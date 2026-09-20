"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";

export default function DeadLinksPage() {
  const { resources } = useWorkspace();
  const flagged = useMemo(
    () =>
      resources
        .filter((r) => !r.trash && (r.linkStatus === "dead" || r.linkStatus === "warning"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [resources]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Dead &amp; Warning Links</h1>
      <p className="text-sm text-neutral-500">
        Resources flagged dead or warning the last time they were checked. Use Settings → Link
        Checking to re-check everything, or select some here and re-check just those.
      </p>
      <SelectableResourceGrid
        resources={flagged}
        emptyLabel="Nothing flagged — run a link check from Settings to populate this."
      />
    </div>
  );
}
