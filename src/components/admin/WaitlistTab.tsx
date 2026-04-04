import React, { useState } from 'react';
import type { WaitlistEntry } from '../../types';

interface WaitlistTabProps {
  waitlist: WaitlistEntry[];
  approvingId: string | null;
  onApprove: (entry: WaitlistEntry) => void;
  onReject: (id: string, reason: string) => Promise<boolean>;
}

const REJECT_REASONS = [
  "You don't fit our current tester profile",
  "Too little information provided",
  "The beta is currently full — we'll keep your application on file",
];

const WaitlistTab: React.FC<WaitlistTabProps> = ({ waitlist, approvingId, onApprove, onReject }) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingCount = waitlist.filter(w => w.status === 'pending').length;

  const handleConfirmReject = async (id: string) => {
    if (!rejectReason) return;
    const ok = await onReject(id, rejectReason);
    if (ok) {
      setRejectingId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="admin__section">
      <div className="admin__list">
        <div className="admin__list-title">
          Beta Waitlist — {waitlist.length} total · {pendingCount} pending
        </div>
        {waitlist.length === 0 ? (
          <div className="admin__empty">No waitlist entries yet.</div>
        ) : (
          waitlist.map(entry => (
            <div
              key={entry.id}
              className={"admin__item admin__item--submission" + (entry.status === 'pending' ? ' admin__item--pending' : '')}
            >
              <div className="admin__item-info">
                <div className="admin__item-title">{entry.email}</div>
                <div className="admin__item-meta">
                  {new Date(entry.applied_at).toLocaleDateString()}
                  {' · Status: '}
                  <span className={`admin__status--${entry.status}`}>{entry.status}</span>
                  {entry.rejection_reason && (
                    <span className="admin__text--dim"> · {entry.rejection_reason}</span>
                  )}
                </div>
                {entry.reason && <div className="admin__item-desc">"{entry.reason}"</div>}

                {entry.status === 'pending' && rejectingId !== entry.id && (
                  <div className="admin__action-btns admin__action-btns--top">
                    <button
                      className="admin__approve-btn"
                      onClick={() => onApprove(entry)}
                      disabled={approvingId === entry.id}
                    >
                      {approvingId === entry.id ? 'Sending...' : '✉ Send Invite'}
                    </button>
                    <button className="admin__reject-btn" onClick={() => { setRejectingId(entry.id); setRejectReason(''); }}>
                      ✗ Reject
                    </button>
                  </div>
                )}

                {entry.status === 'pending' && rejectingId === entry.id && (
                  <div className="admin__review-actions">
                    <select className="admin__select" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                      <option value="">Select reason...</option>
                      {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="admin__action-btns">
                      <button className="admin__reject-btn" onClick={() => handleConfirmReject(entry.id)} disabled={!rejectReason}>
                        Confirm Reject
                      </button>
                      <button className="admin__cancel-btn" onClick={() => setRejectingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WaitlistTab;
