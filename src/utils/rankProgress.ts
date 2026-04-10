export interface ProgressInfo {
  nextRank: string;
  required: number;
  completed: number;
  challengeTier: string | null;
  isLegend: boolean;
}

interface ChallengeRef {
  id: number;
  tier: string;
}

export function getProgressInfo(
  currentTier: string | null,
  approvedChallengeIds: (number | null)[],
  challenges: ChallengeRef[]
): ProgressInfo {
  // Unranked users treated the same as Bronze (need 5 Platinum challenges)
  if (!currentTier) {
    const completed = challenges.filter(
      c => c.tier === 'Platinum' && approvedChallengeIds.includes(c.id)
    ).length;
    return { nextRank: 'Platinum', required: 5, completed, challengeTier: 'Platinum', isLegend: false };
  }

  const isBronze = currentTier.startsWith('Bronze');
  const isSilver = currentTier.startsWith('Silver');
  const isGold = currentTier === 'Gold';
  const isPlatinum = currentTier.startsWith('Platinum');
  const isDiamond = currentTier.startsWith('Diamond');
  const isMaster = currentTier.startsWith('Master');
  const isGrandmaster = currentTier === 'Grandmaster';

  if (isGrandmaster) {
    return { nextRank: 'Legend', required: 0, completed: 0, challengeTier: null, isLegend: true };
  }

  let required = 0;
  let challengeTier = '';
  let nextRank = '';

  if (isBronze)    { required = 5; challengeTier = 'Platinum'; nextRank = 'Platinum'; }
  else if (isSilver)    { required = 4; challengeTier = 'Platinum'; nextRank = 'Platinum'; }
  else if (isGold)      { required = 3; challengeTier = 'Platinum'; nextRank = 'Platinum'; }
  else if (isPlatinum)  { required = 2; challengeTier = 'Diamond';  nextRank = 'Diamond'; }
  else if (isDiamond)   { required = 2; challengeTier = 'Master';   nextRank = 'Master'; }
  else if (isMaster)    { required = 1; challengeTier = 'Grandmaster'; nextRank = 'Grandmaster'; }

  const completed = challenges.filter(
    c => c.tier === challengeTier && approvedChallengeIds.includes(c.id)
  ).length;

  return { nextRank, required, completed, challengeTier, isLegend: false };
}
