import React, { useEffect, useState } from 'react';
import './SteamCallback.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SteamCallbackProps {
  onSuccess: (user: SteamUser) => void;
  onError: () => void;
}

export interface SteamUser {
  steamId: string;
  username: string;
  avatarUrl: string;
  isPublic: boolean;
  token: string;
}

const SteamCallback: React.FC<SteamCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState<'loading' | 'checking' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying Steam login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        // Success path — exchange one-time code for JWT (token never travels in URL)
        const code = params.get('code');
        if (code) {
          setStatus('checking');
          setMessage('Completing login...');

          const res = await fetch(`${SUPABASE_URL}/functions/v1/exchange-code`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (!res.ok) {
            setStatus('error');
            setMessage('Login failed. Please try again.');
            setTimeout(onError, 2000);
            return;
          }

          const data = await res.json();
          if (!data.success) {
            setStatus('error');
            setMessage('Login failed. Please try again.');
            setTimeout(onError, 2000);
            return;
          }

          setMessage('Checking achievements...');

          const user: SteamUser = {
            steamId: data.steamId,
            username: data.username,
            avatarUrl: data.avatarUrl,
            isPublic: data.isPublic,
            token: data.token,
          };

          try {
            await fetch(`${SUPABASE_URL}/functions/v1/check-achievements`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ steamId: data.steamId, appId: '3228590' }),
            });
          } catch (e) {
            console.warn('Achievement check failed (will retry on dashboard load):', e);
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

        // Attach invite nonce from localStorage so steam-auth can validate new users
        const inviteNonce = localStorage.getItem('invite_nonce');
        const nonceParam = inviteNonce ? `&invite_nonce=${encodeURIComponent(inviteNonce)}` : '';

        // Redirect browser directly to Edge Function
        // This avoids CORS issues with fetch + redirects
        window.location.href = `${SUPABASE_URL}/functions/v1/steam-auth?${params.toString()}${nonceParam}`;

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
