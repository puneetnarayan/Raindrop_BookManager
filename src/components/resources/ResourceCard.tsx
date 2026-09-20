"use client";

import { memo } from "react";
import { Globe } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";
import { pastelTint } from "@/lib/client/colors";
import { useResourceCardActions } from "@/lib/client/useResourceCardActions";
import { ResourceActionButtons } from "@/components/resources/ResourceActionButtons";
import { EditResourceModal } from "@/components/resources/EditResourceModal";

function ResourceCardImpl({
  resource,
  size = "large",
  selectable,
  selected,
  onToggleSelect,
}: {
  resource: Resource;
  size?: "compact" | "large";
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { spaces } = useWorkspace();
  const { busy, checkingLink, showEdit, setShowEdit, toggle, handleOpen, handleCheckLink, badge } =
    useResourceCardActions(resource);

  const space = spaces.find((s) => s.id === resource.spaceId);
  const cardBg = pastelTint(space?.color, 0.35);
  const large = size === "large";

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
            onChange={() => onToggleSelect?.(resource.id)}
            aria-label={`Select ${resource.title || resource.url}`}
            className="h-3.5 w-3.5"
          />
        </label>
      )}

      {large && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={handleOpen} className="block">
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
      )}

      <div className={`relative flex flex-1 flex-col gap-1 ${large ? "p-3" : "p-2.5"}`}>
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
            className={`${large ? "line-clamp-2" : "line-clamp-1"} text-sm font-medium hover:underline`}
          >
            {resource.title || resource.url}
          </a>
        </div>
        {large && resource.description && (
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
        {large && resource.tags.length > 0 && (
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

      <ResourceActionButtons
        resource={resource}
        busy={busy}
        checkingLink={checkingLink}
        onEdit={() => setShowEdit(true)}
        onToggle={toggle}
        onCheckLink={handleCheckLink}
        className="relative flex items-center justify-end gap-1 border-t border-black/5 p-1.5 opacity-0 transition group-hover:opacity-100 dark:border-white/10"
      />

      {showEdit && <EditResourceModal resource={resource} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

// Resource updates keep unaffected resource objects referentially equal (see workspace-context's
// commit() map), so memoizing here skips re-rendering every other card whenever one changes.
export const ResourceCard = memo(ResourceCardImpl);
