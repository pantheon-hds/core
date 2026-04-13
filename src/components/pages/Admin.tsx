import React, { useState, useCallback, useMemo } from 'react';
import './Admin.css';
import { SteamUser } from './SteamCallback';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserByToken, sendInvite, rejectWaitlistEntry } from '../../services/supabase';
import * as adminService from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../ui/Toast';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { WaitlistEntry } from '../../types';
import SubmissionsTab from '../admin/SubmissionsTab';
import ChallengesTab from '../admin/ChallengesTab';
import GamesTab from '../admin/GamesTab';
import WaitlistTab from '../admin/WaitlistTab';
import UsersTab from '../admin/UsersTab';
import JudgesTab from '../admin/JudgesTab';

type TabId = 'submissions' | 'challenges' | 'games' | 'judges' | 'waitlist' | 'users';

interface AdminProps { user: SteamUser | null; }

const Admin: React.FC<AdminProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('submissions');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const { toast, showToast } = useToast();

  // ── Auth check ───────────────────────────────────────────────────────────────
  const { data: dbUser, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ['admin-auth', user?.steamId],
    queryFn: () => getUserByToken(user!.token),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
  const isAdmin = !!dbUser?.is_admin;

  // ── Per-resource queries (enabled only when admin confirmed) ─────────────────
  const { data: submissions = [] } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: () => adminService.fetchAdminSubmissions(user!.token),
    enabled: isAdmin,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: () => adminService.fetchAdminChallenges(user!.token),
    enabled: isAdmin,
  });

  const { data: games = [] } = useQuery({
    queryKey: ['admin-games'],
    queryFn: () => adminService.fetchAdminGames(user!.token),
    enabled: isAdmin,
  });

  const { data: judgeApps = [] } = useQuery({
    queryKey: ['admin-judge-apps'],
    queryFn: () => adminService.fetchAdminJudgeApps(user!.token),
    enabled: isAdmin,
  });

  const { data: waitlist = [] } = useQuery({
    queryKey: ['admin-waitlist', user?.steamId],
    queryFn: () => adminService.fetchAdminWaitlist(user!.token),
    enabled: isAdmin && !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.fetchAdminUsers(user!.token),
    enabled: isAdmin,
  });

  const judges = useMemo(
    () => allUsers.filter(u => u.is_judge).sort((a, b) => a.username.localeCompare(b.username)),
    [allUsers]
  );

  // ── Submissions ──────────────────────────────────────────────────────────────
  const handleSubmissionAction = async (id: string, action: 'approved' | 'rejected', note: string) => {
    const result = await adminService.reviewSubmission(user!.token, id, action, note);
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
  };

  // ── Challenges ───────────────────────────────────────────────────────────────
  const handleAddChallenge = async (data: { title: string; description: string; condition: string; verification: string; tier: string; game_id: string }): Promise<boolean> => {
    const gameId = parseInt(data.game_id, 10);
    if (isNaN(gameId)) { showToast('Invalid game selection', 'error'); return false; }
    const result = await adminService.addChallenge(user!.token, {
      title: data.title,
      description: data.description,
      condition: data.condition,
      verification: data.verification,
      tier: data.tier,
      gameId,
    });
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return false; }
    showToast('Challenge added!', 'success');
    queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    return true;
  };

  const handleEditChallenge = async (id: number, data: { title: string; description: string; condition: string; verification: string; tier: string; game_id: string }): Promise<boolean> => {
    const gameId = parseInt(data.game_id, 10);
    if (isNaN(gameId)) { showToast('Invalid game selection', 'error'); return false; }
    const result = await adminService.editChallenge(user!.token, id, {
      title: data.title,
      description: data.description,
      condition: data.condition,
      verification: data.verification,
      tier: data.tier,
      gameId,
    });
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return false; }
    showToast('Challenge updated!', 'success');
    queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    return true;
  };

  const handleDeleteChallenge = useCallback((id: number) => {
    setConfirmDialog({
      message: 'Delete this challenge? This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        const result = await adminService.deleteChallenge(user!.token, id);
        if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
        queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      },
    });
  }, [user?.token, showToast, queryClient]);

  // ── Games ────────────────────────────────────────────────────────────────────
  const handleAddGame = async (data: { title: string; steam_app_id: string }): Promise<boolean> => {
    const result = await adminService.addGame(user!.token, {
      title: data.title,
      steamAppId: data.steam_app_id,
    });
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return false; }
    showToast('Game added!', 'success');
    queryClient.invalidateQueries({ queryKey: ['admin-games'] });
    return true;
  };

  // ── Waitlist ─────────────────────────────────────────────────────────────────
  const handleApproveWaitlist = async (entry: WaitlistEntry) => {
    setApprovingId(entry.id);
    const result = await sendInvite(user!.token, entry.id, entry.email);
    setApprovingId(null);
    if (result.success) {
      showToast(`Invite sent to ${entry.email}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist', user?.steamId] });
    } else {
      showToast(result.error ?? 'Failed to send invite', 'error');
    }
  };

  const handleRejectWaitlist = async (id: string, reason: string): Promise<boolean> => {
    const ok = await rejectWaitlistEntry(user!.token, id, reason);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist', user?.steamId] });
    } else {
      showToast('Failed to reject entry', 'error');
    }
    return ok;
  };

  // ── Users / Bans ─────────────────────────────────────────────────────────────
  const handleBanUser = async (userId: string, reason: string, expiry: string | null): Promise<boolean> => {
    const result = await adminService.banUser(user!.token, userId, reason, expiry);
    if (result.success) {
      showToast('User banned', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } else {
      showToast(result.error ?? 'Failed to ban user', 'error');
    }
    return result.success;
  };

  const handleUnbanUser = async (userId: string): Promise<boolean> => {
    const result = await adminService.unbanUser(user!.token, userId);
    if (result.success) {
      showToast('User unbanned', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } else {
      showToast(result.error ?? 'Failed to unban user', 'error');
    }
    return result.success;
  };

  // ── Judges ───────────────────────────────────────────────────────────────────
  const handleJudgeAppReview = async (appId: string, userId: string, action: 'approved' | 'rejected') => {
    const result = await adminService.reviewJudgeApp(user!.token, appId, userId, action);
    if (!result.success) { showToast(`Error: ${result.error}`, 'error'); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-judge-apps'] });
    if (action === 'approved') queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleAppointJudge = async (targetSteamId: string) => {
    const result = await adminService.appointJudge(user!.token, targetSteamId);
    if (result.success) {
      showToast(`${result.username} is now a Judge!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } else {
      showToast(result.error ?? 'Unknown error', 'error');
    }
  };

  const handleRemoveJudge = useCallback((userId: string, username: string) => {
    setConfirmDialog({
      message: `Remove judge status from ${username}?`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        const result = await adminService.removeJudge(user!.token, userId);
        if (result.success) {
          showToast(`${username} is no longer a Judge`, 'success');
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        } else {
          showToast(result.error ?? 'Failed to remove judge', 'error');
        }
      },
    });
  }, [user?.token, showToast, queryClient]);

  // ── Render ────────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="admin__loading">Loading...</div>;
  if (authError) return <div className="admin__denied">Failed to verify access. Check your connection and refresh.</div>;
  if (!isAdmin) return <div className="admin__denied">Access denied.</div>;

  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const pendingJudgeApps = judgeApps.filter(j => j.status === 'pending').length;
  const pendingWaitlist = waitlist.filter(w => w.status === 'pending').length;

  const tabs: { id: TabId; label: React.ReactNode }[] = [
    { id: 'submissions', label: <>Submissions {pendingSubmissions > 0 && <span className="admin__badge">{pendingSubmissions}</span>}</> },
    { id: 'challenges',  label: `Challenges (${challenges.length})` },
    { id: 'games',       label: `Games (${games.length})` },
    { id: 'judges',      label: <>Judges {pendingJudgeApps > 0 && <span className="admin__badge">{pendingJudgeApps}</span>}</> },
    { id: 'waitlist',    label: <>Waitlist {pendingWaitlist > 0 && <span className="admin__badge">{pendingWaitlist}</span>}</> },
    { id: 'users',       label: `Users (${allUsers.length})` },
  ];

  return (
    <div className="admin">
      <Toast toast={toast} />

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          dangerous
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

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
        <UsersTab users={allUsers} onBan={handleBanUser} onUnban={handleUnbanUser} />
      )}
      {activeTab === 'judges' && (
        <JudgesTab judgeApps={judgeApps} judges={judges} onAppReview={handleJudgeAppReview} onAppoint={handleAppointJudge} onRemove={handleRemoveJudge} />
      )}
    </div>
  );
};

export default Admin;
