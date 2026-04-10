import React, { useState, useRef, useEffect } from 'react';
import FounderLogin from './FounderLogin';
import type { FounderUser } from '../../types';

interface FounderGateProps {
  onLogin: (user: FounderUser) => void;
}

const FounderGate: React.FC<FounderGateProps> = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleHonorClick = () => {
    countRef.current += 1;
    clearTimeout(timerRef.current);
    if (countRef.current >= 3) {
      countRef.current = 0;
      setShowLogin(true);
      return;
    }
    timerRef.current = setTimeout(() => { countRef.current = 0; }, 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
    }}>
      {showLogin && (
        <FounderLogin
          onSuccess={(user) => {
            setShowLogin(false);
            onLogin(user);
          }}
          onCancel={() => setShowLogin(false)}
        />
      )}

      <div style={{ textAlign: 'center', userSelect: 'none' }}>
        <div
          onClick={handleHonorClick}
          style={{
            fontSize: '13px',
            letterSpacing: '4px',
            color: '#2a2a3e',
            cursor: 'default',
          }}
        >
          HONOR
        </div>
      </div>
    </div>
  );
};

export default FounderGate;
