"use client";

import { Modal } from "@/components/common/Modal";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`rounded px-3 py-1.5 text-sm text-white ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:bg-neutral-800"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
