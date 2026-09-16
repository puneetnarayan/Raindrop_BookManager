"use client";

import { useState } from "react";

export function InlineEditableText({
  value,
  onSave,
  className,
  inputClassName,
  as: Tag = "span",
}: {
  value: string;
  onSave: (next: string) => void;
  className?: string;
  inputClassName?: string;
  as?: "span" | "h1";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={inputClassName}
      />
    );
  }

  return (
    <Tag
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to rename"
      className={`${className ?? ""} cursor-text rounded hover:bg-black/5 dark:hover:bg-white/10`}
    >
      {value}
    </Tag>
  );
}
