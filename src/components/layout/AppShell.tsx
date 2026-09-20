"use client";

import { useCallback, useState } from "react";
import { Loader2, Menu, TriangleAlert } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-neutral-200 p-2 dark:border-neutral-800 sm:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-medium">Raindrop BookManager</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Toast />
      {showAddResource && <AddResourceModal onClose={() => setShowAddResource(false)} />}
      {showSaveSession && <SaveSessionModal onClose={() => setShowSaveSession(false)} />}
      {showShortcutsHelp && <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />}
    </div>
  );
}
