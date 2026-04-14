import React from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../layout/LandingLayout';
import { getRankImage } from '../../constants/ranks';
import './LandingRanks.css';

const ranks = [
  { tier: 'Bronze', color: '#e8974a', how: 'Automatic · Steam API', desc: '1-74% Steam achievements. Your journey begins.', sub: 'Three tiers: Bronze I · Bronze II · Bronze III' },
  { tier: 'Silver', color: '#d8eaf8', how: 'Automatic · Steam API', desc: '75-99% Steam achievements. Almost there.', sub: 'Three tiers: Silver I · Silver II · Silver III' },
  { tier: 'Gold', color: '#e8a830', how: 'Automatic · Steam API', desc: '100% Steam achievements. The starting point of greatness.' },
  { tier: 'Platinum', color: '#9ac4e4', how: 'Judge verified', desc: 'Complete community challenges. Verified by real judges.' },
  { tier: 'Diamond', color: '#b8e4ff', how: 'Judge verified', desc: 'Elite challenges. Only the dedicated reach this far.' },
  { tier: 'Master', color: '#d4a8f4', how: 'Judge verified', desc: 'Master-level challenges. True mastery of the game.' },
  { tier: 'Grandmaster', color: '#f4d4a8', how: 'Judge verified', desc: 'Grandmaster-level challenges. The pinnacle of skill.' },
  { tier: 'Legend', color: '#e45a3a', how: 'Judge verified', desc: 'The highest award. Awarded to those who have proven their place among the best. Legends never die.' },
] as { tier: string; color: string; how: string; desc: string; sub?: string }[];

const LandingRanks: React.FC = () => {
  return (
    <LandingLayout>
      <div className="lr__page">
        <div className="lr__inner">
          <div className="lr__label">The Path</div>
          <h1 className="lr__title">Eight Ranks. One Legend.</h1>
          <div className="lr__subtitle">
            Every rank is earned. None can be purchased. The path is long, but every step is real.
          </div>

          <div className="lr__ranks">
            {ranks.map((rank, i) => (
              <div key={i} className="lr__rank">
                <div className="lr__rank-left">
                  <img src={getRankImage(rank.tier)} alt={rank.tier} className="lr__rank-badge" />
                  <div className="lr__rank-num">{String(i + 1).padStart(2, '0')}</div>
                </div>
                <div className="lr__rank-content">
                  <div className="lr__rank-name" style={{ color: rank.color }}>{rank.tier}</div>
                  <div className="lr__rank-how">{rank.how}</div>
                  <div className="lr__rank-desc">{rank.desc}</div>
                  {rank.sub && <div className="lr__rank-sub">{rank.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="lr__note">
            <div className="lr__note-title">How verification works</div>
            <div className="lr__note-text">
              Gold rank is awarded automatically when you connect Steam and have all achievements completed.
              Platinum and above require submitting video proof of a community challenge.
              Three randomly selected judges watch your video anonymously and vote.
              2 of 3 approvals required. No exceptions.
            </div>
          </div>

          <div className="lr__cta">
            <Link to="/beta" className="ll__btn ll__btn--primary">Start Your Journey</Link>
            <Link to="/games" className="ll__btn ll__btn--ghost">See Supported Games</Link>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingRanks;
