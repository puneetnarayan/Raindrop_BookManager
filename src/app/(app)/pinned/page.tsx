"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";

export default function PinnedPage() {
  const { resources } = useWorkspace();
  const visible = useMemo(
    () =>
      resources
        .filter((r) => r.pinned && !r.trash)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [resources]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Pinned</h1>
      <SelectableResourceGrid resources={visible} emptyLabel="Pin a resource to see it here." />
    </div>
  );
}
