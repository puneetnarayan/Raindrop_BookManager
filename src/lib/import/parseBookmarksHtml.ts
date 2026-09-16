export interface ParsedBookmark {
  folder: string | null;
  title: string;
  url: string;
}

/**
 * Parses a Netscape Bookmark File (the format Chrome/Firefox/Safari export)
 * using the browser's own DOMParser. Each link is tagged with the name of its
 * nearest enclosing folder (one level — nested sub-folders are flattened into
 * their own folder name rather than a full path, to keep the Space/Collection
 * mapping simple for V1).
 */
export function parseBookmarksHtml(html: string): ParsedBookmark[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rootDl = doc.querySelector("dl");
  const out: ParsedBookmark[] = [];
  if (!rootDl) return out;

  function walk(dl: Element, folder: string | null) {
    for (const dt of Array.from(dl.children)) {
      if (dt.tagName !== "DT") continue;
      const h3 = dt.querySelector(":scope > h3");
      const nestedDl = dt.querySelector(":scope > dl");
      if (h3 && nestedDl) {
        walk(nestedDl, h3.textContent?.trim() || "Untitled Folder");
      } else {
        const a = dt.querySelector(":scope > a");
        const href = a?.getAttribute("href");
        if (a && href && /^https?:\/\//i.test(href)) {
          out.push({ folder, title: a.textContent?.trim() || href, url: href });
        }
      }
    }
  }

  walk(rootDl, null);
  return out;
}

export interface BookmarkFolderSummary {
  name: string;
  count: number;
}

export function summarizeFolders(bookmarks: ParsedBookmark[]): BookmarkFolderSummary[] {
  const counts = new Map<string, number>();
  for (const b of bookmarks) {
    const key = b.folder ?? "(no folder)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}
