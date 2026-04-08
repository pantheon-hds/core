import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Profile.css';
import { SteamUser } from './SteamCallback';
import { checkJudgeEligibility, submitJudgeApplication } from '../../services/profileService';
import { getTierColorSet } from '../../constants/ranks';
import StatueSVG from '../ui/StatueSVG';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserData } from '../../hooks/useUserData';
import { useChallenges } from '../../hooks/useChallenges';
import type { UserStatue } from '../../types';

interface ProfileProps { user: SteamUser | null; }

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [selected, setSelected] = useState<UserStatue | null>(null);

  const [showJudgeForm, setShowJudgeForm] = useState(false);
  const [judgeGameId, setJudgeGameId] = useState('');
  const [judgeMotivation, setJudgeMotivation] = useState('');
  const [judgeSubmitting, setJudgeSubmitting] = useState(false);
  const [judgeMessage, setJudgeMessage] = useState('');
  const judgeMessageTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(judgeMessageTimerRef.current), []);

  const { games } = useChallenges();
  const { dbUserId, ranks, statues, isLoading } = useUserData(user, games);
  const queryClient = useQueryClient();

  const { data: judgeEligibility } = useQuery({
    queryKey: ['judgeEligibility', dbUserId],
    queryFn: () => checkJudgeEligibility(dbUserId!),
    enabled: !!dbUserId,
  });

  const handleJudgeApplication = useCallback(async () => {
    if (!dbUserId || !judgeGameId || !judgeMotivation.trim()) {
      setJudgeMessage('Please select a game and describe your motivation.');
      return;
    }
    setJudgeSubmitting(true);
    const success = await submitJudgeApplication(dbUserId, parseInt(judgeGameId), judgeMotivation);
    if (success) {
      setJudgeMessage('Application submitted! The admin will review it.');
      setShowJudgeForm(false);
      queryClient.invalidateQueries({ queryKey: ['judgeEligibility', dbUserId] });
    } else {
      setJudgeMessage('Error submitting application. Try again.');
    }
    setJudgeSubmitting(false);
    clearTimeout(judgeMessageTimerRef.current);
    judgeMessageTimerRef.current = setTimeout(() => setJudgeMessage(''), 4000);
  }, [dbUserId, judgeGameId, judgeMotivation, queryClient]);

  const topRank = ranks[0];
  const username = user?.username || 'Guest';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="profile">
      {selected && (
        <div className="profile__overlay" onClick={() => setSelected(null)}>
          <div className="profile__modal" onClick={e => e.stopPropagation()}>
            <div className="profile__modal-statue">
              <StatueSVG tier={selected.tier} size={100} unique={selected.is_unique} />
            </div>
            <div className="profile__modal-tier" style={{ color: getTierColorSet(selected.tier).primary }}>
              {selected.tier}{selected.is_unique && ' · Unique'}
            </div>
            <div className="profile__modal-title">{selected.challenge}</div>
            <div className="profile__modal-game">{selected.game?.title}</div>
            <div className="profile__modal-season">
              {new Date(selected.granted_at).toLocaleDateString()}
            </div>
            {selected.is_unique && (
              <div className="profile__modal-unique">
                This statue is one of a kind. There's only one in existence across the entire platform.
              </div>
            )}
            <button className="profile__modal-close" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="profile__header">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={username} className="profile__avatar-img" />
        ) : (
          <div className="profile__avatar">{initials}</div>
        )}
        <div className="profile__info">
          <div className="profile__username">{username}</div>
          <div className="profile__since">
            {topRank ? `${topRank.tier} · ${topRank.game?.title}` : 'No ranks yet'}
          </div>
          <div className="profile__tags">
            {ranks.slice(0, 3).map((r, i) => (
              <span key={i} className="profile__tag">{r.game?.title}</span>
            ))}
          </div>
        </div>
        {judgeEligibility?.isAlreadyJudge && (
          <div className="profile__judge-badge">⚖ Judge</div>
        )}
      </div>

      <div className="profile__stats">
        <div className="profile__stat">
          <div className="profile__stat-value">{statues.length}</div>
          <div className="profile__stat-label">Statues</div>
        </div>
        <div className="profile__stat">
          <div className="profile__stat-value">{statues.filter(s => s.is_unique).length}</div>
          <div className="profile__stat-label">Legends</div>
        </div>
        <div className="profile__stat">
          <div className="profile__stat-value">{ranks.length * 100}</div>
          <div className="profile__stat-label">Skill Points</div>
        </div>
        <div className="profile__stat">
          <div className="profile__stat-value">{ranks.length}</div>
          <div className="profile__stat-label">Games</div>
        </div>
      </div>

      {judgeEligibility && !judgeEligibility.isAlreadyJudge && (
        <div className="profile__judge-section">
          <div className="profile__judge-title">⚖ Become a Judge</div>

          {!judgeEligibility.meetsRequirements ? (
            <div className="profile__judge-requirements">
              <div className="profile__judge-req-title">Requirements to apply:</div>
              <div className={"profile__judge-req" + (judgeEligibility.hasPlatinumRank ? ' profile__judge-req--met' : '')}>
                {judgeEligibility.hasPlatinumRank ? '✓' : '✗'} Platinum rank in at least one game
              </div>
              <div className={"profile__judge-req" + (judgeEligibility.accountAgeOk ? ' profile__judge-req--met' : '')}>
                {judgeEligibility.accountAgeOk ? '✓' : '✗'} Account at least 7 days old
              </div>
            </div>
          ) : judgeEligibility.existingApplication ? (
            <div className="profile__judge-status">
              Application status:
              <span style={{
                color: judgeEligibility.existingApplication.status === 'approved' ? '#6ab87a' :
                       judgeEligibility.existingApplication.status === 'rejected' ? '#e45a3a' : '#e8a830'
              }}>
                {' '}{judgeEligibility.existingApplication.status}
              </span>
            </div>
          ) : (
            <>
              {!showJudgeForm ? (
                <button className="profile__judge-btn" onClick={() => setShowJudgeForm(true)}>
                  Apply to become a Judge
                </button>
              ) : (
                <div className="profile__judge-form">
                  <div className="profile__judge-field">
                    <label className="profile__judge-label" htmlFor="judge-game">Game you want to judge</label>
                    <select
                      id="judge-game"
                      className="profile__judge-select"
                      value={judgeGameId}
                      onChange={e => setJudgeGameId(e.target.value)}
                    >
                      <option value="">Select game...</option>
                      {games.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="profile__judge-field">
                    <label className="profile__judge-label" htmlFor="judge-motivation">Why do you want to be a judge?</label>
                    <textarea
                      id="judge-motivation"
                      className="profile__judge-textarea"
                      placeholder="Tell us about your experience with this game..."
                      value={judgeMotivation}
                      onChange={e => setJudgeMotivation(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="profile__judge-actions">
                    <button
                      className="profile__judge-submit"
                      onClick={handleJudgeApplication}
                      disabled={judgeSubmitting}
                    >
                      {judgeSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button className="profile__judge-cancel" onClick={() => setShowJudgeForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {judgeMessage && (
            <div className="profile__judge-message">{judgeMessage}</div>
          )}
        </div>
      )}

      <div className="profile__section-title">Hall of Statues</div>

      {isLoading ? (
        <div className="profile__loading">Loading statues...</div>
      ) : statues.length === 0 ? (
        <div className="profile__empty">No statues yet. Check your achievements to earn ranks.</div>
      ) : (
        <div className="profile__statues">
          {statues.map(s => (
            <div
              key={s.id}
              className={`profile__statue-card ${s.is_unique ? 'profile__statue-card--unique' : ''}`}
              onClick={() => setSelected(s)}
            >
              {s.is_unique && <div className="profile__statue-card-glow" style={{ background: getTierColorSet(s.tier).primary }} />}
              <div className="profile__statue-figure">
                <StatueSVG tier={s.tier} size={72} unique={s.is_unique} />
              </div>
              <div className="profile__statue-tier" style={{ color: getTierColorSet(s.tier).primary }}>
                {s.tier}
              </div>
              <div className="profile__statue-game">{s.game?.title}</div>
              {s.is_unique && <div className="profile__statue-unique-tag">Unique</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
