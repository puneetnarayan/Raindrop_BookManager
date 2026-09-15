export class GitHubConfigError extends Error {}

export interface GitHubDataConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

/**
 * Reads the GitHub data-repo configuration from server-only env vars.
 * Never import this module from client components.
 */
export function getGitHubConfig(): GitHubDataConfig {
  const owner = process.env.GITHUB_DATA_OWNER;
  const repo = process.env.GITHUB_DATA_REPO;
  const branch = process.env.GITHUB_DATA_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;

  const missing: string[] = [];
  if (!owner) missing.push("GITHUB_DATA_OWNER");
  if (!repo) missing.push("GITHUB_DATA_REPO");
  if (!token) missing.push("GITHUB_TOKEN");

  if (missing.length > 0) {
    throw new GitHubConfigError(
      `Missing required environment variable(s): ${missing.join(", ")}`
    );
  }

  return { owner: owner!, repo: repo!, branch, token: token! };
}
