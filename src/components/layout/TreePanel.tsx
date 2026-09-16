"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";

export function TreePanel() {
  const { spaces, collections, resources } = useWorkspace();
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  const visibleSpaces = spaces
    .filter((s) => !s.trash && !s.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (visibleSpaces.length === 0) {
    return <p className="px-3 py-3 text-xs text-neutral-400">No spaces yet.</p>;
  }

  return (
    <div className="space-y-0.5 px-2 py-2 text-sm">
      {visibleSpaces.map((space) => {
        const spaceOpen = expandedSpaces.has(space.id);
        const spaceCollections = collections
          .filter((c) => c.spaceId === space.id && !c.trash && !c.archived)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div key={space.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggle(expandedSpaces, setExpandedSpaces, space.id)}
                aria-label={spaceOpen ? "Collapse" : "Expand"}
                className="rounded p-0.5 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                {spaceOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: space.color || "#a3a3a3" }} />
              <Link href={`/space/${space.id}`} className="truncate py-1 hover:underline">
                {space.name}
              </Link>
            </div>

            {spaceOpen && (
              <div className="ml-5 space-y-0.5 border-l border-neutral-200 pl-2 dark:border-neutral-800">
                {spaceCollections.length === 0 && (
                  <p className="py-1 text-xs text-neutral-400">No collections</p>
                )}
                {spaceCollections.map((collection) => {
                  const collectionOpen = expandedCollections.has(collection.id);
                  const collectionResources = resources
                    .filter((r) => r.collectionId === collection.id && !r.trash && !r.archived)
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

                  return (
                    <div key={collection.id}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggle(expandedCollections, setExpandedCollections, collection.id)}
                          aria-label={collectionOpen ? "Collapse" : "Expand"}
                          className="rounded p-0.5 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        >
                          {collectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        <Folder size={13} className="shrink-0 text-neutral-400" />
                        <Link
                          href={`/space/${space.id}?collection=${collection.id}`}
                          className="truncate py-1 text-neutral-600 hover:underline dark:text-neutral-400"
                        >
                          {collection.name}
                        </Link>
                      </div>

                      {collectionOpen && (
                        <div className="ml-5 space-y-0.5 border-l border-neutral-200 pl-2 dark:border-neutral-800">
                          {collectionResources.length === 0 && (
                            <p className="py-1 text-xs text-neutral-400">No resources</p>
                          )}
                          {collectionResources.map((r) => (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 truncate py-1 text-xs text-neutral-500 hover:underline dark:text-neutral-500"
                              title={r.title || r.url}
                            >
                              <FileText size={12} className="shrink-0" />
                              <span className="truncate">{r.title || r.url}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
