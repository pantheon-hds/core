import React, { useState } from 'react';
import './WelcomeScreen.css';
import SteamAuth from '../ui/SteamAuth';

interface WelcomeScreenProps {
  onEnter: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  const [leaving, setLeaving] = useState(false);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(onEnter, 800);
  };

  return (
    <div className={`welcome ${leaving ? 'welcome--out' : ''}`}>
      <div className="welcome__line welcome__line--top" />
      <div className="welcome__line welcome__line--bottom" />

      <div className="welcome__content">
        <div className="welcome__words">
          <span className="welcome__word welcome__word--1">Honor</span>
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
