import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { eldenRingChallenges, Challenge, Tier } from '../../data/challenges';
import { SteamUser } from './SteamCallback';
import { getUserBySteamId, getUserRanks, checkAchievements, UserRank } from '../../services/supabase';

const tierColors: Record<Tier, string> = {
  Platinum: '#8ab4d4',
  Diamond: '#a8d4f4',
  Legend: '#c44a2a',
};

interface DashboardProps { user: SteamUser | null; }

const GAMES = [
  { appId: '3228590', title: 'Deadzone: Rogue' },
  { appId: '367520', title: 'Hollow Knight' },
  { appId: '1030300', title: 'Hollow Knight: Silksong' },
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<Tier | 'All'>('All');
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingGame, setCheckingGame] = useState<string | null>(null);

  const filtered = filter === 'All'
    ? eldenRingChallenges
    : eldenRingChallenges.filter(c => c.tier === filter);

  useEffect(() => {
    if (!user) return;
    loadUserData();
   }, [user, loadUserData]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dbUser = await getUserBySteamId(user.steamId);
      if (dbUser) {
        const userRanks = await getUserRanks(dbUser.id);
        setRanks(userRanks);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
    setLoading(false);
  };

  const handleCheckGame = async (appId: string, title: string) => {
    if (!user) return;
    setCheckingGame(title);
    try {
      const result = await checkAchievements(user.steamId, appId);
      if (result?.isGold) {
        await loadUserData();
      }
      alert(result
        ? `${title}: ${result.unlocked}/${result.total} achievements (${result.percentage}%)${result.isGold ? ' — Gold rank assigned!' : ''}`
        : 'Could not check achievements. Make sure your Steam profile is public.'
      );
    } catch (e) {
      console.error('Check failed:', e);
    }
    setCheckingGame(null);
  };

  const topRank = ranks[0];

  return (
    <div className="dashboard">
      {activeChallenge && (
        <div className="dashboard__modal-overlay" onClick={() => setActiveChallenge(null)}>
          <div className="dashboard__modal" onClick={e => e.stopPropagation()}>
            <div className="dashboard__modal-tier" style={{ color: tierColors[activeChallenge.tier] }}>
              {activeChallenge.tier}
            </div>
            <div className="dashboard__modal-title">{activeChallenge.title}</div>
            <div className="dashboard__modal-desc">{activeChallenge.description}</div>
            <div className="dashboard__modal-meta">
              {activeChallenge.attempts.toLocaleString()} attempts worldwide
            </div>
            <button className="dashboard__modal-close" onClick={() => setActiveChallenge(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="dashboard__rank-card">
        <div className="dashboard__rank-statue">
          <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="30" cy="72" rx="18" ry="5" fill="#1a1508" opacity="0.5"/>
            <rect x="15" y="58" width="30" height="12" rx="2" fill={topRank?.tier === 'Gold' ? '#8b6914' : '#2a2215'}/>
            <ellipse cx="30" cy="44" rx="12" ry="16" fill={topRank?.tier === 'Gold' ? '#c9922a' : '#3a3020'}/>
            <circle cx="30" cy="24" r="10" fill={topRank?.tier === 'Gold' ? '#c9922a' : '#3a3020'}/>
          </svg>
        </div>
        <div className="dashboard__rank-info">
          <div className="dashboard__rank-title">
            {loading ? 'Loading...' : topRank ? `${topRank.tier} I` : 'No rank yet'}
          </div>
          <div className="dashboard__rank-game">
            {topRank ? (topRank.game as any)?.title : 'Check your achievements below'}
          </div>
          <div className="dashboard__rank-bar">
            <div className="dashboard__rank-bar-fill" style={{ width: topRank ? '100%' : '0%' }} />
          </div>
          <div className="dashboard__rank-xp">
            {ranks.length} rank{ranks.length !== 1 ? 's' : ''} earned
          </div>
        </div>
      </div>

      {/* Check achievements section */}
      {user && (
        <div className="dashboard__games">
          <div className="dashboard__games-title">Check Your Achievements</div>
          <div className="dashboard__games-list">
            {GAMES.map(game => {
              const hasRank = ranks.some(r => (r.game as any)?.steam_app_id === game.appId);
              return (
                <div key={game.appId} className="dashboard__game-item">
                  <span className="dashboard__game-title">{game.title}</span>
                  {hasRank ? (
                    <span className="dashboard__game-gold">✓ Gold</span>
                  ) : (
                    <button
                      className="dashboard__game-btn"
                      onClick={() => handleCheckGame(game.appId, game.title)}
                      disabled={checkingGame === game.title}
                    >
                      {checkingGame === game.title ? 'Checking...' : 'Check'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{ranks.length > 0 ? '847' : '0'}</div>
          <div className="dashboard__stat-label">Rank Points</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">10</div>
          <div className="dashboard__stat-label">Challenges</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{ranks.length}</div>
          <div className="dashboard__stat-label">Ranks</div>
        </div>
      </div>

      <div className="dashboard__challenges-header">
        <span className="dashboard__challenges-title">Challenges — Elden Ring</span>
        <div className="dashboard__filters">
          {(['All', 'Platinum', 'Diamond', 'Legend'] as const).map(t => (
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
        {filtered.map(challenge => (
          <div
            key={challenge.id}
            className="dashboard__challenge"
            onClick={() => setActiveChallenge(challenge)}
          >
            <div
              className="dashboard__challenge-dot"
              style={{ background: tierColors[challenge.tier] }}
            />
            <span className="dashboard__challenge-title">{challenge.title}</span>
            <span className="dashboard__challenge-tier">{challenge.tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
