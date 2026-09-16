"use client";

import { useCallback, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/common/Toast";
import { AddResourceModal } from "@/components/resources/AddResourceModal";
import { SaveSessionModal } from "@/components/resources/SaveSessionModal";
import { KeyboardShortcutsHelp } from "@/components/layout/KeyboardShortcutsHelp";
import { useGlobalShortcuts } from "@/lib/client/shortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loadState, loadError, reload } = useWorkspace();
  const [showAddResource, setShowAddResource] = useState(false);
  const [showSaveSession, setShowSaveSession] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  useGlobalShortcuts({
    onAddResource: useCallback(() => setShowAddResource(true), []),
    onShowHelp: useCallback(() => setShowShortcutsHelp(true), []),
  });

  if (loadState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-neutral-500">
        <Loader2 size={18} className="animate-spin" /> Loading workspace…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <TriangleAlert size={28} className="text-red-500" />
        <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-400">{loadError}</p>
        <p className="max-w-sm text-xs text-neutral-400">
          Check that GITHUB_DATA_OWNER, GITHUB_DATA_REPO and GITHUB_TOKEN are configured, then
          retry.
        </p>
        <button
          onClick={reload}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          Retry
        </button>
        <a href="/diagnostics" className="text-xs text-neutral-400 underline">
          Open diagnostics
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <Sidebar
        onAddResource={() => setShowAddResource(true)}
        onSaveSession={() => setShowSaveSession(true)}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Toast />
      {showAddResource && <AddResourceModal onClose={() => setShowAddResource(false)} />}
      {showSaveSession && <SaveSessionModal onClose={() => setShowSaveSession(false)} />}
      {showShortcutsHelp && <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />}
    </div>
  );
}
