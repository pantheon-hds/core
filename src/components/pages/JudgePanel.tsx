import React, { useState, useEffect, useCallback } from 'react';
import './JudgePanel.css';
import { SteamUser } from './SteamCallback';
import { getUserBySteamId, supabase } from '../../services/supabase';

interface JudgePanelProps { user: SteamUser | null; }

interface Assignment {
  id: string;
  assigned_at: string;
  vote: string | null;
  timestamp_note: string | null;
  submission: {
    id: string;
    video_url: string;
    comment: string;
    submitted_at: string;
    user: { username: string };
    challenge: { title: string; tier: string; description: string };
  };
}

const JudgePanel: React.FC<JudgePanelProps> = ({ user }) => {
  const [isJudge, setIsJudge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [voting, setVoting] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  const loadAssignments = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const dbUser = await getUserBySteamId(user.steamId);
    if (!dbUser?.is_judge) {
      setIsJudge(false);
      setLoading(false);
      return;
    }
    setIsJudge(true);

    const { data } = await supabase
      .from('submission_judges')
      .select(`
        id,
        assigned_at,
        vote,
        timestamp_note,
        submission:submissions(
          id,
          video_url,
          comment,
          submitted_at,
          user:users(username),
          challenge:challenges(title, tier, description)
        )
      `)
      .eq('judge_user_id', dbUser.id)
      .order('assigned_at', { ascending: false });

    setAssignments((data as any[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleVote = async (assignmentId: string, submissionId: string, vote: 'approved' | 'rejected') => {
    const timestamp = timestamps[assignmentId]?.trim();
    if (!timestamp) {
      setMessage('Please provide a timestamp before voting.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setVoting({ ...voting, [assignmentId]: true });

    await supabase
      .from('submission_judges')
      .update({
        vote,
        timestamp_note: timestamp,
        voted_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    // Check if all judges voted
    const { data: allVotes } = await supabase
      .from('submission_judges')
      .select('vote')
      .eq('submission_id', submissionId);

    if (allVotes) {
      const totalVoted = allVotes.filter(v => v.vote !== null).length;
      const approvedVotes = allVotes.filter(v => v.vote === 'approved').length;
      const totalJudges = allVotes.length;

      if (totalVoted === totalJudges) {
        const finalStatus = approvedVotes >= Math.ceil(totalJudges / 2) ? 'approved' : 'rejected';
        await supabase
          .from('submissions')
          .update({ status: finalStatus })
          .eq('id', submissionId);

        if (finalStatus === 'approved') {
          // Get submission details and assign rank
          const { data: sub } = await supabase
            .from('submissions')
            .select('user_id, challenge:challenges(tier, game_id)')
            .eq('id', submissionId)
            .single();

          if (sub) {
            const challenge = (sub as any).challenge;
            await supabase.from('ranks').upsert({
              user_id: sub.user_id,
              game_id: challenge.game_id,
              tier: challenge.tier + ' I',
              method: 'community_verified',
            }, { onConflict: 'user_id,game_id' });

            await supabase.from('statues').upsert({
              user_id: sub.user_id,
              game_id: challenge.game_id,
              tier: challenge.tier + ' I',
              challenge: challenge.title,
              is_unique: challenge.tier === 'Legend',
            }, { onConflict: 'user_id,game_id' });
          }
        }
      }
    }

    setVoting({ ...voting, [assignmentId]: false });
    await loadAssignments();
  };

  const pendingCount = assignments.filter(a => !a.vote).length;

  if (loading) return <div className="judge__loading">Loading...</div>;
  if (!isJudge) return <div className="judge__denied">You are not a judge.</div>;

  return (
    <div className="judge">
      <div className="judge__header">
        <div className="judge__title">⚖ Judge Panel</div>
        <div className="judge__subtitle">
          {pendingCount > 0
            ? `${pendingCount} submission${pendingCount !== 1 ? 's' : ''} awaiting your review`
            : 'No pending submissions'}
        </div>
      </div>

      {message && <div className="judge__message">{message}</div>}

      <div className="judge__list">
        {assignments.length === 0 ? (
          <div className="judge__empty">No submissions assigned to you yet.</div>
        ) : (
          assignments.map(a => (
            <div key={a.id} className={"judge__item" + (!a.vote ? ' judge__item--pending' : '')}>
              <div className="judge__item-header">
                <div className="judge__item-challenge">
                  {a.submission?.challenge?.title || 'Unknown'}
                </div>
                <div className="judge__item-tier">
                  {a.submission?.challenge?.tier}
                </div>
              </div>

              <div className="judge__item-desc">
                {a.submission?.challenge?.description}
              </div>

              <div className="judge__item-meta">
                Submitted by: {a.submission?.user?.username || 'Unknown'}
                · {new Date(a.submission?.submitted_at).toLocaleDateString()}
              </div>

              {a.submission?.comment && (
                <div className="judge__item-comment">
                  "{a.submission.comment}"
                </div>
              )}

              <a
                href={a.submission?.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="judge__video-link"
              >
                Watch Video →
              </a>

              {!a.vote ? (
                <div className="judge__vote-section">
                  <div className="judge__timestamp-field">
                    <label className="judge__label">
                      Timestamp confirming completion *
                    </label>
                    <input
                      className="judge__timestamp-input"
                      placeholder="e.g. 1:23:45 — condition clearly met here"
                      value={timestamps[a.id] || ''}
                      onChange={e => setTimestamps({ ...timestamps, [a.id]: e.target.value })}
                    />
                    <div className="judge__timestamp-hint">
                      Required. Without timestamp your vote is not counted.
                    </div>
                  </div>
                  <div className="judge__vote-btns">
                    <button
                      className="judge__approve-btn"
                      onClick={() => handleVote(a.id, a.submission.id, 'approved')}
                      disabled={voting[a.id]}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="judge__reject-btn"
                      onClick={() => handleVote(a.id, a.submission.id, 'rejected')}
                      disabled={voting[a.id]}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="judge__voted">
                  Your vote: <span style={{ color: a.vote === 'approved' ? '#6ab87a' : '#e45a3a' }}>
                    {a.vote}
                  </span>
                  {a.timestamp_note && <span className="judge__voted-note"> · {a.timestamp_note}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JudgePanel;
