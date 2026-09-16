"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Globe, Pin, PinOff, Star, Trash2 } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";

export function ResourceCard({ resource }: { resource: Resource }) {
  const { updateResource } = useWorkspace();
  const [busy, setBusy] = useState(false);

  async function toggle(patch: Partial<Resource>) {
    setBusy(true);
    try {
      await updateResource(resource.id, patch);
      if (patch.lastOpenedAt === undefined) return;
    } catch {
      // toast shown by context
    } finally {
      setBusy(false);
    }
  }

  function handleOpen() {
    updateResource(resource.id, { lastOpenedAt: new Date().toISOString() }).catch(() => {});
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="block"
      >
        {resource.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.thumbnail}
            alt=""
            className="h-32 w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
            <Globe size={28} className="text-neutral-300 dark:text-neutral-600" />
          </div>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start gap-2">
          {resource.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.favicon}
              alt=""
              className="mt-0.5 h-4 w-4 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          ) : (
            <Globe size={14} className="mt-0.5 shrink-0 text-neutral-400" />
          )}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpen}
            className="line-clamp-2 text-sm font-medium hover:underline"
          >
            {resource.title || resource.url}
          </a>
        </div>
        {resource.description && (
          <p className="line-clamp-2 text-xs text-neutral-500">{resource.description}</p>
        )}
        <p className="truncate text-xs text-neutral-400">{resource.domain}</p>
        {resource.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 border-t border-neutral-100 p-1.5 opacity-0 transition group-hover:opacity-100 dark:border-neutral-800">
        <button
          disabled={busy}
          onClick={() => toggle({ favorite: !resource.favorite })}
          aria-label={resource.favorite ? "Unfavorite" : "Favorite"}
          className={`rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${resource.favorite ? "text-yellow-500" : "text-neutral-400"}`}
        >
          <Star size={14} fill={resource.favorite ? "currentColor" : "none"} />
        </button>
        <button
          disabled={busy}
          onClick={() => toggle({ pinned: !resource.pinned })}
          aria-label={resource.pinned ? "Unpin" : "Pin"}
          className={`rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${resource.pinned ? "text-blue-500" : "text-neutral-400"}`}
        >
          {resource.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        {resource.archived ? (
          <button
            disabled={busy}
            onClick={() => toggle({ archived: false })}
            aria-label="Unarchive"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ArchiveRestore size={14} />
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={() => toggle({ archived: true })}
            aria-label="Archive"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Archive size={14} />
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => toggle({ trash: true, archived: false })}
          aria-label="Move to Trash"
          className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
