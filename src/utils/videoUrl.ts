const ALLOWED_DOMAINS = ['youtube.com', 'youtu.be', 'twitch.tv'];

export function isValidVideoUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== 'https:') return false;
    const domain = hostname.replace(/^www\./, '');
    return ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  } catch {
    return false;
  }
}

/** Returns the URL if valid, otherwise '#' to prevent navigation to unsafe hrefs. */
export function safeVideoUrl(url: string | null | undefined): string {
  if (!url) return '#';
  return isValidVideoUrl(url) ? url : '#';
}
