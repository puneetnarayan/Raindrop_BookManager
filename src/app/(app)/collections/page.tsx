"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { pastelTint } from "@/lib/client/colors";

export default function CollectionsPage() {
  const { spaces, collections, resources } = useWorkspace();
  const visible = useMemo(
    () => collections.filter((c) => !c.trash && !c.archived).sort((a, b) => a.sortOrder - b.sortOrder),
    [collections]
  );

  // A count map is O(collections + resources) instead of filtering the whole
  // resource list once per collection card (O(collections * resources)).
  const resourceCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resources) {
      if (r.trash || r.archived) continue;
      map.set(r.collectionId, (map.get(r.collectionId) ?? 0) + 1);
    }
    return map;
  }, [resources]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Collections</h1>

      {visible.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No collections yet — open a Space and create one there.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((collection) => {
            const space = spaces.find((s) => s.id === collection.spaceId);
            const resourceCount = resourceCounts.get(collection.id) ?? 0;
            return (
              <Link
                key={collection.id}
                href={`/space/${collection.spaceId}?collection=${collection.id}`}
                className="stat-card"
                style={{ backgroundColor: pastelTint(space?.color, 0.3) }}
              >
                <p className="font-medium">{collection.name}</p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {space?.name ?? "Unknown space"} · {resourceCount} resource{resourceCount === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
