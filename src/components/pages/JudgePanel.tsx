import React, { useState, useEffect, useCallback } from 'react';
import './JudgePanel.css';
import { SteamUser } from './SteamCallback';
import { getUserBySteamId } from '../../services/supabase';
import { fetchAdminPendingSubmissions, fetchJudgeAssignments } from '../../services/judgeService';
import { safeVideoUrl } from '../../utils/videoUrl';
import { recordJudgeVote } from '../../services/submissionService';
import * as adminService from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../ui/Toast';
import type { JudgeAssignment } from '../../types';

interface JudgePanelProps { user: SteamUser | null; }

const JudgePanel: React.FC<JudgePanelProps> = ({ user }) => {
  const [isJudge, setIsJudge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [voting, setVoting] = useState<Record<string, boolean>>({});
  const { toast, showToast } = useToast();

  const loadAssignments = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const dbUser = await getUserBySteamId(user.steamId);
    if (!dbUser?.is_judge && !dbUser?.is_admin) {
      setIsJudge(false);
      setLoading(false);
      return;
    }
    setIsJudge(true);
    setIsAdmin(!!dbUser?.is_admin);

    const data = dbUser.is_admin
      ? await fetchAdminPendingSubmissions(user.token)
      : await fetchJudgeAssignments(user.token);

    setAssignments(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleVote = useCallback(async (
    assignmentId: string,
    submissionId: string,
    vote: 'approved' | 'rejected'
  ) => {
    const timestamp = timestamps[assignmentId]?.trim();
    if (!timestamp) {
      showToast('Please provide a timestamp before voting.', 'error');
      return;
    }

    setVoting(prev => ({ ...prev, [assignmentId]: true }));

    if (isAdmin) {
      const result = await adminService.reviewSubmission(user!.token, submissionId, vote, timestamp);
      if (!result.success) {
        showToast(`Error: ${result.error}`, 'error');
      } else {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        showToast(`Submission ${vote} by founder.`, vote === 'approved' ? 'success' : 'info');
      }
    } else {
      const result = await recordJudgeVote(assignmentId, submissionId, vote, timestamp, user!.token);
      if (!result.success) {
        showToast(`Error: ${result.error}`, 'error');
      } else {
        setAssignments(prev =>
          prev.map(a => a.id === assignmentId ? { ...a, vote, timestamp_note: timestamp } : a)
        );
        if (result.finalised) {
          showToast(`Submission ${vote}! Majority reached.`, vote === 'approved' ? 'success' : 'info');
        }
      }
    }

    setVoting(prev => ({ ...prev, [assignmentId]: false }));
  }, [isAdmin, user, timestamps, showToast]);

  const pendingCount = assignments.filter(a => !a.vote).length;

  if (loading) return <div className="judge__loading">Loading...</div>;
  if (!isJudge) return <div className="judge__denied">You are not a judge.</div>;

  return (
    <div className="judge">
      <Toast toast={toast} />

      <div className="judge__header">
        <div className="judge__title">⚖ Judge Panel</div>
        <div className="judge__subtitle">
          {isAdmin
            ? `Founder view — all submissions · ${pendingCount} pending`
            : pendingCount > 0
              ? `${pendingCount} submission${pendingCount !== 1 ? 's' : ''} awaiting your review`
              : 'No pending submissions'}
        </div>
      </div>

      <div className="judge__list">
        {assignments.length === 0 ? (
          <div className="judge__empty">
            {isAdmin ? 'No pending submissions.' : 'No submissions assigned to you yet.'}
          </div>
        ) : (
          assignments.map(a => (
            <div key={a.id} className={"judge__item" + (!a.vote ? ' judge__item--pending' : '')}>
              <div className="judge__item-header">
                <div className="judge__item-challenge">
                  {a.submission?.challenge?.title || 'Unknown'}
                </div>
                <div className="judge__item-tier">
                  {a.submission?.challenge?.tier}
                </div>
              </div>

              <div className="judge__item-desc">
                {a.submission?.challenge?.description}
              </div>

              <div className="judge__item-meta">
                Submitted by: {a.submission?.user?.username || 'Unknown'}
                · {a.submission?.submitted_at ? new Date(a.submission.submitted_at).toLocaleDateString() : '—'}
              </div>

              {a.submission?.comment && (
                <div className="judge__item-comment">
                  "{a.submission.comment}"
                </div>
              )}

              <a
                href={safeVideoUrl(a.submission?.video_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="judge__video-link"
              >
                Watch Video →
              </a>

              {!a.vote ? (
                <div className="judge__vote-section">
                  <div className="judge__timestamp-field">
                    <label className="judge__label" htmlFor={`timestamp-${a.id}`}>
                      Timestamp confirming completion *
                    </label>
                    <input
                      id={`timestamp-${a.id}`}
                      className="judge__timestamp-input"
                      placeholder="e.g. 1:23:45 — condition clearly met here"
                      value={timestamps[a.id] || ''}
                      onChange={e => setTimestamps(prev => ({ ...prev, [a.id]: e.target.value }))}
                    />
                    <div className="judge__timestamp-hint">
                      Required. Without timestamp your vote is not counted.
                    </div>
                  </div>
                  <div className="judge__vote-btns">
                    <button
                      className="judge__approve-btn"
                      onClick={() => handleVote(a.id, a.submission.id, 'approved')}
                      disabled={voting[a.id]}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="judge__reject-btn"
                      onClick={() => handleVote(a.id, a.submission.id, 'rejected')}
                      disabled={voting[a.id]}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="judge__voted">
                  Your vote: <span style={{ color: a.vote === 'approved' ? '#6ab87a' : '#e45a3a' }}>
                    {a.vote}
                  </span>
                  {a.timestamp_note && <span className="judge__voted-note"> · {a.timestamp_note}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JudgePanel;
