import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import type { UserRank, UserStatue, Submission } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Re-export types so existing imports from this file keep working
export type { UserRank, UserStatue };

export async function getUserRanks(userId: string): Promise<UserRank[]> {
  const { data, error } = await supabase
    .from('ranks')
    .select('id, tier, method, granted_at, game:games(id, title, steam_app_id)')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as UserRank[]) || [];
}

export async function getUserStatues(userId: string): Promise<UserStatue[]> {
  const { data, error } = await supabase
    .from('statues')
    .select('id, tier, challenge, is_unique, granted_at, game:games(title)')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as UserStatue[]) || [];
}

export async function getUserBySteamId(steamId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('steam_id', steamId)
    .single();

  if (error) { console.error('Error fetching user:', error); return null; }
  return data;
}

export async function checkAchievements(steamId: string, appId: string) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check-achievements`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ steamId, appId }),
    }
  );
  if (!response.ok) return null;
  return response.json();
}

export const REAPPLY_DAYS = 30;

export async function submitWaitlist(email: string, reason: string): Promise<{ success: boolean; error?: string }> {
  // Check if email already exists
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id, status, rejected_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    if (existing.status === 'pending') {
      return { success: false, error: 'This email is already on the waitlist.' };
    }
    if (existing.status === 'approved') {
      return { success: false, error: 'This email has already been approved. Check your inbox for the invite code.' };
    }
    if (existing.status === 'rejected') {
      const rejectedAt = existing.rejected_at ? new Date(existing.rejected_at) : new Date(0);
      const daysSince = (Date.now() - rejectedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < REAPPLY_DAYS) {
        const reapplyDate = new Date(rejectedAt.getTime() + REAPPLY_DAYS * 24 * 60 * 60 * 1000);
        const dateStr = reapplyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return { success: false, error: `You can reapply after ${dateStr}.` };
      }
      // 30 days passed — reset to pending
      const { error } = await supabase
        .from('waitlist')
        .update({ status: 'pending', reason: reason.trim() || null, rejection_reason: null, rejected_at: null, applied_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  }

  const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase(), reason: reason.trim() || null });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Returns a nonce string on success (to be passed through Steam OAuth), null on failure
export async function validateInviteCode(code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('validate_invite_code', { p_code: code.trim().toUpperCase() });
  if (error) { console.error('Error validating invite code:', error); return null; }
  return (data as string) || null;
}

export async function sendInvite(token: string, waitlistId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-invite`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ waitlistId, email }),
    }
  );
  if (!response.ok) {
    const data = await response.json();
    return { success: false, error: data.error || 'Failed to send invite' };
  }
  return { success: true };
}

export async function rejectWaitlistEntry(token: string, id: string, rejectionReason: string): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-rejection`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ waitlistId: id, rejectionReason }),
    }
  );
  return response.ok;
}

export async function fetchMySubmissions(token: string): Promise<Submission[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-challenge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'list' }),
    });
    const data = await res.json();
    return data.submissions ?? [];
  } catch {
    return [];
  }
}

export async function submitChallenge(
  token: string,
  params: { challengeId: number; videoUrl: string; comment: string | null }
): Promise<{ success: boolean; submissionId: string; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-challenge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, submissionId: '', error: (err as Error).message };
  }
}

export async function assignJudges(token: string, submissionId: string): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/assign-judges`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ submissionId }),
    }
  );
  return response.ok;
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
      },
    });
  } catch {
    // logout should never fail visibly
  }
}

