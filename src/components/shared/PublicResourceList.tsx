"use client";

import { Globe } from "lucide-react";

export interface PublicResource {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  thumbnail?: string;
  domain?: string;
  tags: string[];
}

export function PublicResourceList({ resources }: { resources: PublicResource[] }) {
  if (resources.length === 0) {
    return <p className="text-sm text-neutral-500">Nothing here yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r) => (
        <a
          key={r.id}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 transition hover:shadow-md dark:border-neutral-800"
        >
          {r.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.thumbnail}
              alt=""
              loading="lazy"
              className="h-28 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center bg-neutral-100 dark:bg-neutral-900">
              <Globe size={24} className="text-neutral-300 dark:text-neutral-700" />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-1 p-3">
            <div className="flex items-start gap-2">
              {r.favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.favicon}
                  alt=""
                  loading="lazy"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              ) : (
                <Globe size={14} className="mt-0.5 shrink-0 text-neutral-400" />
              )}
              <span className="line-clamp-2 text-sm font-medium">{r.title || r.url}</span>
            </div>
            {r.description && (
              <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{r.description}</p>
            )}
            <p className="truncate text-xs text-neutral-500">{r.domain}</p>
            {r.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {r.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
