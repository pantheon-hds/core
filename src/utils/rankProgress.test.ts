import { getProgressInfo } from './rankProgress';

const challenges = [
  { id: 'p1', tier: 'Platinum' },
  { id: 'p2', tier: 'Platinum' },
  { id: 'p3', tier: 'Platinum' },
  { id: 'p4', tier: 'Platinum' },
  { id: 'p5', tier: 'Platinum' },
  { id: 'd1', tier: 'Diamond' },
  { id: 'd2', tier: 'Diamond' },
  { id: 'm1', tier: 'Master' },
  { id: 'g1', tier: 'Grandmaster' },
];

describe('getProgressInfo', () => {
  describe('Bronze tiers', () => {
    it('requires 5 Platinum challenges to advance', () => {
      const result = getProgressInfo('Bronze I', [], challenges);
      expect(result.required).toBe(5);
      expect(result.challengeTier).toBe('Platinum');
      expect(result.nextRank).toBe('Platinum I');
    });

    it('counts completed Platinum challenges', () => {
      const result = getProgressInfo('Bronze III', ['p1', 'p2'], challenges);
      expect(result.completed).toBe(2);
    });

    it('works for all Bronze sub-tiers', () => {
      for (const tier of ['Bronze I', 'Bronze II', 'Bronze III']) {
        const result = getProgressInfo(tier, [], challenges);
        expect(result.required).toBe(5);
        expect(result.challengeTier).toBe('Platinum');
      }
    });
  });

  describe('Silver tiers', () => {
    it('requires 4 Platinum challenges to advance', () => {
      const result = getProgressInfo('Silver I', [], challenges);
      expect(result.required).toBe(4);
      expect(result.challengeTier).toBe('Platinum');
      expect(result.nextRank).toBe('Platinum I');
    });

    it('works for all Silver sub-tiers', () => {
      for (const tier of ['Silver I', 'Silver II', 'Silver III']) {
        const result = getProgressInfo(tier, [], challenges);
        expect(result.required).toBe(4);
      }
    });
  });

  describe('Gold tier', () => {
    it('requires 3 Platinum challenges to advance', () => {
      const result = getProgressInfo('Gold', [], challenges);
      expect(result.required).toBe(3);
      expect(result.challengeTier).toBe('Platinum');
      expect(result.nextRank).toBe('Platinum I');
    });

    it('counts only Platinum challenges, not other tiers', () => {
      const result = getProgressInfo('Gold', ['p1', 'd1', 'd2'], challenges);
      expect(result.completed).toBe(1); // only p1 counts
    });
  });

  describe('Platinum tier', () => {
    it('requires 2 Diamond challenges to advance', () => {
      const result = getProgressInfo('Platinum I', [], challenges);
      expect(result.required).toBe(2);
      expect(result.challengeTier).toBe('Diamond');
      expect(result.nextRank).toBe('Diamond I');
    });

    it('counts completed Diamond challenges', () => {
      const result = getProgressInfo('Platinum I', ['d1', 'd2', 'p1'], challenges);
      expect(result.completed).toBe(2);
    });
  });

  describe('Diamond tier', () => {
    it('requires 2 Master challenges to advance', () => {
      const result = getProgressInfo('Diamond I', [], challenges);
      expect(result.required).toBe(2);
      expect(result.challengeTier).toBe('Master');
      expect(result.nextRank).toBe('Master I');
    });
  });

  describe('Master tier', () => {
    it('requires 1 Grandmaster challenge to advance', () => {
      const result = getProgressInfo('Master I', [], challenges);
      expect(result.required).toBe(1);
      expect(result.challengeTier).toBe('Grandmaster');
      expect(result.nextRank).toBe('Grandmaster');
    });
  });

  describe('Grandmaster tier', () => {
    it('returns isLegend flag and 0 required', () => {
      const result = getProgressInfo('Grandmaster', [], challenges);
      expect(result.isLegend).toBe(true);
      expect(result.required).toBe(0);
      expect(result.nextRank).toBe('Legend');
    });

    it('ignores approved challenges since Legend is not earnable this way', () => {
      const result = getProgressInfo('Grandmaster', ['g1'], challenges);
      expect(result.completed).toBe(0);
    });
  });

  describe('completed count', () => {
    it('is 0 when no approved submissions', () => {
      const result = getProgressInfo('Gold', [], challenges);
      expect(result.completed).toBe(0);
    });

    it('only counts challenges matching the required tier', () => {
      const result = getProgressInfo('Gold', ['p1', 'p2', 'd1', 'm1'], challenges);
      expect(result.completed).toBe(2); // only p1 and p2
    });

    it('does not count the same challenge twice if submitted twice', () => {
      // approvedChallengeIds is a list of challenge IDs, each approval is separate
      const result = getProgressInfo('Gold', ['p1', 'p1', 'p2'], challenges);
      // filter(c => approvedIds.includes(c.id)) counts distinct challenges
      expect(result.completed).toBe(2);
    });
  });

  describe('isLegend flag', () => {
    it('is false for all non-Grandmaster tiers', () => {
      const tiers = ['Bronze I', 'Silver II', 'Gold', 'Platinum I', 'Diamond I', 'Master I'];
      for (const tier of tiers) {
        expect(getProgressInfo(tier, [], challenges).isLegend).toBe(false);
      }
    });
  });
});
