import React, { useState } from 'react';
import type { JudgeApplication, DBUser } from '../../types';

interface JudgesTabProps {
  judgeApps: JudgeApplication[];
  judges: DBUser[];
  onAppReview: (appId: string, userId: string, action: 'approved' | 'rejected') => void;
  onAppoint: (steamId: string) => void;
  onRemove: (userId: string, username: string) => void;
}

const JudgesTab: React.FC<JudgesTabProps> = ({ judgeApps, judges, onAppReview, onAppoint, onRemove }) => {
  const [manualSteamId, setManualSteamId] = useState('');

  const pendingCount = judgeApps.filter(a => a.status === 'pending').length;

  const handleAppoint = () => {
    if (!manualSteamId.trim()) return;
    onAppoint(manualSteamId.trim());
    setManualSteamId('');
  };

  return (
    <div className="admin__section">
      <div className="admin__list">
        <div className="admin__list-title">Judge Applications — {judgeApps.length} total · {pendingCount} pending</div>
        {judgeApps.length === 0 ? (
          <div className="admin__empty">No judge applications yet.</div>
        ) : (
          judgeApps.map(app => (
            <div
              key={app.id}
              className={"admin__item admin__item--submission" + (app.status === 'pending' ? ' admin__item--pending' : '')}
            >
              <div className="admin__item-info">
                <div className="admin__item-title">
                  {app.user?.username || 'Unknown'} — {app.game?.title || 'Unknown game'}
                </div>
                <div className="admin__item-meta">
                  Applied: {new Date(app.applied_at).toLocaleDateString()}
                  {' · Status: '}
                  <span className={`admin__status--${app.status}`}>{app.status}</span>
                </div>
                {app.motivation && <div className="admin__item-desc">"{app.motivation}"</div>}
                {app.status === 'pending' && (
                  <div className="admin__action-btns admin__action-btns--top">
                    <button className="admin__approve-btn" onClick={() => onAppReview(app.id, app.user_id, 'approved')}>
                      ✓ Approve
                    </button>
                    <button className="admin__reject-btn" onClick={() => onAppReview(app.id, app.user_id, 'rejected')}>
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="admin__list admin__list--spaced">
        <div className="admin__list-title">Current Judges — {judges.length}</div>
        <div className="admin__form admin__form--compact">
          <div className="admin__form-title">Appoint Judge Manually</div>
          <div className="admin__field">
            <label className="admin__label">Steam ID</label>
            <input
              className="admin__input"
              placeholder="Steam ID of the player..."
              value={manualSteamId}
              onChange={e => setManualSteamId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAppoint()}
            />
          </div>
          <button className="admin__btn" onClick={handleAppoint}>
            Appoint as Judge
          </button>
        </div>
        {judges.length === 0 ? (
          <div className="admin__empty">No active judges.</div>
        ) : (
          judges.map(j => (
            <div key={j.id} className="admin__item">
              <div className="admin__item-info">
                <div className="admin__item-title">{j.username}</div>
                <div className="admin__item-meta">Steam: {j.steam_id}</div>
              </div>
              <button className="admin__reject-btn" onClick={() => onRemove(j.id, j.username)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JudgesTab;
