import { determineRank } from './steamApi';

describe('determineRank', () => {
  describe('Gold', () => {
    it('returns Gold at exactly 100%', () => {
      expect(determineRank(100)).toBe('Gold');
    });
  });

  describe('Silver III', () => {
    it('returns Silver III at exactly 95%', () => {
      expect(determineRank(95)).toBe('Silver III');
    });

    it('returns Silver III at 99%', () => {
      expect(determineRank(99)).toBe('Silver III');
    });
  });

  describe('Silver II', () => {
    it('returns Silver II at exactly 90%', () => {
      expect(determineRank(90)).toBe('Silver II');
    });

    it('returns Silver II at 94%', () => {
      expect(determineRank(94)).toBe('Silver II');
    });
  });

  describe('Silver I', () => {
    it('returns Silver I at exactly 75%', () => {
      expect(determineRank(75)).toBe('Silver I');
    });

    it('returns Silver I at 89%', () => {
      expect(determineRank(89)).toBe('Silver I');
    });
  });

  describe('Bronze III', () => {
    it('returns Bronze III at exactly 50%', () => {
      expect(determineRank(50)).toBe('Bronze III');
    });

    it('returns Bronze III at 74%', () => {
      expect(determineRank(74)).toBe('Bronze III');
    });
  });

  describe('Bronze II', () => {
    it('returns Bronze II at exactly 25%', () => {
      expect(determineRank(25)).toBe('Bronze II');
    });

    it('returns Bronze II at 49%', () => {
      expect(determineRank(49)).toBe('Bronze II');
    });
  });

  describe('Bronze I', () => {
    it('returns Bronze I at 0%', () => {
      expect(determineRank(0)).toBe('Bronze I');
    });

    it('returns Bronze I at 24%', () => {
      expect(determineRank(24)).toBe('Bronze I');
    });

    it('returns Bronze I at 1%', () => {
      expect(determineRank(1)).toBe('Bronze I');
    });
  });

  it('returns a valid RankTier for every boundary value', () => {
    const boundaries = [0, 1, 24, 25, 49, 50, 74, 75, 89, 90, 94, 95, 99, 100];
    const validTiers = ['Gold', 'Silver III', 'Silver II', 'Silver I', 'Bronze III', 'Bronze II', 'Bronze I'];
    for (const pct of boundaries) {
      expect(validTiers).toContain(determineRank(pct));
    }
  });
});
