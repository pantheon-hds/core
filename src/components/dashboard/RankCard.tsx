import React from 'react';
import StatueSVG from '../ui/StatueSVG';
import { RANK_TIER_COLORS, TIER_COLORS } from '../../constants/ranks';
import { getProgressInfo } from '../../utils/rankProgress';
import type { UserRank, UserStatue, Challenge } from '../../types';

interface Game { id: number; steam_app_id: string; title: string; }

interface Props {
  ranks: UserRank[];
  statues: UserStatue[];
  games: Game[];
  challenges: Challenge[];
  dbUsername: string | null;
  copied: boolean;
  onCopy: () => void;
  topRank: UserRank | undefined;
  approvedChallengeIds: (number | null)[];
}

const RankCard: React.FC<Props> = ({
  ranks, statues, games, challenges, dbUsername, copied, onCopy, topRank, approvedChallengeIds,
}) => {
  const progress = topRank ? getProgressInfo(topRank.tier, approvedChallengeIds, challenges) : null;

  return (
    <>
      <div className="dashboard__rank-card">
        <div className="dashboard__rank-statues">
          {statues.length > 0
            ? statues.map(s => (
                <div key={s.id} className="dashboard__rank-statue-item">
                  <StatueSVG tier={s.tier} size={80} unique={s.is_unique} />
                  <div className="dashboard__rank-statue-tier" style={{ color: RANK_TIER_COLORS[s.tier] || '#c9922a' }}>
                    {s.tier}
                  </div>
                  <div className="dashboard__rank-statue-game">{s.game?.title}</div>
                </div>
              ))
            : (
              <div className="dashboard__rank-statue-item">
                <StatueSVG tier="Bronze I" size={80} />
                <div className="dashboard__rank-statue-tier" style={{ color: '#c9922a' }}>No rank yet</div>
                <div className="dashboard__rank-statue-game">Play games to earn ranks</div>
              </div>
            )
          }
        </div>
        <div className="dashboard__rank-info">
          <div className="dashboard__rank-xp">
            {ranks.length} rank{ranks.length !== 1 ? 's' : ''} earned across {games.length} game{games.length !== 1 ? 's' : ''}
          </div>
          {dbUsername && (
            <div className="dashboard__profile-share">
              <div className="dashboard__profile-share-label">Your public profile · share with anyone</div>
              <div className="dashboard__profile-share-row">
                <a href={`/u/${dbUsername}`} className="dashboard__profile-link" target="_blank" rel="noreferrer">
                  pantheonhds.com/u/{dbUsername}
                </a>
                <button className="dashboard__copy-btn" onClick={onCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {progress && !progress.isLegend && progress.required > 0 && (
        <div className="dashboard__progress">
          <div className="dashboard__progress-header">
            <span className="dashboard__progress-label">Path to {progress.nextRank}</span>
            <span className="dashboard__progress-count">
              {progress.completed} / {progress.required} {progress.challengeTier} challenges
            </span>
          </div>
          <div className="dashboard__progress-dots">
            {Array.from({ length: progress.required }).map((_, i) => (
              <div
                key={i}
                className={"dashboard__progress-dot" + (i < progress.completed ? ' dashboard__progress-dot--done' : '')}
                style={i < progress.completed ? { background: TIER_COLORS[progress.challengeTier!] || '#c9922a' } : {}}
              />
            ))}
          </div>
          {progress.completed >= progress.required && (
            <div className="dashboard__progress-ready">
              Ready to advance! Submit your next challenge to unlock {progress.nextRank}.
            </div>
          )}
        </div>
      )}

      {progress?.isLegend && (
        <div className="dashboard__progress dashboard__progress--legend">
          <div className="dashboard__progress-label">You are Grandmaster. The path to Legend awaits.</div>
          <div className="dashboard__progress-legend-text">Legend rank is granted by community vote only.</div>
        </div>
      )}
    </>
  );
};

export default RankCard;
