import {
  RANK_TIERS,
  CHALLENGE_TIERS,
  challengeTierToRankTier,
  getRankOrder,
  getTierColorSet,
  RANK_TIER_COLORS,
  TIER_COLOR_SETS,
} from './ranks';

describe('RANK_TIERS', () => {
  it('starts with Legend (highest rank)', () => {
    expect(RANK_TIERS[0]).toBe('Legend');
  });

  it('ends with Bronze I (lowest rank)', () => {
    expect(RANK_TIERS[RANK_TIERS.length - 1]).toBe('Bronze I');
  });

  it('contains 12 tiers', () => {
    expect(RANK_TIERS.length).toBe(12);
  });

  it('has Grandmaster above Master I', () => {
    expect(getRankOrder('Grandmaster')).toBeLessThan(getRankOrder('Master I'));
  });
});

describe('challengeTierToRankTier', () => {
  it('appends " I" to Platinum', () => {
    expect(challengeTierToRankTier('Platinum')).toBe('Platinum I');
  });

  it('appends " I" to Diamond', () => {
    expect(challengeTierToRankTier('Diamond')).toBe('Diamond I');
  });

  it('appends " I" to Master', () => {
    expect(challengeTierToRankTier('Master')).toBe('Master I');
  });

  it('does NOT append " I" to Grandmaster', () => {
    expect(challengeTierToRankTier('Grandmaster')).toBe('Grandmaster');
  });

  it('does NOT append " I" to Legend', () => {
    expect(challengeTierToRankTier('Legend')).toBe('Legend');
  });

  it('returns a value that exists in RANK_TIERS', () => {
    for (const tier of CHALLENGE_TIERS) {
      const rankTier = challengeTierToRankTier(tier);
      expect(RANK_TIERS as readonly string[]).toContain(rankTier);
    }
  });
});

describe('getRankOrder', () => {
  it('returns lower index for higher rank', () => {
    expect(getRankOrder('Legend')).toBeLessThan(getRankOrder('Grandmaster'));
    expect(getRankOrder('Grandmaster')).toBeLessThan(getRankOrder('Master I'));
    expect(getRankOrder('Master I')).toBeLessThan(getRankOrder('Diamond I'));
    expect(getRankOrder('Diamond I')).toBeLessThan(getRankOrder('Platinum I'));
    expect(getRankOrder('Platinum I')).toBeLessThan(getRankOrder('Gold'));
    expect(getRankOrder('Gold')).toBeLessThan(getRankOrder('Silver III'));
    expect(getRankOrder('Silver III')).toBeLessThan(getRankOrder('Silver II'));
    expect(getRankOrder('Silver II')).toBeLessThan(getRankOrder('Silver I'));
    expect(getRankOrder('Silver I')).toBeLessThan(getRankOrder('Bronze III'));
    expect(getRankOrder('Bronze III')).toBeLessThan(getRankOrder('Bronze II'));
    expect(getRankOrder('Bronze II')).toBeLessThan(getRankOrder('Bronze I'));
  });

  it('returns Infinity for unknown tier', () => {
    expect(getRankOrder('Unknown Tier')).toBe(Infinity);
    expect(getRankOrder('')).toBe(Infinity);
  });

  it('unknown tiers sort after all known tiers', () => {
    expect(getRankOrder('Bronze I')).toBeLessThan(getRankOrder('SomeFutureTier'));
  });
});

describe('getTierColorSet', () => {
  it('returns a color set with primary, secondary, base for known tiers', () => {
    for (const tier of RANK_TIERS) {
      const colors = getTierColorSet(tier);
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('base');
    }
  });

  it('returns Gold color for any Gold-prefixed tier', () => {
    expect(getTierColorSet('Gold')).toEqual(TIER_COLOR_SETS['Gold']);
  });

  it('returns Silver I color for all Silver sub-tiers', () => {
    expect(getTierColorSet('Silver I')).toEqual(TIER_COLOR_SETS['Silver I']);
    expect(getTierColorSet('Silver II')).toEqual(TIER_COLOR_SETS['Silver I']);
    expect(getTierColorSet('Silver III')).toEqual(TIER_COLOR_SETS['Silver I']);
  });

  it('returns Bronze I color for all Bronze sub-tiers', () => {
    expect(getTierColorSet('Bronze I')).toEqual(TIER_COLOR_SETS['Bronze I']);
    expect(getTierColorSet('Bronze II')).toEqual(TIER_COLOR_SETS['Bronze I']);
    expect(getTierColorSet('Bronze III')).toEqual(TIER_COLOR_SETS['Bronze I']);
  });

  it('falls back to Bronze I for completely unknown tier', () => {
    expect(getTierColorSet('???')).toEqual(TIER_COLOR_SETS['Bronze I']);
  });
});

describe('RANK_TIER_COLORS', () => {
  it('has a color entry for every tier in RANK_TIERS', () => {
    for (const tier of RANK_TIERS) {
      expect(RANK_TIER_COLORS).toHaveProperty(tier);
    }
  });

  it('all color values are valid hex strings', () => {
    for (const color of Object.values(RANK_TIER_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
