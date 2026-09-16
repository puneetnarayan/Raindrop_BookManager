"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Globe, Pencil, Pin, PinOff, Star, Trash2 } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";
import { pastelTint } from "@/lib/client/colors";

export function ResourceCard({ resource }: { resource: Resource }) {
  const { updateResource, spaces } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(resource.title);

  const space = spaces.find((s) => s.id === resource.spaceId);
  const cardBg = pastelTint(space?.color, 0.35);

  async function toggle(patch: Partial<Resource>) {
    setBusy(true);
    try {
      await updateResource(resource.id, patch);
    } catch {
      // toast shown by context
    } finally {
      setBusy(false);
    }
  }

  function handleOpen() {
    updateResource(resource.id, { lastOpenedAt: new Date().toISOString() }).catch(() => {});
  }

  function saveTitle() {
    const trimmed = titleDraft.trim();
    setEditingTitle(false);
    if (trimmed && trimmed !== resource.title) {
      updateResource(resource.id, { title: trimmed }).catch(() => {});
    } else {
      setTitleDraft(resource.title);
    }
  }

  return (
    <div
      style={{ backgroundColor: cardBg }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200/60 transition-shadow hover:shadow-md dark:border-neutral-800"
    >
      {/* Darkens the whole card on hover, darker still while clicking — no per-color dark variant needed. */}
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.06] group-active:bg-black/[0.14]" />

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
          <div className="flex h-32 w-full items-center justify-center bg-black/5 dark:bg-white/5">
            <Globe size={28} className="text-neutral-400 dark:text-neutral-600" />
          </div>
        )}
      </a>

      <div className="relative flex flex-1 flex-col gap-1 p-3">
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
            <Globe size={14} className="mt-0.5 shrink-0 text-neutral-500" />
          )}

          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setTitleDraft(resource.title);
                  setEditingTitle(false);
                }
              }}
              onClick={(e) => e.preventDefault()}
              className="w-full rounded border border-violet-300 bg-white/90 px-1 py-0.5 text-sm dark:bg-neutral-900"
            />
          ) : (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpen}
              className="line-clamp-2 text-sm font-medium hover:underline"
            >
              {resource.title || resource.url}
            </a>
          )}
        </div>
        {resource.description && (
          <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{resource.description}</p>
        )}
        <p className="truncate text-xs text-neutral-500">{resource.domain}</p>
        {resource.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-neutral-700 dark:bg-black/20 dark:text-neutral-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-end gap-1 border-t border-black/5 p-1.5 opacity-0 transition group-hover:opacity-100 dark:border-white/10">
        <button
          disabled={busy}
          onClick={() => {
            setTitleDraft(resource.title);
            setEditingTitle(true);
          }}
          aria-label="Edit title"
          className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
        >
          <Pencil size={14} />
        </button>
        <button
          disabled={busy}
          onClick={() => toggle({ favorite: !resource.favorite })}
          aria-label={resource.favorite ? "Unfavorite" : "Favorite"}
          className={`rounded p-1 hover:bg-white/60 dark:hover:bg-black/30 ${resource.favorite ? "text-amber-600" : "text-neutral-500"}`}
        >
          <Star size={14} fill={resource.favorite ? "currentColor" : "none"} />
        </button>
        <button
          disabled={busy}
          onClick={() => toggle({ pinned: !resource.pinned })}
          aria-label={resource.pinned ? "Unpin" : "Pin"}
          className={`rounded p-1 hover:bg-white/60 dark:hover:bg-black/30 ${resource.pinned ? "text-sky-600" : "text-neutral-500"}`}
        >
          {resource.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        {resource.archived ? (
          <button
            disabled={busy}
            onClick={() => toggle({ archived: false })}
            aria-label="Unarchive"
            className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
          >
            <ArchiveRestore size={14} />
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={() => toggle({ archived: true })}
            aria-label="Archive"
            className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
          >
            <Archive size={14} />
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => toggle({ trash: true, archived: false })}
          aria-label="Move to Trash"
          className="rounded p-1 text-neutral-500 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
