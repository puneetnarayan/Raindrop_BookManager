"use client";

import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";
import { ArchiveRestore } from "lucide-react";

export default function ArchivePage() {
  const { resources, collections, spaces, updateCollection, updateSpace } = useWorkspace();

  const archivedResources = resources.filter((r) => r.archived && !r.trash);
  const archivedCollections = collections.filter((c) => c.archived && !c.trash);
  const archivedSpaces = spaces.filter((s) => s.archived && !s.trash);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Archive</h1>

      {archivedSpaces.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Spaces
          </h2>
          <ul className="space-y-1">
            {archivedSpaces.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                {s.name}
                <button
                  onClick={() => updateSpace(s.id, { archived: false })}
                  className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <ArchiveRestore size={14} /> Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {archivedCollections.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Collections
          </h2>
          <ul className="space-y-1">
            {archivedCollections.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                {c.name}
                <button
                  onClick={() => updateCollection(c.id, { archived: false })}
                  className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <ArchiveRestore size={14} /> Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Resources
        </h2>
        <SelectableResourceGrid
          resources={archivedResources}
          context="archive"
          emptyLabel="Nothing archived yet."
        />
      </section>
    </div>
  );
}
