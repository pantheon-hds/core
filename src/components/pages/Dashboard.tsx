import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { SteamUser } from './SteamCallback';
import { getUserBySteamId, getUserRanks, checkAchievements, UserRank, supabase } from '../../services/supabase';

const TIER_COLORS: Record<string, string> = {
  Platinum: '#9ac4e4',
  Diamond: '#b8e4ff',
  Master: '#d4a8f4',
  Grandmaster: '#f4d4a8',
  Legend: '#e45a3a',
};

const STATUE_COLORS: Record<string, string> = {
  Gold: '#e8a830',
  'Silver III': '#d8eaf8',
  'Silver II': '#d8eaf8',
  'Silver I': '#d8eaf8',
  'Bronze III': '#e8974a',
  'Bronze II': '#e8974a',
  'Bronze I': '#e8974a',
};

const ALLOWED_DOMAINS = ['youtube.com', 'youtu.be', 'twitch.tv'];

function isValidVideoUrl(url: string): boolean {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return ALLOWED_DOMAINS.some(d => domain.includes(d));
  } catch {
    return false;
  }
}

const GAMES = [
  { appId: '367520', title: 'Hollow Knight' },
  { appId: '1030300', title: 'Hollow Knight: Silksong' },
];

interface DBChallenge {
  id: string;
  title: string;
  description: string;
  tier: string;
  attempts: number;
  game: any;
}

interface Submission {
  id: string;
  challenge_id: string;
  status: string;
  cooldown_until: string | null;
}

interface DashboardProps { user: SteamUser | null; }

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeChallenge, setActiveChallenge] = useState<DBChallenge | null>(null);
  const [submitChallenge, setSubmitChallenge] = useState<DBChallenge | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [challenges, setChallenges] = useState<DBChallenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Submit form state
  const [videoUrl, setVideoUrl] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const loadChallenges = useCallback(async () => {
    const { data } = await supabase
      .from('challenges')
      .select('*, game:games(title)')
      .order('tier', { ascending: true });
    setChallenges(data || []);
  }, []);

  const loadSubmissions = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('submissions')
      .select('id, challenge_id, status, cooldown_until')
      .eq('user_id', userId);
    setSubmissions(data || []);
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dbUser = await getUserBySteamId(user.steamId);
      if (dbUser) {
        setDbUserId(dbUser.id);
        await Promise.all(GAMES.map(g => checkAchievements(user.steamId, g.appId)));
        const userRanks = await getUserRanks(dbUser.id);
        setRanks(userRanks);
        await loadSubmissions(dbUser.id);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
    setLoading(false);
  }, [user, loadSubmissions]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);
  useEffect(() => { if (user) loadUserData(); }, [user, loadUserData]);

  const getSubmissionStatus = (challengeId: string) => {
    return submissions.find(s => s.challenge_id === challengeId);
  };

  const hasActiveSubmission = () => {
    return submissions.some(s => s.status === 'pending' || s.status === 'in_review');
  };

  const isOnCooldown = () => {
    const latest = submissions
      .filter(s => s.cooldown_until)
      .sort((a, b) => new Date(b.cooldown_until!).getTime() - new Date(a.cooldown_until!).getTime())[0];
    if (!latest?.cooldown_until) return false;
    return new Date(latest.cooldown_until) > new Date();
  };

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
    const { error } = await supabase.from('submissions').insert({
      user_id: dbUserId,
      challenge_id: submitChallenge.id,
      video_url: videoUrl.trim(),
      comment: comment.trim() || null,
      status: 'pending',
    });

    if (error) {
      setSubmitMessage(`Error: ${error.message}`);
    } else {
      setSubmitMessage('Submission sent! Judges will review your video.');
      setVideoUrl('');
      setComment('');
      await loadSubmissions(dbUserId);
      setTimeout(() => {
        setSubmitChallenge(null);
        setSubmitMessage('');
      }, 2000);
    }
    setSubmitting(false);
  };

  const handleWithdraw = async (submissionId: string) => {
    if (!window.confirm('Withdraw this submission? You will have a 24-hour cooldown.')) return;

    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 24);

    await supabase.from('submissions')
      .update({
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
        cooldown_until: cooldownUntil.toISOString(),
      })
      .eq('id', submissionId);

    if (dbUserId) await loadSubmissions(dbUserId);
  };

  const topRank = [...ranks].sort((a, b) => {
    const order = ['Gold', 'Silver III', 'Silver II', 'Silver I', 'Bronze III', 'Bronze II', 'Bronze I'];
    return order.indexOf(a.tier) - order.indexOf(b.tier);
  })[0];

  const statueColor = topRank ? (STATUE_COLORS[topRank.tier] || '#3a3020') : '#3a3020';
  const tiers = ['All', ...Array.from(new Set(challenges.map(c => c.tier)))];
  const filtered = filter === 'All' ? challenges : challenges.filter(c => c.tier === filter);

  return (
    <div className="dashboard">

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
              <button
                className="dashboard__modal-submit-btn"
                onClick={() => {
                  setActiveChallenge(null);
                  setSubmitChallenge(activeChallenge);
                }}
              >
                Submit Attempt
              </button>
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
        <div className="dashboard__rank-statue">
          <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="64">
            <ellipse cx="30" cy="72" rx="18" ry="5" fill="#1a1508" opacity="0.5"/>
            <rect x="15" y="58" width="30" height="12" rx="2" fill={topRank ? statueColor : '#2a2215'} opacity="0.7"/>
            <ellipse cx="30" cy="44" rx="12" ry="16" fill={statueColor}/>
            <circle cx="30" cy="24" r="10" fill={statueColor}/>
          </svg>
        </div>
        <div className="dashboard__rank-info">
          <div className="dashboard__rank-title">
            {loading ? 'Checking achievements...' : topRank ? topRank.tier : 'No rank yet'}
          </div>
          <div className="dashboard__rank-game">
            {loading ? 'Please wait' : topRank ? topRank.game?.title : 'Play games to earn ranks'}
          </div>
          <div className="dashboard__rank-bar">
            <div className="dashboard__rank-bar-fill" style={{ width: topRank ? '100%' : '0%' }} />
          </div>
          <div className="dashboard__rank-xp">
            {ranks.length} rank{ranks.length !== 1 ? 's' : ''} earned across {GAMES.length} games
          </div>
        </div>
      </div>

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
                <span className="dashboard__game-rank" style={{ color: STATUE_COLORS[rank.tier] || '#c9922a' }}>
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
          <div className="dashboard__stat-value">{submissions.filter(s => s.status === 'approved').length}</div>
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
