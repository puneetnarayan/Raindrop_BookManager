/**
 * Minimal, safe Markdown-subset renderer for Notes fields.
 *
 * The whole input is HTML-escaped up front, so every transform below only
 * ever wraps already-escaped text in whitelisted tags — there is no path for
 * raw HTML or scripts to reach the DOM, without needing a sanitizer dependency.
 *
 * Supported: # / ## / ### headings, **bold**, *italic*, `code`,
 * [text](url) links, "- " / "* " bullet lists, "1. " numbered lists.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(escaped: string): string {
  // Links first (text is already escaped, so href content is safe literal text).
  let out = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-black/10 px-1 py-0.5 text-[0.85em] dark:bg-white/10">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  return out;
}

export function renderMiniMarkdown(raw: string): string {
  const lines = escapeHtml(raw).split("\n");
  const htmlLines: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function closeList() {
    if (listType) {
      htmlLines.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  }

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);

    if (heading) {
      closeList();
      const level = heading[1].length;
      const sizeClass = level === 1 ? "text-lg font-semibold" : level === 2 ? "text-base font-semibold" : "text-sm font-semibold";
      htmlLines.push(`<p class="${sizeClass}">${renderInline(heading[2])}</p>`);
    } else if (bullet) {
      if (listType !== "ul") {
        closeList();
        htmlLines.push('<ul class="list-disc pl-5">');
        listType = "ul";
      }
      htmlLines.push(`<li>${renderInline(bullet[1])}</li>`);
    } else if (numbered) {
      if (listType !== "ol") {
        closeList();
        htmlLines.push('<ol class="list-decimal pl-5">');
        listType = "ol";
      }
      htmlLines.push(`<li>${renderInline(numbered[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
      htmlLines.push("<br />");
    } else {
      closeList();
      htmlLines.push(`<p>${renderInline(line)}</p>`);
    }
  }
  closeList();

  return htmlLines.join("\n");
}
