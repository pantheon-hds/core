import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './LandingLayout.css';

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="ll">
      <nav className="ll__nav">
        <Link to="/" className="ll__nav-logo">
          <img src="/favicon.png" alt="Pantheon" className="ll__nav-icon" />
          <span>PANTHEON</span>
        </Link>
        <div className="ll__nav-links">
          <Link to="/" className={"ll__nav-link" + (isActive('/') ? ' ll__nav-link--active' : '')}>About</Link>
          <Link to="/ranks" className={"ll__nav-link" + (isActive('/ranks') ? ' ll__nav-link--active' : '')}>Ranks</Link>
          <Link to="/games" className={"ll__nav-link" + (isActive('/games') ? ' ll__nav-link--active' : '')}>Games</Link>
          <Link to="/faq" className={"ll__nav-link" + (isActive('/faq') ? ' ll__nav-link--active' : '')}>FAQ</Link>
          <Link to="/beta" className="ll__nav-link ll__nav-link--cta">Request Invite</Link>
          <Link to="/app" className="ll__nav-link ll__nav-link--enter">Enter App →</Link>
        </div>
        <button className="ll__nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? '✕' : '≡'}
        </button>
      </nav>

      {menuOpen && (
        <div className="ll__mobile-menu">
          <Link to="/" className={"ll__mobile-link" + (isActive('/') ? ' ll__mobile-link--active' : '')} onClick={() => setMenuOpen(false)}>About</Link>
          <Link to="/ranks" className={"ll__mobile-link" + (isActive('/ranks') ? ' ll__mobile-link--active' : '')} onClick={() => setMenuOpen(false)}>Ranks</Link>
          <Link to="/games" className={"ll__mobile-link" + (isActive('/games') ? ' ll__mobile-link--active' : '')} onClick={() => setMenuOpen(false)}>Games</Link>
          <Link to="/faq" className={"ll__mobile-link" + (isActive('/faq') ? ' ll__mobile-link--active' : '')} onClick={() => setMenuOpen(false)}>FAQ</Link>
          <Link to="/beta" className="ll__mobile-link ll__mobile-link--cta" onClick={() => setMenuOpen(false)}>Request Invite</Link>
          <Link to="/app" className="ll__mobile-link ll__mobile-link--enter" onClick={() => setMenuOpen(false)}>Enter App →</Link>
        </div>
      )}

      <main className="ll__main">{children}</main>

      <footer className="ll__footer">
        <div className="ll__footer-inner">
          <div className="ll__footer-brand">
            <img src="/favicon.png" alt="Pantheon" className="ll__footer-icon" />
            <span className="ll__footer-name">PANTHEON HDS</span>
          </div>
          <div className="ll__footer-principles">Honor · Democracy · Skill</div>
          <div className="ll__footer-links">
            <a href="https://discord.com/users/1485317934959169786" target="_blank" rel="noopener noreferrer" className="ll__footer-link">Discord</a>
            <a href="https://reddit.com/r/PantheonHDS" target="_blank" rel="noopener noreferrer" className="ll__footer-link">Reddit</a>
            <a href="https://x.com/pantheonhds" target="_blank" rel="noopener noreferrer" className="ll__footer-link">X</a>
            <a href="https://github.com/pantheon-hds/core" target="_blank" rel="noopener noreferrer" className="ll__footer-link">GitHub</a>
            <a href="mailto:pantheon.honor.democracy.skill@gmail.com" className="ll__footer-link">Email</a>
            <Link to="/privacy" className="ll__footer-link">Privacy</Link>
          </div>
          <div className="ll__footer-copy">© 2026 Pantheon HDS · Built in public · Open source</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
