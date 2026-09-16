"use client";

import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";

export default function FavoritesPage() {
  const { resources } = useWorkspace();
  const visible = resources
    .filter((r) => r.favorite && !r.trash)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Favorites</h1>
      <SelectableResourceGrid resources={visible} emptyLabel="Star a resource to see it here." />
    </div>
  );
}
