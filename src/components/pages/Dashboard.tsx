import React, { useState, useCallback, useMemo } from 'react';
import './Dashboard.css';
import { SteamUser } from './SteamCallback';
import { assignJudges, getUserRanks, supabase } from '../../services/supabase';
import { RANK_TIER_COLORS, getRankOrder } from '../../constants/ranks';
import { Toast } from '../ui/Toast';
import { useChallenges } from '../../hooks/useChallenges';
import { useUserData } from '../../hooks/useUserData';
import { useSubmissions } from '../../hooks/useSubmissions';
import ChallengeDetailModal from '../dashboard/ChallengeDetailModal';
import SubmitModal from '../dashboard/SubmitModal';
import RankCard from '../dashboard/RankCard';
import ChallengeList from '../dashboard/ChallengeList';
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
  const { dbUserId, dbUsername, ranks, statues, setRanks, isBanned, banReason, banUntil } = useUserData(user, games);

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
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const approvedChallengeIds = approvedSubmissions.map(s => s.challenge_id);

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
          onClose={() => { setSubmitChallenge(null); setSubmitMessage(''); }}
        />
      )}

      <RankCard
        ranks={ranks}
        statues={statues}
        games={games}
        challenges={challenges}
        dbUsername={dbUsername}
        copied={copied}
        onCopy={() => {
          navigator.clipboard.writeText(`https://pantheonhds.com/u/${dbUsername}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        topRank={topRank}
        approvedChallengeIds={approvedChallengeIds}
      />

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
            <button className="dashboard__withdraw-btn" onClick={() => handleWithdraw(s.id)}>
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
