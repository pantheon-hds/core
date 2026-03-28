import React, { useState } from 'react';
import './App.css';
import WelcomeScreen from './components/pages/WelcomeScreen';
import SteamCallback, { SteamUser } from './components/pages/SteamCallback';
import Dashboard from './components/pages/Dashboard';
import Pantheon from './components/pages/Pantheon';
import Profile from './components/pages/Profile';
import Admin from './components/pages/Admin';
import JudgePanel from './components/pages/JudgePanel';
import Sandbox from './components/pages/Sandbox';
import FAQ from './components/pages/FAQ';
import Sidebar, { Page } from './components/ui/Sidebar';

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

const App: React.FC = () => {
  const savedUser = getSavedUser();
  const [entered, setEntered] = useState(!!savedUser);
  const [page, setPage] = useState<Page>('dashboard');
  const [user, setUser] = useState<SteamUser | null>(savedUser);
  const [isCallback] = useState(isSteamCallback);

  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    pantheon: 'Pantheon of Legends',
    profile: 'Player Profile',
    admin: 'Admin Panel',
    judge: 'Judge Panel',
    sandbox: 'Sandbox',
    faq: 'About & FAQ',
  };

  const handleSteamSuccess = (steamUser: SteamUser) => {
    localStorage.setItem('pantheon_user', JSON.stringify(steamUser));
    setUser(steamUser);
    setEntered(true);
  };

  const handleFounderLogin = (founderUser: any) => {
    const user: SteamUser = {
      steamId: founderUser.steamId,
      username: founderUser.username,
      avatarUrl: founderUser.avatarUrl,
      isPublic: true,
    };
    localStorage.setItem('pantheon_user', JSON.stringify(user));
    setUser(user);
    setEntered(true);
  };

  const handleSteamError = () => {
    window.location.href = '/';
  };

  if (isCallback) {
    return <SteamCallback onSuccess={handleSteamSuccess} onError={handleSteamError} />;
  }

  const isFounder = user?.steamId === 'VOLAND_FOUNDER';

  return (
    <div className="app">
      {!entered && (
        <WelcomeScreen
          onEnter={() => setEntered(true)}
          onFounderLogin={handleFounderLogin}
        />
      )}
      <div className={"app__layout" + (entered ? " app__layout--visible" : "")}>
        <Sidebar current={page} onChange={setPage} user={user} />
        <div className="app__main">
          <div className="app__topbar">
            <span className="app__topbar-title">{titles[page]}</span>
            <div className="app__topbar-tags">
              {isFounder && (
                <span className="app__tag app__tag--founder">⚜ Founder</span>
              )}
              {user && (
                <span className="app__tag app__tag--live">● {user.username}</span>
              )}
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

export default App;
