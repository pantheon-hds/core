import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shuffleArray, selectJudges, type Judge } from './judgeSelection';

// ── Test data ─────────────────────────────────────────────────────────────────

const PLAYER: Judge = { id: 'player-1', username: 'Kittyerit' };

// 6 judges, all ranked in the game
const SIX_JUDGES: Judge[] = [
  { id: 'judge-1', username: 'Judge1' },
  { id: 'judge-2', username: 'Judge2' },
  { id: 'judge-3', username: 'Judge3' },
  { id: 'judge-4', username: 'Judge4' },
  { id: 'judge-5', username: 'Judge5' },
  { id: 'judge-6', username: 'Judge6' },
];
const ALL_RANKED = SIX_JUDGES.map(j => j.id);

// ── shuffleArray ──────────────────────────────────────────────────────────────

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    expect(shuffleArray(SIX_JUDGES)).toHaveLength(SIX_JUDGES.length);
  });

  it('contains the same elements as the original', () => {
    const shuffled = shuffleArray(SIX_JUDGES);
    expect(shuffled).toEqual(expect.arrayContaining(SIX_JUDGES));
    expect(SIX_JUDGES).toEqual(expect.arrayContaining(shuffled));
  });

  it('does not mutate the original array', () => {
    const original = [...SIX_JUDGES];
    shuffleArray(SIX_JUDGES);
    expect(SIX_JUDGES).toEqual(original);
  });

  it('produces different orders over many runs (not always sorted)', () => {
    // Run 20 times — probability of always same order is (1/720)^20 ≈ 0
    const orders = new Set(
      Array.from({ length: 20 }, () => shuffleArray(SIX_JUDGES).map(j => j.id).join(','))
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single-element array', () => {
    expect(shuffleArray([SIX_JUDGES[0]])).toEqual([SIX_JUDGES[0]]);
  });
});

// ── selectJudges — основные сценарии ─────────────────────────────────────────

describe('selectJudges — basic selection', () => {
  it('selects exactly 3 judges when 6 are available', () => {
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, ALL_RANKED);
    expect(selected).toHaveLength(3);
  });

  it('never selects the submitter even if they are a judge', () => {
    // Imagine Kittyerit is also listed as a judge
    const judgesIncludingPlayer: Judge[] = [PLAYER, ...SIX_JUDGES];
    const rankedIds = [PLAYER.id, ...ALL_RANKED];

    for (let i = 0; i < 20; i++) {
      const selected = selectJudges(judgesIncludingPlayer, PLAYER.id, rankedIds);
      expect(selected.find(j => j.id === PLAYER.id)).toBeUndefined();
    }
  });

  it('selected judges are all from the eligible pool', () => {
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, ALL_RANKED);
    for (const judge of selected) {
      expect(ALL_RANKED).toContain(judge.id);
    }
  });

  it('no duplicate judges in the selection', () => {
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, ALL_RANKED);
    const ids = selected.map(j => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── selectJudges — ранговый фильтр ───────────────────────────────────────────

describe('selectJudges — ranked filter', () => {
  it('excludes judges who have no rank in this game', () => {
    // Only judges 1, 2, 3 are ranked in this game
    const rankedIds = ['judge-1', 'judge-2', 'judge-3'];
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, rankedIds);

    expect(selected).toHaveLength(3);
    for (const judge of selected) {
      expect(rankedIds).toContain(judge.id);
    }
  });

  it('selects only ranked judges when fewer than 3 are ranked', () => {
    const rankedIds = ['judge-1', 'judge-2'];
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, rankedIds);

    expect(selected).toHaveLength(2);
    expect(selected.map(j => j.id)).toEqual(expect.arrayContaining(rankedIds));
  });

  it('returns empty array when no judges are ranked in this game', () => {
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, []);
    expect(selected).toHaveLength(0);
  });
});

// ── selectJudges — граничные случаи ──────────────────────────────────────────

describe('selectJudges — edge cases', () => {
  it('returns empty array when judge pool is empty', () => {
    const selected = selectJudges([], PLAYER.id, ALL_RANKED);
    expect(selected).toHaveLength(0);
  });

  it('selects all judges when exactly 3 are available', () => {
    const threeJudges = SIX_JUDGES.slice(0, 3);
    const rankedIds = threeJudges.map(j => j.id);
    const selected = selectJudges(threeJudges, PLAYER.id, rankedIds);
    expect(selected).toHaveLength(3);
  });

  it('selects fewer than 3 when only 1 eligible judge exists', () => {
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, ['judge-1']);
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('judge-1');
  });

  it('handles custom count parameter', () => {
    const selected = selectJudges(SIX_JUDGES, PLAYER.id, ALL_RANKED, 2);
    expect(selected).toHaveLength(2);
  });
});

// ── selectJudges — случайность распределения ─────────────────────────────────

describe('selectJudges — random distribution', () => {
  it('each of the 6 judges gets selected at least once in 100 runs', () => {
    const counts: Record<string, number> = {};
    SIX_JUDGES.forEach(j => { counts[j.id] = 0; });

    for (let i = 0; i < 100; i++) {
      const selected = selectJudges(SIX_JUDGES, PLAYER.id, ALL_RANKED);
      selected.forEach(j => { counts[j.id]++; });
    }

    // Every judge should appear in roughly 100 * 3/6 = 50 runs.
    // With high probability each judge appears at least once in 100 trials.
    for (const judge of SIX_JUDGES) {
      expect(counts[judge.id]).toBeGreaterThan(0);
    }
  });

  it('selection varies across runs (not always the same 3)', () => {
    const selections = new Set(
      Array.from({ length: 30 }, () =>
        selectJudges(SIX_JUDGES, PLAYER.id, ALL_RANKED)
          .map(j => j.id)
          .sort()
          .join(',')
      )
    );
    // With 6 judges and C(6,3)=20 possible combinations, we expect multiple different ones
    expect(selections.size).toBeGreaterThan(1);
  });
});
