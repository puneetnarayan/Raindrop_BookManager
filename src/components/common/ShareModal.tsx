"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { newId } from "@/lib/client/ids";
import { Check, Copy } from "lucide-react";
import { ShareMode } from "@/lib/validation/schemas";

export function ShareModal({
  title,
  shareMode,
  shareToken,
  kind,
  onSave,
  onClose,
}: {
  title: string;
  shareMode: ShareMode;
  shareToken: string | null;
  kind: "space" | "collection";
  onSave: (patch: { shareMode: ShareMode; shareToken: string | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const isPublic = shareMode === "public" && !!shareToken;
  const link = shareToken && typeof window !== "undefined" ? `${window.location.origin}/shared/${shareToken}` : "";

  async function handleToggle(enable: boolean) {
    setSaving(true);
    try {
      if (enable) {
        // A fresh token every time sharing is (re-)enabled, so a previously
        // disabled link can never silently start working again.
        await onSave({ shareMode: "public", shareToken: newId() });
      } else {
        await onSave({ shareMode: "private", shareToken: null });
      }
    } catch {
      // toast shown by context
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    setSaving(true);
    try {
      await onSave({ shareMode: "public", shareToken: newId() });
    } catch {
      // toast shown by context
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable; the link is still shown to copy manually
    }
  }

  return (
    <Modal title={`Share "${title}"`} onClose={onClose}>
      <div className="space-y-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">
            <span className="font-medium">Anyone with the link can view</span>
            <span className="mt-0.5 block text-xs text-neutral-500">
              Read-only. They won&apos;t see any other {kind === "space" ? "Spaces" : "Collections"},
              and can&apos;t edit, favorite, or delete anything.
            </span>
          </span>
          <input
            type="checkbox"
            checked={isPublic}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
        </label>

        {isPublic && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button
                onClick={copyLink}
                aria-label="Copy link"
                className="btn-pastel-secondary shrink-0 !p-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button onClick={handleRegenerate} disabled={saving} className="text-xs text-neutral-500 underline hover:text-neutral-800 dark:hover:text-neutral-200">
              Generate a new link (invalidates the current one)
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={onClose} className="btn-pastel-secondary">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
