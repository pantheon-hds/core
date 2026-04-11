import type { JudgeAssignment } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function callAction(token: string, fnName: string, action: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/** Admin view — all submissions currently pending or in review. */
export async function fetchAdminPendingSubmissions(token: string): Promise<JudgeAssignment[]> {
  const result = await callAction(token, 'admin-action', 'list-pending-submissions');
  return ((result.data as JudgeAssignment[]) || []).map((s: JudgeAssignment & { id: string; submitted_at?: string }) => ({
    id: s.id,
    assigned_at: s.assigned_at ?? (s as { submitted_at?: string }).submitted_at ?? '',
    vote: null,
    timestamp_note: null,
    submission: s.submission,
  }));
}

/** Judge view — assignments for the current judge. */
export async function fetchJudgeAssignments(token: string): Promise<JudgeAssignment[]> {
  const result = await callAction(token, 'profile-action', 'list-judge-assignments');
  return (result.data as JudgeAssignment[]) || [];
}
