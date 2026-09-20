"use client";

import { Archive, ArchiveRestore, Link2, Loader2, Pencil, Pin, PinOff, Star, Trash2 } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";

export function ResourceActionButtons({
  resource,
  busy,
  checkingLink,
  onEdit,
  onToggle,
  onCheckLink,
  iconSize = 14,
  className,
}: {
  resource: Resource;
  busy: boolean;
  checkingLink: boolean;
  onEdit: () => void;
  onToggle: (patch: Partial<Resource>) => void;
  onCheckLink: () => void;
  iconSize?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        disabled={busy}
        onClick={onEdit}
        aria-label="Edit resource"
        title="Edit resource"
        className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
      >
        <Pencil size={iconSize} />
      </button>
      <button
        disabled={busy || checkingLink}
        onClick={onCheckLink}
        aria-label="Check link"
        title="Check link"
        className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
      >
        {checkingLink ? <Loader2 size={iconSize} className="animate-spin" /> : <Link2 size={iconSize} />}
      </button>
      <button
        disabled={busy}
        onClick={() => onToggle({ favorite: !resource.favorite })}
        aria-label={resource.favorite ? "Unfavorite" : "Favorite"}
        className={`rounded p-1 hover:bg-white/60 dark:hover:bg-black/30 ${resource.favorite ? "text-amber-600" : "text-neutral-500"}`}
      >
        <Star size={iconSize} fill={resource.favorite ? "currentColor" : "none"} />
      </button>
      <button
        disabled={busy}
        onClick={() => onToggle({ pinned: !resource.pinned })}
        aria-label={resource.pinned ? "Unpin" : "Pin"}
        className={`rounded p-1 hover:bg-white/60 dark:hover:bg-black/30 ${resource.pinned ? "text-sky-600" : "text-neutral-500"}`}
      >
        {resource.pinned ? <PinOff size={iconSize} /> : <Pin size={iconSize} />}
      </button>
      {resource.archived ? (
        <button
          disabled={busy}
          onClick={() => onToggle({ archived: false })}
          aria-label="Unarchive"
          className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
        >
          <ArchiveRestore size={iconSize} />
        </button>
      ) : (
        <button
          disabled={busy}
          onClick={() => onToggle({ archived: true })}
          aria-label="Archive"
          className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
        >
          <Archive size={iconSize} />
        </button>
      )}
      <button
        disabled={busy}
        onClick={() => onToggle({ trash: true, archived: false })}
        aria-label="Move to Trash"
        className="rounded p-1 text-neutral-500 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950"
      >
        <Trash2 size={iconSize} />
      </button>
    </div>
  );
}
