import React, { useState } from 'react';
import './WelcomeScreen.css';
import SteamAuth from '../ui/SteamAuth';
import FounderLogin from './FounderLogin';
import type { FounderUser } from '../../types';
import { validateInviteCode } from '../../services/supabase';

interface WelcomeScreenProps {
  onEnter: () => void;
  onFounderLogin: (user: FounderUser) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter, onFounderLogin }) => {
  const [leaving, setLeaving] = useState(false);
  const [showFounder, setShowFounder] = useState(false);
  const [honorClicks, setHonorClicks] = useState(0);

  const [betaUnlocked, setBetaUnlocked] = useState(
    localStorage.getItem('pantheon_beta') === 'true'
  );
  const [betaInput, setBetaInput] = useState('');
  const [betaError, setBetaError] = useState('');
  const [betaLoading, setBetaLoading] = useState(false);

  const handleBetaSubmit = async () => {
    if (!betaInput.trim()) return;
    setBetaLoading(true);
    setBetaError('');
    const valid = await validateInviteCode(betaInput.trim());
    setBetaLoading(false);
    if (valid) {
      localStorage.setItem('pantheon_beta', 'true');
      setBetaUnlocked(true);
    } else {
      setBetaError('Invalid or already used invite code.');
      setBetaInput('');
    }
  };

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

  if (!betaUnlocked) {
    return (
      <div className="welcome">
        <div className="welcome__line welcome__line--top" />
        <div className="welcome__line welcome__line--bottom" />
        <div className="welcome__content">
          <img src="/logo-hero.png" alt="Pantheon" className="welcome__logo" />
          <div className="welcome__words">
            <span className="welcome__word welcome__word--1">Honor</span>
            <div className="welcome__sep" />
            <span className="welcome__word welcome__word--2">Democracy</span>
            <div className="welcome__sep" />
            <span className="welcome__word welcome__word--3">Skill</span>
          </div>
          <div className="welcome__beta-gate">
            <div className="welcome__beta-title">Closed Beta</div>
            <div className="welcome__beta-text">Enter your access code to continue.</div>
            <input
              className="welcome__beta-input"
              type="password"
              placeholder="Access code"
              value={betaInput}
              onChange={e => setBetaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBetaSubmit()}
              autoFocus
            />
            {betaError && <div className="welcome__beta-error">{betaError}</div>}
            <button className="welcome__beta-btn" onClick={handleBetaSubmit} disabled={betaLoading}>
              {betaLoading ? 'Checking...' : 'Enter'}
            </button>
            <div className="welcome__beta-divider">or</div>
            <SteamAuth />
            <a href="/" className="welcome__beta-back">← Back to site</a>
          </div>
        </div>
      </div>
    );
  }

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
        <img src="/logo-hero.png" alt="Pantheon" className="welcome__logo" />
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
