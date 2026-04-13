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
          <div className="lh__hero-beta">Closed Beta</div>
          <div className="lh__hero-tagline">Where 100% is just the beginning.</div>
          <div className="lh__hero-principles">
            <span>Honor</span>
            <span className="lh__sep">·</span>
            <span>Democracy</span>
            <span className="lh__sep">·</span>
            <span>Skill</span>
          </div>
          <div className="lh__hero-actions">
            <Link to="/beta" className="ll__btn ll__btn--primary">Request Invite</Link>
            <button
              className="ll__btn lh__btn--scroll"
              onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ↓
            </button>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="lh__section" id="story">
        <div className="lh__inner">
          <div className="lh__label">The Story</div>
          <h2 className="lh__title">You got 100%.<br />Now what?</h2>
          <div className="lh__story-text">
            <p>I was madly in love with games. I adored them, I lived for them. I didn't just beat each game; I drank it in, like a thirsty person in the desert.</p>
            <p>But after I finished a game, I felt empty inside. The achievements I earned on Steam gave me no satisfaction. I felt like a student who passed an exam and immediately forgot everything.</p>
            <p>And then I thought that after every game, I wanted to be left with an aftertaste I'd remember for a long time. That I'd done something truly challenging. And for there to be a place for people like me, who love to push games to the limit.</p>
            <p>I searched for such a place. And I didn't find it. So I decided to build it myself.</p>
          </div>
          <div className="lh__quote">
            "What if 100% is not the end of a game, but only the beginning?"
          </div>
          <div className="lh__quote-author">Voland, Founder</div>
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
              <div className="lh__principle-text">The community decides who is a Legend. Not algorithms. Not money. Players decide. No one else.</div>
            </div>
            <div className="lh__principle">
              <div className="lh__principle-num">03</div>
              <div className="lh__principle-title">Skill</div>
              <div className="lh__principle-text">One path to the Pantheon. Earned. Proven. Recognized. Eternal.</div>
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
              { num: '01', title: 'Connect Steam', text: 'Link your account. We automatically detect your completed games and award Gold rank.' },
              { num: '02', title: 'Take Challenges', text: 'Community challenges are in development. The first testers will shape them from scratch — what they are, how they work, what counts as proof.' },
              { num: '03', title: 'Get Verified', text: 'Real judges watch your video anonymously and vote. 2 of 3 must approve. No algorithms.' },
              { num: '04', title: 'Earn Your Statue', text: 'Your rank rises. A statue is placed in your Hall. Reach Legend and stand in the Pantheon forever.' },
            ].map((step, i) => (
              <div key={i} className="lh__step">
                <div className="lh__step-num">{step.num}</div>
                <div className="lh__step-title">{step.title}</div>
                <div className="lh__step-text">{step.text}</div>
              </div>
            ))}
          </div>
          <div className="lh__cta">
            <Link to="/beta" className="ll__btn ll__btn--primary">Request Invite</Link>
            <Link to="/ranks" className="ll__btn ll__btn--ghost">See All Ranks</Link>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default LandingHome;
