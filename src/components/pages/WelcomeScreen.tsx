import React, { useState } from 'react';
import './WelcomeScreen.css';
import SteamAuth from '../ui/SteamAuth';
import FounderLogin from './FounderLogin';

interface WelcomeScreenProps {
  onEnter: () => void;
  onFounderLogin: (user: any) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter, onFounderLogin }) => {
  const [leaving, setLeaving] = useState(false);
  const [showFounder, setShowFounder] = useState(false);
  const [honorClicks, setHonorClicks] = useState(0);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(onEnter, 800);
  };

  const handleHonorClick = () => {
    const newCount = honorClicks + 1;
    setHonorClicks(newCount);
    if (newCount >= 3) {
      setShowFounder(true);
      setHonorClicks(0);
    }
    setTimeout(() => setHonorClicks(0), 2000);
  };

  return (
    <div className={`welcome ${leaving ? 'welcome--out' : ''}`}>
      {showFounder && (
        <FounderLogin
          onSuccess={(user) => {
            setShowFounder(false);
            onFounderLogin(user);
          }}
          onCancel={() => setShowFounder(false)}
        />
      )}

      <div className="welcome__line welcome__line--top" />
      <div className="welcome__line welcome__line--bottom" />

      <div className="welcome__content">
        <div className="welcome__words">
          <span
            className="welcome__word welcome__word--1"
            onClick={handleHonorClick}
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            Honor
          </span>
          <div className="welcome__sep" />
          <span className="welcome__word welcome__word--2">Democracy</span>
          <div className="welcome__sep" />
          <span className="welcome__word welcome__word--3">Skill</span>
        </div>

        <SteamAuth />

        <button className="welcome__demo" onClick={handleEnter}>
          View demo without login
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
