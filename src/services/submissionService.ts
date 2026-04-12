export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface VoteResult extends ServiceResult {
  finalised: boolean;
}

// Judge path: record a vote via Edge Function (handles 2/3 majority logic server-side).
export async function recordJudgeVote(
  assignmentId: string,
  submissionId: string,
  vote: 'approved' | 'rejected',
  timestampNote: string,
  token: string
): Promise<VoteResult> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/profile-action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'record-judge-vote', assignmentId, submissionId, vote, timestampNote }),
    });
    const result = await res.json();
    if (!result.success) return { success: false, error: result.error, finalised: false };
    return { success: true, finalised: result.finalised ?? false };
  } catch (err) {
    return { success: false, error: (err as Error).message, finalised: false };
  }
}
