import React, { useEffect, useState } from 'react';
import './SteamCallback.css';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

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
        const steamId = params.get('steamId');
        const username = params.get('username');
        const avatar = params.get('avatar');
        const isPublic = params.get('public') === 'true';

        // Success path — Steam already verified by Edge Function
        if (steamId && username) {
          setStatus('checking');
          setMessage('Checking achievements...');

          const user: SteamUser = {
            steamId,
            username: decodeURIComponent(username),
            avatarUrl: decodeURIComponent(avatar || ''),
            isPublic,
          };

          try {
            await fetch(
              `${SUPABASE_URL}/functions/v1/check-achievements`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ steamId, appId: '3228590' }),
              }
            );
          } catch (e) {
            console.log('Achievement check failed:', e);
          }

          window.history.replaceState({}, '', '/app');
          onSuccess(user);
          return;
        }

        // OpenID callback — redirect browser to Edge Function
        // Edge Function will verify and redirect back with steamId
        const claimedId = params.get('openid.claimed_id');
        if (!claimedId) {
          setStatus('error');
          setMessage('Login failed. Please try again.');
          setTimeout(onError, 2000);
          return;
        }

        setMessage('Verifying with Steam...');

        // Redirect browser directly to Edge Function
        // This avoids CORS issues with fetch + redirects
        window.location.href = `${SUPABASE_URL}/functions/v1/steam-auth?${params.toString()}`;

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
