import { getFile, listDir, putFile } from "@/lib/github/client";
import { readAllData, writeData } from "@/lib/data/store";
import { DATA_FILES, DataFileKey } from "@/lib/data/files";

function timestampParts(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return { year, isoDate: `${year}-${month}-${day}`, time: `${hh}-${mm}-${ss}` };
}

export interface BackupResult {
  path: string;
  commitSha: string;
  createdAt: string;
}

/**
 * Snapshots every data file into a single timestamped JSON file under backups/.
 * Call this before any destructive or bulk operation, and on demand from Settings.
 */
export async function createBackup(reason: string): Promise<BackupResult> {
  const now = new Date();
  const { year, isoDate, time } = timestampParts(now);
  const safeReason = reason.replace(/[^a-zA-Z0-9-]+/g, "-").slice(0, 60);
  const path = `backups/${year}/${isoDate}/backup-${time}-${safeReason}.json`;

  const data = await readAllData();
  const snapshot = {
    createdAt: now.toISOString(),
    reason,
    data,
  };

  const result = await putFile(
    path,
    JSON.stringify(snapshot, null, 2) + "\n",
    `chore(backup): ${reason}`
  );

  // Best-effort metadata update; failure here should not fail the backup itself.
  try {
    const meta = await getFile(DATA_FILES.metadata.path);
    const parsed = meta ? JSON.parse(meta.content) : {};
    await writeData(
      "metadata",
      { ...parsed, lastBackupAt: now.toISOString(), schemaVersion: parsed.schemaVersion ?? 1 },
      { expectedSha: meta?.sha ?? null, message: "chore(data): record last backup time" }
    );
  } catch {
    // non-fatal
  }

  return { path, commitSha: result.commitSha, createdAt: now.toISOString() };
}

export interface BackupListEntry {
  path: string;
  year: string;
  date: string;
  fileName: string;
}

/** Lists all backup files, most recent first. */
export async function listBackups(): Promise<BackupListEntry[]> {
  const years = await listDir("backups");
  const entries: BackupListEntry[] = [];

  for (const yearEntry of years.filter((e) => e.type === "dir")) {
    const year = yearEntry.path.split("/").pop()!;
    const days = await listDir(yearEntry.path);
    for (const dayEntry of days.filter((e) => e.type === "dir")) {
      const date = dayEntry.path.split("/").pop()!;
      const files = await listDir(dayEntry.path);
      for (const fileEntry of files.filter((e) => e.type === "file")) {
        entries.push({
          path: fileEntry.path,
          year,
          date,
          fileName: fileEntry.path.split("/").pop()!,
        });
      }
    }
  }

  entries.sort((a, b) => b.path.localeCompare(a.path));
  return entries;
}

export interface BackupSnapshot {
  createdAt: string;
  reason: string;
  data: Record<DataFileKey, unknown>;
}

/** Reads a specific backup snapshot's full content. */
export async function readBackup(path: string): Promise<BackupSnapshot> {
  const file = await getFile(path);
  if (!file) {
    throw new Error(`Backup not found: ${path}`);
  }
  return JSON.parse(file.content) as BackupSnapshot;
}

/**
 * Restores every data file from a backup snapshot.
 * Always creates a fresh backup of current state first, so a bad restore is itself recoverable.
 */
export async function restoreBackup(path: string): Promise<{ preRestoreBackupPath: string }> {
  const pre = await createBackup(`before-restore-${path.split("/").pop()}`);
  const snapshot = await readBackup(path);

  const keys = Object.keys(DATA_FILES) as DataFileKey[];
  for (const key of keys) {
    const value = snapshot.data[key];
    if (value === undefined) continue;
    const current = await getFile(DATA_FILES[key].path);
    await writeData(key, value as never, {
      expectedSha: current?.sha ?? null,
      message: `chore(restore): restore ${key} from ${path}`,
    });
  }

  return { preRestoreBackupPath: pre.path };
}
