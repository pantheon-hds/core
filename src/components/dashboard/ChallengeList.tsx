import React from 'react';
import { TIER_COLORS } from '../../constants/ranks';
import type { Challenge, Submission } from '../../types';

interface Props {
  challenges: Challenge[];
  filter: string;
  tiers: string[];
  onFilterChange: (tier: string) => void;
  onChallengeClick: (challenge: Challenge) => void;
  getSubmissionStatus: (id: number) => Submission | undefined;
}

const ChallengeList: React.FC<Props> = ({
  challenges, filter, tiers, onFilterChange, onChallengeClick, getSubmissionStatus,
}) => {
  const filtered = filter === 'All' ? challenges : challenges.filter(c => c.tier === filter);

  return (
    <>
      <div className="dashboard__challenges-header">
        <span className="dashboard__challenges-title">Community Challenges</span>
        <div className="dashboard__filters">
          {tiers.map(t => (
            <button
              key={t}
              className={"dashboard__filter" + (filter === t ? " dashboard__filter--active" : "")}
              onClick={() => onFilterChange(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard__challenges">
        {filtered.length === 0 ? (
          <div className="dashboard__empty">No challenges yet. Add some from the Admin panel.</div>
        ) : (
          filtered.map(challenge => {
            const submission = getSubmissionStatus(challenge.id);
            return (
              <div
                key={challenge.id}
                className="dashboard__challenge"
                onClick={() => onChallengeClick(challenge)}
              >
                <div className="dashboard__challenge-dot" style={{ background: TIER_COLORS[challenge.tier] || '#c9922a' }} />
                <span className="dashboard__challenge-title">{challenge.title}</span>
                <span className="dashboard__challenge-game">{challenge.game?.title}</span>
                <span className="dashboard__challenge-tier">{challenge.tier}</span>
                {submission && (
                  <span className="dashboard__challenge-status" style={{
                    color: submission.status === 'approved' ? '#6ab87a' :
                           submission.status === 'rejected' ? '#e45a3a' : '#c9922a',
                  }}>
                    {submission.status === 'pending' ? '⏳' :
                     submission.status === 'approved' ? '✓' :
                     submission.status === 'rejected' ? '✗' :
                     submission.status === 'in_review' ? '👁' : ''}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default ChallengeList;
