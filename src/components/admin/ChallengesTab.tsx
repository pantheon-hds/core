import React, { useState } from 'react';
import { CHALLENGE_TIERS } from '../../constants/ranks';
import type { Challenge, Game } from '../../types';

interface ChallengesTabProps {
  challenges: Challenge[];
  games: Game[];
  onAdd: (data: { title: string; description: string; tier: string; game_id: string }) => Promise<boolean>;
  onEdit: (id: number, data: { title: string; description: string; tier: string; game_id: string }) => Promise<boolean>;
  onDelete: (id: number) => void;
}

type EditingChallenge = { id: number; title: string; description: string; tier: string; game_id: string };

const ChallengesTab: React.FC<ChallengesTabProps> = ({ challenges, games, onAdd, onEdit, onDelete }) => {
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', tier: 'Platinum', game_id: '' });
  const [editingChallenge, setEditingChallenge] = useState<EditingChallenge | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleAdd = async () => {
    if (!newChallenge.title || !newChallenge.description || !newChallenge.game_id) return;
    setSavingNew(true);
    try {
      const ok = await onAdd(newChallenge);
      if (ok) setNewChallenge({ title: '', description: '', tier: 'Platinum', game_id: '' });
    } finally {
      setSavingNew(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingChallenge) return;
    if (!editingChallenge.title || !editingChallenge.description || !editingChallenge.game_id) return;
    setSavingEdit(true);
    try {
      const ok = await onEdit(editingChallenge.id, editingChallenge);
      if (ok) setEditingChallenge(null);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="admin__section">
      <div className="admin__form">
        <div className="admin__form-title">Add New Challenge</div>
        <div className="admin__field">
          <label className="admin__label" htmlFor="new-game">Game</label>
          <select id="new-game" className="admin__select" value={newChallenge.game_id} onChange={e => setNewChallenge(p => ({ ...p, game_id: e.target.value }))}>
            <option value="">Select game...</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
        <div className="admin__field">
          <label className="admin__label" htmlFor="new-tier">Tier</label>
          <select id="new-tier" className="admin__select" value={newChallenge.tier} onChange={e => setNewChallenge(p => ({ ...p, tier: e.target.value }))}>
            {CHALLENGE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="admin__field">
          <label className="admin__label" htmlFor="new-title">Title</label>
          <input id="new-title" className="admin__input" placeholder="Challenge name" value={newChallenge.title} onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="admin__field">
          <label className="admin__label" htmlFor="new-desc">Description</label>
          <textarea id="new-desc" className="admin__textarea" placeholder="Challenge conditions..." value={newChallenge.description} onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))} rows={3} />
        </div>
        <button className="admin__btn" onClick={handleAdd} disabled={savingNew}>{savingNew ? 'Saving...' : 'Add Challenge'}</button>
      </div>

      {editingChallenge && (
        <div className="admin__form admin__form--editing">
          <div className="admin__form-title">Edit Challenge</div>
          <div className="admin__field">
            <label className="admin__label" htmlFor="edit-game">Game</label>
            <select id="edit-game" className="admin__select" value={editingChallenge.game_id} onChange={e => setEditingChallenge(p => p && ({ ...p, game_id: e.target.value }))}>
              {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <div className="admin__field">
            <label className="admin__label" htmlFor="edit-tier">Tier</label>
            <select id="edit-tier" className="admin__select" value={editingChallenge.tier} onChange={e => setEditingChallenge(p => p && ({ ...p, tier: e.target.value }))}>
              {CHALLENGE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="admin__field">
            <label className="admin__label" htmlFor="edit-title">Title</label>
            <input id="edit-title" className="admin__input" value={editingChallenge.title} onChange={e => setEditingChallenge(p => p && ({ ...p, title: e.target.value }))} />
          </div>
          <div className="admin__field">
            <label className="admin__label" htmlFor="edit-desc">Description</label>
            <textarea id="edit-desc" className="admin__textarea" value={editingChallenge.description} onChange={e => setEditingChallenge(p => p && ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <div className="admin__action-btns">
            <button className="admin__approve-btn" onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? 'Saving...' : '✓ Save Changes'}</button>
            <button className="admin__cancel-btn" onClick={() => setEditingChallenge(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="admin__list">
        <div className="admin__list-title">All Challenges</div>
        {challenges.map(c => (
          <div key={c.id} className={"admin__item" + (editingChallenge?.id === c.id ? ' admin__item--pending' : '')}>
            <div className="admin__item-info">
              <div className="admin__item-title">{c.title}</div>
              <div className="admin__item-meta">{c.game?.title} · {c.tier}</div>
              <div className="admin__item-desc">{c.description}</div>
            </div>
            <div className="admin__action-btns admin__action-btns--column">
              <button className="admin__approve-btn" onClick={() => setEditingChallenge({ id: c.id, title: c.title, description: c.description, tier: c.tier, game_id: String(c.game_id) })}>Edit</button>
              <button className="admin__delete-btn" onClick={() => onDelete(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengesTab;
