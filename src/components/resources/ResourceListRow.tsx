"use client";

import { Globe } from "lucide-react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";
import { useResourceCardActions } from "@/lib/client/useResourceCardActions";
import { ResourceActionButtons } from "@/components/resources/ResourceActionButtons";
import { EditResourceModal } from "@/components/resources/EditResourceModal";

export function ResourceListRow({
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
  const { spaces } = useWorkspace();
  const { busy, checkingLink, showEdit, setShowEdit, toggle, handleOpen, handleCheckLink, badge } =
    useResourceCardActions(resource);
  const space = spaces.find((s) => s.id === resource.spaceId);

  return (
    <div className="group flex items-center gap-3 border-b border-neutral-200/60 px-2 py-2 hover:bg-black/[0.03] dark:border-neutral-800 dark:hover:bg-white/[0.04]">
      {selectable && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggleSelect}
          aria-label={`Select ${resource.title || resource.url}`}
          className="h-3.5 w-3.5 shrink-0"
        />
      )}

      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: space?.color || "#a3a3a3" }}
        title={space?.name}
      />

      {resource.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resource.favicon}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-4 w-4 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      ) : (
        <Globe size={14} className="shrink-0 text-neutral-500" />
      )}

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
      >
        {resource.title || resource.url}
      </a>

      <span className="hidden shrink-0 truncate text-xs text-neutral-500 sm:block sm:max-w-[14rem]">
        {resource.domain}
      </span>

      {badge && (
        <span className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline ${badge.className}`}>
          {badge.label}
        </span>
      )}

      {resource.tags.length > 0 && (
        <div className="hidden shrink-0 gap-1 md:flex">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-white/10 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <ResourceActionButtons
        resource={resource}
        busy={busy}
        checkingLink={checkingLink}
        onEdit={() => setShowEdit(true)}
        onToggle={toggle}
        onCheckLink={handleCheckLink}
        iconSize={13}
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100"
      />

      {showEdit && <EditResourceModal resource={resource} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
