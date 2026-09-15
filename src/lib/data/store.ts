import { z } from "zod";
import { getFile, putFile, GitHubConflictError } from "@/lib/github/client";
import { DATA_FILES, DataFileKey, DataFileValue } from "@/lib/data/files";

export class DataValidationError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = "DataValidationError";
  }
}

export interface ReadResult<K extends DataFileKey> {
  data: DataFileValue<K>;
  sha: string | null; // null means the file doesn't exist yet (default value returned)
}

/** Reads and validates a data file. Returns the schema default if the file doesn't exist yet. */
export async function readData<K extends DataFileKey>(key: K): Promise<ReadResult<K>> {
  const def = DATA_FILES[key];
  const file = await getFile(def.path);

  if (!file) {
    return { data: def.default as DataFileValue<K>, sha: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(file.content);
  } catch {
    throw new DataValidationError(`${def.path} contains invalid JSON`, []);
  }

  const result = def.schema.safeParse(parsed);
  if (!result.success) {
    throw new DataValidationError(
      `${def.path} failed schema validation`,
      result.error.issues
    );
  }

  return { data: result.data as DataFileValue<K>, sha: file.sha };
}

export interface WriteOptions {
  message?: string;
  /** sha previously returned by readData(); omit only for a brand-new file. */
  expectedSha?: string | null;
}

export interface WriteResult {
  sha: string;
  commitSha: string;
}

/**
 * Validates and writes a data file. Throws GitHubConflictError if the file
 * was modified remotely since expectedSha was read — callers must not
 * swallow this; surface it to the user so they can re-read and retry.
 */
export async function writeData<K extends DataFileKey>(
  key: K,
  data: DataFileValue<K>,
  options: WriteOptions = {}
): Promise<WriteResult> {
  const def = DATA_FILES[key];

  const result = def.schema.safeParse(data);
  if (!result.success) {
    throw new DataValidationError(
      `Refusing to write invalid data to ${def.path}`,
      result.error.issues
    );
  }

  const content = JSON.stringify(result.data, null, 2) + "\n";
  const message = options.message || `chore(data): update ${def.path}`;

  try {
    return await putFile(def.path, content, message, options.expectedSha);
  } catch (err) {
    if (err instanceof GitHubConflictError) {
      throw err;
    }
    throw err;
  }
}

/** Reads every data file at once. Used for full backups and export. */
export async function readAllData(): Promise<Record<DataFileKey, unknown>> {
  const keys = Object.keys(DATA_FILES) as DataFileKey[];
  const entries = await Promise.all(
    keys.map(async (key) => [key, (await readData(key)).data] as const)
  );
  return Object.fromEntries(entries) as Record<DataFileKey, unknown>;
}
