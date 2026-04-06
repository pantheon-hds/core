import { supabase } from './supabase';
import type { JudgeAssignment } from '../types';

interface SubmissionRow {
  id: string;
  video_url: string;
  comment: string | null;
  submitted_at: string;
  user: { username: string } | null;
  challenge: { title: string; tier: string; description: string } | null;
}

/** Admin view — all submissions currently pending or in review. */
export async function fetchAdminPendingSubmissions(): Promise<JudgeAssignment[]> {
  const { data } = await supabase
    .from('submissions')
    .select(`
      id,
      video_url,
      comment,
      submitted_at,
      user:users(username),
      challenge:challenges(title, tier, description)
    `)
    .in('status', ['pending', 'in_review'])
    .order('submitted_at', { ascending: true });

  return ((data as SubmissionRow[]) || []).map(s => ({
    id: s.id,
    assigned_at: s.submitted_at,
    vote: null,
    timestamp_note: null,
    submission: s as JudgeAssignment['submission'],
  }));
}

/** Judge view — assignments assigned to a specific judge. */
export async function fetchJudgeAssignments(judgeId: string): Promise<JudgeAssignment[]> {
  const { data } = await supabase
    .from('submission_judges')
    .select(`
      id,
      assigned_at,
      vote,
      timestamp_note,
      submission:submissions(
        id,
        video_url,
        comment,
        submitted_at,
        user:users(username),
        challenge:challenges(title, tier, description)
      )
    `)
    .eq('judge_user_id', judgeId)
    .order('assigned_at', { ascending: false });

  return (data as JudgeAssignment[]) || [];
}
