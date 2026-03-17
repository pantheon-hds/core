import React, { useState } from 'react';
import './App.css';
import WelcomeScreen from './components/pages/WelcomeScreen';
import SteamCallback, { SteamUser } from './components/pages/SteamCallback';
import Dashboard from './components/pages/Dashboard';
import Pantheon from './components/pages/Pantheon';
import Profile from './components/pages/Profile';
import Sidebar, { Page } from './components/ui/Sidebar';

const isSteamCallback = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.has('openid.claimed_id') || params.has('steamId');
};

const App: React.FC = () => {
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isCallback] = useState(isSteamCallback);

  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    pantheon: 'Pantheon of Legends',
    profile: 'Player Profile',
  };

  const handleSteamSuccess = (steamUser: SteamUser) => {
    setUser(steamUser);
    setEntered(true);
  };

  const handleSteamError = () => {
    window.location.href = '/';
  };

  if (isCallback) {
    return <SteamCallback onSuccess={handleSteamSuccess} onError={handleSteamError} />;
  }

  return (
    <div className="app">
      {!entered && <WelcomeScreen onEnter={() => setEntered(true)} />}
      <div className={"app__layout" + (entered ? " app__layout--visible" : "")}>
        <Sidebar current={page} onChange={setPage} user={user} />
        <div className="app__main">
          <div className="app__topbar">
            <span className="app__topbar-title">{titles[page]}</span>
            <div className="app__topbar-tags">
              <span className="app__tag">Hollow Knight</span>
              {user && <span className="app__tag app__tag--live">● {user.username}</span>}
            </div>
          </div>
          <div className="app__content">
            {page === 'dashboard' && <Dashboard user={user} />}
            {page === 'pantheon' && <Pantheon />}
            {page === 'profile' && <Profile user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
