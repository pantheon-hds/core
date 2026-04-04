import React, { useState } from 'react';
import type { DBUser } from '../../types';

type BanDuration = 'week' | 'month' | 'year' | 'permanent';

interface UsersTabProps {
  users: DBUser[];
  onBan: (userId: string, reason: string, expiry: string | null) => Promise<boolean>;
  onUnban: (userId: string) => Promise<boolean>;
}

function getBanExpiry(duration: BanDuration): string | null {
  if (duration === 'permanent') return null;
  const now = new Date();
  if (duration === 'week')       now.setDate(now.getDate() + 7);
  else if (duration === 'month') now.setMonth(now.getMonth() + 1);
  else if (duration === 'year')  now.setFullYear(now.getFullYear() + 1);
  return now.toISOString();
}

function isBanActive(user: DBUser): boolean {
  if (!user.is_banned) return false;
  if (!user.banned_until) return true;
  return new Date(user.banned_until) > new Date();
}

const UsersTab: React.FC<UsersTabProps> = ({ users, onBan, onUnban }) => {
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<BanDuration>('week');

  const bannedCount = users.filter(isBanActive).length;

  const handleConfirmBan = async (userId: string) => {
    if (!banReason.trim()) return;
    const ok = await onBan(userId, banReason.trim(), getBanExpiry(banDuration));
    if (ok) {
      setBanningUserId(null);
      setBanReason('');
      setBanDuration('week');
    }
  };

  return (
    <div className="admin__section">
      <div className="admin__list">
        <div className="admin__list-title">
          All Users — {users.length} total · {bannedCount} banned
        </div>
        {users.length === 0 ? (
          <div className="admin__empty">No users yet.</div>
        ) : (
          users.map(u => {
            const active = isBanActive(u);
            return (
              <div key={u.id} className={"admin__item" + (active ? ' admin__item--pending' : '')}>
                <div className="admin__item-info">
                  <div className="admin__item-title">
                    {u.username}
                    {u.is_admin  && <span className="admin__role-tag admin__role-tag--admin">[Admin]</span>}
                    {u.is_judge  && <span className="admin__role-tag admin__role-tag--judge">[Judge]</span>}
                    {active      && <span className="admin__role-tag admin__role-tag--banned">[Banned]</span>}
                  </div>
                  <div className="admin__item-meta">
                    Steam: {u.steam_id} · Joined: {new Date(u.created_at).toLocaleDateString()}
                  </div>
                  {active && (
                    <div className="admin__item-desc admin__item-desc--error">
                      Reason: {u.ban_reason || '—'} · Until: {u.banned_until ? new Date(u.banned_until).toLocaleDateString() : 'Permanent'}
                    </div>
                  )}
                  {banningUserId === u.id && (
                    <div className="admin__review-actions">
                      <input
                        className="admin__note-input"
                        placeholder="Ban reason (required)..."
                        value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                      />
                      <select
                        className="admin__select"
                        value={banDuration}
                        onChange={e => setBanDuration(e.target.value as BanDuration)}
                      >
                        <option value="week">1 Week</option>
                        <option value="month">1 Month</option>
                        <option value="year">1 Year</option>
                        <option value="permanent">Permanent</option>
                      </select>
                      <div className="admin__action-btns">
                        <button className="admin__reject-btn" onClick={() => handleConfirmBan(u.id)}>
                          ⛔ Confirm Ban
                        </button>
                        <button className="admin__cancel-btn" onClick={() => { setBanningUserId(null); setBanReason(''); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {active ? (
                  <button className="admin__approve-btn" onClick={() => onUnban(u.id)}>
                    ✓ Unban
                  </button>
                ) : (
                  !u.is_admin && banningUserId !== u.id && (
                    <button className="admin__reject-btn" onClick={() => { setBanningUserId(u.id); setBanReason(''); }}>
                      Ban
                    </button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UsersTab;
