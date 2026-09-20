"use client";

import { LayoutGrid, LayoutList, List } from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { Settings } from "@/lib/validation/schemas";

type ViewMode = Settings["resourceViewMode"];

const OPTIONS: { mode: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { mode: "compact", label: "Compact Cards", icon: LayoutGrid },
  { mode: "list", label: "List", icon: List },
  { mode: "large", label: "Large Cards", icon: LayoutList },
];

export function ViewModeSwitcher() {
  const { settings, updateSettings } = useWorkspace();

  return (
    <div className="inline-flex rounded-md border border-neutral-300 p-0.5 text-xs dark:border-neutral-700">
      {OPTIONS.map((opt, i) => {
        const Icon = opt.icon;
        const active = settings.resourceViewMode === opt.mode;
        return (
          <button
            key={opt.mode}
            onClick={() => updateSettings({ resourceViewMode: opt.mode })}
            title={opt.label}
            className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors ${
              active
                ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            } ${i > 0 ? "border-l border-transparent" : ""}`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
