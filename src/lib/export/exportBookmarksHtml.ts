import { Collection, Resource, Space } from "@/lib/validation/schemas";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Generates a standard Netscape Bookmark File, folders nested as Space > Collection. */
export function resourcesToBookmarksHtml(spaces: Space[], collections: Collection[], resources: Resource[]): string {
  const lines: string[] = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
  ];

  for (const space of spaces) {
    lines.push(`    <DT><H3>${escapeHtml(space.name)}</H3>`);
    lines.push("    <DL><p>");

    const spaceCollections = collections.filter((c) => c.spaceId === space.id);
    for (const collection of spaceCollections) {
      const collectionResources = resources.filter((r) => r.collectionId === collection.id);
      lines.push(`        <DT><H3>${escapeHtml(collection.name)}</H3>`);
      lines.push("        <DL><p>");
      for (const r of collectionResources) {
        const addDate = Math.floor(new Date(r.createdAt).getTime() / 1000);
        lines.push(
          `            <DT><A HREF="${escapeHtml(r.url)}" ADD_DATE="${addDate}">${escapeHtml(r.title || r.url)}</A>`
        );
      }
      lines.push("        </DL><p>");
    }
    lines.push("    </DL><p>");
  }

  lines.push("</DL><p>");
  return lines.join("\n") + "\n";
}
