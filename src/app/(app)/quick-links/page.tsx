"use client";

import { useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { Modal } from "@/components/common/Modal";
import { Globe, Plus, Trash2 } from "lucide-react";

function QuickLinkForm({ onClose }: { onClose: () => void }) {
  const { createQuickLink } = useWorkspace();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      await createQuickLink({ name: name.trim(), url: withScheme });
      onClose();
    } catch {
      // toast shown by context
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Quick Link" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="GitHub"
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com"
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-pastel-secondary">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || !url.trim() || saving} className="btn-pastel-primary">
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function QuickLinksPage() {
  const { quickLinks, deleteQuickLink } = useWorkspace();
  const [showForm, setShowForm] = useState(false);

  const sorted = [...quickLinks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quick Links</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-pastel-primary flex items-center gap-1.5"
        >
          <Plus size={16} /> New Quick Link
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Add shortcuts to the sites you use most — GitHub, Vercel, your Drive, etc.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((q) => (
            <div
              key={q.id}
              className="group relative flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-3 dark:border-neutral-800"
            >
              <a href={q.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center gap-2 overflow-hidden">
                <Globe size={16} className="shrink-0 text-neutral-400" style={q.color ? { color: q.color } : undefined} />
                <span className="truncate text-sm">{q.name}</span>
              </a>
              <button
                onClick={() => deleteQuickLink(q.id)}
                aria-label={`Delete ${q.name}`}
                className="shrink-0 text-neutral-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && <QuickLinkForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
