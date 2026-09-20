"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Globe, MoreHorizontal, NotebookText, Pencil, Plus } from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";
import { CollectionModal } from "@/components/spaces/CollectionModal";
import { SpaceModal } from "@/components/spaces/SpaceModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineEditableText } from "@/components/common/InlineEditableText";
import { ContextMenu, ContextMenuItem } from "@/components/common/ContextMenu";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { MarkdownView } from "@/components/common/MarkdownView";
import { Modal } from "@/components/common/Modal";
import { ShareModal } from "@/components/common/ShareModal";
import { Collection, Space } from "@/lib/validation/schemas";
import { downloadFile } from "@/lib/client/download";
import { buildCollectionExport, buildSpaceExport } from "@/lib/export/exportJson";

function CollectionPill({
  collection,
  active,
  onSelect,
}: {
  collection: Collection;
  active: boolean;
  onSelect: () => void;
}) {
  const { updateCollection, resources, spaces, collections, tags } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(collection.name);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const collectionResources = resources.filter(
    (r) => r.collectionId === collection.id && !r.trash && !r.archived
  );

  function openAllLinks() {
    for (const r of collectionResources) {
      window.open(r.url, "_blank", "noopener,noreferrer");
    }
  }

  function exportCollection() {
    const payload = buildCollectionExport(collection.id, spaces, collections, resources, tags);
    downloadFile(
      `${collection.name.replace(/[^a-z0-9-]+/gi, "-")}-export.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  const menuItems: ContextMenuItem[] = [
    {
      label: `Open all links (${collectionResources.length})`,
      onClick: openAllLinks,
    },
    { label: "Rename", onClick: () => setEditing(true) },
    { label: "Edit description & notes", onClick: () => setShowEditModal(true) },
    { label: collection.shareMode === "public" ? "Sharing…" : "Share…", onClick: () => setShowShareModal(true) },
    { label: "Export (JSON)", onClick: exportCollection },
  ];

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          setEditing(false);
          const trimmed = draft.trim();
          if (trimmed && trimmed !== collection.name) updateCollection(collection.id, { name: trimmed });
          else setDraft(collection.name);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(collection.name);
            setEditing(false);
          }
        }}
        className="rounded-full border border-violet-300 px-3 py-1 text-sm dark:bg-neutral-800"
      />
    );
  }

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
      }}
      className={`group flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1 text-sm transition-colors active:brightness-95 ${
        active
          ? "bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200"
          : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
      }`}
    >
      <button onClick={onSelect} className="flex items-center gap-1">
        {collection.shareMode === "public" && <Globe size={11} className="text-emerald-600" />}
        {collection.name}
      </button>
      <button
        onClick={() => setShowEditModal(true)}
        aria-label={`Edit ${collection.name}`}
        title="Edit description & notes"
        className="rounded p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100"
      >
        <NotebookText size={11} />
      </button>
      <button
        onClick={() => setEditing(true)}
        aria-label={`Rename ${collection.name}`}
        title="Rename"
        className="rounded p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100"
      >
        <Pencil size={11} />
      </button>
      {menuPos && (
        <ContextMenu x={menuPos.x} y={menuPos.y} items={menuItems} onClose={() => setMenuPos(null)} />
      )}
      {showEditModal && (
        <CollectionModal collection={collection} spaceId={collection.spaceId} onClose={() => setShowEditModal(false)} />
      )}
      {showShareModal && (
        <ShareModal
          title={collection.name}
          kind="collection"
          shareMode={collection.shareMode}
          shareToken={collection.shareToken}
          onSave={(patch) => updateCollection(collection.id, patch)}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

function SpaceNotesModal({ space, onClose }: { space: Space; onClose: () => void }) {
  const { updateSpace } = useWorkspace();
  const [notes, setNotes] = useState(space.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateSpace(space.id, { notes: notes.trim() || undefined });
      onClose();
    } catch {
      // toast already shown
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Notes — ${space.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        <MarkdownEditor value={notes} onChange={setNotes} rows={8} placeholder="Notes for this Space…" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button type="submit" onClick={handleSave} disabled={saving} className="btn-pastel-primary">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function SpaceView({ spaceId }: { spaceId: string }) {
  const { spaces, collections, resources, tags, updateSpace } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCollectionId = searchParams.get("collection");

  const [showNewCollection, setShowNewCollection] = useState(false);
  const [editingSpaceColor, setEditingSpaceColor] = useState(false);
  const [editingSpaceNotes, setEditingSpaceNotes] = useState(false);
  const [showSpaceShareModal, setShowSpaceShareModal] = useState(false);
  const [confirmArchiveSpace, setConfirmArchiveSpace] = useState(false);

  const space = spaces.find((s) => s.id === spaceId);
  const spaceCollections = useMemo(
    () =>
      collections
        .filter((c) => c.spaceId === spaceId && !c.trash && !c.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [collections, spaceId]
  );

  const visibleResources = useMemo(
    () =>
      resources
        .filter((r) => r.spaceId === spaceId && !r.trash && !r.archived)
        .filter((r) => !selectedCollectionId || r.collectionId === selectedCollectionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [resources, spaceId, selectedCollectionId]
  );

  if (!space) {
    return (
      <div className="p-6 text-sm text-neutral-500">
        Space not found. It may have been deleted.
      </div>
    );
  }

  function selectCollection(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("collection", id);
    else params.delete("collection");
    router.push(`/space/${spaceId}?${params.toString()}`);
  }

  function exportSpace() {
    const payload = buildSpaceExport(spaceId, spaces, collections, resources, tags);
    downloadFile(
      `${space!.name.replace(/[^a-z0-9-]+/gi, "-")}-export.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: space.color || "#a3a3a3" }} />
          <InlineEditableText
            as="h1"
            value={space.name}
            onSave={(name) => updateSpace(spaceId, { name })}
            className="text-2xl font-semibold px-1"
            inputClassName="text-2xl font-semibold rounded border border-violet-300 px-1 dark:bg-neutral-800"
          />
          {space.shareMode === "public" && (
            <span title="Publicly shared">
              <Globe size={14} className="shrink-0 text-emerald-600" />
            </span>
          )}
        </div>
        <div className="relative">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center rounded p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <MoreHorizontal size={18} />
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <button
                onClick={() => setEditingSpaceColor(true)}
                className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Change color
              </button>
              <button
                onClick={() => updateSpace(spaceId, { pinned: !space.pinned })}
                className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {space.pinned ? "Unpin" : "Pin"} Space
              </button>
              <button
                onClick={() => setEditingSpaceNotes(true)}
                className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Edit notes
              </button>
              <button
                onClick={() => setShowSpaceShareModal(true)}
                className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {space.shareMode === "public" ? "Sharing…" : "Share…"}
              </button>
              <button
                onClick={exportSpace}
                className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Export (JSON)
              </button>
              <button
                onClick={() => setConfirmArchiveSpace(true)}
                className="block w-full px-3 py-1.5 text-left text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Archive Space
              </button>
            </div>
          </details>
        </div>
      </div>

      {space.notes && (
        <div className="rounded-md bg-black/[0.03] p-3 dark:bg-white/5">
          <MarkdownView content={space.notes} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => selectCollection(null)}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            !selectedCollectionId
              ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
              : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
          }`}
        >
          All
        </button>
        {spaceCollections.map((c) => (
          <CollectionPill
            key={c.id}
            collection={c}
            active={selectedCollectionId === c.id}
            onSelect={() => selectCollection(c.id)}
          />
        ))}
        <button
          onClick={() => setShowNewCollection(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-3 py-1 text-sm text-neutral-400 hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700"
        >
          <Plus size={14} /> Collection
        </button>
      </div>

      {selectedCollectionId &&
        (() => {
          const c = spaceCollections.find((sc) => sc.id === selectedCollectionId);
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                {c?.description ? <p className="text-sm text-neutral-500">{c.description}</p> : <span />}
                {visibleResources.length > 0 && (
                  <button
                    onClick={() => {
                      for (const r of visibleResources) window.open(r.url, "_blank", "noopener,noreferrer");
                    }}
                    className="btn-pastel-secondary flex shrink-0 items-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open all ({visibleResources.length})
                  </button>
                )}
              </div>
              {c?.notes && (
                <div className="rounded-md bg-black/[0.03] p-3 dark:bg-white/5">
                  <MarkdownView content={c.notes} />
                </div>
              )}
            </div>
          );
        })()}

      <SelectableResourceGrid
        resources={visibleResources}
        emptyLabel={
          spaceCollections.length === 0
            ? "Create a collection, then add resources to it."
            : "No resources here yet."
        }
        defaultAllSelected={!!selectedCollectionId}
        resetKey={selectedCollectionId ?? spaceId}
      />

      {showNewCollection && (
        <CollectionModal
          spaceId={spaceId}
          onClose={() => setShowNewCollection(false)}
          onCreated={(c) => selectCollection(c.id)}
        />
      )}
      {editingSpaceColor && <SpaceModal space={space} onClose={() => setEditingSpaceColor(false)} />}
      {editingSpaceNotes && <SpaceNotesModal space={space} onClose={() => setEditingSpaceNotes(false)} />}
      {showSpaceShareModal && (
        <ShareModal
          title={space.name}
          kind="space"
          shareMode={space.shareMode}
          shareToken={space.shareToken}
          onSave={(patch) => updateSpace(spaceId, patch)}
          onClose={() => setShowSpaceShareModal(false)}
        />
      )}
      {confirmArchiveSpace && (
        <ConfirmDialog
          title="Archive Space"
          message={`Archive "${space.name}"? You can restore it from the Archive view later.`}
          confirmLabel="Archive"
          danger
          onConfirm={async () => {
            await updateSpace(spaceId, { archived: true });
            setConfirmArchiveSpace(false);
            router.push("/");
          }}
          onCancel={() => setConfirmArchiveSpace(false)}
        />
      )}
    </div>
  );
}
