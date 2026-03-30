import React from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../layout/LandingLayout';
import './LandingRanks.css';

const ranks = [
  { tier: 'Bronze', color: '#e8974a', how: 'Automatic · Steam API', desc: '1-74% Steam achievements. Your journey begins.' },
  { tier: 'Silver', color: '#d8eaf8', how: 'Automatic · Steam API', desc: '75-99% Steam achievements. Almost there.' },
  { tier: 'Gold', color: '#e8a830', how: 'Automatic · Steam API', desc: '100% Steam achievements. The starting point of greatness.' },
  { tier: 'Platinum', color: '#9ac4e4', how: 'Community · Judge verified', desc: 'Complete community challenges. Verified by real judges.' },
  { tier: 'Diamond', color: '#b8e4ff', how: 'Community · Judge verified', desc: 'Elite challenges. Only the dedicated reach this far.' },
  { tier: 'Master', color: '#d4a8f4', how: 'Community · Judge verified', desc: 'Master-level challenges. True mastery of the game.' },
  { tier: 'Grandmaster', color: '#f4d4a8', how: 'Community recognition', desc: 'Beyond challenges. The community recognizes your legacy.' },
  { tier: 'Legend', color: '#e45a3a', how: 'Community vote only', desc: 'The highest honor. Granted by community vote alone. Your statue stands forever.' },
];

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
                  <div className="lr__rank-dot" style={{ background: rank.color }} />
                  <div className="lr__rank-num">{String(i + 1).padStart(2, '0')}</div>
                </div>
                <div className="lr__rank-content">
                  <div className="lr__rank-name" style={{ color: rank.color }}>{rank.tier}</div>
                  <div className="lr__rank-how">{rank.how}</div>
                  <div className="lr__rank-desc">{rank.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="lr__note">
            <div className="lr__note-title">How verification works</div>
            <div className="lr__note-text">
              Gold rank is awarded automatically when you connect Steam and have 100% achievements.
              Platinum and above require submitting a video proof of a community challenge.
              Three randomly selected judges watch your video anonymously and vote.
              2 of 3 approvals required. No exceptions.
            </div>
          </div>

          <div className="lr__cta">
            <Link to="/beta" className="lr__btn lr__btn--primary">Start Your Journey</Link>
            <Link to="/games" className="lr__btn lr__btn--ghost">See Supported Games</Link>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingRanks;
