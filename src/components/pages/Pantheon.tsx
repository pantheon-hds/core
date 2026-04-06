import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import './Pantheon.css';
import { getPantheonData, PantheonEntry } from '../../services/pantheonService';
import { RANK_TIER_COLORS } from '../../constants/ranks';
import StatueSVG from '../ui/StatueSVG';

const TIER_GROUPS = [
  { label: 'Legends',      tiers: ['Legend'],                       special: true  },
  { label: 'Grandmasters', tiers: ['Grandmaster'],                  special: false },
  { label: 'Masters',      tiers: ['Master'],                       special: false },
  { label: 'Diamond',      tiers: ['Diamond'],                      special: false },
  { label: 'Platinum',     tiers: ['Platinum'],                     special: false },
  { label: 'Champions',    tiers: ['Gold', 'Silver III', 'Silver II', 'Silver I', 'Bronze III', 'Bronze II', 'Bronze I'], special: false },
];

const Pantheon: React.FC = () => {
  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ['pantheon'],
    queryFn: getPantheonData,
    staleTime: 60 * 1000,
  });

  const hasAny = entries.length > 0;

  return (
    <div className="pantheon">
      <div className="pantheon__intro">
        <div className="pantheon__intro-top" />
        <div className="pantheon__intro-title">Pantheon of Legends</div>
        <div className="pantheon__intro-sub">
          Only the community decides who is worthy. No algorithms. No money. Just skill.
        </div>
      </div>

      {isLoading && (
        <div className="pantheon__empty">
          <div className="pantheon__empty-title">Loading...</div>
        </div>
      )}

      {!isLoading && isError && (
        <div className="pantheon__empty">
          <div className="pantheon__empty-title">Failed to load</div>
          <div className="pantheon__empty-sub">Check your connection and try again.</div>
        </div>
      )}

      {!isLoading && !isError && !hasAny && (
        <div className="pantheon__empty">
          <div className="pantheon__empty-icon">
            <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
              <polygon
                points="30,4 37,22 56,22 41,34 47,52 30,41 13,52 19,34 4,22 23,22"
                stroke="#3a2e1a" strokeWidth="1" fill="none"
              />
            </svg>
          </div>
          <div className="pantheon__empty-title">No Champions Yet</div>
          <div className="pantheon__empty-text">
            The Pantheon awaits its first champions.<br/>
            Complete challenges. Prove your skill.<br/>
            Let the community decide.
          </div>
          <div className="pantheon__empty-hint">
            Be the first to earn a rank. Your statue will stand here forever.
          </div>
        </div>
      )}

      {!isLoading && !isError && hasAny && TIER_GROUPS.map(group => {
        const groupEntries = entries.filter(e => group.tiers.includes(e.bestTier));
        if (groupEntries.length === 0) {
          if (!group.special) return null;
          return (
            <div key={group.label} className="pantheon__group">
              <div className="pantheon__section-title">{group.label}</div>
              <div className="pantheon__legend-empty">
                <StatueSVG tier="Legend" size={56} />
                <div className="pantheon__legend-empty-text">
                  No Legends yet. Be the first.
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={group.label} className="pantheon__group">
            <div className="pantheon__section-title">
              {group.label} · {groupEntries.length}
            </div>
            <div className={`pantheon__grid${group.special ? ' pantheon__grid--legend' : ''}`}>
              {groupEntries.map(entry => (
                <PlayerCard key={entry.userId} entry={entry} featured={group.special} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface PlayerCardProps {
  entry: PantheonEntry;
  featured: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ entry, featured }) => {
  const tierColor = RANK_TIER_COLORS[entry.bestTier] || '#c9922a';
  const navigate = useNavigate();

  return (
    <div
      className={`pantheon__card pantheon__card--clickable${featured ? ' pantheon__card--legend' : ''}`}
      onClick={() => navigate(`/u/${entry.username}`)}
    >
      {featured && <div className="pantheon__card-top" />}

      <div className="pantheon__card-inner">
        <div className="pantheon__card-statue">
          <StatueSVG tier={entry.bestTier} size={featured ? 72 : 56} />
        </div>

        <div className="pantheon__card-body">
          <div className="pantheon__card-name">{entry.username}</div>
          <div className="pantheon__card-game">{entry.bestGame}</div>

          <div className="pantheon__card-tier" style={{ color: tierColor }}>
            {entry.bestTier}
          </div>

          <div className="pantheon__card-stats">
            {entry.statueCount > 0 && (
              <span className="pantheon__card-stat">
                {entry.statueCount} statue{entry.statueCount !== 1 ? 's' : ''}
              </span>
            )}
            {entry.uniqueStatueCount > 0 && (
              <span className="pantheon__card-stat pantheon__card-stat--unique">
                {entry.uniqueStatueCount} unique
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pantheon;
