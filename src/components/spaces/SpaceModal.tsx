"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { useWorkspace } from "@/lib/client/workspace-context";
import { Space } from "@/lib/validation/schemas";
import { PASTEL_COLORS } from "@/lib/client/colors";

export function SpaceModal({
  space,
  onClose,
  onCreated,
}: {
  space?: Space;
  onClose: () => void;
  /** When provided, called instead of navigating to the new space's page. */
  onCreated?: (space: Space) => void;
}) {
  const { createSpace, updateSpace } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState(space?.name ?? "");
  const [color, setColor] = useState(space?.color ?? PASTEL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (space) {
        await updateSpace(space.id, { name: name.trim(), color });
      } else {
        const created = await createSpace({ name: name.trim(), color });
        if (onCreated) onCreated(created);
        else router.push(`/space/${created.id}`);
      }
      onClose();
    } catch {
      // error toast already shown by workspace context
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={space ? "Rename Space" : "New Space"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web Development"
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Color</label>
          <div className="flex flex-wrap gap-2">
            {PASTEL_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-neutral-900 dark:ring-offset-neutral-900" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || saving} className="btn-pastel-primary">
            {saving ? "Saving…" : space ? "Save" : "Create Space"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
