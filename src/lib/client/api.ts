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
