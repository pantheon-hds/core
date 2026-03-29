import React from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../layout/LandingLayout';
import './LandingHome.css';

const LandingHome: React.FC = () => {
  return (
    <LandingLayout>
      {/* Hero */}
      <section className="lh__hero">
        <div className="lh__hero-glow" />
        <div className="lh__hero-content">
          <img src="/logo-hero.png" alt="Pantheon" className="lh__hero-logo" />
          <h1 className="lh__hero-title">PANTHEON</h1>
          <div className="lh__hero-tagline">Where 100% is just the beginning.</div>
          <div className="lh__hero-principles">
            <span>Honor</span>
            <span className="lh__sep">·</span>
            <span>Democracy</span>
            <span className="lh__sep">·</span>
            <span>Skill</span>
          </div>
          <div className="lh__hero-actions">
            <Link to="/beta" className="lh__btn lh__btn--primary">Request Invite</Link>
            <Link to="/ranks" className="lh__btn lh__btn--ghost">Learn More →</Link>
          </div>
        </div>
        <div className="lh__scroll-line" />
      </section>

      {/* Story */}
      <section className="lh__section">
        <div className="lh__inner">
          <div className="lh__label">The Story</div>
          <h2 className="lh__title">You got 100%.<br />Now what?</h2>
          <div className="lh__story-text">
            <p>I have loved video games my entire life. For years, my way of honoring a game I loved was simple: get 100%. Every achievement. Every secret. Every hidden ending.</p>
            <p>But after the last achievement popped — I felt something unexpected. <em>Emptiness.</em> The game was over. There was nowhere left to go.</p>
            <p>I had done something genuinely hard. But where could I show it? Nobody cared about a Steam profile screenshot.</p>
            <p>So I asked myself one question that changed everything:</p>
          </div>
          <div className="lh__quote">
            "What if 100% achievements isn't the end of a game — but only the beginning?"
          </div>
          <div className="lh__quote-author">— Voland, Founder</div>
        </div>
      </section>

      {/* Principles */}
      <section className="lh__section lh__section--dark">
        <div className="lh__inner">
          <div className="lh__label">Our Foundation</div>
          <h2 className="lh__title">Three Principles. One Platform.</h2>
          <div className="lh__principles">
            <div className="lh__principle">
              <div className="lh__principle-num">01</div>
              <div className="lh__principle-title">Honor</div>
              <div className="lh__principle-text">Open source. No hidden mechanics. No ads. No pay-to-win. Verify everything yourself.</div>
            </div>
            <div className="lh__principle">
              <div className="lh__principle-num">02</div>
              <div className="lh__principle-title">Democracy</div>
              <div className="lh__principle-text">The community decides who is a Legend. Not algorithms. Not money. Only the voice of players.</div>
            </div>
            <div className="lh__principle">
              <div className="lh__principle-num">03</div>
              <div className="lh__principle-title">Skill</div>
              <div className="lh__principle-text">One path to the Pantheon. Mastery. Proven. Recognized. Eternal.</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lh__section">
        <div className="lh__inner">
          <div className="lh__label">How It Works</div>
          <h2 className="lh__title">From 100% to Legend</h2>
          <div className="lh__steps">
            {[
              { num: '01', title: 'Connect Steam', text: 'Link your account. We automatically detect your 100% completions and award Gold rank.' },
              { num: '02', title: 'Take Challenges', text: 'Community-created challenges push you beyond 100%. Record your attempt. Submit your video.' },
              { num: '03', title: 'Get Verified', text: 'Real judges — anonymous, blind voting. 2 of 3 must approve. No algorithms.' },
              { num: '04', title: 'Earn Your Statue', text: 'Your rank rises. A statue is placed in your Hall. Reach Legend — stand in the Pantheon forever.' },
            ].map((step, i) => (
              <div key={i} className="lh__step">
                <div className="lh__step-num">{step.num}</div>
                <div className="lh__step-title">{step.title}</div>
                <div className="lh__step-text">{step.text}</div>
              </div>
            ))}
          </div>
          <div className="lh__cta">
            <Link to="/beta" className="lh__btn lh__btn--primary">Request Invite</Link>
            <Link to="/ranks" className="lh__btn lh__btn--ghost">See All Ranks →</Link>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default LandingHome;
