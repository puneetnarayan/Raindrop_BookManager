"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { useWorkspace } from "@/lib/client/workspace-context";
import { newId, now } from "@/lib/client/ids";
import { normalizeUrl } from "@/lib/client/url";
import { formatSessionTimestamp } from "@/lib/client/timestamp";
import { SpaceModal } from "@/components/spaces/SpaceModal";
import { Collection, Resource } from "@/lib/validation/schemas";
import { Loader2 } from "lucide-react";

const NEW_SPACE = "__new_space__";

export function SaveSessionModal({ onClose }: { onClose: () => void }) {
  const { spaces, bulkImport } = useWorkspace();
  const [collectionName, setCollectionName] = useState(formatSessionTimestamp());
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [urlsText, setUrlsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewSpace, setShowNewSpace] = useState(false);

  const lines = urlsText
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter(Boolean);
  const normalized = lines.map((l) => normalizeUrl(l)).filter((u): u is string => u !== null);
  const invalidCount = lines.length - normalized.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!spaceId) {
      setError("Choose a Space.");
      return;
    }
    if (normalized.length === 0) {
      setError("Paste at least one valid URL.");
      return;
    }

    setSaving(true);
    try {
      const timestamp = now();
      const collection: Collection = {
        id: newId(),
        createdAt: timestamp,
        updatedAt: timestamp,
        spaceId,
        name: collectionName.trim() || formatSessionTimestamp(),
        sortOrder: 0,
        pinned: false,
        favorite: false,
        archived: false,
        trash: false,
        shareMode: "private",
        shareToken: null,
      };

      const resources: Resource[] = normalized.map((url, index) => {
        let domain: string | undefined;
        try {
          domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          domain = undefined;
        }
        return {
          id: newId(),
          createdAt: timestamp,
          updatedAt: timestamp,
          url,
          title: url,
          domain,
          spaceId,
          collectionId: collection.id,
          tags: [],
          highlights: [],
          resourceType: "website",
          favorite: false,
          pinned: false,
          next: false,
          priority: "normal",
          dueDate: null,
          archived: false,
          trash: false,
          lastOpenedAt: null,
          httpStatus: null,
          linkStatus: "unknown",
          lastCheckedAt: null,
          sortOrder: index, // preserves the order the URLs were pasted/tabs were listed in
        };
      });

      await bulkImport({ collections: [collection], resources });
      onClose();
    } catch {
      // toast shown by context; keep modal open so the user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Save Session" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-neutral-500">
          Paste the URLs of your current tabs (one per line, or comma-separated) to save them as a
          new Collection, in the order you paste them. Titles default to the URL — edit them
          later, or open a resource once to have this picked up automatically over time.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Space</label>
            <select
              value={spaceId}
              onChange={(e) => {
                if (e.target.value === NEW_SPACE) {
                  setShowNewSpace(true);
                  return;
                }
                setSpaceId(e.target.value);
              }}
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {spaces.length === 0 && <option value="">No spaces yet</option>}
              {spaces
                .filter((s) => !s.trash && !s.archived)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              <option value={NEW_SPACE}>+ New Space…</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Collection name</label>
            <input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder={formatSessionTimestamp()}
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">URLs</label>
          <textarea
            autoFocus
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            rows={8}
            placeholder={"https://example.com/one\nhttps://example.com/two"}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-800"
          />
          <p className="mt-1 text-xs text-neutral-400">
            {normalized.length} valid URL{normalized.length === 1 ? "" : "s"}
            {invalidCount > 0 ? ` · ${invalidCount} line(s) skipped (not a valid URL)` : ""}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !spaceId || normalized.length === 0}
            className="btn-pastel-primary flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Save Session"}
          </button>
        </div>
      </form>

      {showNewSpace && (
        <SpaceModal onClose={() => setShowNewSpace(false)} onCreated={(created) => setSpaceId(created.id)} />
      )}
    </Modal>
  );
}
