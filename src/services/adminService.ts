/**
 * Admin service — all privileged operations go through the admin-action Edge Function.
 *
 * The Edge Function verifies is_admin server-side using the service role key
 * before performing any operation. Direct Supabase mutations for admin actions
 * are intentionally absent from the frontend.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface AdminResult {
  success: boolean;
  error?: string;
}

async function callAdminAction(
  steamId: string,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<AdminResult & Record<string, unknown>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ steamId, action, ...payload }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Submissions ──────────────────────────────────────────────────────────────

export function reviewSubmission(
  steamId: string,
  submissionId: string,
  status: 'approved' | 'rejected',
  adminNote: string
): Promise<AdminResult> {
  return callAdminAction(steamId, 'review-submission', { submissionId, status, adminNote });
}

// ── Bans ─────────────────────────────────────────────────────────────────────

export function banUser(
  steamId: string,
  userId: string,
  reason: string,
  bannedUntil: string | null
): Promise<AdminResult> {
  return callAdminAction(steamId, 'ban-user', { userId, reason, bannedUntil });
}

export function unbanUser(steamId: string, userId: string): Promise<AdminResult> {
  return callAdminAction(steamId, 'unban-user', { userId });
}

// ── Judges ───────────────────────────────────────────────────────────────────

export function reviewJudgeApp(
  steamId: string,
  appId: string,
  userId: string,
  decision: 'approved' | 'rejected'
): Promise<AdminResult> {
  return callAdminAction(steamId, 'review-judge-app', { appId, userId, decision });
}

export function appointJudge(
  steamId: string,
  targetSteamId: string
): Promise<AdminResult & { username?: string }> {
  return callAdminAction(steamId, 'appoint-judge', { targetSteamId });
}

export function removeJudge(steamId: string, userId: string): Promise<AdminResult> {
  return callAdminAction(steamId, 'remove-judge', { userId });
}

// ── Challenges ───────────────────────────────────────────────────────────────

export function addChallenge(
  steamId: string,
  data: { title: string; description: string; tier: string; gameId: number }
): Promise<AdminResult> {
  return callAdminAction(steamId, 'add-challenge', data);
}

export function editChallenge(
  steamId: string,
  id: number,
  data: { title: string; description: string; tier: string; gameId: number }
): Promise<AdminResult> {
  return callAdminAction(steamId, 'edit-challenge', { id, ...data });
}

export function deleteChallenge(steamId: string, id: number): Promise<AdminResult> {
  return callAdminAction(steamId, 'delete-challenge', { id });
}

// ── Games ────────────────────────────────────────────────────────────────────

export function addGame(
  steamId: string,
  data: { title: string; steamAppId: string }
): Promise<AdminResult> {
  return callAdminAction(steamId, 'add-game', data);
}
