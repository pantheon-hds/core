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

      // ── Sandbox (test data, founder-only) ─────────────────────────────────
      // These actions are also protected by requireAdmin — Voland's account
      // must have is_admin = true in the DB.

      case 'sandbox-create-judges': {
        const { count } = payload as { count?: number }
        const judgeCount = Math.min(Math.max(1, count ?? 3), 10)
        const created: string[] = []

        for (let i = 0; i < judgeCount; i++) {
          const steamId = `TEST_JUDGE_${Date.now()}_${i}`
          const { data: newJudge } = await supabase.from('users').insert({
            steam_id: steamId,
            username: `TestJudge_${i + 1}`,
            is_judge: true,
            is_test: true,
            is_admin: false,
          }).select('id').single()

          if (newJudge) {
            created.push(newJudge.id)
            await supabase.from('ranks').insert([
              { user_id: newJudge.id, game_id: 2, tier: 'Gold', method: 'steam_auto', is_test: true },
              { user_id: newJudge.id, game_id: 3, tier: 'Gold', method: 'steam_auto', is_test: true },
            ])
          }
        }

        return json({ success: true, created })
      }

      case 'sandbox-create-submission': {
        const { challengeId, judgeIds } = payload as { challengeId?: number; judgeIds?: string[] }
        if (!challengeId) return json({ success: false, error: 'challengeId required' }, 400)

        const { data: voland } = await supabase
          .from('users').select('id').eq('steam_id', 'VOLAND_FOUNDER').single()
        if (!voland) return json({ success: false, error: 'Voland user not found' }, 404)

        const { data: newSub, error: subError } = await supabase
          .from('submissions')
          .insert({
            user_id: voland.id,
            challenge_id: challengeId,
            video_url: 'https://www.youtube.com/watch?v=test',
            comment: 'Test submission',
            status: 'pending',
            is_test: true,
          })
          .select('id')
          .single()

        if (subError || !newSub) return json({ success: false, error: subError?.message ?? 'Insert failed' }, 500)

        const selected = (judgeIds ?? []).slice(0, 3)
        if (selected.length > 0) {
          await supabase.from('submission_judges').insert(
            selected.map(judgeId => ({
              submission_id: newSub.id,
              judge_user_id: judgeId,
              is_test: true,
            }))
          )
          await supabase.from('submissions').update({ status: 'in_review' }).eq('id', newSub.id)
        }

        return json({ success: true, submissionId: newSub.id })
      }

      case 'sandbox-simulate-vote': {
        const { assignmentId, submissionId, vote } = payload as {
          assignmentId?: string; submissionId?: string; vote?: string
        }
        if (!assignmentId || !submissionId || !vote) {
          return json({ success: false, error: 'assignmentId, submissionId and vote required' }, 400)
        }

        await supabase
          .from('submission_judges')
          .update({ vote, timestamp_note: '0:30 — test timestamp', voted_at: new Date().toISOString() })
          .eq('id', assignmentId)

        const { data: allVotes } = await supabase
          .from('submission_judges')
          .select('vote')
          .eq('submission_id', submissionId)

        // NOTE: this mirrors resolveVotes() in src/utils/judgeVoting.ts.
        // Edge Functions can't import frontend utils, so the logic is duplicated.
        // If voting rules change, update BOTH this block and judgeVoting.ts.
        let finalStatus: string | null = null
        if (allVotes && allVotes.length > 0) {
          const votes = allVotes.map(v => v.vote as string | null)
          const approved = votes.filter(v => v === 'approved').length
          const rejected = votes.filter(v => v === 'rejected').length
          const needed = Math.ceil(votes.length / 2)
          if (approved >= needed) finalStatus = 'approved'
          else if (rejected >= needed) finalStatus = 'rejected'
        }

        if (finalStatus) {
          await supabase.from('submissions').update({ status: finalStatus }).eq('id', submissionId)
        }

        return json({ success: true, finalStatus })
      }

      case 'sandbox-clear-all': {
        await supabase.from('submission_judges').delete().eq('is_test', true)
        await supabase.from('submissions').delete().eq('is_test', true)
        await supabase.from('ranks').delete().eq('is_test', true)
        await supabase.from('statues').delete().eq('is_test', true)
        await supabase.from('users').delete().eq('is_test', true)
        return json({ success: true })
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400)
    }

  } catch (err) {
    console.error('admin-action error:', err)
    return json({ success: false, error: 'Internal error' }, 500)
  }
})
