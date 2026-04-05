import React, { useState, useEffect, useCallback } from 'react';
import './Admin.css';
import { SteamUser } from './SteamCallback';
import { supabase, getUserBySteamId, sendInvite, rejectWaitlistEntry } from '../../services/supabase';
import * as adminService from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../ui/Toast';
import type { Game, Challenge, Submission, JudgeApplication, WaitlistEntry, DBUser } from '../../types';
import SubmissionsTab from '../admin/SubmissionsTab';
import ChallengesTab from '../admin/ChallengesTab';
import GamesTab from '../admin/GamesTab';
import WaitlistTab from '../admin/WaitlistTab';
import UsersTab from '../admin/UsersTab';
import JudgesTab from '../admin/JudgesTab';

type TabId = 'submissions' | 'challenges' | 'games' | 'judges' | 'waitlist' | 'users';

interface AdminProps { user: SteamUser | null; }

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('submissions');
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [judgeApps, setJudgeApps] = useState<JudgeApplication[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [judges, setJudges] = useState<DBUser[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const dbUser = await getUserBySteamId(user.steamId);
    if (!dbUser?.is_admin) { setIsAdmin(false); setLoading(false); return; }
    setIsAdmin(true);

    const [gamesRes, challengesRes, subsRes, judgeAppsRes, waitlistRes, usersRes] = await Promise.all([
      supabase.from('games').select('*').order('title'),
      supabase.from('challenges').select('*, game:games(id, title)').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*, user:users(username, steam_id), challenge:challenges(title, tier)').order('submitted_at', { ascending: false }),
      supabase.from('judge_applications').select('*, user:users(username, steam_id), game:games(title)').order('applied_at', { ascending: false }),
      supabase.rpc('get_waitlist_admin', { p_steam_id: user.steamId }),
      supabase.from('users').select('id, username, steam_id, is_admin, is_judge, is_test, is_banned, ban_reason, banned_until, created_at').order('created_at', { ascending: false }),
    ]);

    setGames((gamesRes.data as Game[]) || []);
    setChallenges((challengesRes.data as Challenge[]) || []);
    setSubmissions((subsRes.data as Submission[]) || []);
    setJudgeApps((judgeAppsRes.data as JudgeApplication[]) || []);
    setWaitlist((waitlistRes.data as WaitlistEntry[]) || []);
    const allUsers = (usersRes.data as DBUser[]) || [];
    setUsers(allUsers);
    setJudges(allUsers.filter(u => u.is_judge).sort((a, b) => a.username.localeCompare(b.username)));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Submissions ──────────────────────────────────────────────────────────
  const handleSubmissionAction = async (id: string, action: 'approved' | 'rejected', note: string) => {
    const result = await adminService.reviewSubmission(user!.token, id, action, note);
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action, admin_note: note } : s));
  };

  // ── Challenges ───────────────────────────────────────────────────────────
  const handleAddChallenge = async (data: { title: string; description: string; tier: string; game_id: string }): Promise<boolean> => {
    const result = await adminService.addChallenge(user!.token, {
      title: data.title,
      description: data.description,
      tier: data.tier,
      gameId: parseInt(data.game_id),
    });
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return false; }
    showToast('Challenge added!', 'success');
    await loadData();
    return true;
  };

  const handleEditChallenge = async (id: number, data: { title: string; description: string; tier: string; game_id: string }): Promise<boolean> => {
    const result = await adminService.editChallenge(user!.token, id, {
      title: data.title,
      description: data.description,
      tier: data.tier,
      gameId: parseInt(data.game_id),
    });
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return false; }
    showToast('Challenge updated!', 'success');
    await loadData();
    return true;
  };

  const handleDeleteChallenge = async (id: number) => {
    if (!window.confirm('Delete this challenge?')) return;
    const result = await adminService.deleteChallenge(user!.token, id);
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  // ── Games ────────────────────────────────────────────────────────────────
  const handleAddGame = async (data: { title: string; steam_app_id: string }): Promise<boolean> => {
    const result = await adminService.addGame(user!.token, {
      title: data.title,
      steamAppId: data.steam_app_id,
    });
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return false; }
    showToast('Game added!', 'success');
    await loadData();
    return true;
  };

  // ── Waitlist ─────────────────────────────────────────────────────────────
  const handleApproveWaitlist = async (entry: WaitlistEntry) => {
    setApprovingId(entry.id);
    const result = await sendInvite(user!.token, entry.id, entry.email);
    setApprovingId(null);
    if (result.success) {
      showToast(`Invite sent to ${entry.email}`, 'success');
      setWaitlist(prev => prev.map(w => w.id === entry.id ? { ...w, status: 'approved' } : w));
    } else {
      showToast(result.error ?? 'Failed to send invite', 'error');
    }
  };

  const handleRejectWaitlist = async (id: string, reason: string): Promise<boolean> => {
    const ok = await rejectWaitlistEntry(user!.token, id, reason);
    if (ok) {
      setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected', rejection_reason: reason } : w));
    } else {
      showToast('Failed to reject entry', 'error');
    }
    return ok;
  };

  // ── Users / Bans ─────────────────────────────────────────────────────────
  const handleBanUser = async (userId: string, reason: string, expiry: string | null): Promise<boolean> => {
    const result = await adminService.banUser(user!.token, userId, reason, expiry);
    if (result.success) {
      showToast('User banned', 'success');
      const update = { is_banned: true, ban_reason: reason, banned_until: expiry };
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...update } : u));
      setJudges(prev => prev.map(j => j.id === userId ? { ...j, ...update } : j));
    } else {
      showToast(result.error ?? 'Failed to ban user', 'error');
    }
    return result.success;
  };

  const handleUnbanUser = async (userId: string): Promise<boolean> => {
    const result = await adminService.unbanUser(user!.token, userId);
    if (result.success) {
      showToast('User unbanned', 'success');
      const update = { is_banned: false, ban_reason: null, banned_until: null };
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...update } : u));
      setJudges(prev => prev.map(j => j.id === userId ? { ...j, ...update } : j));
    } else {
      showToast(result.error ?? 'Failed to unban user', 'error');
    }
    return result.success;
  };

  // ── Judges ───────────────────────────────────────────────────────────────
  const handleJudgeAppReview = async (appId: string, userId: string, action: 'approved' | 'rejected') => {
    const result = await adminService.reviewJudgeApp(user!.token, appId, userId, action);
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
    setJudgeApps(prev => prev.map(a => a.id === appId ? { ...a, status: action } : a));
    if (action === 'approved') await loadData();
  };

  const handleAppointJudge = async (targetSteamId: string) => {
    const result = await adminService.appointJudge(user!.token, targetSteamId);
    if (result.success) {
      showToast(`${result.username} is now a Judge!`, 'success');
      await loadData();
    } else {
      showToast(result.error ?? 'Unknown error', 'error');
    }
  };

  const handleRemoveJudge = async (userId: string, username: string) => {
    if (!window.confirm(`Remove judge status from ${username}?`)) return;
    const result = await adminService.removeJudge(user!.token, userId);
    if (result.success) {
      showToast(`${username} is no longer a Judge`, 'success');
      setJudges(prev => prev.filter(j => j.id !== userId));
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_judge: false } : u));
    } else {
      showToast(result.error ?? 'Failed to remove judge', 'error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const pendingJudgeApps = judgeApps.filter(j => j.status === 'pending').length;
  const pendingWaitlist = waitlist.filter(w => w.status === 'pending').length;

  if (loading) return <div className="admin__loading">Loading...</div>;
  if (!isAdmin) return <div className="admin__denied">Access denied.</div>;

  const tabs: { id: TabId; label: React.ReactNode }[] = [
    { id: 'submissions', label: <>Submissions {pendingSubmissions > 0 && <span className="admin__badge">{pendingSubmissions}</span>}</> },
    { id: 'challenges',  label: `Challenges (${challenges.length})` },
    { id: 'games',       label: `Games (${games.length})` },
    { id: 'judges',      label: <>Judges {pendingJudgeApps > 0 && <span className="admin__badge">{pendingJudgeApps}</span>}</> },
    { id: 'waitlist',    label: <>Waitlist {pendingWaitlist > 0 && <span className="admin__badge">{pendingWaitlist}</span>}</> },
    { id: 'users',       label: `Users (${users.length})` },
  ];

  return (
    <div className="admin">
      <Toast toast={toast} />

      <div className="admin__header">
        <div className="admin__title">Admin Panel</div>
        <div className="admin__subtitle">Pantheon Management · Voland</div>
      </div>

      <div className="admin__tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={"admin__tab" + (activeTab === t.id ? ' admin__tab--active' : '')}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'submissions' && (
        <SubmissionsTab submissions={submissions} onAction={handleSubmissionAction} />
      )}
      {activeTab === 'challenges' && (
        <ChallengesTab challenges={challenges} games={games} onAdd={handleAddChallenge} onEdit={handleEditChallenge} onDelete={handleDeleteChallenge} />
      )}
      {activeTab === 'games' && (
        <GamesTab games={games} onAdd={handleAddGame} />
      )}
      {activeTab === 'waitlist' && (
        <WaitlistTab waitlist={waitlist} approvingId={approvingId} onApprove={handleApproveWaitlist} onReject={handleRejectWaitlist} />
      )}
      {activeTab === 'users' && (
        <UsersTab users={users} onBan={handleBanUser} onUnban={handleUnbanUser} />
      )}
      {activeTab === 'judges' && (
        <JudgesTab judgeApps={judgeApps} judges={judges} onAppReview={handleJudgeAppReview} onAppoint={handleAppointJudge} onRemove={handleRemoveJudge} />
      )}
    </div>
  );
};

export default Admin;
