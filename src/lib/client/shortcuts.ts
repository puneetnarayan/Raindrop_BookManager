"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Dispatched to ask any mounted "new space" UI (e.g. the sidebar) to open itself. */
export const NEW_SPACE_SHORTCUT_EVENT = "shortcut:new-space";

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/**
 * Registers the app's global keyboard shortcuts:
 *  - Cmd/Ctrl+K: jump to Search
 *  - Cmd/Ctrl+N: open Add Resource
 *  - Cmd/Ctrl+Shift+N: open New Space (via a DOM event the sidebar listens for)
 *  - ?: open the keyboard shortcuts help (ignored while typing)
 * Escape-to-close-modal and Cmd/Ctrl+S-to-submit are handled locally by Modal.
 */
export function useGlobalShortcuts({
  onAddResource,
  onShowHelp,
}: {
  onAddResource: () => void;
  onShowHelp: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
        return;
      }

      if (mod && e.key.toLowerCase() === "n" && e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new Event(NEW_SPACE_SHORTCUT_EVENT));
        return;
      }

      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onAddResource();
        return;
      }

      if (e.key === "?" && !isTypingTarget(e.target)) {
        e.preventDefault();
        onShowHelp();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, onAddResource, onShowHelp]);
}
