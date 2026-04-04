import React, { useState } from 'react';
import type { Submission } from '../../types';

interface SubmissionsTabProps {
  submissions: Submission[];
  onAction: (submissionId: string, action: 'approved' | 'rejected', note: string) => void;
}

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({ submissions, onAction }) => {
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="admin__section">
      <div className="admin__list">
        <div className="admin__list-title">
          All Submissions — {submissions.length} total · {pendingCount} pending
        </div>
        {submissions.length === 0 ? (
          <div className="admin__empty">No submissions yet.</div>
        ) : (
          submissions.map(s => (
            <div
              key={s.id}
              className={"admin__item admin__item--submission" + (s.status === 'pending' ? ' admin__item--pending' : '')}
            >
              <div className="admin__item-info">
                <div className="admin__item-title">
                  {s.user?.username || 'Unknown'} — {s.challenge?.title || 'Unknown challenge'}
                </div>
                <div className="admin__item-meta">
                  {s.challenge?.tier} · {new Date(s.submitted_at).toLocaleDateString()}
                  {' · Status: '}
                  <span className={`admin__status--${s.status}`}>{s.status}</span>
                </div>
                {s.comment && <div className="admin__item-desc">Comment: {s.comment}</div>}
                <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="admin__video-link">
                  Watch Video →
                </a>
                {s.status === 'pending' && (
                  <div className="admin__review-actions">
                    <input
                      className="admin__note-input"
                      placeholder="Admin note (optional)..."
                      value={adminNote[s.id] || ''}
                      onChange={e => setAdminNote(prev => ({ ...prev, [s.id]: e.target.value }))}
                    />
                    <div className="admin__action-btns">
                      <button className="admin__approve-btn" onClick={() => onAction(s.id, 'approved', adminNote[s.id] ?? '')}>
                        ✓ Approve
                      </button>
                      <button className="admin__reject-btn" onClick={() => onAction(s.id, 'rejected', adminNote[s.id] ?? '')}>
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                )}
                {s.admin_note && <div className="admin__item-note">Note: {s.admin_note}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SubmissionsTab;
