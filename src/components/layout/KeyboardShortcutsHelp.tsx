"use client";

import { Modal } from "@/components/common/Modal";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "⌘ / Ctrl + K", description: "Global search" },
  { keys: "⌘ / Ctrl + N", description: "Add resource" },
  { keys: "⌘ / Ctrl + Shift + N", description: "New Space" },
  { keys: "⌘ / Ctrl + S", description: "Save (while a dialog is open)" },
  { keys: "Esc", description: "Close dialog" },
  { keys: "?", description: "Show this help" },
];

export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard Shortcuts" onClose={onClose}>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="flex items-center justify-between py-2 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">{s.description}</span>
            <kbd className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs dark:bg-neutral-800">
              {s.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
