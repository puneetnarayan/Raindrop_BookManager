"use client";

import { useState } from "react";
import { MarkdownView } from "@/components/common/MarkdownView";

export function MarkdownEditor({
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="rounded border border-neutral-300 dark:border-neutral-700">
      <div className="flex items-center justify-between border-b border-neutral-200 px-2 py-1 dark:border-neutral-800">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`rounded px-2 py-0.5 text-xs ${
              tab === "write"
                ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded px-2 py-0.5 text-xs ${
              tab === "preview"
                ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Preview
          </button>
        </div>
        <span className="text-[10px] text-neutral-400">
          # heading · **bold** · *italic* · `code` · [link](url) · - bullet · 1. numbered
        </span>
      </div>

      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-b bg-transparent px-3 py-2 text-sm focus:outline-none dark:bg-neutral-800"
        />
      ) : (
        <div className="min-h-[3rem] px-3 py-2">
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-sm text-neutral-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
