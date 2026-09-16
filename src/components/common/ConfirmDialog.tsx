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
        <button onClick={onCancel} className="btn-pastel-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className={danger ? "btn-pastel-danger" : "btn-pastel-primary"}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
