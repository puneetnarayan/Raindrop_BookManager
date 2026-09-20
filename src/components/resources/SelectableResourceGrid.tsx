"use client";

import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ViewModeSwitcher } from "@/components/resources/ViewModeSwitcher";
import { BulkActionsBar, BulkContext } from "@/components/resources/BulkActionsBar";

export function SelectableResourceGrid({
  resources,
  context = "active",
  emptyLabel = "No resources here yet.",
}: {
  resources: Resource[];
  context?: BulkContext;
  emptyLabel?: string;
}) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectionMode() {
    setSelectionMode((v) => !v);
    setSelected(new Set());
  }

  function selectAll() {
    setSelected(new Set(resources.map((r) => r.id)));
  }

  const selectedIds = Array.from(selected).filter((id) => resources.some((r) => r.id === id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectionMode}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
              selectionMode
                ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                : "border border-neutral-300 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            }`}
          >
            {selectionMode ? <CheckSquare size={13} /> : <Square size={13} />}
            Select
          </button>
          {selectionMode && resources.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Select all ({resources.length})
            </button>
          )}
        </div>
        <ViewModeSwitcher />
      </div>

      {selectionMode && (
        <BulkActionsBar
          selectedIds={selectedIds}
          context={context}
          onClear={() => setSelected(new Set())}
        />
      )}

      <ResourceGrid
        resources={resources}
        emptyLabel={emptyLabel}
        selectable={selectionMode}
        selectedIds={selected}
        onToggleSelect={toggle}
        hideViewSwitcher
      />
    </div>
  );
}
