"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { Search } from "lucide-react";

export default function SearchPage() {
  const { resources } = useWorkspace();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return resources.filter((r) => {
      if (r.trash) return false;
      return (
        r.title.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, resources]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Search</h1>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-2.5 text-neutral-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, URLs, descriptions, notes, tags…"
          className="w-full rounded border border-neutral-300 py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>
      <p className="text-xs text-neutral-400">
        Basic search across titles/URLs/descriptions/notes/tags. Filters, sorting and keyboard
        shortcut (⌘K) land in Phase 3.
      </p>
      {query.trim() && <ResourceGrid resources={results} emptyLabel="No matches." />}
    </div>
  );
}
