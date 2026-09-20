"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";

export default function AllResourcesPage() {
  const { resources } = useWorkspace();
  const visible = useMemo(
    () =>
      resources
        .filter((r) => !r.trash && !r.archived)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [resources]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">All Resources</h1>
      <SelectableResourceGrid resources={visible} emptyLabel="No resources saved yet." />
    </div>
  );
}
