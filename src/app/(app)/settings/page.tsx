"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { createBackup, ApiError } from "@/lib/client/api";
import { RefreshCw } from "lucide-react";

interface StatusResponse {
  connected: boolean;
  repository: string;
  branch: string;
  lastBackupAt: string | null;
  lastWriteAt: string | null;
}
interface BackupEntry {
  path: string;
  year: string;
  date: string;
  fileName: string;
}

export default function SettingsPage() {
  const { settings, updateSettings } = useWorkspace();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  async function loadStatus() {
    setStatusError(null);
    try {
      const res = await fetch("/api/github/status");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setStatus(json);
    } catch (err) {
      setStatusError((err as Error).message);
    }
  }

  async function loadBackups() {
    const res = await fetch("/api/github/backup");
    const json = await res.json();
    if (res.ok) setBackups(json.backups);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    loadStatus();
    loadBackups();
  }, []);

  async function handleBackupNow() {
    setBusy("backup");
    try {
      await createBackup("manual");
      await loadBackups();
      await loadStatus();
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : "Backup failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore(path: string) {
    setBusy("restore");
    try {
      const res = await fetch("/api/github/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      window.location.reload();
    } catch (err) {
      setStatusError((err as Error).message);
    } finally {
      setBusy(null);
      setRestoreTarget(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Appearance</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as typeof settings.theme })}
            className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">Density</label>
          <select
            value={settings.density}
            onChange={(e) => updateSettings({ density: e.target.value as typeof settings.density })}
            className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Data &amp; Backup
          </h2>
          <button onClick={loadStatus} aria-label="Refresh status" className="text-neutral-400 hover:text-neutral-700">
            <RefreshCw size={14} />
          </button>
        </div>

        {statusError && <p className="text-sm text-red-600">{statusError}</p>}
        {status && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-neutral-500">GitHub</dt>
            <dd>{status.connected ? "Connected" : "Not connected"}</dd>
            <dt className="text-neutral-500">Repository</dt>
            <dd>{status.repository}</dd>
            <dt className="text-neutral-500">Branch</dt>
            <dd>{status.branch}</dd>
            <dt className="text-neutral-500">Last write</dt>
            <dd>{status.lastWriteAt ?? "never"}</dd>
            <dt className="text-neutral-500">Last backup</dt>
            <dd>{status.lastBackupAt ?? "never"}</dd>
          </dl>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleBackupNow}
            disabled={busy !== null}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {busy === "backup" ? "Backing up…" : "Backup Now"}
          </button>
          <a href="/diagnostics" className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
            Test Connection
          </a>
        </div>

        <div>
          <h3 className="mb-1 mt-3 text-xs font-medium text-neutral-500">Backup history</h3>
          {backups.length === 0 ? (
            <p className="text-sm text-neutral-400">No backups yet.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {backups.map((b) => (
                <li key={b.path} className="flex items-center justify-between rounded border border-neutral-200 px-2 py-1 dark:border-neutral-800">
                  <span className="truncate">{b.fileName}</span>
                  {restoreTarget === b.path ? (
                    <span className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleRestore(b.path)}
                        disabled={busy !== null}
                        className="text-red-600"
                      >
                        {busy === "restore" ? "Restoring…" : "Confirm restore"}
                      </button>
                      <button onClick={() => setRestoreTarget(null)} className="text-neutral-400">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setRestoreTarget(b.path)}
                      className="shrink-0 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
