"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Globe,
  Link2,
  Loader2,
  Pencil,
  Pin,
  PinOff,
  Star,
  Trash2,
} from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";
import { pastelTint } from "@/lib/client/colors";
import { checkLinks } from "@/lib/client/api";
import { EditResourceModal } from "@/components/resources/EditResourceModal";

const LINK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  dead: { label: "Dead link", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  warning: { label: "Warning", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  redirected: { label: "Redirected", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
};

export function ResourceCard({
  resource,
  selectable,
  selected,
  onToggleSelect,
}: {
  resource: Resource;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { updateResource, spaces, settings } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const space = spaces.find((s) => s.id === resource.spaceId);
  const cardBg = pastelTint(space?.color, 0.35);
  const badge = LINK_STATUS_BADGE[resource.linkStatus];

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

  async function handleCheckLink() {
    setCheckingLink(true);
    try {
      const [result] = await checkLinks([resource.url], settings.linkCheckTimeoutMs);
      await updateResource(resource.id, {
        httpStatus: result.httpStatus,
        linkStatus: result.linkStatus,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch {
      // toast shown by context
    } finally {
      setCheckingLink(false);
    }
  }

  return (
    <div
      style={{ backgroundColor: cardBg }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200/60 transition-shadow hover:shadow-md dark:border-neutral-800"
    >
      {/* Darkens the whole card on hover, darker still while clicking — no per-color dark variant needed. */}
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.06] group-active:bg-black/[0.14]" />

      {selectable && (
        <label className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded bg-white/90 shadow dark:bg-neutral-900/90">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            aria-label={`Select ${resource.title || resource.url}`}
            className="h-3.5 w-3.5"
          />
        </label>
      )}

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
            loading="lazy"
            decoding="async"
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
              loading="lazy"
              decoding="async"
              className="mt-0.5 h-4 w-4 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          ) : (
            <Globe size={14} className="mt-0.5 shrink-0 text-neutral-500" />
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
          <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{resource.description}</p>
        )}
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs text-neutral-500">{resource.domain}</p>
          {badge && (
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
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
          onClick={() => setShowEdit(true)}
          aria-label="Edit resource"
          title="Edit resource"
          className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
        >
          <Pencil size={14} />
        </button>
        <button
          disabled={busy || checkingLink}
          onClick={handleCheckLink}
          aria-label="Check link"
          title="Check link"
          className="rounded p-1 text-neutral-500 hover:bg-white/60 dark:hover:bg-black/30"
        >
          {checkingLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
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

      {showEdit && <EditResourceModal resource={resource} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
