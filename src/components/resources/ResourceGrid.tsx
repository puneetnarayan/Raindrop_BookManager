"use client";

import { Inbox } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceListRow } from "@/components/resources/ResourceListRow";
import { ViewModeSwitcher } from "@/components/resources/ViewModeSwitcher";

export function ResourceGrid({
  resources,
  emptyLabel = "No resources here yet.",
  selectable,
  selectedIds,
  onToggleSelect,
  hideViewSwitcher,
}: {
  resources: Resource[];
  emptyLabel?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  hideViewSwitcher?: boolean;
}) {
  const { settings } = useWorkspace();
  const mode = settings.resourceViewMode;

  return (
    <div className="space-y-3">
      {!hideViewSwitcher && (
        <div className="flex justify-end">
          <ViewModeSwitcher />
        </div>
      )}

      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-16 text-neutral-400 dark:border-neutral-700">
          <Inbox size={28} />
          <p className="text-sm">{emptyLabel}</p>
        </div>
      ) : mode === "list" ? (
        <div className="overflow-hidden rounded-lg border border-neutral-200/60 dark:border-neutral-800">
          {resources.map((r) => (
            <ResourceListRow
              key={r.id}
              resource={r}
              selectable={selectable}
              selected={selectedIds?.has(r.id)}
              onToggleSelect={() => onToggleSelect?.(r.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            mode === "compact" ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              size={mode === "compact" ? "compact" : "large"}
              selectable={selectable}
              selected={selectedIds?.has(r.id)}
              onToggleSelect={() => onToggleSelect?.(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
