"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { X } from "lucide-react";

export default function TagsPage() {
  const { tags, resources, deleteTag } = useWorkspace();
  const [selected, setSelected] = useState<string | null>(null);

  const counts = new Map<string, number>();
  for (const r of resources) {
    if (r.trash) continue;
    for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const sortedTags = [...tags].sort((a, b) => (counts.get(b.name) ?? 0) - (counts.get(a.name) ?? 0));

  const filtered = selected
    ? resources.filter((r) => !r.trash && r.tags.includes(selected))
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Tags</h1>

      {sortedTags.length === 0 ? (
        <p className="text-sm text-neutral-500">No tags yet — add tags when saving a resource.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((tag) => (
            <div
              key={tag.id}
              className={`group flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                selected === tag.name
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
              }`}
            >
              <button onClick={() => setSelected(selected === tag.name ? null : tag.name)}>
                {tag.name} <span className="opacity-60">{counts.get(tag.name) ?? 0}</span>
              </button>
              <button
                onClick={() => deleteTag(tag.id)}
                aria-label={`Delete tag ${tag.name}`}
                className="opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="pt-4">
          <ResourceGrid resources={filtered} />
        </div>
      )}
    </div>
  );
}
