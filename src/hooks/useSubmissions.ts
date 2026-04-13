import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, assignJudges, submitChallenge, fetchMySubmissions, withdrawSubmission } from '../services/supabase';
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

  // Always-fresh ref so stable callbacks can read current submissions.
  // Updated synchronously inside the setter to avoid the one-render stale window
  // that a useEffect-based approach would create.
  const submissionsRef = useRef<Submission[]>([]);
  const setSubmissionsAndRef = useCallback(
    (updater: Submission[] | ((prev: Submission[]) => Submission[])) => {
      setSubmissions(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        submissionsRef.current = next;
        return next;
      });
    },
    []
  );

  const loadSubmissions = useCallback(async (_userId: string) => {
    if (!token) return;
    const data = await fetchMySubmissions(token);
    setSubmissionsAndRef(data);
  }, [token, setSubmissionsAndRef]);

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
          setSubmissionsAndRef(prev =>
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
  }, [dbUserId, showToast, onApproved, setSubmissionsAndRef]);

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
    setSubmissionsAndRef(prev => [...prev, optimistic]);

    const result = await submitChallenge(params.token, {
      challengeId: params.challengeId,
      videoUrl: params.videoUrl,
      comment: params.comment,
    });

    if (!result.success) {
      setSubmissionsAndRef(prev => prev.filter(s => s.id !== optimisticId));
      setSubmitting(false);
      return { success: false, error: result.error };
    }

    const judgesAssigned = await assignJudges(params.token, result.submissionId);
    setSubmissionsAndRef(prev =>
      prev.map(s => s.id === optimisticId ? { ...s, id: result.submissionId } : s)
    );
    setSubmitting(false);
    if (!judgesAssigned) {
      showToast('Submission created. Judge assignment failed — an admin will review.', 'info');
    }
    return { success: true };
  }, [dbUserId, hasActiveSubmission, isOnCooldown, showToast, setSubmissionsAndRef]);

  const withdraw = useCallback(async (submissionId: string): Promise<ServiceResult> => {
    if (!token) return { success: false, error: 'Not authenticated' };

    const result = await withdrawSubmission(token, submissionId);
    if (!result.success) {
      showToast('Failed to withdraw submission. Please try again.', 'error');
      return result;
    }

    if (dbUserId) await loadSubmissions(dbUserId);
    return { success: true };
  }, [token, dbUserId, loadSubmissions, showToast]);

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
