import React, { useState } from 'react';
import './Profile.css';

type StatueTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Legend';

interface Statue {
  id: number;
  tier: StatueTier;
  game: string;
  challenge: string;
  grantedAt: string;
  isUnique: boolean;
}

const statues: Statue[] = [
  { id: 1, tier: 'Gold', game: 'Elden Ring', challenge: '100% Steam Achievements', grantedAt: 'Season 1', isUnique: false },
  { id: 2, tier: 'Platinum', game: 'Dark Souls III', challenge: 'Naked & Afraid', grantedAt: 'Season 1', isUnique: false },
  { id: 3, tier: 'Legend', game: 'Hollow Knight', challenge: 'Pantheon — Zero Damage', grantedAt: 'Season 1', isUnique: true },
  { id: 4, tier: 'Diamond', game: 'Elden Ring', challenge: 'Level One Wretch', grantedAt: 'Season 1', isUnique: false },
  { id: 5, tier: 'Silver', game: 'Sekiro', challenge: 'Halfway There', grantedAt: 'Season 1', isUnique: false },
  { id: 6, tier: 'Bronze', game: 'Elden Ring', challenge: 'First Steps', grantedAt: 'Season 1', isUnique: false },
];

const statueColors: Record<StatueTier, { primary: string; secondary: string; base: string }> = {
  Bronze:   { primary: '#c8874a', secondary: '#a06030', base: '#3a2215' },
  Silver:   { primary: '#c0c8d4', secondary: '#8898a8', base: '#2a3040' },
  Gold:     { primary: '#c9922a', secondary: '#b07820', base: '#3a2e1a' },
  Platinum: { primary: '#8ab4d4', secondary: '#6a94b4', base: '#1e2a3a' },
  Diamond:  { primary: '#a8d4f4', secondary: '#78b4e4', base: '#182030' },
  Legend:   { primary: '#c44a2a', secondary: '#a43a1a', base: '#2a1a0a' },
};

interface StatueSVGProps {
  tier: StatueTier;
  size?: number;
}

const StatueSVG: React.FC<StatueSVGProps> = ({ tier, size = 80 }) => {
  const c = statueColors[tier];
  const s = size;
  const cx = s / 2;

  if (tier === 'Legend') {
    return (
      <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
        <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
        <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
        <ellipse cx={cx} cy={s*0.26} rx={s*0.18} ry={s*0.2} fill={c.primary} opacity="0.95"/>
        <rect x={s*0.34} y={s*0.44} width={s*0.32} height={s*0.44} rx="3" fill={c.secondary}/>
        <polygon points={`${cx},${s*0.06} ${cx+s*0.06},${s*0.18} ${cx+s*0.14},${s*0.18} ${cx+s*0.08},${s*0.26} ${cx+s*0.1},${s*0.36} ${cx},${s*0.3} ${cx-s*0.1},${s*0.36} ${cx-s*0.08},${s*0.26} ${cx-s*0.14},${s*0.18} ${cx-s*0.06},${s*0.18}`} fill={c.primary} opacity="0.7"/>
        <line x1={s*0.28} y1={s*0.44} x2={s*0.2} y2={s*0.56} stroke={c.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={s*0.72} y1={s*0.44} x2={s*0.8} y2={s*0.52} stroke={c.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <polygon points={`${s*0.78},${s*0.5} ${s*0.88},${s*0.46} ${s*0.86},${s*0.56}`} fill={c.primary} opacity="0.8"/>
        <circle cx={cx} cy={s*0.18} r="4" fill="#ffddcc" opacity="0.5"/>
      </svg>
    );
  }

  if (tier === 'Diamond') {
    return (
      <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
        <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
        <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
        <ellipse cx={cx} cy={s*0.26} rx={s*0.17} ry={s*0.19} fill={c.primary} opacity="0.9"/>
        <rect x={s*0.35} y={s*0.44} width={s*0.3} height={s*0.44} rx="3" fill={c.secondary}/>
        <line x1={s*0.28} y1={s*0.44} x2={s*0.22} y2={s*0.54} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
        <line x1={s*0.72} y1={s*0.44} x2={s*0.78} y2={s*0.54} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
        <polygon points={`${cx},${s*0.08} ${cx+s*0.1},${s*0.18} ${cx},${s*0.28} ${cx-s*0.1},${s*0.18}`} fill={c.primary} opacity="0.6"/>
        <circle cx={cx} cy={s*0.18} r="3" fill="#e8f4ff" opacity="0.6"/>
      </svg>
    );
  }

  if (tier === 'Platinum') {
    return (
      <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
        <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
        <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
        <ellipse cx={cx} cy={s*0.26} rx={s*0.16} ry={s*0.18} fill={c.primary} opacity="0.9"/>
        <rect x={s*0.36} y={s*0.43} width={s*0.28} height={s*0.45} rx="3" fill={c.secondary}/>
        <line x1={s*0.29} y1={s*0.43} x2={s*0.23} y2={s*0.53} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
        <line x1={s*0.71} y1={s*0.43} x2={s*0.77} y2={s*0.53} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
        <circle cx={cx} cy={s*0.18} r="3.5" fill="#e8f4ff" opacity="0.5"/>
        <circle cx={cx} cy={s*0.26} r={s*0.16} fill="none" stroke={c.primary} strokeWidth="0.5" opacity="0.4"/>
      </svg>
    );
  }

  return (
    <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
      <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
      <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
      <ellipse cx={cx} cy={s*0.26} rx={s*0.15} ry={s*0.17} fill={c.primary} opacity="0.9"/>
      <rect x={s*0.37} y={s*0.42} width={s*0.26} height={s*0.46} rx="3" fill={c.secondary}/>
      <line x1={s*0.3} y1={s*0.46} x2={s*0.24} y2={s*0.54} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <line x1={s*0.7} y1={s*0.46} x2={s*0.76} y2={s*0.54} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <circle cx={cx} cy={s*0.18} r="3" fill="#e8d5a0" opacity="0.25"/>
    </svg>
  );
};

const Profile: React.FC = () => {
  const [selected, setSelected] = useState<Statue | null>(null);

  return (
    <div className="profile">
      {selected && (
        <div className="profile__overlay" onClick={() => setSelected(null)}>
          <div className="profile__modal" onClick={e => e.stopPropagation()}>
            <div className="profile__modal-statue">
              <StatueSVG tier={selected.tier} size={100} />
            </div>
            <div className="profile__modal-tier" style={{ color: statueColors[selected.tier].primary }}>
              {selected.tier}{selected.isUnique && ' · Unique'}
            </div>
            <div className="profile__modal-title">{selected.challenge}</div>
            <div className="profile__modal-game">{selected.game}</div>
            <div className="profile__modal-season">{selected.grantedAt}</div>
            {selected.isUnique && (
              <div className="profile__modal-unique">
                This statue is one of a kind. It exists only once in the entire platform history.
              </div>
            )}
            <button className="profile__modal-close" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="profile__header">
        <div className="profile__avatar">HR</div>
        <div className="profile__info">
          <div className="profile__username">Hero_RU</div>
          <div className="profile__since">Member since Season 1 · Gold III</div>
          <div className="profile__tags">
            <span className="profile__tag">Elden Ring</span>
            <span className="profile__tag">Dark Souls III</span>
            <span className="profile__tag">Hollow Knight</span>
          </div>
        </div>
        <div className="profile__legend-badge">
          <div className="profile__legend-dot" />
          <span>Legend</span>
        </div>
      </div>

      <div className="profile__stats">
        <div className="profile__stat">
          <div className="profile__stat-value">{statues.length}</div>
          <div className="profile__stat-label">Statues</div>
        </div>
        <div className="profile__stat">
          <div className="profile__stat-value">1</div>
          <div className="profile__stat-label">Legends</div>
        </div>
        <div className="profile__stat">
          <div className="profile__stat-value">847</div>
          <div className="profile__stat-label">Skill Points</div>
        </div>
        <div className="profile__stat">
          <div className="profile__stat-value">3</div>
          <div className="profile__stat-label">Games</div>
        </div>
      </div>

      <div className="profile__section-title">Hall of Statues</div>

      <div className="profile__statues">
        {statues.map(s => (
          <div
            key={s.id}
            className={`profile__statue-card ${s.isUnique ? 'profile__statue-card--unique' : ''}`}
            onClick={() => setSelected(s)}
          >
            {s.isUnique && <div className="profile__statue-card-glow" style={{ background: statueColors[s.tier].primary }} />}
            <div className="profile__statue-figure">
              <StatueSVG tier={s.tier} size={72} />
            </div>
            <div className="profile__statue-tier" style={{ color: statueColors[s.tier].primary }}>
              {s.tier}
            </div>
            <div className="profile__statue-game">{s.game}</div>
            {s.isUnique && <div className="profile__statue-unique-tag">Unique</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
