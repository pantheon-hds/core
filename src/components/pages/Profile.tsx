import React, { useState, useEffect, useCallback } from 'react';
import './Profile.css';
import { SteamUser } from './SteamCallback';
import { getUserBySteamId, getUserStatues, getUserRanks, UserStatue, supabase, checkJudgeEligibility, submitJudgeApplication } from '../../services/supabase';


const statueColors: Record<string, { primary: string; secondary: string; base: string }> = {
  'Bronze I':   { primary: '#e8974a', secondary: '#a06030', base: '#3a2215' },
  'Bronze II':  { primary: '#e8974a', secondary: '#a06030', base: '#3a2215' },
  'Bronze III': { primary: '#e8974a', secondary: '#a06030', base: '#3a2215' },
  'Silver I':   { primary: '#d8eaf8', secondary: '#8898a8', base: '#2a3040' },
  'Silver II':  { primary: '#d8eaf8', secondary: '#8898a8', base: '#2a3040' },
  'Silver III': { primary: '#d8eaf8', secondary: '#8898a8', base: '#2a3040' },
  'Gold':       { primary: '#e8a830', secondary: '#b07820', base: '#3a2e1a' },
  'Gold I':     { primary: '#e8a830', secondary: '#b07820', base: '#3a2e1a' },
  'Platinum':   { primary: '#8ab4d4', secondary: '#6a94b4', base: '#1e2a3a' },
  'Diamond':    { primary: '#a8d4f4', secondary: '#78b4e4', base: '#182030' },
  'Legend':     { primary: '#c44a2a', secondary: '#a43a1a', base: '#2a1a0a' },
  'Bronze':     { primary: '#c8874a', secondary: '#a06030', base: '#3a2215' },
  'Silver':     { primary: '#c0c8d4', secondary: '#8898a8', base: '#2a3040' },
};

const getBaseColor = (tier: string) => {
  if (tier.startsWith('Gold')) return statueColors['Gold'];
  if (tier.startsWith('Silver')) return statueColors['Silver I'];
  if (tier.startsWith('Bronze')) return statueColors['Bronze I'];
  return statueColors[tier] || statueColors['Bronze I'];
};

interface StatueSVGProps { tier: string; size?: number; }

const StatueSVG: React.FC<StatueSVGProps> = ({ tier, size = 80 }) => {
  const c = getBaseColor(tier);
  const s = size;
  const cx = s / 2;

  if (tier === 'Legend') {
    return (
      <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
        <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
        <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
        <ellipse cx={cx} cy={s*0.26} rx={s*0.18} ry={s*0.2} fill={c.primary} opacity="0.95"/>
        <rect x={s*0.34} y={s*0.44} width={s*0.32} height={s*0.44} rx="3" fill={c.secondary}/>
        <line x1={s*0.28} y1={s*0.44} x2={s*0.2} y2={s*0.56} stroke={c.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={s*0.72} y1={s*0.44} x2={s*0.8} y2={s*0.52} stroke={c.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={s*0.18} r="4" fill="#ffddcc" opacity="0.5"/>
      </svg>
    );
  }

  if (tier.startsWith('Diamond')) {
    return (
      <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
        <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
        <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
        <ellipse cx={cx} cy={s*0.26} rx={s*0.17} ry={s*0.19} fill={c.primary} opacity="0.9"/>
        <rect x={s*0.35} y={s*0.44} width={s*0.3} height={s*0.44} rx="3" fill={c.secondary}/>
        <polygon points={`${cx},${s*0.08} ${cx+s*0.1},${s*0.18} ${cx},${s*0.28} ${cx-s*0.1},${s*0.18}`} fill={c.primary} opacity="0.6"/>
        <circle cx={cx} cy={s*0.18} r="3" fill="#e8f4ff" opacity="0.6"/>
      </svg>
    );
  }

  if (tier.startsWith('Platinum')) {
    return (
      <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
        <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
        <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
        <ellipse cx={cx} cy={s*0.26} rx={s*0.16} ry={s*0.18} fill={c.primary} opacity="0.9"/>
        <rect x={s*0.36} y={s*0.43} width={s*0.28} height={s*0.45} rx="3" fill={c.secondary}/>
        <circle cx={cx} cy={s*0.18} r="3.5" fill="#e8f4ff" opacity="0.5"/>
      </svg>
    );
  }

  return (
    <svg width={s} height={s * 1.2} viewBox={`0 0 ${s} ${s * 1.2}`} fill="none">
      <rect x={s*0.22} y={s*1.05} width={s*0.56} height={s*0.12} rx="2" fill={c.base}/>
      <rect x={s*0.32} y={s*0.88} width={s*0.36} height={s*0.18} rx="2" fill={c.base} opacity="0.8"/>
      <ellipse cx={cx} cy={s*0.26} rx={s*0.15} ry={s*0.17} fill={c.primary} opacity="0.9"/>
      <rect x={s*0.37} y={s*0.42} width={s*0.26} height={s*0.46} rx="3" fill={c.secondary}/>
      <line x1={s*0.3} y1={s*0.46} x2={s*0.24} y2={s*0.54} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <line x1={s*0.7} y1={s*0.46} x2={s*0.76} y2={s*0.54} stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <circle cx={cx} cy={s*0.18} r="3" fill="#e8d5a0" opacity="0.25"/>
    </svg>
  );
};

interface ProfileProps { user: SteamUser | null; }


const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [selected, setSelected] = useState<UserStatue | null>(null);
  const [statues, setStatues] = useState<UserStatue[]>([]);
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);

  // Judge application state
  const [judgeEligibility, setJudgeEligibility] = useState<any>(null);
  const [showJudgeForm, setShowJudgeForm] = useState(false);
  const [judgeGameId, setJudgeGameId] = useState('');
  const [judgeMotivation, setJudgeMotivation] = useState('');
  const [judgeSubmitting, setJudgeSubmitting] = useState(false);
  const [judgeMessage, setJudgeMessage] = useState('');

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dbUser = await getUserBySteamId(user.steamId);
      if (dbUser) {
        setDbUserId(dbUser.id);
        const [userStatues, userRanks] = await Promise.all([
          getUserStatues(dbUser.id),
          getUserRanks(dbUser.id),
        ]);
        setStatues(userStatues);
        setRanks(userRanks);

        // Load games and judge eligibility
        const { data: gamesData } = await supabase.from('games').select('*');
        setGames(gamesData || []);

        const eligibility = await checkJudgeEligibility(dbUser.id, user.steamId);
        setJudgeEligibility(eligibility);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadProfileData();
  }, [user, loadProfileData]);

  const handleJudgeApplication = async () => {
    if (!dbUserId || !judgeGameId || !judgeMotivation.trim()) {
      setJudgeMessage('Please select a game and write your motivation.');
      return;
    }
    setJudgeSubmitting(true);
    const success = await submitJudgeApplication(
      dbUserId,
      parseInt(judgeGameId),
      judgeMotivation
    );
    if (success) {
      setJudgeMessage('Application submitted! The admin will review it.');
      setShowJudgeForm(false);
      await loadProfileData();
    } else {
      setJudgeMessage('Error submitting application. Try again.');
    }
    setJudgeSubmitting(false);
    setTimeout(() => setJudgeMessage(''), 4000);
  };

  const topRank = ranks[0];
  const username = user?.username || 'Guest';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="profile">
      {selected && (
        <div className="profile__overlay" onClick={() => setSelected(null)}>
          <div className="profile__modal" onClick={e => e.stopPropagation()}>
            <div className="profile__modal-statue">
              <StatueSVG tier={selected.tier} size={100} />
            </div>
            <div className="profile__modal-tier" style={{ color: getBaseColor(selected.tier).primary }}>
              {selected.tier}{selected.is_unique && ' · Unique'}
            </div>
            <div className="profile__modal-title">{selected.challenge}</div>
            <div className="profile__modal-game">{selected.game?.title}</div>
            <div className="profile__modal-season">
              {new Date(selected.granted_at).toLocaleDateString()}
            </div>
            {selected.is_unique && (
              <div className="profile__modal-unique">
                This statue is one of a kind. It exists only once in the entire platform history.
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
            {loading ? 'Loading...' : topRank ? `${topRank.tier} · ${topRank.game?.title}` : 'No ranks yet'}
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

      {/* Judge Application Section */}
      {judgeEligibility && !judgeEligibility.isAlreadyJudge && (
        <div className="profile__judge-section">
          <div className="profile__judge-title">⚖ Become a Judge</div>

          {!judgeEligibility.meetsRequirements ? (
            <div className="profile__judge-requirements">
              <div className="profile__judge-req-title">Requirements to apply:</div>
              <div className={"profile__judge-req" + (judgeEligibility.hasGoldRank ? ' profile__judge-req--met' : '')}>
                {judgeEligibility.hasGoldRank ? '✓' : '✗'} Gold rank in at least one game
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
                    <label className="profile__judge-label">Game you want to judge</label>
                    <select
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
                    <label className="profile__judge-label">Why do you want to be a judge?</label>
                    <textarea
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
                    <button
                      className="profile__judge-cancel"
                      onClick={() => setShowJudgeForm(false)}
                    >
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

      {loading ? (
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
              {s.is_unique && <div className="profile__statue-card-glow" style={{ background: getBaseColor(s.tier).primary }} />}
              <div className="profile__statue-figure">
                <StatueSVG tier={s.tier} size={72} />
              </div>
              <div className="profile__statue-tier" style={{ color: getBaseColor(s.tier).primary }}>
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
