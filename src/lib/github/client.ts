import { getGitHubConfig } from "./env";

const API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

/** Thrown when a write's expectedSha no longer matches the file on GitHub. */
export class GitHubConflictError extends Error {
  constructor(public path: string) {
    super(`File ${path} was modified since it was last read`);
    this.name = "GitHubConflictError";
  }
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok && res.status !== 404) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      // ignore non-JSON error bodies
    }
    throw new GitHubApiError(
      `GitHub API request failed: ${init.method || "GET"} ${url} -> ${res.status}`,
      res.status,
      body
    );
  }
  return res;
}

export interface RepoFile {
  path: string;
  sha: string;
  content: string; // decoded UTF-8 text
}

/** Fetches a file from the data repo. Returns null if it doesn't exist. */
export async function getFile(path: string): Promise<RepoFile | null> {
  const cfg = getGitHubConfig();
  const url = `${API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(
    path
  )}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await githubFetch(url, { headers: authHeaders(cfg.token), cache: "no-store" });
  if (res.status === 404) return null;

  const json = await res.json();
  if (Array.isArray(json) || json.type !== "file") {
    throw new GitHubApiError(`${path} is not a file`, 400);
  }
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  return { path, sha: json.sha, content };
}

export interface PutFileResult {
  sha: string;
  commitSha: string;
}

/**
 * Creates or updates a file in the data repo.
 * Pass expectedSha (from a prior getFile) when updating an existing file;
 * omit it only when you are sure the file does not exist yet.
 * Throws GitHubConflictError if the file changed remotely since expectedSha was read.
 */
export async function putFile(
  path: string,
  content: string,
  message: string,
  expectedSha?: string | null
): Promise<PutFileResult> {
  const cfg = getGitHubConfig();
  const url = `${API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(path)}`;

  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: cfg.branch,
  };
  if (expectedSha) body.sha = expectedSha;

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...authHeaders(cfg.token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    throw new GitHubConflictError(path);
  }
  if (res.status === 422) {
    // 422 with an sha mismatch also indicates a conflict; other 422s are validation errors.
    const errBody = await res.json().catch(() => undefined);
    const msg = typeof errBody?.message === "string" ? errBody.message : "";
    if (/sha/i.test(msg)) {
      throw new GitHubConflictError(path);
    }
    throw new GitHubApiError(`GitHub rejected write to ${path}: ${msg}`, 422, errBody);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => undefined);
    throw new GitHubApiError(
      `Failed to write ${path} (${res.status})`,
      res.status,
      errBody
    );
  }

  const json = await res.json();
  return { sha: json.content.sha as string, commitSha: json.commit.sha as string };
}

export interface RepoDirEntry {
  path: string;
  type: "file" | "dir";
}

/** Lists entries in a directory. Returns [] if the directory doesn't exist. */
export async function listDir(path: string): Promise<RepoDirEntry[]> {
  const cfg = getGitHubConfig();
  const url = `${API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURI(
    path
  )}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await githubFetch(url, { headers: authHeaders(cfg.token), cache: "no-store" });
  if (res.status === 404) return [];
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map((entry: { path: string; type: string }) => ({
    path: entry.path,
    type: entry.type === "dir" ? "dir" : "file",
  }));
}

export interface RepoInfo {
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

/** Verifies credentials and repo access; used by the "Test Connection" action. */
export async function getRepoInfo(): Promise<RepoInfo> {
  const cfg = getGitHubConfig();
  const url = `${API_BASE}/repos/${cfg.owner}/${cfg.repo}`;
  const res = await githubFetch(url, { headers: authHeaders(cfg.token), cache: "no-store" });
  if (res.status === 404) {
    throw new GitHubApiError("Repository not found or token lacks access", 404);
  }
  const json = await res.json();
  return {
    fullName: json.full_name,
    defaultBranch: json.default_branch,
    private: json.private,
  };
}
