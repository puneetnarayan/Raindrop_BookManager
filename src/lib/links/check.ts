export type LinkStatus = "healthy" | "redirected" | "warning" | "dead" | "unknown";

export interface LinkCheckResult {
  url: string;
  httpStatus: number | null;
  linkStatus: LinkStatus;
  finalUrl?: string;
}

const USER_AGENT = "Mozilla/5.0 (compatible; RaindropBookManagerLinkChecker/1.0; +link-health-check)";

async function attemptFetch(url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    // We only need the status/headers, not the body — stop the download immediately.
    res.body?.cancel().catch(() => {});
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function classify(status: number): LinkStatus {
  if (status >= 200 && status < 400) return "healthy"; // redirects are re-classified by the caller
  if (status === 401 || status === 403 || status === 429 || status === 503) return "warning";
  if (status >= 400) return "dead";
  return "unknown";
}

/** Checks a single URL. Prefers HEAD (cheapest for the target server); falls back to GET if HEAD isn't supported. */
export async function checkUrl(rawUrl: string, timeoutMs: number): Promise<LinkCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { url: rawUrl, httpStatus: null, linkStatus: "unknown" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { url: rawUrl, httpStatus: null, linkStatus: "unknown" };
  }

  try {
    let res: Response;
    try {
      res = await attemptFetch(rawUrl, "HEAD", timeoutMs);
      if (res.status === 405 || res.status === 501) {
        res = await attemptFetch(rawUrl, "GET", timeoutMs);
      }
    } catch {
      // Some servers reset the connection on HEAD; retry once with GET before giving up.
      res = await attemptFetch(rawUrl, "GET", timeoutMs);
    }

    const redirected = res.redirected || res.url !== rawUrl;
    const linkStatus: LinkStatus = redirected && res.ok ? "redirected" : classify(res.status);
    return {
      url: rawUrl,
      httpStatus: res.status,
      linkStatus,
      finalUrl: res.url !== rawUrl ? res.url : undefined,
    };
  } catch {
    // Timeout, DNS failure, connection refused, etc.
    return { url: rawUrl, httpStatus: null, linkStatus: "dead" };
  }
}

/**
 * Checks many URLs with limited concurrency, so a batch never opens more
 * than a handful of connections to third-party sites at once.
 */
export async function checkUrls(urls: string[], timeoutMs: number, concurrency = 5): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = new Array(urls.length);
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const i = cursor++;
      results[i] = await checkUrl(urls[i], timeoutMs);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results;
}
