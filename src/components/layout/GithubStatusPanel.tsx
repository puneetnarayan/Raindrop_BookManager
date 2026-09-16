"use client";

import { useWorkspace } from "@/lib/client/workspace-context";
import { RefreshCw } from "lucide-react";

export function GithubStatusPanel() {
  const { githubConnected, githubRepository, saveSignal, reload } = useWorkspace();

  const label =
    githubConnected === null ? "Checking…" : githubConnected ? "Connected" : "Not connected";
  const dotColor =
    githubConnected === null ? "bg-neutral-400" : githubConnected ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div className="space-y-3 px-3 py-3 text-sm">
      <div className="flex items-center gap-2">
        {/* key={saveSignal} restarts the CSS animation on every successful save */}
        <span key={saveSignal} className={`save-pulse inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
        <span className="font-medium">{label}</span>
        <button
          onClick={reload}
          aria-label="Refresh connection status"
          className="ml-auto rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {githubRepository && (
        <p className="truncate text-xs text-neutral-500" title={githubRepository}>
          {githubRepository}
        </p>
      )}

      <p className="text-xs text-neutral-400">
        The dot blinks whenever a change is saved to GitHub.
      </p>

      {githubConnected === false && (
        <a href="/diagnostics" className="btn-pastel-secondary block text-center text-xs">
          Diagnose connection
        </a>
      )}
    </div>
  );
}
