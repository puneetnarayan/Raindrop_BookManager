"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  LayoutDashboard,
  Library,
  ListTodo,
  Plus,
  Search,
  Settings,
  Star,
  Tag as TagIcon,
  Trash2,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { useState } from "react";
import { SpaceModal } from "@/components/spaces/SpaceModal";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/next", label: "Next", icon: ListTodo },
  { href: "/quick-links", label: "Quick Links", icon: Zap },
  { href: "/all", label: "All Resources", icon: Library },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/tags", label: "Tags", icon: TagIcon },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

export function Sidebar({ onAddResource }: { onAddResource: () => void }) {
  const pathname = usePathname();
  const { spaces } = useWorkspace();
  const [showNewSpace, setShowNewSpace] = useState(false);

  const visibleSpaces = spaces
    .filter((s) => !s.trash && !s.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="space-y-2 p-3">
        <button
          onClick={onAddResource}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <Plus size={16} /> Add Resource
        </button>
        <Link
          href="/search"
          className="flex w-full items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-500 hover:border-neutral-400 dark:border-neutral-700"
        >
          <Search size={14} /> Search
          <kbd className="ml-auto rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] dark:bg-neutral-800">
            ⌘K
          </kbd>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm ${
                    active
                      ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
                  }`}
                >
                  <Icon size={16} /> {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between px-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Spaces
          </span>
          <button
            onClick={() => setShowNewSpace(true)}
            aria-label="New Space"
            className="rounded p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800"
          >
            <Plus size={14} />
          </button>
        </div>
        <ul className="mt-1 space-y-0.5">
          {visibleSpaces.map((space) => {
            const active = pathname === `/space/${space.id}`;
            return (
              <li key={space.id}>
                <Link
                  href={`/space/${space.id}`}
                  className={`flex items-center gap-2.5 truncate rounded-md px-2.5 py-1.5 text-sm ${
                    active
                      ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: space.color || "#a3a3a3" }}
                  />
                  <span className="truncate">{space.name}</span>
                </Link>
              </li>
            );
          })}
          {visibleSpaces.length === 0 && (
            <li className="px-2.5 py-1 text-xs text-neutral-400">No spaces yet</li>
          )}
        </ul>
      </div>

      <div className="border-t border-neutral-200 p-2 dark:border-neutral-800">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
        >
          <Settings size={16} /> Settings
        </Link>
      </div>

      {showNewSpace && <SpaceModal onClose={() => setShowNewSpace(false)} />}
    </nav>
  );
}
