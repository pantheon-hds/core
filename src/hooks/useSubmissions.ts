import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, assignJudges, submitChallenge } from '../services/supabase';
import { useToast } from './useToast';
import type { ServiceResult } from '../services/submissionService';
import type { Submission, SubmissionStatus } from '../types';

export interface SubmitParams {
  challengeId: number;
  videoUrl: string;
  comment: string | null;
  token: string;
}

interface UseSubmissionsResult {
  submissions: Submission[];
  toast: ReturnType<typeof useToast>['toast'];
  submitting: boolean;
  getSubmissionStatus: (challengeId: number) => Submission | undefined;
  hasActiveSubmission: () => boolean;
  isOnCooldown: () => boolean;
  submit: (params: SubmitParams) => Promise<ServiceResult>;
  withdraw: (submissionId: string) => Promise<ServiceResult>;
}

export function useSubmissions(
  dbUserId: string | null,
  token: string | null,
  onApproved?: () => void
): UseSubmissionsResult {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast } = useToast(5000);

  // Always-fresh ref so stable callbacks can read current submissions
  const submissionsRef = useRef(submissions);
  useEffect(() => { submissionsRef.current = submissions; }, [submissions]);

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
    (challengeId: number) => submissionsRef.current.find(s => s.challenge_id === challengeId),
    []
  );

  const hasActiveSubmission = useCallback(
    () => submissionsRef.current.some(s => s.status === 'pending' || s.status === 'in_review'),
    []
  );

  const isOnCooldown = useCallback(() => {
    const latest = submissionsRef.current
      .filter(s => s.cooldown_until)
      .sort((a, b) => new Date(b.cooldown_until!).getTime() - new Date(a.cooldown_until!).getTime())[0];
    return !!latest?.cooldown_until && new Date(latest.cooldown_until) > new Date();
  }, []);

  const submit = useCallback(async (params: SubmitParams): Promise<ServiceResult> => {
    if (!dbUserId) return { success: false, error: 'Not authenticated' };
    if (hasActiveSubmission()) return { success: false, error: 'You already have an active submission. Wait for the result.' };
    if (isOnCooldown()) return { success: false, error: 'You are on cooldown. Please wait 24 hours after withdrawing.' };

    setSubmitting(true);

    const optimisticId = `optimistic_${Date.now()}`;
    const optimistic: Submission = {
      id: optimisticId,
      challenge_id: params.challengeId,
      status: 'pending',
      cooldown_until: null,
      video_url: params.videoUrl,
      comment: params.comment,
      submitted_at: new Date().toISOString(),
      admin_note: null,
      user_id: dbUserId,
      user: null,
      challenge: null,
    };
    setSubmissions(prev => [...prev, optimistic]);

    const result = await submitChallenge(params.token, {
      challengeId: params.challengeId,
      videoUrl: params.videoUrl,
      comment: params.comment,
    });

    if (!result.success) {
      setSubmissions(prev => prev.filter(s => s.id !== optimisticId));
      setSubmitting(false);
      return { success: false, error: result.error };
    }

    await assignJudges(params.token, result.submissionId);
    setSubmissions(prev =>
      prev.map(s => s.id === optimisticId ? { ...s, id: result.submissionId } : s)
    );
    setSubmitting(false);
    return { success: true };
  }, [dbUserId, hasActiveSubmission, isOnCooldown]);

  const withdraw = useCallback(async (submissionId: string): Promise<ServiceResult> => {
    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 24);

    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'withdrawn' as SubmissionStatus,
        withdrawn_at: new Date().toISOString(),
        cooldown_until: cooldownUntil.toISOString(),
      })
      .eq('id', submissionId);

    if (error) {
      showToast('Failed to withdraw submission. Please try again.', 'error');
      return { success: false, error: error.message };
    }

    if (dbUserId) await loadSubmissions(dbUserId);
    return { success: true };
  }, [dbUserId, loadSubmissions, showToast]);

  return {
    submissions,
    toast,
    submitting,
    getSubmissionStatus,
    hasActiveSubmission,
    isOnCooldown,
    submit,
    withdraw,
  };
}
