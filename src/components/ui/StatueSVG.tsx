import React from 'react';
import { getTierColorSet, TierColorSet } from '../../constants/ranks';
import './StatueSVG.css';

interface Props {
  tier: string;
  size?: number;
  unique?: boolean;
}

interface PedestalProps { cx: number; s: number; c: TierColorSet; }

const Pedestal: React.FC<PedestalProps> = ({ cx, s, c }) => (
  <>
    <rect x={cx - s*0.38} y={s*1.09} width={s*0.76} height={s*0.14} rx="2" fill={c.base}/>
    <rect x={cx - s*0.28} y={s*0.95} width={s*0.56} height={s*0.15} rx="2" fill={c.base} opacity="0.82"/>
    <line x1={cx - s*0.20} y1={s*1.14} x2={cx + s*0.20} y2={s*1.14}
      stroke={c.secondary} strokeWidth="0.5" opacity="0.40"/>
  </>
);

const StatueSVG: React.FC<Props> = ({ tier, size = 80, unique = false }) => {
  const c = getTierColorSet(tier);
  const s = size;
  const cx = s / 2;
  const H = s * 1.27;

  const cls = [
    'statue-svg',
    tier === 'Legend'      ? 'statue-svg--legend'      :
    tier === 'Grandmaster' ? 'statue-svg--grandmaster'  :
    tier.startsWith('Master')    ? 'statue-svg--master'    :
    tier.startsWith('Diamond')   ? 'statue-svg--diamond'   :
    tier.startsWith('Platinum')  ? 'statue-svg--platinum'  : '',
    unique ? 'statue-svg--unique' : '',
  ].filter(Boolean).join(' ');

  const glow = c.primary;

  /* ── LEGEND ─────────────────────────────────────────────── */
  if (tier === 'Legend') {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <defs>
          <radialGradient id="statue-aura-legend" cx="50%" cy="44%" r="50%">
            <stop offset="0%" stopColor={c.primary} stopOpacity="0.22"/>
            <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Aura */}
        <ellipse cx={cx} cy={s*0.48} rx={s*0.46} ry={s*0.50}
          fill="url(#statue-aura-legend)" className="statue-aura"/>

        <Pedestal cx={cx} s={s} c={c}/>

        {/* Cape left */}
        <path d={`M ${cx-s*0.14},${s*0.35}
          C ${cx-s*0.28},${s*0.56} ${cx-s*0.34},${s*0.74} ${cx-s*0.29},${s*0.95}
          L ${cx-s*0.17},${s*0.95}
          C ${cx-s*0.10},${s*0.74} ${cx-s*0.10},${s*0.56} ${cx-s*0.10},${s*0.35} Z`}
          fill={c.secondary} opacity="0.62"/>
        {/* Cape right */}
        <path d={`M ${cx+s*0.14},${s*0.35}
          C ${cx+s*0.28},${s*0.56} ${cx+s*0.34},${s*0.74} ${cx+s*0.29},${s*0.95}
          L ${cx+s*0.17},${s*0.95}
          C ${cx+s*0.10},${s*0.74} ${cx+s*0.10},${s*0.56} ${cx+s*0.10},${s*0.35} Z`}
          fill={c.secondary} opacity="0.62"/>

        {/* Legs */}
        <rect x={cx-s*0.13} y={s*0.67} width={s*0.10} height={s*0.28} rx="2" fill={c.secondary}/>
        <rect x={cx+s*0.03} y={s*0.67} width={s*0.10} height={s*0.28} rx="2" fill={c.secondary}/>

        {/* Torso */}
        <path d={`M ${cx-s*0.18},${s*0.36} L ${cx-s*0.13},${s*0.67}
          L ${cx+s*0.13},${s*0.67} L ${cx+s*0.18},${s*0.36} Z`} fill={c.secondary}/>
        {/* Breastplate diamond */}
        <path d={`M ${cx},${s*0.39} L ${cx-s*0.11},${s*0.52}
          L ${cx},${s*0.62} L ${cx+s*0.11},${s*0.52} Z`}
          fill={c.primary} opacity="0.45"/>
        <circle cx={cx} cy={s*0.52} r={s*0.030} fill={c.primary} opacity="0.90"/>

        {/* Pauldrons */}
        <ellipse cx={cx-s*0.22} cy={s*0.38} rx={s*0.065} ry={s*0.044} fill={c.primary} opacity="0.80"/>
        <ellipse cx={cx+s*0.22} cy={s*0.38} rx={s*0.065} ry={s*0.044} fill={c.primary} opacity="0.80"/>

        {/* Left arm raised */}
        <line x1={cx-s*0.18} y1={s*0.40} x2={cx-s*0.30} y2={s*0.27}
          stroke={c.primary} strokeWidth={s*0.055} strokeLinecap="round"/>
        {/* Right arm with sword */}
        <line x1={cx+s*0.18} y1={s*0.40} x2={cx+s*0.28} y2={s*0.24}
          stroke={c.primary} strokeWidth={s*0.055} strokeLinecap="round"/>
        {/* Sword blade */}
        <line x1={cx+s*0.28} y1={s*0.24} x2={cx+s*0.40} y2={-s*0.01}
          stroke={c.primary} strokeWidth={s*0.026} strokeLinecap="round"/>
        {/* Crossguard */}
        <line x1={cx+s*0.23} y1={s*0.17} x2={cx+s*0.37} y2={s*0.12}
          stroke={c.primary} strokeWidth={s*0.020} strokeLinecap="round"/>

        {/* Neck */}
        <rect x={cx-s*0.055} y={s*0.30} width={s*0.11} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Head */}
        <ellipse cx={cx} cy={s*0.24} rx={s*0.12} ry={s*0.10} fill={c.primary}/>
        {/* Visor slit */}
        <rect x={cx-s*0.09} y={s*0.23} width={s*0.18} height={s*0.022}
          rx="0.5" fill={c.base} opacity="0.55"/>

        {/* Imperial crown */}
        <path d={`M ${cx-s*0.12},${s*0.15}
          L ${cx-s*0.12},${s*0.05}
          L ${cx-s*0.06},${s*0.11}
          L ${cx},${s*0.01}
          L ${cx+s*0.06},${s*0.11}
          L ${cx+s*0.12},${s*0.05}
          L ${cx+s*0.12},${s*0.15} Z`} fill={c.primary}/>
        {/* Crown gems */}
        <circle cx={cx}          cy={s*0.03} r={s*0.028} fill="#ffeedd" opacity="0.90"/>
        <circle cx={cx-s*0.09}   cy={s*0.08} r={s*0.018} fill={c.primary} opacity="0.75"/>
        <circle cx={cx+s*0.09}   cy={s*0.08} r={s*0.018} fill={c.primary} opacity="0.75"/>
      </svg>
    );
  }

  /* ── GRANDMASTER ─────────────────────────────────────────── */
  if (tier === 'Grandmaster') {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <Pedestal cx={cx} s={s} c={c}/>

        {/* Cape hint left */}
        <path d={`M ${cx-s*0.14},${s*0.37}
          C ${cx-s*0.25},${s*0.57} ${cx-s*0.28},${s*0.78} ${cx-s*0.22},${s*0.95}
          L ${cx-s*0.14},${s*0.95} Z`} fill={c.secondary} opacity="0.52"/>
        {/* Cape hint right */}
        <path d={`M ${cx+s*0.14},${s*0.37}
          C ${cx+s*0.25},${s*0.57} ${cx+s*0.28},${s*0.78} ${cx+s*0.22},${s*0.95}
          L ${cx+s*0.14},${s*0.95} Z`} fill={c.secondary} opacity="0.52"/>

        {/* Legs */}
        <rect x={cx-s*0.12} y={s*0.68} width={s*0.10} height={s*0.27} rx="2" fill={c.secondary}/>
        <rect x={cx+s*0.02} y={s*0.68} width={s*0.10} height={s*0.27} rx="2" fill={c.secondary}/>

        {/* Torso */}
        <path d={`M ${cx-s*0.17},${s*0.37} L ${cx-s*0.12},${s*0.68}
          L ${cx+s*0.12},${s*0.68} L ${cx+s*0.17},${s*0.37} Z`} fill={c.secondary}/>
        <path d={`M ${cx},${s*0.40} L ${cx-s*0.10},${s*0.51}
          L ${cx},${s*0.60} L ${cx+s*0.10},${s*0.51} Z`} fill={c.primary} opacity="0.38"/>

        {/* Pauldrons */}
        <ellipse cx={cx-s*0.21} cy={s*0.39} rx={s*0.062} ry={s*0.042} fill={c.primary} opacity="0.72"/>
        <ellipse cx={cx+s*0.21} cy={s*0.39} rx={s*0.062} ry={s*0.042} fill={c.primary} opacity="0.72"/>

        {/* Left arm down */}
        <line x1={cx-s*0.17} y1={s*0.41} x2={cx-s*0.24} y2={s*0.60}
          stroke={c.primary} strokeWidth={s*0.052} strokeLinecap="round"/>
        {/* Right arm with sword raised */}
        <line x1={cx+s*0.17} y1={s*0.41} x2={cx+s*0.26} y2={s*0.24}
          stroke={c.primary} strokeWidth={s*0.052} strokeLinecap="round"/>
        <line x1={cx+s*0.26} y1={s*0.24} x2={cx+s*0.36} y2={s*0.02}
          stroke={c.primary} strokeWidth={s*0.025} strokeLinecap="round"/>
        <line x1={cx+s*0.22} y1={s*0.16} x2={cx+s*0.34} y2={s*0.11}
          stroke={c.primary} strokeWidth={s*0.018} strokeLinecap="round"/>

        {/* Neck */}
        <rect x={cx-s*0.055} y={s*0.31} width={s*0.11} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Head */}
        <ellipse cx={cx} cy={s*0.25} rx={s*0.11} ry={s*0.09} fill={c.primary}/>
        {/* Helmet band */}
        <rect x={cx-s*0.11} y={s*0.17} width={s*0.22} height={s*0.10} rx="2" fill={c.primary} opacity="0.82"/>
        {/* Crown prongs */}
        <rect x={cx-s*0.09} y={s*0.09} width={s*0.040} height={s*0.09} rx="1" fill={c.primary}/>
        <rect x={cx-s*0.02} y={s*0.04} width={s*0.040} height={s*0.14} rx="1" fill={c.primary}/>
        <rect x={cx+s*0.05} y={s*0.09} width={s*0.040} height={s*0.09} rx="1" fill={c.primary}/>
        <circle cx={cx} cy={s*0.055} r={s*0.022} fill="#ffeedd" opacity="0.80"/>
      </svg>
    );
  }

  /* ── MASTER ──────────────────────────────────────────────── */
  if (tier.startsWith('Master')) {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <Pedestal cx={cx} s={s} c={c}/>

        {/* Robe — wide at bottom */}
        <path d={`M ${cx-s*0.20},${s*0.57} L ${cx-s*0.27},${s*0.95}
          L ${cx+s*0.27},${s*0.95} L ${cx+s*0.20},${s*0.57} Z`}
          fill={c.secondary} opacity="0.68"/>
        {/* Robe top */}
        <path d={`M ${cx-s*0.16},${s*0.37} L ${cx-s*0.20},${s*0.57}
          L ${cx+s*0.20},${s*0.57} L ${cx+s*0.16},${s*0.37} Z`} fill={c.secondary}/>

        {/* Staff */}
        <line x1={cx-s*0.16} y1={s*0.90} x2={cx-s*0.08} y2={s*0.18}
          stroke={c.primary} strokeWidth={s*0.024} strokeLinecap="round" opacity="0.88"/>
        {/* Staff orb outer glow */}
        <circle cx={cx-s*0.08} cy={s*0.14} r={s*0.07} fill={c.primary}
          opacity="0.20" className="statue-orb"/>
        {/* Staff orb */}
        <circle cx={cx-s*0.08} cy={s*0.14} r={s*0.046} fill={c.primary}
          opacity="0.65" className="statue-orb"/>
        {/* Staff orb core */}
        <circle cx={cx-s*0.08} cy={s*0.14} r={s*0.022} fill="#ffffff" opacity="0.90"/>

        {/* Left arm raised holding staff */}
        <line x1={cx-s*0.16} y1={s*0.42} x2={cx-s*0.11} y2={s*0.26}
          stroke={c.secondary} strokeWidth={s*0.052} strokeLinecap="round"/>
        {/* Right arm gesture */}
        <line x1={cx+s*0.16} y1={s*0.42} x2={cx+s*0.24} y2={s*0.54}
          stroke={c.secondary} strokeWidth={s*0.052} strokeLinecap="round"/>

        {/* Neck */}
        <rect x={cx-s*0.05} y={s*0.31} width={s*0.10} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Head */}
        <ellipse cx={cx} cy={s*0.25} rx={s*0.11} ry={s*0.09} fill={c.primary}/>
        {/* Hood arc */}
        <path d={`M ${cx-s*0.15},${s*0.28} Q ${cx-s*0.17},${s*0.11} ${cx},${s*0.10}
          Q ${cx+s*0.17},${s*0.11} ${cx+s*0.15},${s*0.28}`}
          stroke={c.secondary} strokeWidth={s*0.062} fill="none" strokeLinecap="round"/>
        {/* Hood fill top */}
        <path d={`M ${cx-s*0.15},${s*0.16} Q ${cx},${s*0.04} ${cx+s*0.15},${s*0.16}`}
          fill={c.secondary} opacity="0.78"/>
      </svg>
    );
  }

  /* ── DIAMOND ─────────────────────────────────────────────── */
  if (tier.startsWith('Diamond')) {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <Pedestal cx={cx} s={s} c={c}/>

        {/* Legs */}
        <rect x={cx-s*0.12} y={s*0.68} width={s*0.10} height={s*0.27} rx="2" fill={c.secondary}/>
        <rect x={cx+s*0.02} y={s*0.68} width={s*0.10} height={s*0.27} rx="2" fill={c.secondary}/>

        {/* Torso */}
        <path d={`M ${cx-s*0.17},${s*0.37} L ${cx-s*0.12},${s*0.68}
          L ${cx+s*0.12},${s*0.68} L ${cx+s*0.17},${s*0.37} Z`} fill={c.secondary}/>

        {/* Diamond gem on chest */}
        <path d={`M ${cx},${s*0.42} L ${cx-s*0.08},${s*0.52}
          L ${cx},${s*0.61} L ${cx+s*0.08},${s*0.52} Z`} fill={c.primary} opacity="0.78"/>
        <path d={`M ${cx},${s*0.42} L ${cx-s*0.08},${s*0.52} L ${cx},${s*0.52} Z`}
          fill="#ffffff" opacity="0.22"/>

        {/* Pauldrons */}
        <ellipse cx={cx-s*0.20} cy={s*0.39} rx={s*0.060} ry={s*0.042} fill={c.primary} opacity="0.68"/>
        <ellipse cx={cx+s*0.20} cy={s*0.39} rx={s*0.060} ry={s*0.042} fill={c.primary} opacity="0.68"/>

        {/* Left arm down */}
        <line x1={cx-s*0.17} y1={s*0.42} x2={cx-s*0.24} y2={s*0.62}
          stroke={c.primary} strokeWidth={s*0.050} strokeLinecap="round"/>
        {/* Right arm with sword */}
        <line x1={cx+s*0.17} y1={s*0.42} x2={cx+s*0.27} y2={s*0.28}
          stroke={c.primary} strokeWidth={s*0.050} strokeLinecap="round"/>
        <line x1={cx+s*0.27} y1={s*0.28} x2={cx+s*0.38} y2={s*0.04}
          stroke={c.primary} strokeWidth={s*0.026} strokeLinecap="round"/>
        <line x1={cx+s*0.23} y1={s*0.20} x2={cx+s*0.36} y2={s*0.14}
          stroke={c.primary} strokeWidth={s*0.018} strokeLinecap="round"/>

        {/* Neck */}
        <rect x={cx-s*0.055} y={s*0.31} width={s*0.11} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Head */}
        <ellipse cx={cx} cy={s*0.25} rx={s*0.11} ry={s*0.09} fill={c.primary}/>

        {/* Crystal crown spikes */}
        <polygon points={`${cx-s*0.10},${s*0.17} ${cx-s*0.075},${s*0.04} ${cx-s*0.045},${s*0.17}`}
          fill={c.primary} opacity="0.78"/>
        <polygon points={`${cx-s*0.04},${s*0.17} ${cx},${s*0.01} ${cx+s*0.04},${s*0.17}`}
          fill={c.primary} opacity="0.92"/>
        <polygon points={`${cx+s*0.045},${s*0.17} ${cx+s*0.075},${s*0.04} ${cx+s*0.10},${s*0.17}`}
          fill={c.primary} opacity="0.78"/>

        {/* Sparkle particles */}
        <circle cx={cx-s*0.32} cy={s*0.32} r={s*0.018} fill={c.primary}
          opacity="0.80" className="statue-sparkle"/>
        <circle cx={cx+s*0.34} cy={s*0.18} r={s*0.014} fill={c.primary}
          opacity="0.70" className="statue-sparkle"/>
        <circle cx={cx-s*0.28} cy={s*0.15} r={s*0.012} fill="#ffffff"
          opacity="0.90" className="statue-sparkle"/>
      </svg>
    );
  }

  /* ── PLATINUM ────────────────────────────────────────────── */
  if (tier.startsWith('Platinum')) {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <Pedestal cx={cx} s={s} c={c}/>

        {/* Legs — wide stance */}
        <rect x={cx-s*0.15} y={s*0.68} width={s*0.11} height={s*0.27} rx="2" fill={c.secondary}/>
        <rect x={cx+s*0.04} y={s*0.68} width={s*0.11} height={s*0.27} rx="2" fill={c.secondary}/>

        {/* Heavy torso */}
        <path d={`M ${cx-s*0.20},${s*0.35} L ${cx-s*0.15},${s*0.68}
          L ${cx+s*0.15},${s*0.68} L ${cx+s*0.20},${s*0.35} Z`} fill={c.secondary}/>
        {/* Breastplate center ridge */}
        <line x1={cx} y1={s*0.38} x2={cx} y2={s*0.65}
          stroke={c.primary} strokeWidth={s*0.018} opacity="0.38"/>

        {/* Big pauldrons */}
        <ellipse cx={cx-s*0.25} cy={s*0.37} rx={s*0.080} ry={s*0.052} fill={c.primary} opacity="0.74"/>
        <ellipse cx={cx+s*0.25} cy={s*0.37} rx={s*0.080} ry={s*0.052} fill={c.primary} opacity="0.74"/>

        {/* Both arms on greatsword */}
        <line x1={cx-s*0.20} y1={s*0.38} x2={cx-s*0.10} y2={s*0.55}
          stroke={c.primary} strokeWidth={s*0.056} strokeLinecap="round"/>
        <line x1={cx+s*0.20} y1={s*0.38} x2={cx+s*0.10} y2={s*0.55}
          stroke={c.primary} strokeWidth={s*0.056} strokeLinecap="round"/>

        {/* Greatsword vertical */}
        <line x1={cx} y1={s*0.92} x2={cx} y2={s*0.03}
          stroke={c.primary} strokeWidth={s*0.030} strokeLinecap="round"/>
        {/* Crossguard */}
        <line x1={cx-s*0.16} y1={s*0.50} x2={cx+s*0.16} y2={s*0.50}
          stroke={c.primary} strokeWidth={s*0.026} strokeLinecap="round"/>
        {/* Pommel */}
        <circle cx={cx} cy={s*0.90} r={s*0.032} fill={c.primary}/>
        {/* Blade tip */}
        <polygon points={`${cx-s*0.02},${s*0.05} ${cx},${s*0.01} ${cx+s*0.02},${s*0.05}`}
          fill={c.primary}/>

        {/* Neck */}
        <rect x={cx-s*0.060} y={s*0.29} width={s*0.12} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Heavy helmet */}
        <rect x={cx-s*0.13} y={s*0.15} width={s*0.26} height={s*0.17} rx="4" fill={c.primary}/>
        {/* Visor slit */}
        <rect x={cx-s*0.10} y={s*0.23} width={s*0.20} height={s*0.026}
          rx="1" fill={c.base} opacity="0.58"/>
      </svg>
    );
  }

  /* ── GOLD ────────────────────────────────────────────────── */
  if (tier.startsWith('Gold')) {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <Pedestal cx={cx} s={s} c={c}/>

        {/* Legs */}
        <rect x={cx-s*0.12} y={s*0.68} width={s*0.10} height={s*0.27} rx="2" fill={c.secondary}/>
        <rect x={cx+s*0.02} y={s*0.68} width={s*0.10} height={s*0.27} rx="2" fill={c.secondary}/>

        {/* Torso */}
        <path d={`M ${cx-s*0.17},${s*0.37} L ${cx-s*0.12},${s*0.68}
          L ${cx+s*0.12},${s*0.68} L ${cx+s*0.17},${s*0.37} Z`} fill={c.secondary}/>

        {/* Star on breastplate */}
        <polygon points={`
          ${cx},${s*0.41}
          ${cx+s*0.032},${s*0.48} ${cx+s*0.10},${s*0.48}
          ${cx+s*0.044},${s*0.53} ${cx+s*0.064},${s*0.61}
          ${cx},${s*0.57}
          ${cx-s*0.064},${s*0.61} ${cx-s*0.044},${s*0.53}
          ${cx-s*0.10},${s*0.48} ${cx-s*0.032},${s*0.48}`}
          fill={c.primary} opacity="0.68"/>

        {/* Pauldrons */}
        <ellipse cx={cx-s*0.21} cy={s*0.39} rx={s*0.062} ry={s*0.042} fill={c.primary} opacity="0.70"/>
        <ellipse cx={cx+s*0.21} cy={s*0.39} rx={s*0.062} ry={s*0.042} fill={c.primary} opacity="0.70"/>

        {/* Left arm at side */}
        <line x1={cx-s*0.17} y1={s*0.41} x2={cx-s*0.23} y2={s*0.61}
          stroke={c.primary} strokeWidth={s*0.052} strokeLinecap="round"/>
        {/* Right arm with sword raised */}
        <line x1={cx+s*0.17} y1={s*0.41} x2={cx+s*0.28} y2={s*0.25}
          stroke={c.primary} strokeWidth={s*0.052} strokeLinecap="round"/>
        <line x1={cx+s*0.28} y1={s*0.25} x2={cx+s*0.40} y2={s*0.01}
          stroke={c.primary} strokeWidth={s*0.026} strokeLinecap="round"/>
        <line x1={cx+s*0.24} y1={s*0.17} x2={cx+s*0.37} y2={s*0.12}
          stroke={c.primary} strokeWidth={s*0.018} strokeLinecap="round"/>

        {/* Neck */}
        <rect x={cx-s*0.055} y={s*0.31} width={s*0.11} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Head with T-visor knight helmet */}
        <ellipse cx={cx} cy={s*0.25} rx={s*0.12} ry={s*0.10} fill={c.primary}/>
        <rect x={cx-s*0.12} y={s*0.15} width={s*0.24} height={s*0.12} rx="9" fill={c.primary} opacity="0.84"/>
        {/* T visor horizontal */}
        <rect x={cx-s*0.10} y={s*0.23} width={s*0.20} height={s*0.024}
          rx="0.5" fill={c.base} opacity="0.52"/>
        {/* T visor vertical */}
        <rect x={cx-s*0.016} y={s*0.15} width={s*0.032} height={s*0.11}
          rx="0.5" fill={c.base} opacity="0.40"/>
      </svg>
    );
  }

  /* ── SILVER ──────────────────────────────────────────────── */
  if (tier.startsWith('Silver')) {
    return (
      <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
        className={cls} style={{ '--glow': glow } as React.CSSProperties}>
        <Pedestal cx={cx} s={s} c={c}/>

        {/* Legs */}
        <rect x={cx-s*0.11} y={s*0.68} width={s*0.09} height={s*0.27} rx="2" fill={c.secondary}/>
        <rect x={cx+s*0.02} y={s*0.68} width={s*0.09} height={s*0.27} rx="2" fill={c.secondary}/>

        {/* Torso */}
        <path d={`M ${cx-s*0.15},${s*0.39} L ${cx-s*0.11},${s*0.68}
          L ${cx+s*0.11},${s*0.68} L ${cx+s*0.15},${s*0.39} Z`} fill={c.secondary}/>

        {/* Shield on left arm */}
        <rect x={cx-s*0.32} y={s*0.41} width={s*0.14} height={s*0.22} rx="3"
          fill={c.primary} opacity="0.72"/>
        <ellipse cx={cx-s*0.25} cy={s*0.52} rx={s*0.042} ry={s*0.064}
          fill={c.secondary} opacity="0.38"/>

        {/* Left arm holding shield */}
        <line x1={cx-s*0.15} y1={s*0.44} x2={cx-s*0.24} y2={s*0.52}
          stroke={c.primary} strokeWidth={s*0.050} strokeLinecap="round"/>
        {/* Right arm with short sword angled up */}
        <line x1={cx+s*0.15} y1={s*0.44} x2={cx+s*0.25} y2={s*0.28}
          stroke={c.primary} strokeWidth={s*0.050} strokeLinecap="round"/>
        <line x1={cx+s*0.25} y1={s*0.28} x2={cx+s*0.34} y2={s*0.07}
          stroke={c.primary} strokeWidth={s*0.024} strokeLinecap="round"/>
        <line x1={cx+s*0.21} y1={s*0.21} x2={cx+s*0.32} y2={s*0.15}
          stroke={c.primary} strokeWidth={s*0.016} strokeLinecap="round"/>

        {/* Neck */}
        <rect x={cx-s*0.050} y={s*0.33} width={s*0.10} height={s*0.07} rx="1" fill={c.secondary}/>

        {/* Head */}
        <ellipse cx={cx} cy={s*0.27} rx={s*0.11} ry={s*0.09} fill={c.primary}/>
        {/* Plumed helmet */}
        <rect x={cx-s*0.11} y={s*0.18} width={s*0.22} height={s*0.11} rx="5" fill={c.primary} opacity="0.84"/>
        {/* Plume */}
        <path d={`M ${cx+s*0.06},${s*0.18} Q ${cx+s*0.14},${s*0.07} ${cx+s*0.05},${s*0.01}`}
          stroke={c.primary} strokeWidth={s*0.032} fill="none"
          strokeLinecap="round" opacity="0.68"/>
      </svg>
    );
  }

  /* ── BRONZE (default) ────────────────────────────────────── */
  return (
    <svg width={s} height={H} viewBox={`0 0 ${s} ${H}`} fill="none"
      className={cls} style={{ '--glow': glow } as React.CSSProperties}>
      <Pedestal cx={cx} s={s} c={c}/>

      {/* Legs */}
      <rect x={cx-s*0.10} y={s*0.68} width={s*0.08} height={s*0.27} rx="2" fill={c.secondary}/>
      <rect x={cx+s*0.02} y={s*0.68} width={s*0.08} height={s*0.27} rx="2" fill={c.secondary}/>

      {/* Torso */}
      <path d={`M ${cx-s*0.13},${s*0.41} L ${cx-s*0.10},${s*0.68}
        L ${cx+s*0.10},${s*0.68} L ${cx+s*0.13},${s*0.41} Z`} fill={c.secondary}/>

      {/* Left arm at side */}
      <line x1={cx-s*0.13} y1={s*0.44} x2={cx-s*0.20} y2={s*0.63}
        stroke={c.primary} strokeWidth={s*0.048} strokeLinecap="round"/>
      {/* Right arm holding spear */}
      <line x1={cx+s*0.13} y1={s*0.44} x2={cx+s*0.20} y2={s*0.56}
        stroke={c.primary} strokeWidth={s*0.048} strokeLinecap="round"/>
      {/* Spear shaft */}
      <line x1={cx+s*0.20} y1={s*0.56} x2={cx+s*0.22} y2={s*0.94}
        stroke={c.primary} strokeWidth={s*0.020} strokeLinecap="round" opacity="0.74"/>
      {/* Spear tip */}
      <polygon points={`${cx+s*0.17},${s*0.58} ${cx+s*0.22},${s*0.48} ${cx+s*0.27},${s*0.58}`}
        fill={c.primary} opacity="0.78"/>

      {/* Neck */}
      <rect x={cx-s*0.050} y={s*0.35} width={s*0.10} height={s*0.07} rx="1" fill={c.secondary}/>

      {/* Head */}
      <ellipse cx={cx} cy={s*0.29} rx={s*0.10} ry={s*0.09} fill={c.primary}/>
      {/* Round cap */}
      <ellipse cx={cx} cy={s*0.22} rx={s*0.11} ry={s*0.08} fill={c.primary} opacity="0.84"/>
    </svg>
  );
};

export default StatueSVG;
