"use client";

import { renderMiniMarkdown } from "@/lib/client/markdown";

export function MarkdownView({ content, className }: { content: string; className?: string }) {
  return (
    // renderMiniMarkdown escapes all input before wrapping it in whitelisted tags.
    <div
      className={`prose-sm max-w-none text-sm ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: renderMiniMarkdown(content) }}
    />
  );
}
