import React, { useState, useEffect, useCallback } from 'react';
import './Admin.css';
import { SteamUser } from './SteamCallback';
import { supabase, getUserBySteamId } from '../../services/supabase';
import { adminReviewSubmission, reviewJudgeApplication, appointJudgeBySteamId, banUser, unbanUser, removeJudge } from '../../services/submissionService';
import { sendInvite, rejectWaitlistEntry } from '../../services/supabase';
import { CHALLENGE_TIERS } from '../../constants/ranks';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../ui/Toast';
import type { Game, Challenge, Submission, JudgeApplication, WaitlistEntry, DBUser } from '../../types';

interface AdminProps { user: SteamUser | null; }

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'challenges' | 'games' | 'judges' | 'waitlist' | 'users'>('submissions');
  const [judgeApps, setJudgeApps] = useState<JudgeApplication[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', tier: 'Platinum', game_id: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [manualSteamId, setManualSteamId] = useState('');
  const [users, setUsers] = useState<DBUser[]>([]);
  const [judges, setJudges] = useState<DBUser[]>([]);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<'week' | 'month' | 'year' | 'permanent'>('week');
  const { toast, showToast } = useToast();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const dbUser = await getUserBySteamId(user.steamId);
    if (!dbUser?.is_admin) { setIsAdmin(false); setLoading(false); return; }
    setIsAdmin(true);

    const { data: gamesData } = await supabase.from('games').select('*').order('title');
    setGames((gamesData as Game[]) || []);

    const { data: challengesData } = await supabase
      .from('challenges').select('*, game:games(id, title)').order('created_at', { ascending: false });
    setChallenges((challengesData as Challenge[]) || []);

    const { data: subsData } = await supabase
      .from('submissions')
      .select('*, user:users(username, steam_id), challenge:challenges(title, tier)')
      .order('submitted_at', { ascending: false });
    setSubmissions((subsData as Submission[]) || []);

    const { data: judgeAppsData } = await supabase
      .from('judge_applications')
      .select('*, user:users(username, steam_id), game:games(title)')
      .order('applied_at', { ascending: false });
    setJudgeApps((judgeAppsData as JudgeApplication[]) || []);

    const { data: waitlistData } = await supabase
      .rpc('get_waitlist_admin', { p_steam_id: user?.steamId ?? '' });
    setWaitlist((waitlistData as WaitlistEntry[]) || []);

    const { data: usersData } = await supabase
      .from('users')
      .select('id, username, steam_id, is_admin, is_judge, is_test, is_banned, ban_reason, banned_until, created_at')
      .order('created_at', { ascending: false });
    setUsers((usersData as DBUser[]) || []);

    const { data: judgesData } = await supabase
      .from('users')
      .select('id, username, steam_id, is_admin, is_judge, is_test, is_banned, ban_reason, banned_until, created_at')
      .eq('is_judge', true)
      .order('username');
    setJudges((judgesData as DBUser[]) || []);

    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddChallenge = async () => {
    if (!newChallenge.title || !newChallenge.description || !newChallenge.game_id) {
      setMessage('Please fill all fields'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('challenges').insert({
      title: newChallenge.title,
      description: newChallenge.description,
      tier: newChallenge.tier,
      game_id: parseInt(newChallenge.game_id),
      created_by: null,
      attempts: 0,
      type: 'community',
    });
    if (error) { setMessage(`Error: ${error.message}`); }
    else {
      setMessage('Challenge added!');
      setNewChallenge({ title: '', description: '', tier: 'Platinum', game_id: '' });
      await loadData();
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmissionAction = async (submissionId: string, action: 'approved' | 'rejected') => {
    const result = await adminReviewSubmission(submissionId, action, adminNote[submissionId] ?? '');
    if (!result.success) {
      showToast(`Error: ${result.error}`, 'error');
      return;
    }
    setSubmissions(prev =>
      prev.map(s => s.id === submissionId
        ? { ...s, status: action, admin_note: adminNote[submissionId] ?? '' }
        : s
      )
    );
  };

  const handleJudgeAppReview = async (appId: string, userId: string, action: 'approved' | 'rejected') => {
    const result = await reviewJudgeApplication(appId, userId, action);
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
    setJudgeApps(prev => prev.map(a => a.id === appId ? { ...a, status: action } : a));
  };

  const handleAppointJudge = async () => {
    if (!manualSteamId.trim()) return;
    const result = await appointJudgeBySteamId(manualSteamId.trim());
    if (result.success) {
      showToast(`${result.username} is now a Judge!`, 'success');
      setManualSteamId('');
      await loadData();
    } else {
      showToast(result.error ?? 'Unknown error', 'error');
    }
  };

  const handleRemoveJudge = async (userId: string, username: string) => {
    if (!window.confirm(`Remove judge status from ${username}?`)) return;
    const result = await removeJudge(userId);
    if (result.success) {
      showToast(`${username} is no longer a Judge`, 'success');
      setJudges(prev => prev.filter(j => j.id !== userId));
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_judge: false } : u));
    } else {
      showToast(result.error ?? 'Failed to remove judge', 'error');
    }
  };

  const handleDeleteChallenge = async (id: number) => {
    if (!window.confirm('Delete this challenge?')) return;
    await supabase.from('challenges').delete().eq('id', id);
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  const handleApproveWaitlist = async (entry: WaitlistEntry) => {
    setApprovingId(entry.id);
    const result = await sendInvite(entry.id, entry.email);
    setApprovingId(null);
    if (result.success) {
      showToast(`Invite sent to ${entry.email}`, 'success');
      setWaitlist(prev => prev.map(w => w.id === entry.id ? { ...w, status: 'approved' } : w));
    } else {
      showToast(result.error ?? 'Failed to send invite', 'error');
    }
  };

  const handleRejectWaitlist = async (id: string) => {
    if (!rejectReason) return;
    const ok = await rejectWaitlistEntry(id, rejectReason);
    if (ok) {
      setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected', rejection_reason: rejectReason } : w));
      setRejectingId(null);
      setRejectReason('');
    } else {
      showToast('Failed to reject entry', 'error');
    }
  };

  const getBanExpiry = (): string | null => {
    const now = new Date();
    if (banDuration === 'permanent') return null;
    if (banDuration === 'week') now.setDate(now.getDate() + 7);
    if (banDuration === 'month') now.setMonth(now.getMonth() + 1);
    if (banDuration === 'year') now.setFullYear(now.getFullYear() + 1);
    return now.toISOString();
  };

  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) { showToast('Reason is required', 'error'); return; }
    const result = await banUser(userId, banReason.trim(), getBanExpiry());
    if (result.success) {
      showToast('User banned', 'success');
      setBanningUserId(null);
      setBanReason('');
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, is_banned: true, ban_reason: banReason.trim(), banned_until: getBanExpiry() }
        : u
      ));
    } else {
      showToast(result.error ?? 'Failed to ban user', 'error');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const result = await unbanUser(userId);
    if (result.success) {
      showToast('User unbanned', 'success');
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, is_banned: false, ban_reason: null, banned_until: null }
        : u
      ));
    } else {
      showToast(result.error ?? 'Failed to unban user', 'error');
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const pendingJudgeApps = judgeApps.filter(j => j.status === 'pending').length;
  const pendingWaitlist = waitlist.filter(w => w.status === 'pending').length;

  if (loading) return <div className="admin__loading">Loading...</div>;
  if (!isAdmin) return <div className="admin__denied">Access denied.</div>;

  return (
    <div className="admin">
      <Toast toast={toast} />

      <div className="admin__header">
        <div className="admin__title">Admin Panel</div>
        <div className="admin__subtitle">Pantheon Management · Voland</div>
      </div>

      <div className="admin__tabs">
        <button className={"admin__tab" + (activeTab === 'submissions' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('submissions')}>
          Submissions {pendingSubmissions > 0 && <span className="admin__badge">{pendingSubmissions}</span>}
        </button>
        <button className={"admin__tab" + (activeTab === 'challenges' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('challenges')}>
          Challenges ({challenges.length})
        </button>
        <button className={"admin__tab" + (activeTab === 'games' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('games')}>
          Games ({games.length})
        </button>
        <button className={"admin__tab" + (activeTab === 'judges' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('judges')}>
          Judges {pendingJudgeApps > 0 && <span className="admin__badge">{pendingJudgeApps}</span>}
        </button>
        <button className={"admin__tab" + (activeTab === 'waitlist' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('waitlist')}>
          Waitlist {pendingWaitlist > 0 && <span className="admin__badge">{pendingWaitlist}</span>}
        </button>
        <button className={"admin__tab" + (activeTab === 'users' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('users')}>
          Users ({users.length})
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div className="admin__section">
          <div className="admin__list">
            <div className="admin__list-title">
              All Submissions — {submissions.length} total · {pendingSubmissions} pending
            </div>
            {submissions.length === 0 ? (
              <div className="admin__empty">No submissions yet.</div>
            ) : (
              submissions.map(s => (
                <div key={s.id} className={"admin__item admin__item--submission" + (s.status === 'pending' ? ' admin__item--pending' : '')}>
                  <div className="admin__item-info">
                    <div className="admin__item-title">
                      {s.user?.username || 'Unknown'} — {s.challenge?.title || 'Unknown challenge'}
                    </div>
                    <div className="admin__item-meta">
                      {s.challenge?.tier} · {new Date(s.submitted_at).toLocaleDateString()}
                      · Status: <span style={{ color: s.status === 'approved' ? '#6ab87a' : s.status === 'rejected' ? '#e45a3a' : '#e8a830' }}>{s.status}</span>
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
                          onChange={e => setAdminNote({ ...adminNote, [s.id]: e.target.value })}
                        />
                        <div className="admin__action-btns">
                          <button className="admin__approve-btn" onClick={() => handleSubmissionAction(s.id, 'approved')}>
                            ✓ Approve
                          </button>
                          <button className="admin__reject-btn" onClick={() => handleSubmissionAction(s.id, 'rejected')}>
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
      )}

      {activeTab === 'challenges' && (
        <div className="admin__section">
          <div className="admin__form">
            <div className="admin__form-title">Add New Challenge</div>
            <div className="admin__field">
              <label className="admin__label">Game</label>
              <select className="admin__select" value={newChallenge.game_id} onChange={e => setNewChallenge({ ...newChallenge, game_id: e.target.value })}>
                <option value="">Select game...</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
            <div className="admin__field">
              <label className="admin__label">Tier</label>
              <select className="admin__select" value={newChallenge.tier} onChange={e => setNewChallenge({ ...newChallenge, tier: e.target.value })}>
                {CHALLENGE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin__field">
              <label className="admin__label">Title</label>
              <input className="admin__input" placeholder="Challenge name" value={newChallenge.title} onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })} />
            </div>
            <div className="admin__field">
              <label className="admin__label">Description</label>
              <textarea className="admin__textarea" placeholder="Challenge conditions..." value={newChallenge.description} onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })} rows={3} />
            </div>
            {message && <div className={"admin__message" + (message.includes('Error') ? ' admin__message--error' : ' admin__message--success')}>{message}</div>}
            <button className="admin__btn" onClick={handleAddChallenge} disabled={saving}>{saving ? 'Saving...' : 'Add Challenge'}</button>
          </div>

          <div className="admin__list">
            <div className="admin__list-title">All Challenges</div>
            {challenges.map(c => (
              <div key={c.id} className="admin__item">
                <div className="admin__item-info">
                  <div className="admin__item-title">{c.title}</div>
                  <div className="admin__item-meta">{c.game?.title} · {c.tier}</div>
                  <div className="admin__item-desc">{c.description}</div>
                </div>
                <button className="admin__delete-btn" onClick={() => handleDeleteChallenge(c.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="admin__section">
          <div className="admin__list">
            <div className="admin__list-title">All Games</div>
            {games.map(g => (
              <div key={g.id} className="admin__item">
                <div className="admin__item-info">
                  <div className="admin__item-title">{g.title}</div>
                  <div className="admin__item-meta">Steam App ID: {g.steam_app_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'waitlist' && (
        <div className="admin__section">
          <div className="admin__list">
            <div className="admin__list-title">
              Beta Waitlist — {waitlist.length} total · {pendingWaitlist} pending
            </div>
            {waitlist.length === 0 ? (
              <div className="admin__empty">No waitlist entries yet.</div>
            ) : (
              waitlist.map(entry => (
                <div key={entry.id} className={"admin__item admin__item--submission" + (entry.status === 'pending' ? ' admin__item--pending' : '')}>
                  <div className="admin__item-info">
                    <div className="admin__item-title">{entry.email}</div>
                    <div className="admin__item-meta">
                      {new Date(entry.applied_at).toLocaleDateString()}
                      · Status: <span style={{ color: entry.status === 'approved' ? '#6ab87a' : entry.status === 'rejected' ? '#e45a3a' : '#e8a830' }}>{entry.status}</span>
                      {entry.rejection_reason && <span style={{ color: '#9a9080' }}> · {entry.rejection_reason}</span>}
                    </div>
                    {entry.reason && (
                      <div className="admin__item-desc">"{entry.reason}"</div>
                    )}
                    {entry.status === 'pending' && rejectingId !== entry.id && (
                      <div className="admin__action-btns" style={{ marginTop: '0.8rem' }}>
                        <button
                          className="admin__approve-btn"
                          onClick={() => handleApproveWaitlist(entry)}
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
                        <select
                          className="admin__select"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                        >
                          <option value="">Select reason...</option>
                          <option value="You don't fit our current tester profile">You don't fit our current tester profile</option>
                          <option value="Too little information provided">Too little information provided</option>
                          <option value="The beta is currently full — we'll keep your application on file">The beta is currently full — we'll keep your application on file</option>
                        </select>
                        <div className="admin__action-btns">
                          <button className="admin__reject-btn" onClick={() => handleRejectWaitlist(entry.id)} disabled={!rejectReason}>
                            Confirm Reject
                          </button>
                          <button className="admin__note-input" style={{ cursor: 'pointer', background: 'none', border: '1px solid #5a5048', color: '#9a9080', padding: '0.4rem 0.8rem' }} onClick={() => setRejectingId(null)}>
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
      )}

      {activeTab === 'users' && (
        <div className="admin__section">
          <div className="admin__list">
            <div className="admin__list-title">
              All Users — {users.length} total · {users.filter(u => u.is_banned).length} banned
            </div>
            {users.length === 0 ? (
              <div className="admin__empty">No users yet.</div>
            ) : (
              users.map(u => {
                const isBanActive = u.is_banned && (u.banned_until === null || new Date(u.banned_until) > new Date());
                return (
                  <div key={u.id} className={"admin__item" + (isBanActive ? ' admin__item--pending' : '')}>
                    <div className="admin__item-info">
                      <div className="admin__item-title">
                        {u.username}
                        {u.is_admin && <span style={{ color: '#c9922a', marginLeft: '0.5rem' }}>[Admin]</span>}
                        {u.is_judge && <span style={{ color: '#6ab87a', marginLeft: '0.5rem' }}>[Judge]</span>}
                        {isBanActive && <span style={{ color: '#e45a3a', marginLeft: '0.5rem' }}>[Banned]</span>}
                      </div>
                      <div className="admin__item-meta">
                        Steam: {u.steam_id} · Joined: {new Date(u.created_at).toLocaleDateString()}
                      </div>
                      {isBanActive && (
                        <div className="admin__item-desc" style={{ color: '#e45a3a' }}>
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
                            onChange={e => setBanDuration(e.target.value as 'week' | 'month' | 'year' | 'permanent')}
                          >
                            <option value="week">1 Week</option>
                            <option value="month">1 Month</option>
                            <option value="year">1 Year</option>
                            <option value="permanent">Permanent</option>
                          </select>
                          <div className="admin__action-btns">
                            <button className="admin__reject-btn" onClick={() => handleBanUser(u.id)}>
                              ⛔ Confirm Ban
                            </button>
                            <button
                              style={{ cursor: 'pointer', background: 'none', border: '1px solid #5a5048', color: '#9a9080', padding: '0.4rem 0.8rem' }}
                              onClick={() => { setBanningUserId(null); setBanReason(''); }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {isBanActive ? (
                      <button className="admin__approve-btn" onClick={() => handleUnbanUser(u.id)}>
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
      )}

      {activeTab === 'judges' && (
        <div className="admin__section">
          <div className="admin__list">
            <div className="admin__list-title">Judge Applications — {judgeApps.length} total</div>
            {judgeApps.length === 0 ? (
              <div className="admin__empty">No judge applications yet.</div>
            ) : (
              judgeApps.map(app => (
                <div key={app.id} className={"admin__item admin__item--submission" + (app.status === 'pending' ? ' admin__item--pending' : '')}>
                  <div className="admin__item-info">
                    <div className="admin__item-title">
                      {app.user?.username || 'Unknown'} — {app.game?.title || 'Unknown game'}
                    </div>
                    <div className="admin__item-meta">
                      Applied: {new Date(app.applied_at).toLocaleDateString()}
                      · Status: <span style={{ color: app.status === 'approved' ? '#6ab87a' : app.status === 'rejected' ? '#e45a3a' : '#e8a830' }}>{app.status}</span>
                    </div>
                    {app.motivation && <div className="admin__item-desc">"{app.motivation}"</div>}
                    {app.status === 'pending' && (
                      <div className="admin__action-btns" style={{ marginTop: '0.8rem' }}>
                        <button className="admin__approve-btn" onClick={() => handleJudgeAppReview(app.id, app.user_id, 'approved')}>
                          ✓ Approve
                        </button>
                        <button className="admin__reject-btn" onClick={() => handleJudgeAppReview(app.id, app.user_id, 'rejected')}>
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="admin__list" style={{ marginTop: '2rem' }}>
            <div className="admin__list-title">Current Judges — {judges.length}</div>
            <div className="admin__form" style={{ padding: '1rem' }}>
              <div className="admin__form-title">Appoint Judge Manually</div>
              <div className="admin__field">
                <label className="admin__label">Steam ID</label>
                <input
                  className="admin__input"
                  placeholder="Steam ID of the player..."
                  value={manualSteamId}
                  onChange={e => setManualSteamId(e.target.value)}
                />
              </div>
              <button className="admin__btn" onClick={handleAppointJudge}>
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
                  <button
                    className="admin__reject-btn"
                    onClick={() => handleRemoveJudge(j.id, j.username)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
