"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/client/workspace-context";
import { pastelTint } from "@/lib/client/colors";

export default function SpacesPage() {
  const { spaces, collections, resources } = useWorkspace();
  const visible = spaces.filter((s) => !s.trash && !s.archived).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Spaces</h1>

      {visible.length === 0 ? (
        <p className="text-sm text-neutral-500">No spaces yet — create one from the sidebar.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((space) => {
            const collectionCount = collections.filter((c) => c.spaceId === space.id && !c.trash && !c.archived).length;
            const resourceCount = resources.filter((r) => r.spaceId === space.id && !r.trash && !r.archived).length;
            return (
              <Link
                key={space.id}
                href={`/space/${space.id}`}
                className="stat-card"
                style={{ backgroundColor: pastelTint(space.color, 0.35) }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: space.color || "#a3a3a3" }} />
                  <p className="font-medium">{space.name}</p>
                </div>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {collectionCount} collection{collectionCount === 1 ? "" : "s"} · {resourceCount} resource
                  {resourceCount === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
