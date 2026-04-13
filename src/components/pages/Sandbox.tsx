import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Sandbox.css';
import { SteamUser } from './SteamCallback';
import { supabase } from '../../services/supabase';
import {
  sandboxCreateJudges,
  sandboxCreateSubmission,
  sandboxSimulateVote,
  sandboxClearAll,
} from '../../services/adminService';

interface SandboxProps { user: SteamUser | null; token?: string; }

interface SandboxJudge { id: string; username: string; steam_id: string; is_judge: boolean | null; }
interface SandboxSubmission { id: string; status: string | null; submitted_at: string | null; is_test: boolean | null; challenge: { title: string; tier: string } | null; }
interface SandboxChallenge { id: number; title: string; tier: string; game: { title: string } | null; }
interface SandboxAssignment { id: string; submission_id: string | null; vote: string | null; is_test: boolean | null; judge: { username: string } | null; submission: { is_test: boolean | null } | null; }

const Sandbox: React.FC<SandboxProps> = ({ user, token }) => {
  const isFounder = user?.steamId === 'VOLAND_FOUNDER';

  const [judges, setJudges] = useState<SandboxJudge[]>([]);
  const [submissions, setSubmissions] = useState<SandboxSubmission[]>([]);
  const [challenges, setChallenges] = useState<SandboxChallenge[]>([]);
  const [assignments, setAssignments] = useState<SandboxAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [judgeCount, setJudgeCount] = useState(3);
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showMessage = (msg: string) => {
    setMessage(msg);
    clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage(''), 3000);
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

  useEffect(() => () => clearTimeout(msgTimerRef.current), []);

  useEffect(() => {
    if (isFounder) loadData();
  }, [isFounder, loadData]);

  // Create test judges
  const handleCreateJudges = async () => {
    if (!token) { showMessage('Not authenticated'); return; }
    setLoading(true);
    const result = await sandboxCreateJudges(token, judgeCount);
    if (!result.success) {
      showMessage(`Error: ${result.error}`);
    } else {
      showMessage(`Created ${result.created?.length ?? 0} test judges`);
    }
    await loadData();
    setLoading(false);
  };

  // Create test submission
  const handleCreateSubmission = async () => {
    if (!token) { showMessage('Not authenticated'); return; }
    if (!selectedChallenge) { showMessage('Select a challenge first'); return; }

    setLoading(true);
    const result = await sandboxCreateSubmission(
      token,
      parseInt(selectedChallenge, 10),
      judges.map(j => j.id)
    );
    if (!result.success) {
      showMessage(`Error: ${result.error}`);
    } else {
      showMessage('Test submission created and judges assigned');
    }
    await loadData();
    setLoading(false);
  };

  // Simulate vote for assignment
  const handleSimulateVote = async (assignmentId: string, submissionId: string, vote: 'approved' | 'rejected') => {
    if (!token) { showMessage('Not authenticated'); return; }
    const result = await sandboxSimulateVote(token, assignmentId, submissionId, vote);
    if (!result.success) {
      showMessage(`Error: ${result.error}`);
    } else if (result.finalStatus) {
      showMessage(`Submission ${result.finalStatus}!`);
    }
    await loadData();
  };

  // Clear all test data
  const handleClearAll = async () => {
    if (!token) { showMessage('Not authenticated'); return; }
    if (!window.confirm('Delete ALL test data? This cannot be undone.')) return;
    setLoading(true);
    const result = await sandboxClearAll(token);
    if (!result.success) {
      showMessage(`Error: ${result.error}`);
    } else {
      showMessage('All test data cleared');
    }
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
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setJudgeCount(Math.min(10, Math.max(1, v))); }}
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
