// Tests for ban status logic — no Supabase calls, pure date logic only.

function isBanActive(
  is_banned: boolean,
  banned_until: string | null | undefined
): boolean {
  if (!is_banned) return false;
  if (!banned_until) return true; // permanent
  return new Date(banned_until) > new Date();
}

describe('isBanActive', () => {
  describe('not banned', () => {
    it('returns false when is_banned is false', () => {
      expect(isBanActive(false, null)).toBe(false);
    });

    it('returns false when is_banned is false even with a future date', () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(isBanActive(false, future)).toBe(false);
    });
  });

  describe('permanent ban', () => {
    it('returns true when is_banned and banned_until is null', () => {
      expect(isBanActive(true, null)).toBe(true);
    });

    it('returns true when is_banned and banned_until is undefined', () => {
      expect(isBanActive(true, undefined)).toBe(true);
    });
  });

  describe('temporary ban — active', () => {
    it('returns true when banned_until is in the future (1 week)', () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(isBanActive(true, future)).toBe(true);
    });

    it('returns true when banned_until is in the future (1 year)', () => {
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(isBanActive(true, future)).toBe(true);
    });

    it('returns true when banned_until is 1 minute from now', () => {
      const future = new Date(Date.now() + 60 * 1000).toISOString();
      expect(isBanActive(true, future)).toBe(true);
    });
  });

  describe('temporary ban — expired', () => {
    it('returns false when banned_until is in the past (1 week ago)', () => {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(isBanActive(true, past)).toBe(false);
    });

    it('returns false when banned_until is 1 minute ago', () => {
      const past = new Date(Date.now() - 60 * 1000).toISOString();
      expect(isBanActive(true, past)).toBe(false);
    });

    it('returns false when banned_until is exactly 1 year ago', () => {
      const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(isBanActive(true, past)).toBe(false);
    });
  });
});

describe('ban duration calculation', () => {
  function getBanExpiry(duration: 'week' | 'month' | 'year' | 'permanent'): string | null {
    if (duration === 'permanent') return null;
    const now = new Date();
    if (duration === 'week') now.setDate(now.getDate() + 7);
    if (duration === 'month') now.setMonth(now.getMonth() + 1);
    if (duration === 'year') now.setFullYear(now.getFullYear() + 1);
    return now.toISOString();
  }

  it('permanent ban returns null', () => {
    expect(getBanExpiry('permanent')).toBeNull();
  });

  it('week ban expires in the future', () => {
    const expiry = getBanExpiry('week')!;
    expect(new Date(expiry) > new Date()).toBe(true);
  });

  it('month ban expires after week ban', () => {
    const week = new Date(getBanExpiry('week')!);
    const month = new Date(getBanExpiry('month')!);
    expect(month > week).toBe(true);
  });

  it('year ban expires after month ban', () => {
    const month = new Date(getBanExpiry('month')!);
    const year = new Date(getBanExpiry('year')!);
    expect(year > month).toBe(true);
  });

  it('week ban expires approximately 7 days from now', () => {
    const expiry = new Date(getBanExpiry('week')!);
    const diffDays = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it('year ban expires approximately 365 days from now', () => {
    const expiry = new Date(getBanExpiry('year')!);
    const diffDays = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(365, 0);
  });
});
