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

interface DashboardProps { user: SteamUser | null; }

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeChallenge, setActiveChallenge] = useState<DBChallenge | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [ranks, setRanks] = useState<UserRank[]>([]);
  const [challenges, setChallenges] = useState<DBChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChallenges = useCallback(async () => {
    const { data } = await supabase
      .from('challenges')
      .select('*, game:games(title)')
      .order('tier', { ascending: true });
    setChallenges(data || []);
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dbUser = await getUserBySteamId(user.steamId);
      if (dbUser) {
        await Promise.all(GAMES.map(g => checkAchievements(user.steamId, g.appId)));
        const userRanks = await getUserRanks(dbUser.id);
        setRanks(userRanks);
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    if (!user) return;
    loadUserData();
  }, [user, loadUserData]);

  const topRank = ranks.sort((a, b) => {
    const order = ['Gold', 'Silver III', 'Silver II', 'Silver I', 'Bronze III', 'Bronze II', 'Bronze I'];
    return order.indexOf(a.tier) - order.indexOf(b.tier);
  })[0];

  const statueColor = topRank ? (STATUE_COLORS[topRank.tier] || '#3a3020') : '#3a3020';

  const tiers = ['All', ...Array.from(new Set(challenges.map(c => c.tier)))];
  const filtered = filter === 'All' ? challenges : challenges.filter(c => c.tier === filter);

  return (
    <div className="dashboard">
      {activeChallenge && (
        <div className="dashboard__modal-overlay" onClick={() => setActiveChallenge(null)}>
          <div className="dashboard__modal" onClick={e => e.stopPropagation()}>
            <div className="dashboard__modal-tier" style={{ color: TIER_COLORS[activeChallenge.tier] || '#c9922a' }}>
              {activeChallenge.tier}
            </div>
            <div className="dashboard__modal-title">{activeChallenge.title}</div>
            <div className="dashboard__modal-desc">{activeChallenge.description}</div>
            <div className="dashboard__modal-meta">
              {activeChallenge.game?.title}
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
          <div className="dashboard__stat-value">{ranks.length * 100}</div>
          <div className="dashboard__stat-label">Rank Points</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{challenges.length}</div>
          <div className="dashboard__stat-label">Challenges</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{ranks.length}</div>
          <div className="dashboard__stat-label">Ranks</div>
        </div>
      </div>

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
          filtered.map(challenge => (
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
