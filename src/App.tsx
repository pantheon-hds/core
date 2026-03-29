import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SteamCallback, { SteamUser } from './components/pages/SteamCallback';
import Dashboard from './components/pages/Dashboard';
import Pantheon from './components/pages/Pantheon';
import Profile from './components/pages/Profile';
import Admin from './components/pages/Admin';
import JudgePanel from './components/pages/JudgePanel';
import Sandbox from './components/pages/Sandbox';
import FAQ from './components/pages/FAQ';
import Sidebar, { Page } from './components/ui/Sidebar';
import WelcomeScreen from './components/pages/WelcomeScreen';
import LandingHome from './components/pages/LandingHome';
import LandingRanks from './components/pages/LandingRanks';
import LandingGames from './components/pages/LandingGames';
import LandingBeta from './components/pages/LandingBeta';

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

  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    pantheon: 'Pantheon of Legends',
    profile: 'Player Profile',
    admin: 'Admin Panel',
    judge: 'Judge Panel',
    sandbox: 'Sandbox',
    faq: 'About & FAQ',
  };

  const isFounder = user?.steamId === 'VOLAND_FOUNDER';

  return (
    <div className="app">
      <div className="app__layout app__layout--visible">
        <Sidebar current={page} onChange={setPage} user={user} onLogout={onLogout} />
        <div className="app__main">
          <div className="app__topbar">
            <span className="app__topbar-title">{titles[page]}</span>
            <div className="app__topbar-tags">
              {isFounder && <span className="app__tag app__tag--founder">⚜ Founder</span>}
              {user && <span className="app__tag app__tag--live">● {user.username}</span>}
            </div>
          </div>
          <div className="app__content">
            {page === 'dashboard' && <Dashboard user={user} />}
            {page === 'pantheon' && <Pantheon />}
            {page === 'profile' && <Profile user={user} />}
            {page === 'admin' && <Admin user={user} />}
            {page === 'judge' && <JudgePanel user={user} />}
            {page === 'sandbox' && <Sandbox user={user} />}
            {page === 'faq' && <FAQ />}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<SteamUser | null>(getSavedUser());

  if (isSteamCallback()) {
    return (
      <SteamCallback
        onSuccess={(steamUser) => {
          localStorage.setItem('pantheon_user', JSON.stringify(steamUser));
          setUser(steamUser);
          window.location.href = '/app';
        }}
        onError={() => { window.location.href = '/app'; }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('pantheon_user');
    setUser(null);
    window.location.href = '/';
  };

  const handleFounderLogin = (founderUser: any) => {
    const steamUser: SteamUser = {
      steamId: founderUser.steamId,
      username: founderUser.username,
      avatarUrl: founderUser.avatarUrl,
      isPublic: true,
    };
    localStorage.setItem('pantheon_user', JSON.stringify(steamUser));
    setUser(steamUser);
    window.location.href = '/app';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingHome />} />
        <Route path="/ranks" element={<LandingRanks />} />
        <Route path="/games" element={<LandingGames />} />
        <Route path="/beta" element={<LandingBeta />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
