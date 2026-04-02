export interface ProgressInfo {
  nextRank: string;
  required: number;
  completed: number;
  challengeTier: string | null;
  isLegend: boolean;
}

interface ChallengeRef {
  id: string;
  tier: string;
}

export function getProgressInfo(
  currentTier: string,
  approvedChallengeIds: string[],
  challenges: ChallengeRef[]
): ProgressInfo {
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

  if (isBronze)    { required = 5; challengeTier = 'Platinum'; nextRank = 'Platinum I'; }
  else if (isSilver)    { required = 4; challengeTier = 'Platinum'; nextRank = 'Platinum I'; }
  else if (isGold)      { required = 3; challengeTier = 'Platinum'; nextRank = 'Platinum I'; }
  else if (isPlatinum)  { required = 2; challengeTier = 'Diamond';  nextRank = 'Diamond I'; }
  else if (isDiamond)   { required = 2; challengeTier = 'Master';   nextRank = 'Master I'; }
  else if (isMaster)    { required = 1; challengeTier = 'Grandmaster'; nextRank = 'Grandmaster'; }

  const completed = challenges.filter(
    c => c.tier === challengeTier && approvedChallengeIds.includes(c.id)
  ).length;

  return { nextRank, required, completed, challengeTier, isLegend: false };
}
