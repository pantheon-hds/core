import React from 'react';
import './StatueSVG.css';

interface Props {
  tier: string;
  size?: number;
  unique?: boolean;
}

const TIER_IMAGE: Record<string, string> = {
  'Bronze I':    '/ranks/bronze-1.png',
  'Bronze II':   '/ranks/bronze-2.png',
  'Bronze III':  '/ranks/bronze-3.png',
  'Silver I':    '/ranks/silver-1.png',
  'Silver II':   '/ranks/silver-2.png',
  'Silver III':  '/ranks/silver-3.png',
  'Gold':        '/ranks/gold.png',
  'Platinum':    '/ranks/platinum.png',
  'Diamond':     '/ranks/diamond.png',
  'Master':      '/ranks/master.png',
  'Grandmaster': '/ranks/grandmaster.png',
  'Legend':      '/ranks/legend.png',
};

const TIER_GLOW: Record<string, string> = {
  'Legend':      'rgba(196,74,42,0.9)',
  'Grandmaster': 'rgba(244,212,168,0.9)',
  'Master':      'rgba(212,168,244,0.9)',
  'Diamond':     'rgba(168,212,244,0.9)',
  'Platinum':    'rgba(180,200,220,0.9)',
  'Gold':        'rgba(232,168,48,0.9)',
  'Silver III':  'rgba(180,180,200,0.9)',
  'Silver II':   'rgba(160,160,185,0.9)',
  'Silver I':    'rgba(140,140,165,0.9)',
  'Bronze III':  'rgba(180,120,60,0.9)',
  'Bronze II':   'rgba(160,105,50,0.9)',
  'Bronze I':    'rgba(140,90,45,0.9)',
};

const StatueSVG: React.FC<Props> = ({ tier, size = 80, unique = false }) => {
  const src = TIER_IMAGE[tier] ?? '/ranks/unranked.png';
  const glow = TIER_GLOW[tier] ?? 'rgba(232,168,48,0.8)';

  const cls = [
    'statue-svg',
    tier === 'Legend'      ? 'statue-svg--legend'      : '',
    tier === 'Grandmaster' ? 'statue-svg--grandmaster'  : '',
    unique                 ? 'statue-svg--unique'       : '',
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt={tier}
      width={size}
      className={cls}
      style={{ '--glow': glow, display: 'block' } as React.CSSProperties}
    />
  );
};

export default StatueSVG;
