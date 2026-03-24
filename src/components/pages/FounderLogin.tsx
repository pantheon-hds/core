import React, { useState } from 'react';
import './FounderLogin.css';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

interface FounderLoginProps {
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

const FounderLogin: React.FC<FounderLoginProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/founder-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Access denied.');
        setPassword('');
      } else {
        onSuccess(data.user);
      }
    } catch {
      setError('Connection error.');
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="founder-login" onClick={onCancel}>
      <div className="founder-login__box" onClick={e => e.stopPropagation()}>
        <div className="founder-login__title">⚜</div>
        <input
          className="founder-login__input"
          type="password"
          placeholder="Access key"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {error && <div className="founder-login__error">{error}</div>}
        <button
          className="founder-login__btn"
          onClick={handleLogin}
          disabled={loading || error.includes('Blocked') || error.includes('hours')}
        >
          {loading ? '...' : 'Enter'}
        </button>
      </div>
    </div>
  );
};

export default FounderLogin;
