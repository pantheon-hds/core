import React from 'react';
import { TIER_COLORS } from '../../constants/ranks';
import type { Challenge } from '../../types';

interface Props {
  challenge: Challenge;
  videoUrl: string;
  comment: string;
  submitting: boolean;
  submitMessage: string;
  submitMessageIsError: boolean;
  onVideoUrlChange: (val: string) => void;
  onCommentChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const SubmitModal: React.FC<Props> = ({
  challenge, videoUrl, comment, submitting, submitMessage, submitMessageIsError,
  onVideoUrlChange, onCommentChange, onSubmit, onClose,
}) => {
  const isError = submitMessageIsError;

  return (
    <div className="dashboard__modal-overlay" onClick={onClose}>
      <div className="dashboard__modal dashboard__modal--submit" onClick={e => e.stopPropagation()}>
        <div className="dashboard__modal-tier" style={{ color: TIER_COLORS[challenge.tier] || '#c9922a' }}>
          Submit — {challenge.tier}
        </div>
        <div className="dashboard__modal-title">{challenge.title}</div>
        <div className="dashboard__modal-game">{challenge.game?.title}</div>

        <div className="dashboard__submit-field">
          <label className="dashboard__submit-label" htmlFor="submit-video">Video URL *</label>
          <input
            id="submit-video"
            className="dashboard__submit-input"
            placeholder="YouTube or Twitch link only"
            value={videoUrl}
            onChange={e => onVideoUrlChange(e.target.value)}
          />
          <div className="dashboard__submit-hint">Only youtube.com, youtu.be, twitch.tv are accepted</div>
        </div>

        <div className="dashboard__submit-field">
          <label className="dashboard__submit-label" htmlFor="submit-comment">Comment (optional)</label>
          <textarea
            id="submit-comment"
            className="dashboard__submit-textarea"
            placeholder="Any notes for the judges..."
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            rows={3}
          />
        </div>

        {submitMessage && (
          <div className={`dashboard__submit-message${isError ? ' dashboard__submit-message--error' : ' dashboard__submit-message--success'}`}>
            {submitMessage}
          </div>
        )}

        <div className="dashboard__modal-actions">
          <button className="dashboard__modal-submit-btn" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          <button className="dashboard__modal-close" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModal;
