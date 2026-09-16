"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/client/workspace-context";
import { ResourceGrid } from "@/components/resources/ResourceGrid";

const STAT_COLORS = {
  violet: "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200",
  blue: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  emerald: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200",
  neutral: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800/60 dark:text-neutral-200",
  rose: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200",
} as const;

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: number;
  href: string;
  color: keyof typeof STAT_COLORS;
}) {
  return (
    <Link href={href} className={`stat-card ${STAT_COLORS[color]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { spaces, collections, resources } = useWorkspace();

  const active = resources.filter((r) => !r.trash);
  const favorites = active.filter((r) => r.favorite);
  const pinned = active.filter((r) => r.pinned);
  const archived = resources.filter((r) => r.archived && !r.trash);
  const trashed = resources.filter((r) => r.trash);
  const dead = active.filter((r) => r.linkStatus === "dead");

  const recentlyAdded = [...active]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const recentlyOpened = [...active]
    .filter((r) => r.lastOpenedAt)
    .sort((a, b) => (b.lastOpenedAt || "").localeCompare(a.lastOpenedAt || ""))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Spaces" value={spaces.filter((s) => !s.trash).length} href="/spaces" color="violet" />
        <StatCard label="Collections" value={collections.filter((c) => !c.trash).length} href="/collections" color="blue" />
        <StatCard label="Resources" value={active.length} href="/all" color="emerald" />
        <StatCard label="Favorites" value={favorites.length} href="/favorites" color="amber" />
        <StatCard label="Pinned" value={pinned.length} href="/pinned" color="sky" />
        <StatCard label="Archived" value={archived.length} href="/archive" color="neutral" />
        <StatCard label="Trash" value={trashed.length} href="/trash" color="rose" />
      </div>

      {dead.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {dead.length} resource{dead.length === 1 ? "" : "s"} flagged as dead links. Link
          checking lands in a later phase.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Recently Added
        </h2>
        <ResourceGrid resources={recentlyAdded} emptyLabel="Add your first resource to see it here." />
      </section>

      {recentlyOpened.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Recently Opened
          </h2>
          <ResourceGrid resources={recentlyOpened} />
        </section>
      )}
    </div>
  );
}
