import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import { SteamUser } from '../pages/SteamCallback';
import { getUserBySteamId } from '../../services/supabase';

export type Page = 'dashboard' | 'pantheon' | 'profile' | 'admin';

interface SidebarProps {
  current: Page;
  onChange: (page: Page) => void;
  user: SteamUser | null;
}

const Sidebar: React.FC<SidebarProps> = ({ current, onChange, user }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserBySteamId(user.steamId).then(dbUser => {
      setIsAdmin(dbUser?.is_admin || false);
    });
  }, [user]);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'HR';

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-word">Honor</span>
        <span className="sidebar__logo-word sidebar__logo-word--mid">Democracy</span>
        <span className="sidebar__logo-word">Skill</span>
      </div>

      <nav className="sidebar__nav">
        <button
          className={"sidebar__nav-item" + (current === 'dashboard' ? " sidebar__nav-item--active" : "")}
          onClick={() => onChange('dashboard')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="1" y="1" width="5" height="5"/><rect x="8" y="1" width="5" height="5"/>
            <rect x="1" y="8" width="5" height="5"/><rect x="8" y="8" width="5" height="5"/>
          </svg>
          <span>Dashboard</span>
        </button>

        <button
          className={"sidebar__nav-item" + (current === 'pantheon' ? " sidebar__nav-item--active" : "")}
          onClick={() => onChange('pantheon')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
            <polygon points="7,1 9,5 13,5 10,8 11,13 7,10 3,13 4,8 1,5 5,5" strokeLinejoin="round"/>
          </svg>
          <span>Pantheon</span>
        </button>

        <button
          className={"sidebar__nav-item" + (current === 'profile' ? " sidebar__nav-item--active" : "")}
          onClick={() => onChange('profile')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="7" cy="5" r="3"/><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" fill="none"/>
          </svg>
          <span>Profile</span>
        </button>

        {isAdmin && (
          <button
            className={"sidebar__nav-item" + (current === 'admin' ? " sidebar__nav-item--active" : "")}
            onClick={() => onChange('admin')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="7" cy="7" r="2"/>
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.4 1.4M9.6 9.6L11 11M11 3l-1.4 1.4M4.4 9.6L3 11"/>
            </svg>
            <span>Admin</span>
          </button>
        )}
      </nav>

      <div className="sidebar__footer">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="sidebar__avatar-img" />
        ) : (
          <div className="sidebar__avatar">{initials}</div>
        )}
        <div>
          <div className="sidebar__username">{user?.username || 'Guest'}</div>
          <div className="sidebar__rank">{user ? 'Logged in' : 'Not logged in'}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
