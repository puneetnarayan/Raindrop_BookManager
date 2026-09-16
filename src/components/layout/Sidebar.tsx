"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, GitBranch, Home, ListTree, Menu, Plus, Search } from "lucide-react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { navItems, NavPanel } from "@/components/layout/NavPanel";
import { TreePanel } from "@/components/layout/TreePanel";
import { GithubStatusPanel } from "@/components/layout/GithubStatusPanel";
import { SpaceModal } from "@/components/spaces/SpaceModal";
import { NEW_SPACE_SHORTCUT_EVENT } from "@/lib/client/shortcuts";

type Tab = "nav" | "tree" | "github";

const TABS: { id: Tab; label: string; icon: typeof Menu }[] = [
  { id: "nav", label: "Nav", icon: Menu },
  { id: "tree", label: "Tree", icon: ListTree },
  { id: "github", label: "Connected to GitHub", icon: GitBranch },
];

export function Sidebar({
  onAddResource,
  onSaveSession,
}: {
  onAddResource: () => void;
  onSaveSession: () => void;
}) {
  const pathname = usePathname();
  const { githubConnected, saveSignal } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<Tab>("nav");
  const [showNewSpace, setShowNewSpace] = useState(false);

  useEffect(() => {
    function onShortcut() {
      setShowNewSpace(true);
    }
    window.addEventListener(NEW_SPACE_SHORTCUT_EVENT, onShortcut);
    return () => window.removeEventListener(NEW_SPACE_SHORTCUT_EVENT, onShortcut);
  }, []);

  const dotColor =
    githubConnected === null ? "bg-neutral-400" : githubConnected ? "bg-emerald-500" : "bg-rose-500";

  const content = collapsed ? (
    <nav className="flex h-full w-14 shrink-0 flex-col items-center border-r border-neutral-200 bg-neutral-50 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Expand sidebar"
        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
      >
        <Menu size={18} />
      </button>
      <Link
        href="/"
        aria-label="Home"
        title="Home"
        className={`mt-1 rounded-md p-2 ${
          pathname === "/"
            ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white"
            : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        }`}
      >
        <Home size={16} />
      </Link>
      <button
        onClick={onAddResource}
        aria-label="Add Resource"
        title="Add Resource (Cmd/Ctrl+N)"
        className="mt-3 rounded-md bg-violet-100 p-2 text-violet-800 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onSaveSession}
        aria-label="Save Session"
        title="Save Session as Collection"
        className="mt-2 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        <Camera size={16} />
      </button>
      <div className="mt-3 flex flex-col items-center gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`rounded-md p-2 ${
                active
                  ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              <Icon size={16} />
            </Link>
          );
        })}
      </div>
      <span
        key={saveSignal}
        title={githubConnected ? "Connected to GitHub" : "Not connected"}
        className={`save-pulse mt-auto h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`}
      />
    </nav>
  ) : (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-1 border-b border-neutral-200 p-2 dark:border-neutral-800">
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          <Menu size={16} />
        </button>
        <Link
          href="/"
          aria-label="Home"
          title="Home"
          className={`rounded-md p-1.5 ${
            pathname === "/"
              ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white"
              : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
        >
          <Home size={16} />
        </Link>
        <div className="flex flex-1 rounded-md bg-neutral-200/60 p-0.5 dark:bg-neutral-900">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                title={t.label}
                aria-label={t.label}
                className={`relative flex flex-1 items-center justify-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
                  active
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                <Icon size={13} />
                {t.id === "github" && (
                  <span
                    key={saveSignal}
                    className={`save-pulse absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${dotColor}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 p-3">
        <button
          onClick={onAddResource}
          title="Cmd/Ctrl+N"
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-violet-100 px-3 py-2 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60"
        >
          <Plus size={16} /> Add Resource
        </button>
        <button
          onClick={onSaveSession}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
        >
          <Camera size={14} /> Save Session
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

      <div className="flex-1 overflow-y-auto">
        {tab === "nav" && <NavPanel onNewSpace={() => setShowNewSpace(true)} />}
        {tab === "tree" && <TreePanel />}
        {tab === "github" && <GithubStatusPanel />}
      </div>
    </nav>
  );

  return (
    <>
      {content}
      {showNewSpace && <SpaceModal onClose={() => setShowNewSpace(false)} />}
    </>
  );
}
