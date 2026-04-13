import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json, requireAdmin } from '../_shared/adminGuard.ts'
import { getClientIp, checkRateLimit, rateLimitedResponse } from '../_shared/rateLimit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!


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

        if (status === 'approved') {
          const { data: sub } = await supabase
            .from('submissions')
            .select('user_id, challenge_id')
            .eq('id', submissionId)
            .single()
          if (sub?.user_id && sub?.challenge_id) {
            await supabase.rpc('award_rank_on_approval', {
              p_user_id: sub.user_id,
              p_challenge_id: sub.challenge_id,
            })
          }
        }

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
        const { title, description, condition, verification, tier, gameId } = payload
        if (!title || !description || !condition || !verification || !tier || !gameId) {
          return json({ success: false, error: 'title, description, condition, verification, tier and gameId required' }, 400)
        }

        const { error } = await supabase.from('challenges').insert({
          title, description, condition, verification, tier,
          game_id: gameId,
          created_by: null,
          attempts: 0,
          type: 'community',
        })

        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true })
      }

      case 'edit-challenge': {
        const { id, title, description, condition, verification, tier, gameId } = payload
        if (!id || !title || !description || !condition || !verification || !tier || !gameId) {
          return json({ success: false, error: 'id, title, description, condition, verification, tier and gameId required' }, 400)
        }

        const { error } = await supabase
          .from('challenges')
          .update({ title, description, condition, verification, tier, game_id: gameId })
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

      case 'list-all-submissions': {
        const { data, error } = await supabase
          .from('submissions')
          .select('*, user:users(username, steam_id), challenge:challenges(title, tier)')
          .order('submitted_at', { ascending: false })
        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, data })
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

      case 'list-challenges': {
        const { data, error } = await supabase
          .from('challenges')
          .select('*, game:games(id, title)')
          .order('created_at', { ascending: false })
        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, data })
      }

      case 'list-games': {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .order('title')
        if (error) return json({ success: false, error: error.message }, 500)
        return json({ success: true, data })
      }

      case 'list-waitlist': {
        const { data, error } = await supabase
          .from('waitlist')
          .select('id, email, reason, status, rejection_reason, applied_at')
          .order('applied_at', { ascending: false })
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
