// Fisher-Yates shuffle — uniform distribution.
// Extracted here so it can be unit-tested independently of the Edge Function.
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface Judge {
  id: string;
  username: string;
}

/**
 * Selects up to `count` judges for a submission.
 * Rules:
 *  - judge must have is_judge = true (caller filters by this before passing)
 *  - judge must have a rank in the game (rankedIds)
 *  - judge must not be the submitter
 */
export function selectJudges(
  allJudges: Judge[],
  submitterId: string,
  rankedIds: string[],
  count = 3
): Judge[] {
  const eligible = allJudges.filter(
    j => j.id !== submitterId && rankedIds.includes(j.id)
  );
  return shuffleArray(eligible).slice(0, count);
}
