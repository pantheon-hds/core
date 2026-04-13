import React from 'react';
import { TIER_COLORS } from '../../constants/ranks';
import type { Challenge, Submission } from '../../types';

interface Props {
  challenge: Challenge;
  submissionStatus: Submission | undefined;
  onClose: () => void;
  onSubmit: (challenge: Challenge) => void;
}

const ChallengeDetailModal: React.FC<Props> = ({ challenge, submissionStatus, onClose, onSubmit }) => (
  <div className="dashboard__modal-overlay" onClick={onClose}>
    <div className="dashboard__modal" onClick={e => e.stopPropagation()}>
      <div className="dashboard__modal-tier" style={{ color: TIER_COLORS[challenge.tier] || '#c9922a' }}>
        {challenge.tier}
      </div>
      <div className="dashboard__modal-title">{challenge.title}</div>
      <div className="dashboard__modal-desc">{challenge.description}</div>
      {challenge.condition && (
        <div className="dashboard__modal-field">
          <div className="dashboard__modal-field-label">Condition</div>
          <div className="dashboard__modal-field-value">{challenge.condition}</div>
        </div>
      )}
      {challenge.verification && (
        <div className="dashboard__modal-field">
          <div className="dashboard__modal-field-label">Verification</div>
          <div className="dashboard__modal-field-value">{challenge.verification}</div>
        </div>
      )}
      <div className="dashboard__modal-meta">{challenge.game?.title}</div>
      <div className="dashboard__modal-actions">
        {submissionStatus?.status === 'approved' ? (
          <div className="dashboard__modal-completed">✓ Completed</div>
        ) : (
          <button
            className="dashboard__modal-submit-btn"
            onClick={() => { onClose(); onSubmit(challenge); }}
          >
            Submit Attempt
          </button>
        )}
        <button className="dashboard__modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

export default ChallengeDetailModal;
