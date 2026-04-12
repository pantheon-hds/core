import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, requireAdmin } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const RANK_ORDER: Record<string, number> = {
  'Legend': 0, 'Grandmaster': 1, 'Master': 2, 'Diamond': 3,
  'Platinum': 4, 'Gold': 5, 'Silver III': 6, 'Silver II': 7, 'Silver I': 8,
  'Bronze III': 9, 'Bronze II': 10, 'Bronze I': 11,
}

const RANK_PROGRESSION: Record<string, { challengeTier: string; required: number; nextRank: string }> = {
  'Bronze I':    { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' },
  'Bronze II':   { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' },
  'Bronze III':  { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' },
  'Silver I':    { challengeTier: 'Platinum', required: 4, nextRank: 'Platinum' },
  'Silver II':   { challengeTier: 'Platinum', required: 4, nextRank: 'Platinum' },
  'Silver III':  { challengeTier: 'Platinum', required: 4, nextRank: 'Platinum' },
  'Gold':        { challengeTier: 'Platinum', required: 3, nextRank: 'Platinum' },
  'Platinum':    { challengeTier: 'Diamond',  required: 2, nextRank: 'Diamond'  },
  'Diamond':     { challengeTier: 'Master',   required: 2, nextRank: 'Master'   },
  'Master':      { challengeTier: 'Grandmaster', required: 1, nextRank: 'Grandmaster' },
}
const UNRANKED_PROGRESSION = { challengeTier: 'Platinum', required: 5, nextRank: 'Platinum' }

/**
 * Awards a rank + statue after a submission is approved.
 * Rank is only awarded when the user has enough approved challenges to advance.
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

  // Always update statue
  const { error: statueError } = await supabase.from('statues').upsert(
    {
      user_id: sub.user_id,
      game_id: challenge.game_id,
      tier: challenge.tier,
      challenge: challenge.title,
      is_unique: challenge.tier === 'Legend',
    },
    { onConflict: 'user_id,game_id' }
  )
  if (statueError) console.error('awardRank: statue upsert failed', statueError)

  // Get current rank
  const { data: currentRank } = await supabase
    .from('ranks')
    .select('tier, method')
    .eq('user_id', sub.user_id)
    .eq('game_id', challenge.game_id)
    .maybeSingle()

  const currentTier = currentRank?.tier ?? null
  const req = currentTier ? RANK_PROGRESSION[currentTier] : UNRANKED_PROGRESSION

  if (!req) return // Grandmaster+ no further progression
  if (challenge.tier !== req.challengeTier) return // Wrong tier for current path

  // Count approved submissions for required tier in this game
  const { data: tierChallenges } = await supabase
    .from('challenges')
    .select('id')
    .eq('game_id', challenge.game_id)
    .eq('tier', req.challengeTier)

  const tierChallengeIds = (tierChallenges ?? []).map((c: { id: number }) => c.id)
  if (tierChallengeIds.length === 0) return

  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', sub.user_id)
    .eq('status', 'approved')
    .in('challenge_id', tierChallengeIds)

  if ((count ?? 0) < req.required) return // Not enough yet

  // Don't downgrade a community_verified rank that's already higher
  if (currentRank?.method === 'community_verified' && currentTier) {
    if ((RANK_ORDER[req.nextRank] ?? 99) >= (RANK_ORDER[currentTier] ?? 99)) return
  }

  const { error: rankError } = await supabase.from('ranks').upsert(
    { user_id: sub.user_id, game_id: challenge.game_id, tier: req.nextRank, method: 'community_verified' },
    { onConflict: 'user_id,game_id' }
  )
  if (rankError) console.error('awardRank: rank upsert failed', rankError)
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

      case 'list-pending-submissions': {
        const { data, error } = await supabase
          .from('submissions')
          .select(`id, video_url, comment, submitted_at,
            user:users(username),
            challenge:challenges(title, tier, description)`)
          .in('status', ['pending', 'in_review'])
          .order('submitted_at', { ascending: true })
        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, data })
      }

      case 'list-judge-apps': {
        const { data, error } = await supabase
          .from('judge_applications')
          .select('*, user:users(username, steam_id), game:games(title)')
          .order('applied_at', { ascending: false })
        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, data })
      }

      case 'list-users': {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, steam_id, is_admin, is_judge, is_test, is_banned, ban_reason, banned_until, created_at')
          .order('created_at', { ascending: false })
        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, data })
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400)
    }

  } catch (err) {
    console.error('admin-action error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
