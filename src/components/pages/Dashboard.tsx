import React, { useState, useCallback, useMemo } from 'react';
import './Dashboard.css';
import { SteamUser } from './SteamCallback';
import { assignJudges, getUserRanks, supabase } from '../../services/supabase';
import { TIER_COLORS, RANK_TIER_COLORS, getRankOrder } from '../../constants/ranks';
import { getProgressInfo } from '../../utils/rankProgress';
import { Toast } from '../ui/Toast';
import StatueSVG from '../ui/StatueSVG';
import { useChallenges } from '../../hooks/useChallenges';
import { useUserData } from '../../hooks/useUserData';
import { useSubmissions } from '../../hooks/useSubmissions';
import type { Challenge, Submission, SubmissionStatus } from '../../types';

const ALLOWED_DOMAINS = ['youtube.com', 'youtu.be', 'twitch.tv'];

function isValidVideoUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== 'https:') return false;
    const domain = hostname.replace(/^www\./, '');
    return ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  } catch {
    return false;
  }
}

interface DashboardProps { user: SteamUser | null; }

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [submitChallenge, setSubmitChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const { challenges, games } = useChallenges();
  const { dbUserId, dbUsername, ranks, statues, setRanks } = useUserData(user, games);

  const handleApproved = useCallback(() => {
    if (dbUserId) getUserRanks(dbUserId).then(setRanks);
  }, [dbUserId, setRanks]);

  const { submissions, toast, setSubmissions, loadSubmissions, getSubmissionStatus, hasActiveSubmission, isOnCooldown } =
    useSubmissions(dbUserId, handleApproved);

  const handleSubmit = async () => {
    if (!dbUserId || !submitChallenge) return;

    if (!videoUrl.trim()) {
      setSubmitMessage('Please provide a video URL.');
      return;
    }

    if (!isValidVideoUrl(videoUrl)) {
      setSubmitMessage('Only YouTube or Twitch links are allowed.');
      return;
    }

    if (hasActiveSubmission()) {
      setSubmitMessage('You already have an active submission. Wait for the result.');
      return;
    }

    if (isOnCooldown()) {
      setSubmitMessage('You are on cooldown. Please wait 24 hours after withdrawing.');
      return;
    }

    setSubmitting(true);

    // Optimistic update: show the submission as pending immediately
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticSubmission: Submission = {
      id: optimisticId,
      challenge_id: submitChallenge.id,
      status: 'pending',
      cooldown_until: null,
      video_url: videoUrl.trim(),
      comment: comment.trim() || null,
      submitted_at: new Date().toISOString(),
      admin_note: null,
      user_id: dbUserId,
      user: null,
      challenge: null,
    };
    setSubmissions(prev => [...prev, optimisticSubmission]);
    setSubmitChallenge(null);

    const { data: inserted, error } = await supabase
      .from('submissions')
      .insert({
        user_id: dbUserId,
        challenge_id: submitChallenge.id,
        video_url: videoUrl.trim(),
        comment: comment.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      // Rollback optimistic update
      setSubmissions(prev => prev.filter(s => s.id !== optimisticId));
      setSubmitChallenge(submitChallenge);
      setSubmitMessage(`Error: ${error.message}`);
    } else {
      if (inserted) {
        await assignJudges(inserted.id);
        // Replace optimistic entry with real ID
        setSubmissions(prev =>
          prev.map(s => s.id === optimisticId ? { ...s, id: inserted.id } : s)
        );
      }
      setVideoUrl('');
      setComment('');
    }
    setSubmitting(false);
  };

  const handleWithdraw = async (submissionId: string) => {
    if (!window.confirm('Withdraw this submission? You will have a 24-hour cooldown.')) return;

    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 24);

    await supabase.from('submissions')
      .update({
        status: 'withdrawn' as SubmissionStatus,
        withdrawn_at: new Date().toISOString(),
        cooldown_until: cooldownUntil.toISOString(),
      })
      .eq('id', submissionId);

    if (dbUserId) await loadSubmissions(dbUserId);
  };

  const topRank = useMemo(
    () => [...ranks].sort((a, b) => getRankOrder(a.tier) - getRankOrder(b.tier))[0],
    [ranks]
  );
  const tiers = ['All', ...Array.from(new Set(challenges.map(c => c.tier)))];
  const filtered = filter === 'All' ? challenges : challenges.filter(c => c.tier === filter);

  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const approvedChallengeIds = approvedSubmissions.map(s => s.challenge_id);
  const progress = topRank ? getProgressInfo(topRank.tier, approvedChallengeIds, challenges) : null;

  return (
    <div className="dashboard">
      <Toast toast={toast} />

      {/* Challenge detail modal */}
      {activeChallenge && (
        <div className="dashboard__modal-overlay" onClick={() => setActiveChallenge(null)}>
          <div className="dashboard__modal" onClick={e => e.stopPropagation()}>
            <div className="dashboard__modal-tier" style={{ color: TIER_COLORS[activeChallenge.tier] || '#c9922a' }}>
              {activeChallenge.tier}
            </div>
            <div className="dashboard__modal-title">{activeChallenge.title}</div>
            <div className="dashboard__modal-desc">{activeChallenge.description}</div>
            <div className="dashboard__modal-meta">{activeChallenge.game?.title}</div>
            <div className="dashboard__modal-actions">
              {getSubmissionStatus(activeChallenge.id)?.status === 'approved' ? (
                <div className="dashboard__modal-completed">✓ Completed</div>
              ) : (
                <button
                  className="dashboard__modal-submit-btn"
                  onClick={() => {
                    setActiveChallenge(null);
                    setSubmitChallenge(activeChallenge);
                  }}
                >
                  Submit Attempt
                </button>
              )}
              <button className="dashboard__modal-close" onClick={() => setActiveChallenge(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit form modal */}
      {submitChallenge && (
        <div className="dashboard__modal-overlay" onClick={() => { setSubmitChallenge(null); setSubmitMessage(''); }}>
          <div className="dashboard__modal dashboard__modal--submit" onClick={e => e.stopPropagation()}>
            <div className="dashboard__modal-tier" style={{ color: TIER_COLORS[submitChallenge.tier] || '#c9922a' }}>
              Submit — {submitChallenge.tier}
            </div>
            <div className="dashboard__modal-title">{submitChallenge.title}</div>
            <div className="dashboard__modal-game">{submitChallenge.game?.title}</div>

            <div className="dashboard__submit-field">
              <label className="dashboard__submit-label">Video URL *</label>
              <input
                className="dashboard__submit-input"
                placeholder="YouTube or Twitch link only"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
              <div className="dashboard__submit-hint">Only youtube.com, youtu.be, twitch.tv are accepted</div>
            </div>

            <div className="dashboard__submit-field">
              <label className="dashboard__submit-label">Comment (optional)</label>
              <textarea
                className="dashboard__submit-textarea"
                placeholder="Any notes for the judges..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {submitMessage && (
              <div className={"dashboard__submit-message" + (submitMessage.includes('Error') || submitMessage.includes('Only') || submitMessage.includes('already') || submitMessage.includes('cooldown') ? ' dashboard__submit-message--error' : ' dashboard__submit-message--success')}>
                {submitMessage}
              </div>
            )}

            <div className="dashboard__modal-actions">
              <button
                className="dashboard__modal-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                className="dashboard__modal-close"
                onClick={() => { setSubmitChallenge(null); setSubmitMessage(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rank card */}
      <div className="dashboard__rank-card">
        <div className="dashboard__rank-statues">
          {statues.length > 0
            ? statues.map(s => (
                <div key={s.id} className="dashboard__rank-statue-item">
                  <StatueSVG tier={s.tier} size={80} unique={s.is_unique} />
                  <div className="dashboard__rank-statue-tier"
                    style={{ color: RANK_TIER_COLORS[s.tier] || '#c9922a' }}>
                    {s.tier}
                  </div>
                  <div className="dashboard__rank-statue-game">{s.game?.title}</div>
                </div>
              ))
            : (
                <div className="dashboard__rank-statue-item">
                  <StatueSVG tier="Bronze I" size={80} />
                  <div className="dashboard__rank-statue-tier" style={{ color: '#c9922a' }}>No rank yet</div>
                  <div className="dashboard__rank-statue-game">Play games to earn ranks</div>
                </div>
              )
          }
        </div>
        <div className="dashboard__rank-info">
          <div className="dashboard__rank-xp">
            {ranks.length} rank{ranks.length !== 1 ? 's' : ''} earned across {games.length} game{games.length !== 1 ? 's' : ''}
          </div>
          {dbUsername && (
            <div className="dashboard__profile-share">
              <div className="dashboard__profile-share-label">Your public profile · share with anyone</div>
              <div className="dashboard__profile-share-row">
                <a
                  href={`/u/${dbUsername}`}
                  className="dashboard__profile-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  pantheonhds.com/u/{dbUsername}
                </a>
                <button
                  className="dashboard__copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://pantheonhds.com/u/${dbUsername}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress to next rank */}
      {progress && !progress.isLegend && progress.required > 0 && (
        <div className="dashboard__progress">
          <div className="dashboard__progress-header">
            <span className="dashboard__progress-label">Path to {progress.nextRank}</span>
            <span className="dashboard__progress-count">
              {progress.completed} / {progress.required} {progress.challengeTier} challenges
            </span>
          </div>
          <div className="dashboard__progress-dots">
            {Array.from({ length: progress.required }).map((_, i) => (
              <div
                key={i}
                className={"dashboard__progress-dot" + (i < progress.completed ? ' dashboard__progress-dot--done' : '')}
                style={i < progress.completed ? { background: TIER_COLORS[progress.challengeTier!] || '#c9922a' } : {}}
              />
            ))}
          </div>
          {progress.completed >= progress.required && (
            <div className="dashboard__progress-ready">
              Ready to advance! Submit your next challenge to unlock {progress.nextRank}.
            </div>
          )}
        </div>
      )}

      {progress?.isLegend && (
        <div className="dashboard__progress dashboard__progress--legend">
          <div className="dashboard__progress-label">You are Grandmaster. The path to Legend awaits.</div>
          <div className="dashboard__progress-legend-text">Legend rank is granted by community vote only.</div>
        </div>
      )}

      {/* Active submissions */}
      {submissions.filter(s => s.status === 'pending' || s.status === 'in_review').map(s => {
        const challenge = challenges.find(c => c.id === s.challenge_id);
        return (
          <div key={s.id} className="dashboard__active-submission">
            <div className="dashboard__active-submission-info">
              <div className="dashboard__active-submission-title">
                Active submission — {challenge?.title || 'Challenge'}
              </div>
              <div className="dashboard__active-submission-status">
                Status: {s.status === 'pending' ? 'Waiting for judges' : 'Under review'}
                <span className="dashboard__live-badge">● Live</span>
              </div>
            </div>
            <button
              className="dashboard__withdraw-btn"
              onClick={() => handleWithdraw(s.id)}
            >
              Withdraw
            </button>
          </div>
        );
      })}

      {/* Ranks per game */}
      {ranks.length > 0 && (
        <div className="dashboard__games">
          <div className="dashboard__games-title">Your Ranks</div>
          <div className="dashboard__games-list">
            {ranks.map(rank => (
              <div key={rank.id} className="dashboard__game-item">
                <span className="dashboard__game-title">{rank.game?.title}</span>
                <span className="dashboard__game-rank" style={{ color: RANK_TIER_COLORS[rank.tier] || '#c9922a' }}>
                  {rank.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{ranks.length * 100}</div>
          <div className="dashboard__stat-label">Rank Points</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{challenges.length}</div>
          <div className="dashboard__stat-label">Challenges</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{approvedSubmissions.length}</div>
          <div className="dashboard__stat-label">Completed</div>
        </div>
      </div>

      {/* Challenges */}
      <div className="dashboard__challenges-header">
        <span className="dashboard__challenges-title">Community Challenges</span>
        <div className="dashboard__filters">
          {tiers.map(t => (
            <button
              key={t}
              className={"dashboard__filter" + (filter === t ? " dashboard__filter--active" : "")}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard__challenges">
        {filtered.length === 0 ? (
          <div className="dashboard__empty">
            No challenges yet. Add some from the Admin panel.
          </div>
        ) : (
          filtered.map(challenge => {
            const submission = getSubmissionStatus(challenge.id);
            return (
              <div
                key={challenge.id}
                className="dashboard__challenge"
                onClick={() => setActiveChallenge(challenge)}
              >
                <div
                  className="dashboard__challenge-dot"
                  style={{ background: TIER_COLORS[challenge.tier] || '#c9922a' }}
                />
                <span className="dashboard__challenge-title">{challenge.title}</span>
                <span className="dashboard__challenge-game">{challenge.game?.title}</span>
                <span className="dashboard__challenge-tier">{challenge.tier}</span>
                {submission && (
                  <span className="dashboard__challenge-status" style={{
                    color: submission.status === 'approved' ? '#6ab87a' :
                           submission.status === 'rejected' ? '#e45a3a' :
                           '#c9922a'
                  }}>
                    {submission.status === 'pending' ? '⏳' :
                     submission.status === 'approved' ? '✓' :
                     submission.status === 'rejected' ? '✗' :
                     submission.status === 'in_review' ? '👁' : ''}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
