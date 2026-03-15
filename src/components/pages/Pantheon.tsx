import React, { useState } from 'react';
import './Pantheon.css';

interface Legend {
  id: number;
  name: string;
  game: string;
  region: string;
  feat: string;
  votes: number;
  pct: number;
  isLegend: boolean;
}

const initialLegends: Legend[] = [
  { id: 1, name: 'GhostStep_JP', game: 'Hollow Knight', region: 'Japan', feat: 'Pantheon of Hallownest with zero damage taken — world first, verified by community', votes: 5122, pct: 94, isLegend: true },
  { id: 2, name: 'ShadowBlade_CN', game: 'Dark Souls III', region: 'China', feat: 'Full game blindfolded — 6-hour continuous stream, no cuts', votes: 2841, pct: 72, isLegend: false },
  { id: 3, name: 'IronWill_US', game: 'Elden Ring', region: 'USA', feat: 'No hit run of all bosses including DLC in a single uninterrupted session', votes: 1967, pct: 54, isLegend: false },
  { id: 4, name: 'VoidRunner_DE', game: 'Sekiro', region: 'Germany', feat: 'All bosses with zero parries — evasion and direct strikes only', votes: 1203, pct: 38, isLegend: false },
];

const Pantheon: React.FC = () => {
  const [legends, setLegends] = useState<Legend[]>(initialLegends);
  const [voted, setVoted] = useState<Set<number>>(new Set([1]));

  const handleVote = (id: number) => {
    if (voted.has(id)) return;
    setVoted(prev => new Set(Array.from(prev).concat(id)));
    setLegends(prev => prev.map(l =>
      l.id === id ? { ...l, votes: l.votes + 1, pct: Math.min(l.pct + 1, 99) } : l
    ));
  };

  return (
    <div className="pantheon">
      <div className="pantheon__intro">
        <div className="pantheon__intro-top" />
        <div className="pantheon__intro-title">Pantheon of Legends</div>
        <div className="pantheon__intro-sub">Only the community decides who is worthy. No algorithms. No money. Just skill.</div>
      </div>

      <div className="pantheon__section-title">Candidates & Legends</div>

      <div className="pantheon__grid">
        {legends.map(l => (
          <div className={`pantheon__card ${l.isLegend ? 'pantheon__card--legend' : ''}`} key={l.id}>
            {l.isLegend && <div className="pantheon__card-top" />}
            <div className="pantheon__card-name">{l.name}</div>
            <div className="pantheon__card-game">{l.game} · {l.region}</div>
            <div className="pantheon__card-feat">{l.feat}</div>
            <div className="pantheon__card-footer">
              <span className="pantheon__card-votes">{l.votes.toLocaleString()} votes</span>
              <span className={`pantheon__card-badge ${l.isLegend ? 'pantheon__card-badge--legend' : ''}`}>
                {l.isLegend ? 'Legend' : 'Candidate'}
              </span>
            </div>
            <div className="pantheon__vote-bar">
              <div className="pantheon__vote-track">
                <div className="pantheon__vote-fill" style={{ width: `${l.pct}%` }} />
              </div>
            </div>
            <button
              className={`pantheon__vote-btn ${voted.has(l.id) ? 'pantheon__vote-btn--done' : ''}`}
              onClick={() => handleVote(l.id)}
              disabled={voted.has(l.id)}
            >
              {voted.has(l.id) ? (l.isLegend ? 'Recognized as Legend' : 'Vote Cast') : 'Recognize as Legend'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pantheon;
