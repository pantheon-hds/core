import React, { useState, useEffect, useCallback } from 'react';
import './Sandbox.css';
import { SteamUser } from './SteamCallback';
import { supabase } from '../../services/supabase';

interface SandboxProps { user: SteamUser | null; }

const Sandbox: React.FC<SandboxProps> = ({ user }) => {
  const isFounder = user?.steamId === 'VOLAND_FOUNDER';

  const [judges, setJudges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [judgeCount, setJudgeCount] = useState(3);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: judgesData } = await supabase
      .from('users')
      .select('id, username, steam_id, is_judge')
      .eq('is_test', true);
    setJudges(judgesData || []);

    const { data: subsData } = await supabase
      .from('submissions')
      .select('*, challenge:challenges(title, tier)')
      .eq('is_test', true)
      .order('submitted_at', { ascending: false });
    setSubmissions(subsData || []);

    const { data: challengesData } = await supabase
      .from('challenges')
      .select('id, title, tier, game:games(title)');
    setChallenges(challengesData || []);

    const { data: assignmentsData } = await supabase
      .from('submission_judges')
      .select('*, judge:users(username), submission:submissions(is_test)')
      .eq('is_test', true);
    setAssignments(assignmentsData || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isFounder) loadData();
  }, [isFounder, loadData]);

  // Create test judges
  const handleCreateJudges = async () => {
    setLoading(true);
    for (let i = 0; i < judgeCount; i++) {
      const steamId = `TEST_JUDGE_${Date.now()}_${i}`;
      await supabase.from('users').insert({
        steam_id: steamId,
        username: `TestJudge_${i + 1}`,
        is_judge: true,
        is_test: true,
        is_admin: false,
      });
    }
    showMessage(`Created ${judgeCount} test judges`);
    await loadData();
    setLoading(false);
  };

  // Create test submission
  const handleCreateSubmission = async () => {
    if (!selectedChallenge) {
      showMessage('Select a challenge first');
      return;
    }

    // Get real user ID (Voland)
    const { data: voland } = await supabase
      .from('users')
      .select('id')
      .eq('steam_id', 'VOLAND_FOUNDER')
      .single();

    if (!voland) {
      showMessage('Voland user not found');
      return;
    }

    const { data: newSub, error } = await supabase
      .from('submissions')
      .insert({
        user_id: voland.id,
        challenge_id: parseInt(selectedChallenge),
        video_url: 'https://www.youtube.com/watch?v=test',
        comment: 'Test submission',
        status: 'pending',
        is_test: true,
      })
      .select()
      .single();

    if (error || !newSub) {
      showMessage(`Error: ${error?.message}`);
      return;
    }

    // Assign test judges to this submission
    const testJudgeIds = judges.map(j => j.id);
    if (testJudgeIds.length > 0) {
      const selected = testJudgeIds.slice(0, 3);
      await supabase.from('submission_judges').insert(
        selected.map(judgeId => ({
          submission_id: newSub.id,
          judge_user_id: judgeId,
          is_test: true,
        }))
      );
      await supabase
        .from('submissions')
        .update({ status: 'in_review' })
        .eq('id', newSub.id);
    }

    showMessage('Test submission created and judges assigned');
    await loadData();
  };

  // Simulate vote for assignment
  const handleSimulateVote = async (assignmentId: string, submissionId: string, vote: 'approved' | 'rejected') => {
    await supabase
      .from('submission_judges')
      .update({
        vote,
        timestamp_note: '0:30 — test timestamp',
        voted_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    // Check if all voted
    const { data: allVotes } = await supabase
      .from('submission_judges')
      .select('vote')
      .eq('submission_id', submissionId);

    if (allVotes) {
      const totalVoted = allVotes.filter(v => v.vote !== null).length;
      const approvedVotes = allVotes.filter(v => v.vote === 'approved').length;
      const total = allVotes.length;

      if (totalVoted === total) {
        const finalStatus = approvedVotes >= Math.ceil(total / 2) ? 'approved' : 'rejected';
        await supabase
          .from('submissions')
          .update({ status: finalStatus })
          .eq('id', submissionId);
        showMessage(`Submission ${finalStatus}! (${approvedVotes}/${total} approved)`);
      }
    }

    await loadData();
  };

  // Clear all test data
  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL test data? This cannot be undone.')) return;
    setLoading(true);

    await supabase.from('submission_judges').delete().eq('is_test', true);
    await supabase.from('submissions').delete().eq('is_test', true);
    await supabase.from('ranks').delete().eq('is_test', true);
    await supabase.from('statues').delete().eq('is_test', true);
    await supabase.from('users').delete().eq('is_test', true);

    showMessage('All test data cleared');
    await loadData();
    setLoading(false);
  };

  if (!isFounder) {
    return <div className="sandbox__denied">Founder access only.</div>;
  }

  return (
    <div className="sandbox">
      <div className="sandbox__header">
        <div className="sandbox__title">⚗ Sandbox</div>
        <div className="sandbox__subtitle">Testing environment — Voland only</div>
      </div>

      {message && <div className="sandbox__message">{message}</div>}

      {/* Create test judges */}
      <div className="sandbox__section">
        <div className="sandbox__section-title">Create Test Judges</div>
        <div className="sandbox__row">
          <input
            className="sandbox__input"
            type="number"
            min={1}
            max={10}
            value={judgeCount}
            onChange={e => setJudgeCount(parseInt(e.target.value))}
          />
          <button className="sandbox__btn" onClick={handleCreateJudges} disabled={loading}>
            Create {judgeCount} Test Judge{judgeCount !== 1 ? 's' : ''}
          </button>
        </div>

        {judges.length > 0 && (
          <div className="sandbox__list">
            <div className="sandbox__list-title">Test Judges ({judges.length})</div>
            {judges.map(j => (
              <div key={j.id} className="sandbox__item">
                <span>{j.username}</span>
                <span className="sandbox__tag">⚖ Judge</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create test submission */}
      <div className="sandbox__section">
        <div className="sandbox__section-title">Create Test Submission</div>
        <div className="sandbox__row">
          <select
            className="sandbox__select"
            value={selectedChallenge}
            onChange={e => setSelectedChallenge(e.target.value)}
          >
            <option value="">Select challenge...</option>
            {challenges.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.tier}) — {c.game?.title}
              </option>
            ))}
          </select>
          <button
            className="sandbox__btn"
            onClick={handleCreateSubmission}
            disabled={loading || judges.length === 0}
          >
            Create Submission
          </button>
        </div>
        {judges.length === 0 && (
          <div className="sandbox__hint">Create test judges first</div>
        )}
      </div>

      {/* Live assignments view */}
      {submissions.length > 0 && (
        <div className="sandbox__section">
          <div className="sandbox__section-title">
            Live Submissions & Voting
          </div>
          {submissions.map(sub => {
            const subAssignments = assignments.filter(a => a.submission_id === sub.id);
            return (
              <div key={sub.id} className="sandbox__submission">
                <div className="sandbox__sub-header">
                  <span className="sandbox__sub-title">
                    {sub.challenge?.title} — {sub.challenge?.tier}
                  </span>
                  <span className={
                    "sandbox__status " +
                    (sub.status === 'approved' ? 'sandbox__status--approved' :
                     sub.status === 'rejected' ? 'sandbox__status--rejected' :
                     'sandbox__status--pending')
                  }>
                    {sub.status}
                  </span>
                </div>

                <div className="sandbox__votes">
                  {subAssignments.map(a => (
                    <div key={a.id} className="sandbox__vote-row">
                      <span className="sandbox__judge-name">
                        {a.judge?.username || 'Unknown'}
                      </span>
                      {!a.vote ? (
                        <div className="sandbox__vote-btns">
                          <button
                            className="sandbox__approve"
                            onClick={() => handleSimulateVote(a.id, sub.id, 'approved')}
                          >
                            ✓
                          </button>
                          <button
                            className="sandbox__reject"
                            onClick={() => handleSimulateVote(a.id, sub.id, 'rejected')}
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: a.vote === 'approved' ? '#6ab87a' : '#e45a3a' }}>
                          {a.vote === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear all test data */}
      <div className="sandbox__section sandbox__section--danger">
        <div className="sandbox__section-title">Danger Zone</div>
        <button className="sandbox__clear-btn" onClick={handleClearAll} disabled={loading}>
          🗑 Clear All Test Data
        </button>
        <div className="sandbox__hint">
          Deletes all test judges, submissions, votes, ranks and statues marked as test.
        </div>
      </div>
    </div>
  );
};

export default Sandbox;
