import React, { useState } from 'react';
import type { Game } from '../../types';

interface GamesTabProps {
  games: Game[];
  onAdd: (data: { title: string; steam_app_id: string }) => Promise<boolean>;
}

const GamesTab: React.FC<GamesTabProps> = ({ games, onAdd }) => {
  const [newGame, setNewGame] = useState({ title: '', steam_app_id: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newGame.title.trim() || !newGame.steam_app_id.trim()) return;
    setSaving(true);
    try {
      const ok = await onAdd({ title: newGame.title.trim(), steam_app_id: newGame.steam_app_id.trim() });
      if (ok) setNewGame({ title: '', steam_app_id: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin__section">
      <div className="admin__form">
        <div className="admin__form-title">Add New Game</div>
        <div className="admin__field">
          <label className="admin__label">Title</label>
          <input
            className="admin__input"
            placeholder="e.g. Dark Souls III"
            value={newGame.title}
            onChange={e => setNewGame(p => ({ ...p, title: e.target.value }))}
          />
        </div>
        <div className="admin__field">
          <label className="admin__label">Steam App ID</label>
          <input
            className="admin__input"
            placeholder="e.g. 374320"
            value={newGame.steam_app_id}
            onChange={e => setNewGame(p => ({ ...p, steam_app_id: e.target.value }))}
          />
          <div className="admin__hint">
            Find it at: store.steampowered.com/app/<strong>374320</strong>/
          </div>
        </div>
        <button className="admin__btn" onClick={handleAdd} disabled={saving}>
          {saving ? 'Saving...' : 'Add Game'}
        </button>
      </div>

      <div className="admin__list">
        <div className="admin__list-title">All Games — {games.length}</div>
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
  );
};

export default GamesTab;
