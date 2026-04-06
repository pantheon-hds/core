import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import './Dashboard.css';
import { SteamUser } from './SteamCallback';
import { RANK_TIER_COLORS, getRankOrder } from '../../constants/ranks';
import { Toast } from '../ui/Toast';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useChallenges } from '../../hooks/useChallenges';
import { useUserData } from '../../hooks/useUserData';
import { useSubmissions } from '../../hooks/useSubmissions';
import ChallengeDetailModal from '../dashboard/ChallengeDetailModal';
import SubmitModal from '../dashboard/SubmitModal';
import RankCard from '../dashboard/RankCard';
import ChallengeList from '../dashboard/ChallengeList';
import type { Challenge } from '../../types';
import { isValidVideoUrl } from '../../utils/videoUrl';

interface DashboardProps { user: SteamUser | null; }

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // UI state
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [submitChallenge, setSubmitChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [videoUrl, setVideoUrl] = useState('');
  const [comment, setComment] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);

  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  // Data
  const { challenges, games } = useChallenges();
  const { dbUserId, dbUsername, ranks, statues, refreshRanks, isError, isBanned, banReason, banUntil } = useUserData(user, games);
  const { submissions, toast, submitting, getSubmissionStatus, submit, withdraw } = useSubmissions(dbUserId, user?.token ?? null, refreshRanks);

  // Derived state
  const topRank = useMemo(
    () => [...ranks].sort((a, b) => getRankOrder(a.tier) - getRankOrder(b.tier))[0],
    [ranks]
  );
  const tiers = useMemo(
    () => ['All', ...Array.from(new Set(challenges.map(c => c.tier)))],
    [challenges]
  );
  const approvedSubmissions = useMemo(
    () => submissions.filter(s => s.status === 'approved'),
    [submissions]
  );
  const approvedChallengeIds = useMemo(
    () => approvedSubmissions.map(s => s.challenge_id),
    [approvedSubmissions]
  );
  const activeSubmissions = useMemo(
    () => submissions.filter(s => s.status === 'pending' || s.status === 'in_review'),
    [submissions]
  );

  // Handlers
  const handleSubmit = useCallback(async () => {
    if (!videoUrl.trim()) {
      setSubmitMessage('Please provide a video URL.');
      return;
    }
    if (!isValidVideoUrl(videoUrl)) {
      setSubmitMessage('Only YouTube or Twitch links are allowed.');
      return;
    }

    const result = await submit({
      challengeId: submitChallenge!.id,
      videoUrl: videoUrl.trim(),
      comment: comment.trim() || null,
      token: user?.token ?? '',
    });

    if (result.success) {
      setSubmitChallenge(null);
      setVideoUrl('');
      setComment('');
    } else {
      setSubmitMessage(result.error ?? 'Submission failed.');
    }
  }, [videoUrl, comment, submit, submitChallenge, user?.token]);

  const handleWithdrawRequest = useCallback((submissionId: string) => {
    setWithdrawTarget(submissionId);
  }, []);

  const handleWithdrawConfirm = useCallback(async () => {
    const id = withdrawTarget;
    setWithdrawTarget(null);
    if (id) await withdraw(id);
  }, [withdrawTarget, withdraw]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`https://pantheonhds.com/u/${dbUsername}`)
      .then(() => {
        setCopied(true);
        clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, [dbUsername]);

  const handleCloseSubmitModal = useCallback(() => {
    setSubmitChallenge(null);
    setSubmitMessage('');
  }, []);

  // Error / banned screens
  if (isError) {
    return (
      <div className="dashboard">
        <div className="dashboard__banned">
          <div className="dashboard__banned-icon">⚠</div>
          <div className="dashboard__banned-title">Failed to load your data</div>
          <div className="dashboard__banned-contact">Check your connection and refresh the page.</div>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="dashboard">
        <div className="dashboard__banned">
          <div className="dashboard__banned-icon">⚠</div>
          <div className="dashboard__banned-title">Your account has been suspended</div>
          <div className="dashboard__banned-reason">{banReason || 'No reason provided'}</div>
          {banUntil
            ? <div className="dashboard__banned-until">Until: {new Date(banUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            : <div className="dashboard__banned-until">Permanent</div>
          }
          <div className="dashboard__banned-contact">If you believe this is a mistake, contact support.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Toast toast={toast} />

      {withdrawTarget && (
        <ConfirmDialog
          message="Withdraw this submission? You will have a 24-hour cooldown before submitting again."
          confirmLabel="Withdraw"
          cancelLabel="Keep"
          dangerous
          onConfirm={handleWithdrawConfirm}
          onCancel={() => setWithdrawTarget(null)}
        />
      )}

      {activeChallenge && (
        <ChallengeDetailModal
          challenge={activeChallenge}
          submissionStatus={getSubmissionStatus(activeChallenge.id)}
          onClose={() => setActiveChallenge(null)}
          onSubmit={(c) => setSubmitChallenge(c)}
        />
      )}

      {submitChallenge && (
        <SubmitModal
          challenge={submitChallenge}
          videoUrl={videoUrl}
          comment={comment}
          submitting={submitting}
          submitMessage={submitMessage}
          onVideoUrlChange={setVideoUrl}
          onCommentChange={setComment}
          onSubmit={handleSubmit}
          onClose={handleCloseSubmitModal}
        />
      )}

      <RankCard
        ranks={ranks}
        statues={statues}
        games={games}
        challenges={challenges}
        dbUsername={dbUsername}
        copied={copied}
        onCopy={handleCopy}
        topRank={topRank}
        approvedChallengeIds={approvedChallengeIds}
      />

      {activeSubmissions.map(s => {
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
            <button className="dashboard__withdraw-btn" onClick={() => handleWithdrawRequest(s.id)}>
              Withdraw
            </button>
          </div>
        );
      })}

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

      <ChallengeList
        challenges={challenges}
        filter={filter}
        tiers={tiers}
        onFilterChange={setFilter}
        onChallengeClick={setActiveChallenge}
        getSubmissionStatus={getSubmissionStatus}
      />
    </div>
  );
};

export default Dashboard;
