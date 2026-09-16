"use client";

import { useWorkspace } from "@/lib/client/workspace-context";
import { useEffect } from "react";

export function Toast() {
  const { toast, dismissToast } = useWorkspace();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 6000);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
    >
      <div className="flex items-start justify-between gap-3">
        <span>{toast}</span>
        <button onClick={dismissToast} className="shrink-0 opacity-70 hover:opacity-100">
          Dismiss
        </button>
      </div>
    </div>
  );
}
