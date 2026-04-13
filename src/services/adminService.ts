/**
 * Admin service — all privileged operations go through the admin-action Edge Function.
 *
 * The Edge Function verifies is_admin server-side using the service role key
 * before performing any operation. Direct Supabase mutations for admin actions
 * are intentionally absent from the frontend.
 */

import type { Game, Challenge, Submission, JudgeApplication, WaitlistEntry, DBUser } from '../types';

async function fetchWithTimeout(url: string, options: RequestInit, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface AdminResult {
  success: boolean;
  error?: string;
}

async function callAdminAction(
  token: string,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<AdminResult & Record<string, unknown>> {
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: {
        // Supabase requires anon key for Edge Function routing
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        // Session JWT verified server-side — cannot be forged without APP_SESSION_SECRET
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Submissions ──────────────────────────────────────────────────────────────

export function reviewSubmission(
  token: string,
  submissionId: string,
  status: 'approved' | 'rejected',
  adminNote: string
): Promise<AdminResult> {
  return callAdminAction(token, 'review-submission', { submissionId, status, adminNote });
}

// ── Bans ─────────────────────────────────────────────────────────────────────

export function banUser(
  token: string,
  userId: string,
  reason: string,
  bannedUntil: string | null
): Promise<AdminResult> {
  return callAdminAction(token, 'ban-user', { userId, reason, bannedUntil });
}

export function unbanUser(token: string, userId: string): Promise<AdminResult> {
  return callAdminAction(token, 'unban-user', { userId });
}

// ── Judges ───────────────────────────────────────────────────────────────────

export function reviewJudgeApp(
  token: string,
  appId: string,
  userId: string,
  decision: 'approved' | 'rejected'
): Promise<AdminResult> {
  return callAdminAction(token, 'review-judge-app', { appId, userId, decision });
}

export function appointJudge(
  token: string,
  targetSteamId: string
): Promise<AdminResult & { username?: string }> {
  return callAdminAction(token, 'appoint-judge', { targetSteamId });
}

export function removeJudge(token: string, userId: string): Promise<AdminResult> {
  return callAdminAction(token, 'remove-judge', { userId });
}

// ── Challenges ───────────────────────────────────────────────────────────────

export function addChallenge(
  token: string,
  data: { title: string; description: string; tier: string; gameId: number }
): Promise<AdminResult> {
  return callAdminAction(token, 'add-challenge', data);
}

export function editChallenge(
  token: string,
  id: number,
  data: { title: string; description: string; tier: string; gameId: number }
): Promise<AdminResult> {
  return callAdminAction(token, 'edit-challenge', { id, ...data });
}

export function deleteChallenge(token: string, id: number): Promise<AdminResult> {
  return callAdminAction(token, 'delete-challenge', { id });
}

// ── Games ────────────────────────────────────────────────────────────────────

export function addGame(
  token: string,
  data: { title: string; steamAppId: string }
): Promise<AdminResult> {
  return callAdminAction(token, 'add-game', data);
}

// ── Read queries ──────────────────────────────────────────────────────────────

export async function fetchAdminSubmissions(token: string): Promise<Submission[]> {
  const result = await callAdminAction(token, 'list-all-submissions');
  return (result.data as Submission[]) || [];
}

export async function fetchAdminChallenges(token: string): Promise<Challenge[]> {
  const result = await callAdminAction(token, 'list-challenges');
  return (result.data as Challenge[]) || [];
}

export async function fetchAdminGames(token: string): Promise<Game[]> {
  const result = await callAdminAction(token, 'list-games');
  return (result.data as Game[]) || [];
}

export async function fetchAdminJudgeApps(token: string): Promise<JudgeApplication[]> {
  const result = await callAdminAction(token, 'list-judge-apps');
  return (result.data as JudgeApplication[]) || [];
}

export async function fetchAdminWaitlist(token: string): Promise<WaitlistEntry[]> {
  const result = await callAdminAction(token, 'list-waitlist');
  return (result.data as WaitlistEntry[]) || [];
}

export async function fetchAdminUsers(token: string): Promise<DBUser[]> {
  const result = await callAdminAction(token, 'list-users');
  return (result.data as DBUser[]) || [];
}
