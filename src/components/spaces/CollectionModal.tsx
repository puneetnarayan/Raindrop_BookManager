"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { useWorkspace } from "@/lib/client/workspace-context";
import { Collection } from "@/lib/validation/schemas";

export function CollectionModal({
  spaceId,
  collection,
  onClose,
  onCreated,
}: {
  spaceId: string;
  collection?: Collection;
  onClose: () => void;
  onCreated?: (collection: Collection) => void;
}) {
  const { createCollection, updateCollection } = useWorkspace();
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (collection) {
        await updateCollection(collection.id, { name: name.trim(), description: description.trim() || undefined });
      } else {
        const created = await createCollection({ spaceId, name: name.trim() });
        if (description.trim()) {
          await updateCollection(created.id, { description: description.trim() });
        }
        onCreated?.(created);
      }
      onClose();
    } catch {
      // toast already shown
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={collection ? "Rename Collection" : "New Collection"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Keyword Research"
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || saving} className="btn-pastel-primary">
            {saving ? "Saving…" : collection ? "Save" : "Create Collection"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
