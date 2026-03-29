import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../layout/LandingLayout';
import './LandingBeta.css';

const LandingBeta: React.FC = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: Save to Supabase waitlist table
    setSubmitted(true);
  };

  return (
    <LandingLayout>
      <div className="lb__page">
        <div className="lb__inner">
          <div className="lb__label">Closed Beta</div>
          <h1 className="lb__title">Be Among the First</h1>
          <div className="lb__subtitle">
            Pantheon is being built in public, with the community. The first members shape everything — 
            challenges, rules, culture. There are no second chances to be first.
          </div>

          {!submitted ? (
            <div className="lb__content">
              <div className="lb__form-section">
                <div className="lb__form-title">Join the Waitlist</div>
                <div className="lb__form-text">We review every application personally. No spam. Ever.</div>
                <form className="lb__form" onSubmit={handleSubmit}>
                  <div className="lb__field">
                    <label className="lb__label-field">Email *</label>
                    <input
                      className="lb__input"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="lb__field">
                    <label className="lb__label-field">Why do you want to join? (optional)</label>
                    <textarea
                      className="lb__textarea"
                      placeholder="Tell us about your gaming background, what games you love..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <button className="lb__btn lb__btn--primary" type="submit">
                    Request Invite
                  </button>
                </form>
              </div>

              <div className="lb__divider">
                <div className="lb__divider-line" />
                <span>or</span>
                <div className="lb__divider-line" />
              </div>

              <div className="lb__app-section">
                <div className="lb__app-title">Already have an invite code?</div>
                <div className="lb__app-text">Enter the app and connect your Steam account.</div>
                <Link to="/app" className="lb__btn lb__btn--ghost">Enter App →</Link>
              </div>
            </div>
          ) : (
            <div className="lb__success">
              <div className="lb__success-icon">⚔</div>
              <div className="lb__success-title">Application Received</div>
              <div className="lb__success-text">
                We review every application personally. You will hear from us if you are selected for the beta.
                Thank you for believing in this idea.
              </div>
              <div className="lb__success-author">— Voland</div>
            </div>
          )}

          <div className="lb__promises">
            <div className="lb__promise-title">What we promise</div>
            <div className="lb__promise-list">
              <div className="lb__promise">✓ No spam. We email only when you are invited.</div>
              <div className="lb__promise">✓ Your data is never sold or shared.</div>
              <div className="lb__promise">✓ You can remove yourself from the list anytime.</div>
              <div className="lb__promise">✓ No pay-to-win. Invites are based on merit, not money.</div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingBeta;
