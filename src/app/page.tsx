"use client";

import { useState } from "react";

interface StatusResponse {
  connected: boolean;
  repository: string;
  branch: string;
  private: boolean;
  lastBackupAt: string | null;
  lastWriteAt: string | null;
}

interface ApiError {
  error: string;
  message: string;
}

/**
 * Phase 1 diagnostics page: confirms the GitHub data connection, and lets you
 * exercise init / read / write / backup / restore before any real UI exists.
 * Will be replaced by the dashboard in Phase 2.
 */
export default function Home() {
  const [status, setStatus] = useState<StatusResponse | ApiError | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  function appendLog(line: string) {
    setLog((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 30));
  }

  async function call(label: string, path: string, init?: RequestInit) {
    setLoading(label);
    try {
      const res = await fetch(path, init);
      const json = await res.json();
      appendLog(`${label}: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
      return json;
    } catch (err) {
      appendLog(`${label}: request failed - ${(err as Error).message}`);
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function checkStatus() {
    const json = await call("status", "/api/github/status");
    if (json) setStatus(json);
  }

  async function initData() {
    await call("init", "/api/github/init", { method: "POST" });
  }

  async function testWriteSettings() {
    const read = await call("read settings", "/api/github/read?file=settings");
    if (!read) return;
    const updated = { ...read.data, theme: read.data.theme === "dark" ? "light" : "dark" };
    await call("write settings", "/api/github/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: "settings", data: updated, expectedSha: read.sha }),
    });
  }

  async function backupNow() {
    await call("backup", "/api/github/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "manual-test" }),
    });
  }

  async function listBackups() {
    await call("list backups", "/api/github/backup");
  }

  const isError = status && "error" in status;

  return (
    <div className="min-h-screen bg-neutral-50 p-8 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Raindrop BookManager</h1>
          <p className="text-sm text-neutral-500">
            Phase 1 diagnostics — GitHub data connection &amp; backup layer.
          </p>
        </div>

        <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-3 font-medium">Data &amp; Backup status</h2>
          {status ? (
            isError ? (
              <p className="text-sm text-red-600">
                {(status as ApiError).message}
              </p>
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-neutral-500">Repository</dt>
                <dd>{(status as StatusResponse).repository}</dd>
                <dt className="text-neutral-500">Branch</dt>
                <dd>{(status as StatusResponse).branch}</dd>
                <dt className="text-neutral-500">Last write</dt>
                <dd>{(status as StatusResponse).lastWriteAt ?? "never"}</dd>
                <dt className="text-neutral-500">Last backup</dt>
                <dd>{(status as StatusResponse).lastBackupAt ?? "never"}</dd>
              </dl>
            )
          ) : (
            <p className="text-sm text-neutral-500">Not checked yet.</p>
          )}
          <button
            onClick={checkStatus}
            disabled={loading !== null}
            className="mt-3 rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {loading === "status" ? "Checking…" : "Test Connection"}
          </button>
        </section>

        <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-3 font-medium">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={initData} disabled={loading !== null} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">
              Initialize data files
            </button>
            <button onClick={testWriteSettings} disabled={loading !== null} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">
              Test read/write (toggle theme)
            </button>
            <button onClick={backupNow} disabled={loading !== null} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">
              Backup now
            </button>
            <button onClick={listBackups} disabled={loading !== null} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">
              List backups
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-3 font-medium">Log</h2>
          <div className="space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {log.length === 0 && <p>Nothing yet — try an action above.</p>}
            {log.map((line, i) => (
              <p key={i} className="break-all">{line}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
