import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useToast } from './useToast';
import type { Submission } from '../types';

interface UseSubmissionsResult {
  submissions: Submission[];
  toast: ReturnType<typeof useToast>['toast'];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  loadSubmissions: (userId: string) => Promise<void>;
  getSubmissionStatus: (challengeId: number) => Submission | undefined;
  hasActiveSubmission: () => boolean;
  isOnCooldown: () => boolean;
}

export function useSubmissions(
  dbUserId: string | null,
  onApproved?: () => void
): UseSubmissionsResult {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { toast, showToast } = useToast(5000);

  const loadSubmissions = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('submissions')
      .select('id, challenge_id, status, cooldown_until')
      .eq('user_id', userId);
    setSubmissions((data as Submission[]) || []);
  }, []);

  useEffect(() => {
    if (!dbUserId) return;
    loadSubmissions(dbUserId);
  }, [dbUserId, loadSubmissions]);

  useEffect(() => {
    if (!dbUserId) return;

    const channel = supabase
      .channel(`submissions:${dbUserId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `user_id=eq.${dbUserId}` },
        (payload) => {
          const updated = payload.new as Submission;
          setSubmissions(prev =>
            prev.map(s => s.id === updated.id ? { ...s, ...updated } : s)
          );
          if (updated.status === 'approved') {
            showToast('Your submission was approved! Rank awarded.', 'success');
            onApproved?.();
          } else if (updated.status === 'rejected') {
            showToast('Your submission was not approved this time.', 'error');
          } else if (updated.status === 'in_review') {
            showToast('Your submission is now under review by judges.', 'info');
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dbUserId, showToast, onApproved]);

  const getSubmissionStatus = useCallback(
    (challengeId: number) => submissions.find(s => s.challenge_id === challengeId),
    [submissions]
  );

  const hasActiveSubmission = useCallback(
    () => submissions.some(s => s.status === 'pending' || s.status === 'in_review'),
    [submissions]
  );

  const isOnCooldown = useCallback(() => {
    const latest = submissions
      .filter(s => s.cooldown_until)
      .sort((a, b) => new Date(b.cooldown_until!).getTime() - new Date(a.cooldown_until!).getTime())[0];
    if (!latest?.cooldown_until) return false;
    return new Date(latest.cooldown_until) > new Date();
  }, [submissions]);

  return { submissions, toast, setSubmissions, loadSubmissions, getSubmissionStatus, hasActiveSubmission, isOnCooldown };
}
