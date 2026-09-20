import { useState } from "react";
import { Resource } from "@/lib/validation/schemas";
import { useWorkspace } from "@/lib/client/workspace-context";
import { checkLinks } from "@/lib/client/api";

export const LINK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  dead: { label: "Dead link", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  warning: { label: "Warning", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  redirected: { label: "Redirected", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
};

/** Shared state/handlers behind a resource's action buttons (edit, favorite, pin, archive, trash, check link). */
export function useResourceCardActions(resource: Resource) {
  const { updateResource, settings } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function toggle(patch: Partial<Resource>) {
    setBusy(true);
    try {
      await updateResource(resource.id, patch);
    } catch {
      // toast shown by context
    } finally {
      setBusy(false);
    }
  }

  function handleOpen() {
    updateResource(resource.id, { lastOpenedAt: new Date().toISOString() }).catch(() => {});
  }

  async function handleCheckLink() {
    setCheckingLink(true);
    try {
      const [result] = await checkLinks([resource.url], settings.linkCheckTimeoutMs);
      await updateResource(resource.id, {
        httpStatus: result.httpStatus,
        linkStatus: result.linkStatus,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch {
      // toast shown by context
    } finally {
      setCheckingLink(false);
    }
  }

  return {
    busy,
    checkingLink,
    showEdit,
    setShowEdit,
    toggle,
    handleOpen,
    handleCheckLink,
    badge: LINK_STATUS_BADGE[resource.linkStatus],
  };
}
