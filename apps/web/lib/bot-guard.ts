/**
 * Server-side checks that run before a page is sent. They use only plain web APIs so they work in
 * Next.js middleware (Edge runtime).
 */

// Tools that download pages or drive a browser without a person: scripts, scrapers, test robots
const AUTOMATED_CLIENT =
  /(curl|wget|python-requests|python-urllib|aiohttp|httpx|scrapy|go-http-client|libwww|okhttp|node-fetch|undici|axios|got\/|java\/|apache-httpclient|httrack|mechanize|colly|jsdom|phantomjs|headlesschrome|puppeteer|playwright|selenium|webdriver|lighthouse)/i;

export function isAutomatedClient(userAgent: string | null): boolean {
  // Real browsers always send a user agent. Anything without one is a script.
  if (!userAgent) return true;
  return AUTOMATED_CLIENT.test(userAgent);
}

interface Bucket {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Bucket>();

/**
 * Allows `limit` requests per `windowMs` for each visitor address.
 * The counts live in this server instance's memory, so on a serverless host each instance keeps its
 * own tally. That is enough to slow down a script hitting one URL repeatedly; for strict limits
 * use a shared store (for example Upstash or Vercel KV).
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (windows.size > 5000) {
    windows.forEach((w, k) => {
      if (w.resetAt <= now) windows.delete(k);
    });
  }

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best guess at the visitor's address behind a proxy. */
export function clientAddress(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
