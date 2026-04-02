import React, { useEffect, useRef, useState } from 'react';
import './Landing.css';

interface LandingProps {
  onEnterApp: () => void;
}

const Landing: React.FC<LandingProps> = ({ onEnterApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing">

      {/* Navigation */}
      <nav className={"landing__nav" + (scrolled ? ' landing__nav--scrolled' : '')}>
        <div className="landing__nav-logo">
          <img src="/favicon.png" alt="Pantheon" className="landing__nav-icon" />
          <span>PANTHEON</span>
        </div>
        <div className="landing__nav-links">
          <a href="#about" className="landing__nav-link">About</a>
          <a href="#ranks" className="landing__nav-link">Ranks</a>
          <a href="#games" className="landing__nav-link">Games</a>
          <a href="#beta" className="landing__nav-link landing__nav-link--cta">Request Invite</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero" ref={heroRef}>
        <div className="landing__hero-bg">
          <div className="landing__hero-glow" />
        </div>
        <div className="landing__hero-content">
          <img src="/logo-hero.png" alt="Pantheon" className="landing__hero-logo" />
          <h1 className="landing__hero-title">PANTHEON</h1>
          <div className="landing__hero-tagline">Where 100% is just the beginning.</div>
          <div className="landing__hero-principles">
            <span>Honor</span>
            <span className="landing__hero-sep">·</span>
            <span>Democracy</span>
            <span className="landing__hero-sep">·</span>
            <span>Skill</span>
          </div>
          <div className="landing__hero-actions">
            <a href="#beta" className="landing__btn landing__btn--primary">Request Invite</a>
            <a href="#about" className="landing__btn landing__btn--ghost">Learn More ↓</a>
          </div>
        </div>
        <div className="landing__hero-scroll">
          <div className="landing__hero-scroll-line" />
        </div>
      </section>

      {/* About / Story */}
      <section className="landing__section" id="about">
        <div className="landing__section-inner">
          <div className="landing__story">
            <div className="landing__story-label">The Story</div>
            <h2 className="landing__story-title">
              You got 100%.<br />Now what?
            </h2>
            <div className="landing__story-text">
              <p>
                I have loved video games my entire life. For years, my way of honoring a game I loved was simple: get 100%. Every achievement. Every secret. Every hidden ending.
              </p>
              <p>
                But after the last achievement popped — I felt something unexpected. <em>Emptiness.</em> The game was over. There was nowhere left to go.
              </p>
              <p>
                I had done something genuinely hard. But where could I show it? Nobody cared about a Steam profile screenshot.
              </p>
              <p>
                So I asked myself one question that changed everything:
              </p>
            </div>
            <div className="landing__story-quote">
              "What if 100% achievements isn't the end of a game — but only the beginning?"
            </div>
            <div className="landing__story-author">— Voland, Founder</div>
          </div>

          {/* Three principles */}
          <div className="landing__principles">
            <div className="landing__principle">
              <div className="landing__principle-number">01</div>
              <div className="landing__principle-title">Honor</div>
              <div className="landing__principle-text">
                Open source. No hidden mechanics. No ads. No pay-to-win. Verify everything yourself.
              </div>
            </div>
            <div className="landing__principle">
              <div className="landing__principle-number">02</div>
              <div className="landing__principle-title">Democracy</div>
              <div className="landing__principle-text">
                The community decides who is a Legend. Not algorithms. Not money. Only the voice of players.
              </div>
            </div>
            <div className="landing__principle">
              <div className="landing__principle-number">03</div>
              <div className="landing__principle-title">Skill</div>
              <div className="landing__principle-text">
                One path to the Pantheon. Mastery. Proven. Recognized. Eternal.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing__section landing__section--dark">
        <div className="landing__section-inner">
          <div className="landing__section-label">How It Works</div>
          <h2 className="landing__section-title">From 100% to Legend</h2>
          <div className="landing__steps">
            <div className="landing__step">
              <div className="landing__step-num">01</div>
              <div className="landing__step-title">Connect Steam</div>
              <div className="landing__step-text">Link your Steam account. We automatically detect your 100% completions and award Gold rank.</div>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <div className="landing__step-num">02</div>
              <div className="landing__step-title">Take Challenges</div>
              <div className="landing__step-text">Community-created challenges push you beyond 100%. Record your attempt. Submit your video.</div>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <div className="landing__step-num">03</div>
              <div className="landing__step-title">Get Verified</div>
              <div className="landing__step-text">Real judges — anonymous, blind voting. No algorithms. 2 of 3 judges must approve.</div>
            </div>
            <div className="landing__step-arrow">→</div>
            <div className="landing__step">
              <div className="landing__step-num">04</div>
              <div className="landing__step-title">Earn Your Statue</div>
              <div className="landing__step-text">Your rank rises. A statue is placed in your Hall. Reach Legend — and stand in the Pantheon forever.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranks */}
      <section className="landing__section" id="ranks">
        <div className="landing__section-inner">
          <div className="landing__section-label">The Path</div>
          <h2 className="landing__section-title">Eight Ranks. One Legend.</h2>
          <div className="landing__ranks">
            {[
              { tier: 'Bronze', color: '#e8974a', desc: '1–74% achievements' },
              { tier: 'Silver', color: '#d8eaf8', desc: '75–99% achievements' },
              { tier: 'Gold', color: '#e8a830', desc: '100% achievements' },
              { tier: 'Platinum', color: '#9ac4e4', desc: 'Community challenges' },
              { tier: 'Diamond', color: '#b8e4ff', desc: 'Elite challenges' },
              { tier: 'Master', color: '#d4a8f4', desc: 'Master challenges' },
              { tier: 'Grandmaster', color: '#f4d4a8', desc: 'Community recognition' },
              { tier: 'Legend', color: '#e45a3a', desc: 'Community vote only' },
            ].map((rank, i) => (
              <div key={i} className="landing__rank-card">
                <div className="landing__rank-dot" style={{ background: rank.color }} />
                <div className="landing__rank-name" style={{ color: rank.color }}>{rank.tier}</div>
                <div className="landing__rank-desc">{rank.desc}</div>
              </div>
            ))}
          </div>
          <div className="landing__ranks-note">
            Gold rank is awarded automatically via Steam API. Platinum and above require community challenge verification.
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="landing__section landing__section--dark" id="games">
        <div className="landing__section-inner">
          <div className="landing__section-label">Supported Games</div>
          <h2 className="landing__section-title">Start Your Journey</h2>
          <div className="landing__games">
            <div className="landing__game-card">
              <div className="landing__game-title">Hollow Knight</div>
              <div className="landing__game-studio">Team Cherry</div>
              <div className="landing__game-meta">63 achievements · Active</div>
              <div className="landing__game-status landing__game-status--active">● Live</div>
            </div>
            <div className="landing__game-card">
              <div className="landing__game-title">Hollow Knight: Silksong</div>
              <div className="landing__game-studio">Team Cherry</div>
              <div className="landing__game-meta">57 achievements · Active</div>
              <div className="landing__game-status landing__game-status--active">● Live</div>
            </div>
            <div className="landing__game-card landing__game-card--soon">
              <div className="landing__game-title">More Games</div>
              <div className="landing__game-studio">Community decides</div>
              <div className="landing__game-meta">You suggest. We add.</div>
              <div className="landing__game-status landing__game-status--soon">◌ Coming Soon</div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta / Request Invite */}
      <section className="landing__section landing__section--beta" id="beta">
        <div className="landing__section-inner landing__section-inner--center">
          <div className="landing__section-label">Closed Beta</div>
          <h2 className="landing__section-title">Be Among the First</h2>
          <div className="landing__beta-text">
            Pantheon is in closed beta. We are building with the community, not for it.
            The first members shape everything — challenges, rules, culture.
          </div>
          <div className="landing__beta-options">
            <div className="landing__beta-option">
              <div className="landing__beta-option-title">Join the Waitlist</div>
              <div className="landing__beta-option-text">Leave your email. We review personally.</div>
              <form className="landing__beta-form" onSubmit={e => e.preventDefault()}>
                <input
                  className="landing__beta-input"
                  type="email"
                  placeholder="your@email.com"
                />
                <button className="landing__btn landing__btn--primary" type="submit">
                  Request Invite
                </button>
              </form>
            </div>
            <div className="landing__beta-divider">or</div>
            <div className="landing__beta-option">
              <div className="landing__beta-option-title">Already have a code?</div>
              <div className="landing__beta-option-text">Enter the app and connect Steam.</div>
              <button className="landing__btn landing__btn--ghost" onClick={onEnterApp}>
                Enter App →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-brand">
            <img src="/favicon.png" alt="Pantheon" className="landing__footer-icon" />
            <span className="landing__footer-name">PANTHEON HDS</span>
          </div>
          <div className="landing__footer-principles">
            Honor · Democracy · Skill
          </div>
          <div className="landing__footer-links">
            <a href="https://discord.gg/pantheonhds" target="_blank" rel="noopener noreferrer" className="landing__footer-link">Discord</a>
            <a href="https://reddit.com/r/PantheonHDS" target="_blank" rel="noopener noreferrer" className="landing__footer-link">Reddit</a>
            <a href="https://x.com/pantheonhds" target="_blank" rel="noopener noreferrer" className="landing__footer-link">X</a>
            <a href="https://github.com/pantheon-hds/core" target="_blank" rel="noopener noreferrer" className="landing__footer-link">GitHub</a>
          </div>
          <div className="landing__footer-copy">
            © 2026 Pantheon HDS · Built in public · Open source
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
