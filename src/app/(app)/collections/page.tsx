"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/client/workspace-context";
import { pastelTint } from "@/lib/client/colors";

export default function CollectionsPage() {
  const { spaces, collections, resources } = useWorkspace();
  const visible = collections
    .filter((c) => !c.trash && !c.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

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
            const resourceCount = resources.filter(
              (r) => r.collectionId === collection.id && !r.trash && !r.archived
            ).length;
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
