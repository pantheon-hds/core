import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { eldenRingChallenges, Challenge, Tier } from '../../data/challenges';
import { SteamUser } from './SteamCallback';
import { getUserBySteamId, getUserRanks, checkAchievements, UserRank } from '../../services/supabase';

const tierColors: Record<Tier, string> = {
  Platinum: '#8ab4d4',
  Diamond: '#a8d4f4',
  Legend: '#c44a2a',
};

const STATUE_COLORS: Record<string, string> = {
  Gold: '#c9922a',
  'Silver III': '#a0b4c8',
  'Silver II': '#a0b4c8',
  'Silver I': '#a0b4c8',
  'Bronze III': '#8b6040',
  'Bronze II': '#8b6040',
  'Bronze I': '#8b6040',
};

const GAMES = [
  { appId: '3228590', title: 'Deadzone: Rogue' },
  { appId: '367520', title: 'Hollow Knight' },
  { appId: '1030300', title: 'Hollow Knight: Silksong' },
];

interface DashboardProps { user: SteamUser | null; }

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<Tier | 'All'>('All');
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = filter === 'All'
    ? eldenRingChallenges
    : eldenRingChallenges.filter(c => c.tier === filter);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dbUser = await getUserBySteamId(user.steamId);
      if (dbUser) {
        // Auto-check all games
        await Promise.all(GAMES.map(g => checkAchievements(user.steamId, g.appId)));
        // Load updated ranks
        const userRanks = await getUserRanks(dbUser.id);
        setRanks(userRanks);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadUserData();
  }, [user, loadUserData]);

  const topRank = ranks.sort((a, b) => {
    const order = ['Gold', 'Silver III', 'Silver II', 'Silver I', 'Bronze III', 'Bronze II', 'Bronze I'];
    return order.indexOf(a.tier) - order.indexOf(b.tier);
  })[0];

  const statueColor = topRank ? (STATUE_COLORS[topRank.tier] || '#3a3020') : '#3a3020';

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

      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{ranks.length > 0 ? ranks.length * 100 : 0}</div>
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
