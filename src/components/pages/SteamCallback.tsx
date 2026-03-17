import React, { useEffect, useState } from 'react';
import './SteamCallback.css';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('KEY exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);

interface SteamCallbackProps {
  onSuccess: (user: SteamUser) => void;
  onError: () => void;
}

export interface SteamUser {
  steamId: string;
  username: string;
  avatarUrl: string;
  isPublic: boolean;
}

const SteamCallback: React.FC<SteamCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState<'loading' | 'checking' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying Steam login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
console.log('All params:', window.location.search);
console.log('steamId param:', params.get('steamId'));
console.log('username param:', params.get('username'));
        const steamId = params.get('steamId');
        const username = params.get('username');
        const avatar = params.get('avatar');
        const isPublic = params.get('public') === 'true';

        if (steamId && username) {
          setStatus('checking');
          setMessage('Checking achievements...');

          const user: SteamUser = {
            steamId,
            username: decodeURIComponent(username),
            avatarUrl: decodeURIComponent(avatar || ''),
            isPublic,
          };

          window.history.replaceState({}, '', '/');
          onSuccess(user);
          return;
        }

        const claimedId = params.get('openid.claimed_id');
        if (!claimedId) {
          onError();
          return;
        }

        setMessage('Verifying with Steam...');

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/steam-auth?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        if (!response.ok) {
          throw new Error('Auth failed');
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

      } catch (error) {
        console.error('Steam callback error:', error);
        setStatus('error');
        setMessage('Login failed. Please try again.');
        setTimeout(onError, 2000);
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div className="steam-callback">
      <div className="steam-callback__content">
        {status === 'error' ? (
          <div className="steam-callback__error">{message}</div>
        ) : (
          <>
            <div className="steam-callback__spinner" />
            <div className="steam-callback__message">{message}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default SteamCallback;
