import React, { useState } from 'react';
import './App.css';
import WelcomeScreen from './components/pages/WelcomeScreen';
import Dashboard from './components/pages/Dashboard';
import Pantheon from './components/pages/Pantheon';
import Profile from './components/pages/Profile';
import Sidebar, { Page } from './components/ui/Sidebar';

const App: React.FC = () => {
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');

  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    pantheon: 'Pantheon of Legends',
    profile: 'Player Profile',
  };

  return (
    <div className="app">
      {!entered && <WelcomeScreen onEnter={() => setEntered(true)} />}
      <div className={"app__layout" + (entered ? " app__layout--visible" : "")}>
        <Sidebar current={page} onChange={setPage} />
        <div className="app__main">
          <div className="app__topbar">
            <span className="app__topbar-title">{titles[page]}</span>
            <div className="app__topbar-tags">
              <span className="app__tag">Elden Ring</span>
              <span className="app__tag app__tag--live">● Online</span>
            </div>
          </div>
          <div className="app__content">
            {page === 'dashboard' && <Dashboard />}
            {page === 'pantheon' && <Pantheon />}
            {page === 'profile' && <Profile />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
