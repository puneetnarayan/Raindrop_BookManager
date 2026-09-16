"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { createBackup as apiCreateBackup } from "@/lib/client/api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RotateCcw, Trash2 } from "lucide-react";

export default function TrashPage() {
  const {
    resources,
    collections,
    spaces,
    updateResource,
    updateCollection,
    updateSpace,
    deleteResourceForever,
    deleteCollectionForever,
    deleteSpaceForever,
    bulkUpdateResources,
    bulkDeleteResourcesForever,
  } = useWorkspace();

  const [pendingDelete, setPendingDelete] = useState<
    { kind: "resource" | "collection" | "space"; id: string; label: string } | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const trashedResources = resources.filter((r) => r.trash);
  const trashedCollections = collections.filter((c) => c.trash);
  const trashedSpaces = spaces.filter((s) => s.trash);
  const isEmpty = trashedResources.length + trashedCollections.length + trashedSpaces.length === 0;
  const selectedIds = Array.from(selected).filter((id) => trashedResources.some((r) => r.id === id));

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiCreateBackup(`before-permanent-delete-${pendingDelete.kind}`);
      if (pendingDelete.kind === "resource") await deleteResourceForever(pendingDelete.id);
      if (pendingDelete.kind === "collection") await deleteCollectionForever(pendingDelete.id);
      if (pendingDelete.kind === "space") await deleteSpaceForever(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // toast shown by context; leave dialog open so the user can retry
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkRestore() {
    setBulkBusy(true);
    try {
      await bulkUpdateResources(selectedIds, () => ({ trash: false }));
      setSelected(new Set());
    } catch {
      // toast shown by context
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDeleteForever() {
    setBulkBusy(true);
    try {
      await apiCreateBackup("before-bulk-permanent-delete");
      await bulkDeleteResourcesForever(selectedIds);
      setSelected(new Set());
    } catch {
      // toast shown by context
    } finally {
      setBulkBusy(false);
      setConfirmBulkDelete(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Trash</h1>

      {isEmpty && <p className="text-sm text-neutral-500">Trash is empty.</p>}

      {trashedSpaces.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Spaces</h2>
          <ul className="space-y-1">
            {trashedSpaces.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                {s.name}
                <div className="flex gap-3">
                  <button onClick={() => updateSpace(s.id, { trash: false })} className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    onClick={() => setPendingDelete({ kind: "space", id: s.id, label: s.name })}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Delete forever
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trashedCollections.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Collections</h2>
          <ul className="space-y-1">
            {trashedCollections.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                {c.name}
                <div className="flex gap-3">
                  <button onClick={() => updateCollection(c.id, { trash: false })} className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    onClick={() => setPendingDelete({ kind: "collection", id: c.id, label: c.name })}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Delete forever
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trashedResources.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Resources</h2>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-violet-800 dark:text-violet-200">
                  {selectedIds.length} selected
                </span>
                <button onClick={handleBulkRestore} disabled={bulkBusy} className="btn-pastel-primary-sm">
                  {bulkBusy ? "Restoring…" : "Bulk restore"}
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkBusy}
                  className="btn-pastel-danger !px-2.5 !py-1 text-xs"
                >
                  Delete forever
                </button>
              </div>
            )}
          </div>
          <ul className="space-y-1">
            {trashedResources.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                <label className="flex flex-1 items-center gap-2 truncate">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelected(r.id)}
                  />
                  <span className="truncate">{r.title || r.url}</span>
                </label>
                <div className="flex shrink-0 gap-3">
                  <button onClick={() => updateResource(r.id, { trash: false })} className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    onClick={() => setPendingDelete({ kind: "resource", id: r.id, label: r.title || r.url })}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Delete forever
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete permanently"
          message={`This cannot be undone from the app. A backup snapshot is taken first, so it can still be recovered from Settings → Data & Backup if needed. Delete "${pendingDelete.label}" forever?`}
          confirmLabel={deleting ? "Deleting…" : "Delete forever"}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmDialog
          title="Delete permanently"
          message={`A backup snapshot is taken first. Permanently delete ${selectedIds.length} resource(s)? This cannot be undone from the app.`}
          confirmLabel={bulkBusy ? "Deleting…" : "Delete forever"}
          danger
          onConfirm={handleBulkDeleteForever}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}
    </div>
  );
}
