import { DataFileKey, DataFileValue } from "@/lib/data/files";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "conflict");
    this.name = "ConflictError";
  }
}

async function parseErrorBody(res: Response): Promise<{ message: string; error: string }> {
  try {
    const body = await res.json();
    return { message: body.message || res.statusText, error: body.error || "error" };
  } catch {
    return { message: res.statusText, error: "error" };
  }
}

export async function readFile<K extends DataFileKey>(
  file: K
): Promise<{ data: DataFileValue<K>; sha: string | null }> {
  const res = await fetch(`/api/github/read?file=${file}`, { cache: "no-store" });
  if (!res.ok) {
    const { message, error } = await parseErrorBody(res);
    throw new ApiError(message, res.status, error);
  }
  return res.json();
}

export async function writeFile<K extends DataFileKey>(
  file: K,
  data: DataFileValue<K>,
  expectedSha: string | null,
  message?: string
): Promise<{ sha: string }> {
  const res = await fetch("/api/github/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, data, expectedSha, message }),
  });
  if (!res.ok) {
    const { message: msg, error } = await parseErrorBody(res);
    if (res.status === 409) throw new ConflictError(msg);
    throw new ApiError(msg, res.status, error);
  }
  return res.json();
}

export async function createBackup(reason: string) {
  const res = await fetch("/api/github/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const { message, error } = await parseErrorBody(res);
    throw new ApiError(message, res.status, error);
  }
  return res.json();
}

export interface UrlMetadata {
  title: string;
  description: string;
  favicon: string | null;
  thumbnail: string | null;
  domain: string;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type LinkStatus = "healthy" | "redirected" | "warning" | "dead" | "unknown";

export interface LinkCheckResult {
  url: string;
  httpStatus: number | null;
  linkStatus: LinkStatus;
  finalUrl?: string;
}

const LINK_CHECK_BATCH_SIZE = 25;

async function checkLinksBatch(urls: string[], timeoutMs?: number): Promise<LinkCheckResult[]> {
  const res = await fetch("/api/links/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, timeoutMs }),
  });
  if (!res.ok) {
    const { message, error } = await parseErrorBody(res);
    throw new ApiError(message, res.status, error);
  }
  const json = await res.json();
  return json.results;
}

/**
 * Checks any number of URLs, chunking into batches the server will accept
 * and running batches sequentially (never many at once) so a large check
 * doesn't hammer either our own server or the sites being checked.
 */
export async function checkLinks(
  urls: string[],
  timeoutMs?: number,
  onProgress?: (checked: number, total: number) => void
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];
  for (let i = 0; i < urls.length; i += LINK_CHECK_BATCH_SIZE) {
    const batch = urls.slice(i, i + LINK_CHECK_BATCH_SIZE);
    const batchResults = await checkLinksBatch(batch, timeoutMs);
    results.push(...batchResults);
    onProgress?.(results.length, urls.length);
  }
  return results;
}
