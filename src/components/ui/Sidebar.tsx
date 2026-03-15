import React from 'react';
import './Sidebar.css';

type Page = 'dashboard' | 'pantheon';

interface SidebarProps {
  current: Page;
  onChange: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ current, onChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-word">Honor</span>
        <span className="sidebar__logo-word sidebar__logo-word--mid">Democracy</span>
        <span className="sidebar__logo-word">Skill</span>
      </div>

      <nav className="sidebar__nav">
        <button
          className={`sidebar__nav-item ${current === 'dashboard' ? 'sidebar__nav-item--active' : ''}`}
          onClick={() => onChange('dashboard')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="1" y="1" width="5" height="5"/>
            <rect x="8" y="1" width="5" height="5"/>
            <rect x="1" y="8" width="5" height="5"/>
            <rect x="8" y="8" width="5" height="5"/>
          </svg>
          <span>Dashboard</span>
        </button>

        <button
          className={`sidebar__nav-item ${current === 'pantheon' ? 'sidebar__nav-item--active' : ''}`}
          onClick={() => onChange('pantheon')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
            <polygon points="7,1 9,5 13,5 10,8 11,13 7,10 3,13 4,8 1,5 5,5" strokeLinejoin="round"/>
          </svg>
          <span>Pantheon</span>
        </button>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__avatar">HR</div>
        <div>
          <div className="sidebar__username">Hero_RU</div>
          <div className="sidebar__rank">Gold III</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
