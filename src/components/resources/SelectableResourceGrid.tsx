"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ViewModeSwitcher } from "@/components/resources/ViewModeSwitcher";
import { BulkActionsBar, BulkContext } from "@/components/resources/BulkActionsBar";

export function SelectableResourceGrid({
  resources,
  context = "active",
  emptyLabel = "No resources here yet.",
  hideViewSwitcher,
  defaultAllSelected = false,
  resetKey,
}: {
  resources: Resource[];
  context?: BulkContext;
  emptyLabel?: string;
  hideViewSwitcher?: boolean;
  /** When true, everything is selected by default (e.g. viewing a single Collection). */
  defaultAllSelected?: boolean;
  /** Changing this re-applies defaultAllSelected — pass something that identifies "which list this is" (e.g. a collection id). */
  resetKey?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultAllSelected ? resources.map((r) => r.id) : [])
  );
  // Re-apply the default only when the identity of "which list" changes (e.g. switching
  // Collections) — not on every resource add/remove, which would fight the user's own
  // selection. This is the React-recommended "adjust state during render" pattern, so it
  // needs no effect.
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (resetKey !== appliedResetKey) {
    setAppliedResetKey(resetKey);
    setSelected(new Set(defaultAllSelected ? resources.map((r) => r.id) : []));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(resources.map((r) => r.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const selectedIds = Array.from(selected).filter((id) => resources.some((r) => r.id === id));

  function openSelected() {
    for (const id of selectedIds) {
      const r = resources.find((x) => x.id === id);
      if (r) window.open(r.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {resources.length > 0 && (
            <>
              <span className="text-neutral-500">
                {selectedIds.length} of {resources.length} selected
              </span>
              <button
                onClick={selectAll}
                className="text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Select all
              </button>
              <button
                onClick={clearAll}
                className="text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Clear all
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={openSelected}
                  className="btn-pastel-secondary flex items-center gap-1 !px-2.5 !py-1 text-xs"
                >
                  <ExternalLink size={12} /> Open selected ({selectedIds.length})
                </button>
              )}
            </>
          )}
        </div>
        {!hideViewSwitcher && <ViewModeSwitcher />}
      </div>

      {selectedIds.length > 0 && (
        <BulkActionsBar selectedIds={selectedIds} context={context} onClear={clearAll} />
      )}

      <ResourceGrid
        resources={resources}
        emptyLabel={emptyLabel}
        selectable
        selectedIds={selected}
        onToggleSelect={toggle}
        hideViewSwitcher
      />
    </div>
  );
}
