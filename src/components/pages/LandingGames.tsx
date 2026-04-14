import React from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../layout/LandingLayout';
import './LandingGames.css';

const LandingGames: React.FC = () => {
  return (
    <LandingLayout>
      <div className="lg__page">
        <div className="lg__inner">
          <div className="lg__label">Supported Games</div>
          <h1 className="lg__title">Start Your Journey</h1>
          <div className="lg__subtitle">
            Currently in closed beta with two games. More will be added as the community grows.
          </div>

          <div className="lg__games">
            <div className="lg__game">
              <div className="lg__game-header">
                <div className="lg__game-status lg__game-status--live">● Live</div>
              </div>
              <div className="lg__game-title">Hollow Knight</div>
              <div className="lg__game-studio">Team Cherry · 2017</div>
              <div className="lg__game-divider" />
              <div className="lg__game-stats">
                <div className="lg__game-stat">
                  <div className="lg__game-stat-value">63</div>
                  <div className="lg__game-stat-label">Achievements</div>
                </div>
                <div className="lg__game-stat">
                  <div className="lg__game-stat-value">Gold</div>
                  <div className="lg__game-stat-label">Auto rank at 100%</div>
                </div>
              </div>
              <div className="lg__game-desc">
                A challenging metroidvania set in a vast underground kingdom of insects. One of the deepest games ever made.
              </div>
            </div>

            <div className="lg__game">
              <div className="lg__game-header">
                <div className="lg__game-status lg__game-status--live">● Live</div>
              </div>
              <div className="lg__game-title">Hollow Knight: Silksong</div>
              <div className="lg__game-studio">Team Cherry · 2025</div>
              <div className="lg__game-divider" />
              <div className="lg__game-stats">
                <div className="lg__game-stat">
                  <div className="lg__game-stat-value">57</div>
                  <div className="lg__game-stat-label">Achievements</div>
                </div>
                <div className="lg__game-stat">
                  <div className="lg__game-stat-value">Gold</div>
                  <div className="lg__game-stat-label">Auto rank at 100%</div>
                </div>
              </div>
              <div className="lg__game-desc">
                The long-awaited sequel. Play as Hornet in a brand-new kingdom filled with new enemies and challenges.
              </div>
            </div>

          </div>

          <div className="lg__note">
            <div className="lg__note-title">Challenges are in development</div>
            <div className="lg__note-text">
              Gold rank is awarded automatically when you hit 100% achievements. Challenges — the path to Platinum and beyond — are being built together with the first testers. If you want to help shape them, request an invite.
            </div>
          </div>

          <div className="lg__cta">
            <Link to="/beta" className="ll__btn ll__btn--primary">Request Invite</Link>
            <Link to="/ranks" className="ll__btn ll__btn--ghost">See Rank System</Link>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingGames;
