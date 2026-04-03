import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import SteamCallback, { SteamUser } from './components/pages/SteamCallback';
import Dashboard from './components/pages/Dashboard';
import Pantheon from './components/pages/Pantheon';
import Profile from './components/pages/Profile';
import Admin from './components/pages/Admin';
import JudgePanel from './components/pages/JudgePanel';
import Sandbox from './components/pages/Sandbox';
import Sidebar, { Page } from './components/ui/Sidebar';
import WelcomeScreen from './components/pages/WelcomeScreen';
import type { FounderUser } from './types';
import { supabase } from './services/supabase';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LandingHome from './components/pages/LandingHome';
import LandingRanks from './components/pages/LandingRanks';
import LandingGames from './components/pages/LandingGames';
import LandingBeta from './components/pages/LandingBeta';
import LandingFAQ from './components/pages/LandingFAQ';
import PublicProfile from './components/pages/PublicProfile';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } }, // cache 5 minutes
});

const isSteamCallback = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.has('openid.claimed_id') || params.has('steamId');
};

const getSavedUser = (): SteamUser | null => {
  try {
    const saved = localStorage.getItem('pantheon_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const AppShell: React.FC<{ user: SteamUser | null; onLogout: () => void }> = ({ user, onLogout }) => {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    pantheon: 'Pantheon of Legends',
    profile: 'Player Profile',
    admin: 'Admin Panel',
    judge: 'Judge Panel',
    sandbox: 'Sandbox',
  };

  const isFounder = user?.steamId === 'VOLAND_FOUNDER';

  return (
    <div className="app">
      <div className="app__layout app__layout--visible">
        {sidebarOpen && (
          <div className="app__sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <Sidebar
          current={page}
          onChange={(p) => { setPage(p); setSidebarOpen(false); }}
          user={user}
          onLogout={onLogout}
          isOpen={sidebarOpen}
        />
        <div className="app__main">
          <div className="app__topbar">
            <button className="app__hamburger" onClick={() => setSidebarOpen(o => !o)}>≡</button>
            <span className="app__topbar-title">{titles[page]}</span>
            <div className="app__topbar-tags">
              {isFounder && <span className="app__tag app__tag--founder">⚜ Founder</span>}
              {user && <span className="app__tag app__tag--live">● {user.username}</span>}
            </div>
          </div>
          <div className="app__content">
            <ErrorBoundary key={page}>
              {page === 'dashboard' && <Dashboard user={user} />}
              {page === 'pantheon' && <Pantheon />}
              {page === 'profile' && <Profile user={user} />}
              {page === 'admin' && <Admin user={user} />}
              {page === 'judge' && <JudgePanel user={user} />}
              {page === 'sandbox' && <Sandbox user={user} />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SteamUser | null>(getSavedUser());

  const handleLogout = () => {
    localStorage.removeItem('pantheon_user');
    setUser(null);
    navigate('/');
  };

  const handleFounderLogin = (founderUser: FounderUser) => {
    const steamUser: SteamUser = {
      steamId: founderUser.steamId,
      username: founderUser.username,
      avatarUrl: founderUser.avatarUrl,
      isPublic: true,
    };
    localStorage.setItem('pantheon_user', JSON.stringify(steamUser));
    setUser(steamUser);
    navigate('/app');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingHome />} />
      <Route path="/ranks" element={<LandingRanks />} />
      <Route path="/games" element={<LandingGames />} />
      <Route path="/beta" element={<LandingBeta />} />
      <Route path="/faq" element={<LandingFAQ />} />
      <Route
        path="/app"
        element={
          user
            ? <AppShell user={user} onLogout={handleLogout} />
            : <WelcomeScreen
                onEnter={() => {}}
                onFounderLogin={handleFounderLogin}
              />
        }
      />
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  if (isSteamCallback()) {
    // Full-page redirect after OAuth — window.location.href intentional here
    // to clear OAuth params from the URL bar
    return (
      <SteamCallback
        onSuccess={async (steamUser) => {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('steam_id', steamUser.steamId)
            .maybeSingle();
          if (!data) {
            window.location.href = '/beta?reason=no_access';
            return;
          }
          localStorage.setItem('pantheon_user', JSON.stringify(steamUser));
          localStorage.setItem('pantheon_beta', 'true');
          window.location.href = '/app';
        }}
        onError={() => { window.location.href = '/app'; }}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
