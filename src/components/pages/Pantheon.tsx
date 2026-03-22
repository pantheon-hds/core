import React from 'react';
import './Pantheon.css';

const Pantheon: React.FC = () => {
  return (
    <div className="pantheon">
      <div className="pantheon__header">
        <div className="pantheon__title">Pantheon of Legends</div>
        <div className="pantheon__subtitle">
          Only the community decides who is worthy. No algorithms. No money. Just skill.
        </div>
      </div>

      <div className="pantheon__empty">
        <div className="pantheon__empty-icon">
          <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
            <polygon
              points="30,4 37,22 56,22 41,34 47,52 30,41 13,52 19,34 4,22 23,22"
              stroke="#3a2e1a"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>
        <div className="pantheon__empty-title">No Legends Yet</div>
        <div className="pantheon__empty-text">
          The Pantheon awaits its first Legend.
          Complete challenges. Prove your skill.
          Let the community decide.
        </div>
        <div className="pantheon__empty-hint">
          Be the first to earn a Legend rank.
          Your statue will stand here forever.
        </div>
      </div>
    </div>
  );
};

export default Pantheon;
