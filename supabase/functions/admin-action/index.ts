import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, requireAdmin } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Challenge tiers map 1:1 to rank tiers for the five challenge-eligible tiers.
const CHALLENGE_TIER_TO_RANK: Record<string, string> = {
  Platinum: 'Platinum',
  Diamond: 'Diamond',
  Master: 'Master',
  Grandmaster: 'Grandmaster',
  Legend: 'Legend',
}

/**
 * Awards a rank + statue after a submission is approved.
 * Mirrors the logic in submissionService.ts — kept here to avoid cross-service coupling.
 */
async function awardRank(supabase: SupabaseClient, submissionId: string): Promise<void> {
  const { data: sub } = await supabase
    .from('submissions')
    .select('user_id, challenge_id')
    .eq('id', submissionId)
    .single()

  if (!sub?.user_id || !sub?.challenge_id) {
    console.error('awardRank: submission not found or missing fields', submissionId)
    return
  }

  const { data: challenge } = await supabase
    .from('challenges')
    .select('game_id, title, tier')
    .eq('id', sub.challenge_id)
    .single()

  if (!challenge) {
    console.error('awardRank: challenge not found', sub.challenge_id)
    return
  }

  const rankTier = CHALLENGE_TIER_TO_RANK[challenge.tier] ?? challenge.tier

  const [{ error: rankError }, { error: statueError }] = await Promise.all([
    supabase.from('ranks').upsert(
      { user_id: sub.user_id, game_id: challenge.game_id, tier: rankTier, method: 'community_verified' },
      { onConflict: 'user_id,game_id' }
    ),
    supabase.from('statues').upsert(
      {
        user_id: sub.user_id,
        game_id: challenge.game_id,
        tier: rankTier,
        challenge: challenge.title,
        is_unique: challenge.tier === 'Legend',
      },
      { onConflict: 'user_id,game_id' }
    ),
  ])

  if (rankError) console.error('awardRank: rank upsert failed', rankError)
  if (statueError) console.error('awardRank: statue upsert failed', statueError)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Rate limit: 60 admin actions per minute per IP
    const ip = getClientIp(req)
    const allowed = await checkRateLimit(supabase, ip, 'admin-action', 60, 60)
    if (!allowed) return rateLimitedResponse(corsHeaders)

    // Verify signed session JWT — rejects spoofed Steam IDs
    const adminId = await requireAdmin(req, supabase)
    if (!adminId) return json({ success: false, error: 'Unauthorized' }, 403)

    const body = await req.json()
    const { action, ...payload } = body

    if (!action) {
      return json({ success: false, error: 'action is required' }, 400)
    }

    switch (action) {

      // ── Submissions ────────────────────────────────────────────────────────
      case 'review-submission': {
        const { submissionId, status, adminNote } = payload
        if (!submissionId || !status) return json({ success: false, error: 'submissionId and status required' }, 400)

        const { error } = await supabase
          .from('submissions')
          .update({ status, admin_note: adminNote ?? '' })
          .eq('id', submissionId)

        if (error) return json({ success: false, error: error.message }, 500)
        if (status === 'approved') await awardRank(supabase, submissionId)
        return json({ success: true })
      }

      // ── Bans ───────────────────────────────────────────────────────────────
      case 'ban-user': {
        const { userId, reason, bannedUntil } = payload
        if (!userId || !reason) return json({ success: false, error: 'userId and reason required' }, 400)

        const { error } = await supabase
          .from('users')
          .update({ is_banned: true, ban_reason: reason, banned_until: bannedUntil ?? null })
          .eq('id', userId)

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      case 'unban-user': {
        const { userId } = payload
        if (!userId) return json({ success: false, error: 'userId required' }, 400)

        const { error } = await supabase
          .from('users')
          .update({ is_banned: false, ban_reason: null, banned_until: null })
          .eq('id', userId)

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      // ── Judges ─────────────────────────────────────────────────────────────
      case 'review-judge-app': {
        const { appId, userId, decision } = payload
        if (!appId || !userId || !decision) return json({ success: false, error: 'appId, userId and decision required' }, 400)

        const { error: appError } = await supabase
          .from('judge_applications')
          .update({ status: decision })
          .eq('id', appId)

        if (appError) return json({ success: false, error: appError.message }, 500)

        if (decision === 'approved') {
          const { error: userError } = await supabase
            .from('users')
            .update({ is_judge: true })
            .eq('id', userId)

          if (userError) return json({ success: false, error: userError.message }, 500)
        }

        return json({ success: true })
      }

      case 'appoint-judge': {
        const { targetSteamId } = payload
        if (!targetSteamId) return json({ success: false, error: 'targetSteamId required' }, 400)

        const { data: targetUser } = await supabase
          .from('users')
          .select('id, username')
          .eq('steam_id', targetSteamId)
          .single()

        if (!targetUser) {
          return json({ success: false, error: 'User not found. They must be registered on Pantheon first.' }, 404)
        }

        const { error } = await supabase
          .from('users')
          .update({ is_judge: true })
          .eq('id', targetUser.id)

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, username: targetUser.username })
      }

      case 'remove-judge': {
        const { userId } = payload
        if (!userId) return json({ success: false, error: 'userId required' }, 400)

        const { error } = await supabase
          .from('users')
          .update({ is_judge: false })
          .eq('id', userId)

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      // ── Challenges ─────────────────────────────────────────────────────────
      case 'add-challenge': {
        const { title, description, tier, gameId } = payload
        if (!title || !description || !tier || !gameId) {
          return json({ success: false, error: 'title, description, tier and gameId required' }, 400)
        }

        const { error } = await supabase.from('challenges').insert({
          title, description, tier,
          game_id: gameId,
          created_by: null,
          attempts: 0,
          type: 'community',
        })

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      case 'edit-challenge': {
        const { id, title, description, tier, gameId } = payload
        if (!id || !title || !description || !tier || !gameId) {
          return json({ success: false, error: 'id, title, description, tier and gameId required' }, 400)
        }

        const { error } = await supabase
          .from('challenges')
          .update({ title, description, tier, game_id: gameId })
          .eq('id', id)

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      case 'delete-challenge': {
        const { id } = payload
        if (!id) return json({ success: false, error: 'id required' }, 400)

        const { error } = await supabase
          .from('challenges')
          .delete()
          .eq('id', id)

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      // ── Games ──────────────────────────────────────────────────────────────
      case 'add-game': {
        const { title, steamAppId } = payload
        if (!title || !steamAppId) return json({ success: false, error: 'title and steamAppId required' }, 400)

        const { data: game, error } = await supabase
          .from('games')
          .insert({ title, steam_app_id: steamAppId })
          .select()
          .single()

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, game })
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400)
    }

  } catch (err) {
    console.error('admin-action error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
