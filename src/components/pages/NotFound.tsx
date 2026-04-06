import React from 'react';
import { Link } from 'react-router-dom';
import LandingLayout from '../layout/LandingLayout';

const NotFound: React.FC = () => {
  return (
    <LandingLayout>
      <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.4em', color: 'var(--color-gold-dim)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 52px)', letterSpacing: '0.05em', color: 'var(--color-text-primary)', fontWeight: 400, marginBottom: '1.5rem' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
          This path leads nowhere. The Pantheon is elsewhere.
        </p>
        <Link to="/" className="ll__btn ll__btn--primary">Return Home</Link>
      </div>
    </LandingLayout>
  );
};

export default NotFound;
