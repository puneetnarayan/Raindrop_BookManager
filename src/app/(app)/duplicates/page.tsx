"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { findDuplicateGroups } from "@/lib/client/duplicates";
import { createBackup } from "@/lib/client/api";
import { Resource } from "@/lib/validation/schemas";
import { CopyCheck, Globe } from "lucide-react";

function ResourceRow({ resource, primary }: { resource: Resource; primary?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
      {resource.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resource.favicon} alt="" loading="lazy" className="h-4 w-4 shrink-0" />
      ) : (
        <Globe size={14} className="shrink-0 text-neutral-400" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {resource.title || resource.url}
          {primary && (
            <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-normal text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
              Keep as primary
            </span>
          )}
        </p>
        <p className="truncate text-xs text-neutral-500">{resource.url}</p>
      </div>
      <span className="shrink-0 text-xs text-neutral-400">
        {new Date(resource.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}

export default function DuplicatesPage() {
  const { resources, settings, updateSettings, updateResource, bulkUpdateResources } = useWorkspace();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const groups = useMemo(
    () => findDuplicateGroups(resources, settings.ignoredDuplicateGroupKeys),
    [resources, settings.ignoredDuplicateGroupKeys]
  );

  async function ignoreGroup(key: string) {
    setBusyKey(key);
    try {
      await updateSettings({
        ignoredDuplicateGroupKeys: [...settings.ignoredDuplicateGroupKeys, key],
      });
    } catch {
      // toast shown by context
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteDuplicates(key: string, primary: Resource, rest: Resource[]) {
    setBusyKey(key);
    try {
      await createBackup("before-duplicate-cleanup");
      await bulkUpdateResources(
        rest.map((r) => r.id),
        () => ({ trash: true, archived: false })
      );
    } catch {
      // toast shown by context
    } finally {
      setBusyKey(null);
    }
  }

  async function mergeAndKeepPrimary(key: string, primary: Resource, rest: Resource[]) {
    setBusyKey(key);
    try {
      await createBackup("before-duplicate-merge");
      const mergedTags = Array.from(new Set([...primary.tags, ...rest.flatMap((r) => r.tags)]));
      const mergedNotes = [primary.notes, ...rest.map((r) => r.notes)]
        .filter(Boolean)
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .join("\n\n");

      await updateResource(primary.id, {
        tags: mergedTags,
        notes: mergedNotes || undefined,
        description: primary.description || rest.find((r) => r.description)?.description,
        thumbnail: primary.thumbnail || rest.find((r) => r.thumbnail)?.thumbnail,
        favicon: primary.favicon || rest.find((r) => r.favicon)?.favicon,
      });
      await bulkUpdateResources(
        rest.map((r) => r.id),
        () => ({ trash: true, archived: false })
      );
    } catch {
      // toast shown by context
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Duplicates</h1>
      <p className="text-sm text-neutral-500">
        Resources whose URLs normalize to the same address (ignoring harmless differences like a
        trailing slash or tracking parameters). Nothing is deleted automatically — a backup is
        taken before any merge or delete here, and duplicates are moved to Trash, not erased.
      </p>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-16 text-neutral-400 dark:border-neutral-700">
          <CopyCheck size={28} />
          <p className="text-sm">No duplicates found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const [primary, ...rest] = group.resources;
            const busy = busyKey === group.key;
            return (
              <div key={group.key} className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    {group.resources.length} matching resources
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => mergeAndKeepPrimary(group.key, primary, rest)}
                      className="btn-pastel-primary-sm"
                    >
                      {busy ? "Working…" : "Merge & keep oldest"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => deleteDuplicates(group.key, primary, rest)}
                      className="btn-pastel-danger !px-2.5 !py-1 text-xs"
                    >
                      Trash duplicates
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => ignoreGroup(group.key)}
                      className="btn-pastel-secondary !px-2.5 !py-1 text-xs"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <ResourceRow resource={primary} primary />
                  {rest.map((r) => (
                    <ResourceRow key={r.id} resource={r} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
