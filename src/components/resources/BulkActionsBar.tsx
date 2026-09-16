"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Pin,
  RotateCcw,
  Star,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { createBackup } from "@/lib/client/api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";

export type BulkContext = "active" | "archive" | "trash";

function MoveModal({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const { spaces, collections, bulkUpdateResources } = useWorkspace();
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [collectionId, setCollectionId] = useState("");
  const [saving, setSaving] = useState(false);

  const spaceCollections = collections.filter((c) => c.spaceId === spaceId && !c.trash && !c.archived);
  const effectiveCollectionId =
    collectionId && spaceCollections.some((c) => c.id === collectionId)
      ? collectionId
      : (spaceCollections[0]?.id ?? "");

  async function handleMove() {
    if (!spaceId || !effectiveCollectionId) return;
    setSaving(true);
    try {
      await bulkUpdateResources(ids, () => ({ spaceId, collectionId: effectiveCollectionId }));
      onClose();
    } catch {
      // toast shown by context
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Move ${ids.length} resource(s)`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Space</label>
          <select
            value={spaceId}
            onChange={(e) => {
              setSpaceId(e.target.value);
              setCollectionId("");
            }}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            {spaces.filter((s) => !s.trash && !s.archived).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Collection</label>
          <select
            value={effectiveCollectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            {spaceCollections.length === 0 && <option value="">No collections in this space</option>}
            {spaceCollections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button onClick={handleMove} disabled={saving || !effectiveCollectionId} className="btn-pastel-primary">
            {saving ? "Moving…" : "Move"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TagModal({ ids, mode, onClose }: { ids: string[]; mode: "add" | "remove"; onClose: () => void }) {
  const { tags, createTag, bulkUpdateResources } = useWorkspace();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleApply() {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (mode === "add") {
        const tag = await createTag(name);
        await bulkUpdateResources(ids, (r) =>
          r.tags.includes(tag.name) ? {} : { tags: [...r.tags, tag.name] }
        );
      } else {
        await bulkUpdateResources(ids, (r) =>
          r.tags.includes(name) ? { tags: r.tags.filter((t) => t !== name) } : {}
        );
      }
      onClose();
    } catch {
      // toast shown by context
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={mode === "add" ? "Add tag to selection" : "Remove tag from selection"} onClose={onClose}>
      <div className="space-y-4">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          list="bulk-tag-options"
          placeholder="Tag name"
          className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <datalist id="bulk-tag-options">
          {tags.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button onClick={handleApply} disabled={saving || !value.trim()} className="btn-pastel-primary">
            {saving ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function BulkActionsBar({
  selectedIds,
  context,
  onClear,
}: {
  selectedIds: string[];
  context: BulkContext;
  onClear: () => void;
}) {
  const { bulkUpdateResources, bulkDeleteResourcesForever } = useWorkspace();
  const [busy, setBusy] = useState<string | null>(null);
  const [showMove, setShowMove] = useState(false);
  const [tagModal, setTagModal] = useState<"add" | "remove" | null>(null);
  const [confirmDeleteForever, setConfirmDeleteForever] = useState(false);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    try {
      await action();
    } catch {
      // toast shown by context
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteForever() {
    setBusy("delete");
    try {
      await createBackup("before-bulk-permanent-delete");
      await bulkDeleteResourcesForever(selectedIds);
      onClear();
    } catch {
      // toast shown by context
    } finally {
      setBusy(null);
      setConfirmDeleteForever(false);
    }
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm dark:border-violet-900 dark:bg-violet-950/40">
      <span className="font-medium text-violet-800 dark:text-violet-200">
        {selectedIds.length} selected
      </span>

      {context === "active" && (
        <>
          <button
            disabled={busy !== null}
            onClick={() => run("fav", () => bulkUpdateResources(selectedIds, () => ({ favorite: true })))}
            className="btn-pastel-primary-sm flex items-center gap-1"
          >
            <Star size={12} /> Favorite
          </button>
          <button
            disabled={busy !== null}
            onClick={() => run("unfav", () => bulkUpdateResources(selectedIds, () => ({ favorite: false })))}
            className="btn-pastel-secondary flex items-center gap-1 !px-2.5 !py-1 text-xs"
          >
            Unfavorite
          </button>
          <button
            disabled={busy !== null}
            onClick={() => run("pin", () => bulkUpdateResources(selectedIds, () => ({ pinned: true })))}
            className="btn-pastel-primary-sm flex items-center gap-1"
          >
            <Pin size={12} /> Pin
          </button>
          <button
            disabled={busy !== null}
            onClick={() => run("archive", () => bulkUpdateResources(selectedIds, () => ({ archived: true })))}
            className="btn-pastel-secondary flex items-center gap-1 !px-2.5 !py-1 text-xs"
          >
            <Archive size={12} /> Archive
          </button>
          <button
            disabled={busy !== null}
            onClick={() => setShowMove(true)}
            className="btn-pastel-secondary !px-2.5 !py-1 text-xs"
          >
            Move…
          </button>
          <button
            disabled={busy !== null}
            onClick={() => setTagModal("add")}
            className="btn-pastel-secondary flex items-center gap-1 !px-2.5 !py-1 text-xs"
          >
            <TagIcon size={12} /> Add tag
          </button>
          <button
            disabled={busy !== null}
            onClick={() => setTagModal("remove")}
            className="btn-pastel-secondary !px-2.5 !py-1 text-xs"
          >
            Remove tag
          </button>
          <button
            disabled={busy !== null}
            onClick={() => run("trash", () => bulkUpdateResources(selectedIds, () => ({ trash: true, archived: false })))}
            className="btn-pastel-danger flex items-center gap-1"
          >
            <Trash2 size={12} /> Trash
          </button>
        </>
      )}

      {context === "archive" && (
        <>
          <button
            disabled={busy !== null}
            onClick={() => run("unarchive", () => bulkUpdateResources(selectedIds, () => ({ archived: false })))}
            className="btn-pastel-primary-sm flex items-center gap-1"
          >
            <ArchiveRestore size={12} /> Unarchive
          </button>
          <button
            disabled={busy !== null}
            onClick={() => run("trash", () => bulkUpdateResources(selectedIds, () => ({ trash: true, archived: false })))}
            className="btn-pastel-danger flex items-center gap-1"
          >
            <Trash2 size={12} /> Trash
          </button>
        </>
      )}

      {context === "trash" && (
        <>
          <button
            disabled={busy !== null}
            onClick={() => run("restore", () => bulkUpdateResources(selectedIds, () => ({ trash: false })))}
            className="btn-pastel-primary-sm flex items-center gap-1"
          >
            <RotateCcw size={12} /> Restore
          </button>
          <button
            disabled={busy !== null}
            onClick={() => setConfirmDeleteForever(true)}
            className="btn-pastel-danger flex items-center gap-1"
          >
            <Trash2 size={12} /> Delete forever
          </button>
        </>
      )}

      {busy && <Loader2 size={14} className="animate-spin text-violet-600" />}

      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        <X size={12} /> Clear
      </button>

      {showMove && <MoveModal ids={selectedIds} onClose={() => setShowMove(false)} />}
      {tagModal && <TagModal ids={selectedIds} mode={tagModal} onClose={() => setTagModal(null)} />}
      {confirmDeleteForever && (
        <ConfirmDialog
          title="Delete permanently"
          message={`A backup snapshot is taken first. Permanently delete ${selectedIds.length} resource(s)? This cannot be undone from the app.`}
          confirmLabel={busy === "delete" ? "Deleting…" : "Delete forever"}
          danger
          onConfirm={handleDeleteForever}
          onCancel={() => setConfirmDeleteForever(false)}
        />
      )}
    </div>
  );
}
