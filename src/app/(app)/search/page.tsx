"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/client/workspace-context";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { pastelTint } from "@/lib/client/colors";
import { Search } from "lucide-react";

type CategoryKey = "spaces" | "collections" | "resources" | "favorites" | "archived" | "trash";

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "spaces", label: "Spaces" },
  { key: "collections", label: "Collections" },
  { key: "resources", label: "Resources" },
  { key: "favorites", label: "Favorites" },
  { key: "archived", label: "Archived" },
  { key: "trash", label: "Trash" },
];

function matches(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => (f || "").toLowerCase().includes(q));
}

export default function SearchPage() {
  const { spaces, collections, resources } = useWorkspace();
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<CategoryKey>>(
    new Set(CATEGORIES.map((c) => c.key))
  );

  function toggleCategory(key: CategoryKey) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const q = query.trim();

  const results = useMemo(() => {
    if (!q) {
      return {
        spaces: [],
        collections: [],
        resources: [],
        favorites: [],
        archived: [],
        trash: [],
      };
    }

    const matchedSpaces = spaces.filter(
      (s) => !s.trash && matches(q, s.name, s.description, s.notes)
    );

    const matchedCollections = collections.filter(
      (c) => !c.trash && matches(q, c.name, c.description, c.notes)
    );

    const resourceMatch = (r: (typeof resources)[number]) =>
      matches(q, r.title, r.url, r.description, r.notes) || r.tags.some((t) => matches(q, t));

    const matchedResources = resources.filter((r) => !r.trash && !r.archived && resourceMatch(r));
    const matchedFavorites = resources.filter((r) => !r.trash && r.favorite && resourceMatch(r));
    const matchedArchived = resources.filter((r) => r.archived && !r.trash && resourceMatch(r));
    const matchedTrash = resources.filter((r) => r.trash && resourceMatch(r));

    return {
      spaces: matchedSpaces,
      collections: matchedCollections,
      resources: matchedResources,
      favorites: matchedFavorites,
      archived: matchedArchived,
      trash: matchedTrash,
    };
  }, [q, spaces, collections, resources]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Search</h1>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-2.5 text-neutral-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything…"
          className="w-full rounded border border-neutral-300 py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = activeCategories.has(c.key);
          const count = q ? results[c.key].length : null;
          return (
            <button
              key={c.key}
              onClick={() => toggleCategory(c.key)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                active
                  ? "bg-violet-100 text-violet-800 hover:bg-violet-200 active:bg-violet-300 dark:bg-violet-900/40 dark:text-violet-200"
                  : "border border-neutral-300 text-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              }`}
            >
              {c.label}
              {count !== null && <span className="ml-1 opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {!q && (
        <p className="text-sm text-neutral-400">
          Start typing to search across Spaces, Collections, Resources, Favorites, Archived and
          Trash. Use the pills above to narrow which categories are searched.
        </p>
      )}

      {q && totalResults === 0 && <p className="text-sm text-neutral-500">No matches for &ldquo;{q}&rdquo;.</p>}

      {q && activeCategories.has("spaces") && results.spaces.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Spaces ({results.spaces.length})
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.spaces.map((s) => (
              <Link
                key={s.id}
                href={`/space/${s.id}`}
                className="stat-card flex items-center gap-2"
                style={{ backgroundColor: pastelTint(s.color, 0.35) }}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color || "#a3a3a3" }} />
                <span className="truncate text-sm font-medium">{s.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {q && activeCategories.has("collections") && results.collections.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Collections ({results.collections.length})
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.collections.map((c) => {
              const space = spaces.find((s) => s.id === c.spaceId);
              return (
                <Link
                  key={c.id}
                  href={`/space/${c.spaceId}?collection=${c.id}`}
                  className="stat-card"
                  style={{ backgroundColor: pastelTint(space?.color, 0.3) }}
                >
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                    {space?.name ?? "Unknown space"}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {q && activeCategories.has("resources") && results.resources.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Resources ({results.resources.length})
          </h2>
          <ResourceGrid resources={results.resources} />
        </section>
      )}

      {q && activeCategories.has("favorites") && results.favorites.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Favorites ({results.favorites.length})
          </h2>
          <ResourceGrid resources={results.favorites} hideViewSwitcher />
        </section>
      )}

      {q && activeCategories.has("archived") && results.archived.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Archived ({results.archived.length})
          </h2>
          <ResourceGrid resources={results.archived} hideViewSwitcher />
        </section>
      )}

      {q && activeCategories.has("trash") && results.trash.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Trash ({results.trash.length})
          </h2>
          <ResourceGrid resources={results.trash} hideViewSwitcher />
        </section>
      )}
    </div>
  );
}
