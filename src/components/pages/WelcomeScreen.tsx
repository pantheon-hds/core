import React, { useState, useRef, useEffect } from 'react';
import './WelcomeScreen.css';
import SteamAuth from '../ui/SteamAuth';
import FounderLogin from './FounderLogin';
import type { FounderUser } from '../../types';
import { validateInviteCode } from '../../services/supabase';

interface WelcomeScreenProps {
  onFounderLogin: (user: FounderUser) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFounderLogin }) => {
  const [showFounder, setShowFounder] = useState(false);
  const honorCountRef = useRef(0);
  const honorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(honorTimerRef.current), []);

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

  const handleHonorClick = () => {
    honorCountRef.current += 1;
    clearTimeout(honorTimerRef.current);
    if (honorCountRef.current >= 3) {
      honorCountRef.current = 0;
      setShowFounder(true);
      return;
    }
    honorTimerRef.current = setTimeout(() => { honorCountRef.current = 0; }, 2000);
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
    <div className="welcome">
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
      </div>
    </div>
  );
};

export default WelcomeScreen;
