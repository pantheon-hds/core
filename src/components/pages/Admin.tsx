import React, { useState, useEffect, useCallback } from 'react';
import './Admin.css';
import { SteamUser } from './SteamCallback';
import { supabase, getUserBySteamId } from '../../services/supabase';

interface AdminProps { user: SteamUser | null; }

interface Game { id: number; title: string; steam_app_id: string; }
interface Challenge { id: string; title: string; description: string; tier: string; game_id: number; game?: any; }
interface Submission {
  id: string;
  video_url: string;
  comment: string;
  status: string;
  submitted_at: string;
  admin_note: string;
  user: any;
  challenge: any;
}

const TIERS = ['Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend'];

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'submissions' | 'challenges' | 'games'>('submissions');
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', tier: 'Platinum', game_id: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const dbUser = await getUserBySteamId(user.steamId);
    if (!dbUser?.is_admin) { setIsAdmin(false); setLoading(false); return; }
    setIsAdmin(true);

    const { data: gamesData } = await supabase.from('games').select('*').order('title');
    setGames(gamesData || []);

    const { data: challengesData } = await supabase
      .from('challenges').select('*, game:games(title)').order('created_at', { ascending: false });
    setChallenges(challengesData || []);

    const { data: subsData } = await supabase
      .from('submissions')
      .select('*, user:users(username, steam_id), challenge:challenges(title, tier)')
      .order('submitted_at', { ascending: false });
    setSubmissions(subsData || []);

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

  const handleDeleteChallenge = async (id: string) => {
    if (!window.confirm('Delete this challenge?')) return;
    await supabase.from('challenges').delete().eq('id', id);
    await loadData();
  };

  const handleSubmissionAction = async (submissionId: string, action: 'approved' | 'rejected') => {
    const note = adminNote[submissionId] || '';
    await supabase.from('submissions')
      .update({ status: action, admin_note: note })
      .eq('id', submissionId);

    if (action === 'approved') {
      const sub = submissions.find(s => s.id === submissionId);
      if (sub) {
        const { data: dbUser } = await supabase
          .from('users').select('id').eq('steam_id', sub.user?.steam_id).single();
        const { data: challenge } = await supabase
          .from('challenges').select('*').eq('id', sub.challenge?.id || '').single();

        if (dbUser && challenge) {
          const { data: game } = await supabase
            .from('games').select('id').eq('id', challenge.game_id).single();
         if (game) {
  await supabase.from('ranks').upsert({
    user_id: dbUser.id,
    game_id: game.id,
    tier: challenge.tier,
    method: 'community_verified',
  }, { onConflict: 'user_id,game_id' });

  await supabase.from('statues').upsert({
    user_id: dbUser.id,
    game_id: game.id,
    tier: challenge.tier,
    challenge: challenge.title,
    is_unique: challenge.tier === 'Legend',
  }, { onConflict: 'user_id,game_id' });
}
        }
      }
    }
    await loadData();
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  if (loading) return <div className="admin__loading">Loading...</div>;
  if (!isAdmin) return <div className="admin__denied">Access denied.</div>;

  return (
    <div className="admin">
      <div className="admin__header">
        <div className="admin__title">Admin Panel</div>
        <div className="admin__subtitle">Pantheon Management · Voland</div>
      </div>

      <div className="admin__tabs">
        <button className={"admin__tab" + (activeTab === 'submissions' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('submissions')}>
          Submissions {pendingCount > 0 && <span className="admin__badge">{pendingCount}</span>}
        </button>
        <button className={"admin__tab" + (activeTab === 'challenges' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('challenges')}>
          Challenges ({challenges.length})
        </button>
        <button className={"admin__tab" + (activeTab === 'games' ? ' admin__tab--active' : '')} onClick={() => setActiveTab('games')}>
          Games ({games.length})
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div className="admin__section">
          <div className="admin__list">
            <div className="admin__list-title">
              All Submissions — {submissions.length} total · {pendingCount} pending
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
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
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
    </div>
  );
};

export default Admin;
