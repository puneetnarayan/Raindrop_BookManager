"use client";

import { Resource } from "@/lib/validation/schemas";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Inbox } from "lucide-react";

export function ResourceGrid({
  resources,
  emptyLabel = "No resources here yet.",
}: {
  resources: Resource[];
  emptyLabel?: string;
}) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-16 text-neutral-400 dark:border-neutral-700">
        <Inbox size={28} />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resources.map((r) => (
        <ResourceCard key={r.id} resource={r} />
      ))}
    </div>
  );
}
