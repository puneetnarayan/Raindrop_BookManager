"use client";

import { useRouter } from "next/navigation";
import { SaveSessionModal } from "@/components/resources/SaveSessionModal";

/**
 * Deep-link target for the browser extension's "Open Save Session" button:
 * opens straight into the Save Session modal so the user can paste the tab
 * URLs the extension just copied to their clipboard.
 */
export default function SaveSessionPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <SaveSessionModal onClose={() => router.push("/")} />
    </div>
  );
}
