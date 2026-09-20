"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { SelectableResourceGrid } from "@/components/resources/SelectableResourceGrid";
import { Pencil, Plus, X } from "lucide-react";
import { Tag } from "@/lib/validation/schemas";

function TagPill({
  tag,
  count,
  selected,
  onSelect,
}: {
  tag: Tag;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { renameTag, deleteTag } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tag.name);

  function save() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== tag.name) renameTag(tag.id, trimmed);
    else setDraft(tag.name);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(tag.name);
            setEditing(false);
          }
        }}
        className="rounded-full border border-violet-300 px-3 py-1 text-sm dark:bg-neutral-800"
      />
    );
  }

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
        selected
          ? "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
          : "border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
      }`}
    >
      <button onClick={onSelect}>
        {tag.name} <span className="opacity-60">{count}</span>
      </button>
      <button
        onClick={() => setEditing(true)}
        aria-label={`Rename tag ${tag.name}`}
        className="opacity-0 hover:text-violet-700 group-hover:opacity-100"
      >
        <Pencil size={11} />
      </button>
      <button
        onClick={() => deleteTag(tag.id)}
        aria-label={`Delete tag ${tag.name}`}
        className="opacity-0 hover:text-rose-600 group-hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function NewTagInput() {
  const { createTag } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  async function submit() {
    const trimmed = value.trim();
    if (trimmed) await createTag(trimmed);
    setValue("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-3 py-1 text-sm text-neutral-400 hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700"
      >
        <Plus size={14} /> Add tag
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue("");
          setAdding(false);
        }
      }}
      placeholder="Tag name"
      className="rounded-full border border-violet-300 px-3 py-1 text-sm dark:bg-neutral-800"
    />
  );
}

export default function TagsPage() {
  const { tags, resources } = useWorkspace();
  const [selected, setSelected] = useState<string | null>(null);

  const counts = new Map<string, number>();
  for (const r of resources) {
    if (r.trash) continue;
    for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const sortedTags = [...tags].sort((a, b) => (counts.get(b.name) ?? 0) - (counts.get(a.name) ?? 0));

  const filtered = selected
    ? resources.filter((r) => !r.trash && r.tags.includes(selected))
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Tags</h1>

      <div className="flex flex-wrap gap-2">
        {sortedTags.map((tag) => (
          <TagPill
            key={tag.id}
            tag={tag}
            count={counts.get(tag.name) ?? 0}
            selected={selected === tag.name}
            onSelect={() => setSelected(selected === tag.name ? null : tag.name)}
          />
        ))}
        <NewTagInput />
      </div>

      {sortedTags.length === 0 && (
        <p className="text-sm text-neutral-500">
          No tags yet — add one above, or add tags while saving a resource.
        </p>
      )}

      {selected && (
        <div className="pt-4">
          <SelectableResourceGrid resources={filtered} resetKey={`tag-${selected}`} />
        </div>
      )}
    </div>
  );
}
