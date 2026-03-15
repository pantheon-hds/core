import React, { useState } from 'react';
import './Dashboard.css';
import { eldenRingChallenges, Challenge, Tier } from '../../data/challenges';

const tierColors: Record<Tier, string> = {
  Platinum: '#8ab4d4',
  Diamond: '#a8d4f4',
  Legend: '#c44a2a',
};

const Dashboard: React.FC = () => {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<Tier | 'All'>('All');

  const filtered = filter === 'All'
    ? eldenRingChallenges
    : eldenRingChallenges.filter(c => c.tier === filter);

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

      <div className="dashboard__hero">
        <div className="dashboard__hero-top" />
        <div className="dashboard__statue">
          <svg width="64" height="78" viewBox="0 0 64 78" fill="none">
            <rect x="16" y="68" width="32" height="9" rx="1" fill="#2a2215"/>
            <rect x="22" y="57" width="20" height="12" rx="1" fill="#3a2e1a"/>
            <ellipse cx="32" cy="19" rx="10" ry="12" fill="#c9922a" opacity="0.9"/>
            <rect x="23" y="30" width="18" height="26" rx="2" fill="#b07820"/>
            <line x1="19" y1="36" x2="23" y2="36" stroke="#c9922a" strokeWidth="2" strokeLinecap="round"/>
            <line x1="41" y1="36" x2="45" y2="36" stroke="#c9922a" strokeWidth="2" strokeLinecap="round"/>
            <line x1="45" y1="36" x2="49" y2="44" stroke="#c9922a" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="46,42 51,38 50,46" fill="#c9922a" opacity="0.8"/>
            <circle cx="32" cy="11" r="3" fill="#e8d5a0" opacity="0.25"/>
          </svg>
        </div>
        <div className="dashboard__rank-info">
          <div className="dashboard__rank-name">Gold III</div>
          <div className="dashboard__rank-game">Elden Ring · Season 1</div>
          <div className="dashboard__xp-wrap">
            <div className="dashboard__xp-track">
              <div className="dashboard__xp-fill" style={{ width: '62%' }} />
            </div>
            <div className="dashboard__xp-meta">
              <span>847 / 1000 XP</span>
              <span>153 to Platinum</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard__stats">
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">847</div>
          <div className="dashboard__stat-label">Skill Points</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{eldenRingChallenges.length}</div>
          <div className="dashboard__stat-label">Challenges</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">3</div>
          <div className="dashboard__stat-label">Statues</div>
        </div>
      </div>

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

      <div className="dashboard__section-title">Challenges — Elden Ring</div>

      <div className="dashboard__challenges">
        {filtered.map(ch => (
          <div className="dashboard__challenge" key={ch.id} onClick={() => setActiveChallenge(ch)}>
            <div className="dashboard__challenge-dot" style={{ background: tierColors[ch.tier] }} />
            <div className="dashboard__challenge-name">{ch.title}</div>
            <div className="dashboard__challenge-attempts">{ch.attempts.toLocaleString()}</div>
            <div className="dashboard__challenge-tier">{ch.tier}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
