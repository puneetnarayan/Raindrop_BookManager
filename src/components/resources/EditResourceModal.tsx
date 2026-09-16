"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { useWorkspace } from "@/lib/client/workspace-context";
import { fetchUrlMetadata } from "@/lib/client/api";
import { Loader2 } from "lucide-react";
import { SpaceModal } from "@/components/spaces/SpaceModal";
import { CollectionModal } from "@/components/spaces/CollectionModal";
import { Resource } from "@/lib/validation/schemas";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";

const NEW_SPACE = "__new_space__";
const NEW_COLLECTION = "__new_collection__";

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.pathname === "/") u.pathname = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function EditResourceModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const { spaces, collections, updateResource, createTag } = useWorkspace();
  const [url, setUrl] = useState(resource.url);
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description ?? "");
  const [favicon, setFavicon] = useState<string | undefined>(resource.favicon);
  const [thumbnail, setThumbnail] = useState<string | undefined>(resource.thumbnail);
  const [spaceId, setSpaceId] = useState(resource.spaceId);
  const [collectionOverride, setCollectionOverride] = useState<string | null>(resource.collectionId);
  const [tagsInput, setTagsInput] = useState(resource.tags.join(", "));
  const [notes, setNotes] = useState(resource.notes ?? "");
  const [favorite, setFavorite] = useState(resource.favorite);
  const [pinned, setPinned] = useState(resource.pinned);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);

  const spaceCollections = collections.filter(
    (c) => c.spaceId === spaceId && !c.trash && !c.archived
  );
  const collectionId =
    collectionOverride && spaceCollections.some((c) => c.id === collectionOverride)
      ? collectionOverride
      : (spaceCollections[0]?.id ?? "");

  async function refreshMetadata() {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setUrlError("Enter a valid URL");
      return;
    }
    setUrl(normalized);
    setUrlError(null);
    setFetchingMeta(true);
    const meta = await fetchUrlMetadata(normalized);
    setFetchingMeta(false);
    if (meta) {
      if (meta.title) setTitle(meta.title);
      if (meta.description) setDescription(meta.description);
      if (meta.favicon) setFavicon(meta.favicon);
      if (meta.thumbnail) setThumbnail(meta.thumbnail);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setUrlError("Enter a valid URL");
      return;
    }
    if (!spaceId || !collectionId) return;

    setSaving(true);
    try {
      const tagNames = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const tags = await Promise.all(tagNames.map((t) => createTag(t)));

      await updateResource(resource.id, {
        url: normalized,
        title: title.trim(),
        description: description.trim() || undefined,
        favicon,
        thumbnail,
        spaceId,
        collectionId,
        tags: tags.map((t) => t.name),
        notes: notes.trim() || undefined,
        favorite,
        pinned,
      });
      onClose();
    } catch {
      // toast already shown by workspace context; keep modal open so user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Resource" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">URL</label>
          <div className="relative flex gap-2">
            <input
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://example.com"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              type="button"
              onClick={refreshMetadata}
              disabled={fetchingMeta}
              title="Re-fetch title/description/thumbnail from this URL"
              className="btn-pastel-secondary shrink-0 whitespace-nowrap"
            >
              {fetchingMeta ? <Loader2 size={14} className="animate-spin" /> : "Refresh metadata"}
            </button>
          </div>
          {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
        </div>

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
                setCollectionOverride(null);
              }}
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
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
            <label className="mb-1 block text-sm font-medium">Collection</label>
            <select
              value={collectionId}
              onChange={(e) => {
                if (e.target.value === NEW_COLLECTION) {
                  setShowNewCollection(true);
                  return;
                }
                setCollectionOverride(e.target.value);
              }}
              disabled={!spaceId}
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {spaceCollections.length === 0 && <option value="">No collections yet</option>}
              {spaceCollections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {spaceId && <option value={NEW_COLLECTION}>+ New Collection…</option>}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tags (comma-separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="research, tools"
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <MarkdownEditor value={notes} onChange={setNotes} rows={4} placeholder="Add notes about this resource…" />
        </div>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            Favorite
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving || !spaceId || !collectionId} className="btn-pastel-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      {showNewSpace && (
        <SpaceModal
          onClose={() => setShowNewSpace(false)}
          onCreated={(created) => {
            setSpaceId(created.id);
            setCollectionOverride(null);
          }}
        />
      )}
      {showNewCollection && spaceId && (
        <CollectionModal
          spaceId={spaceId}
          onClose={() => setShowNewCollection(false)}
          onCreated={(created) => setCollectionOverride(created.id)}
        />
      )}
    </Modal>
  );
}
