import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function extractMeta(html: string, matchers: RegExp[]): string | null {
  for (const re of matchers) {
    const match = html.match(re);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function metaTag(property: string): RegExp {
  return new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
}

function metaTagReversed(property: string): RegExp {
  return new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
}

/**
 * Best-effort server-side metadata fetch for the Add Resource flow.
 * Deliberately tolerant: any failure here must never block saving the resource.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "invalid_request", message: "'url' is required." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "Not a valid http(s) URL." }, { status: 400 });
  }

  const domain = url.hostname.replace(/^www\./, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RaindropBookManagerBot/1.0; +metadata-fetch)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ title: "", description: "", favicon: null, thumbnail: null, domain });
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ title: "", description: "", favicon: null, thumbnail: null, domain });
    }

    // Only read the head; pages can be arbitrarily large.
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytes = 0;
      while (bytes < 200_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        bytes += value.length;
        if (html.includes("</head>")) break;
      }
      reader.cancel().catch(() => {});
    } else {
      html = await res.text();
    }

    const title =
      extractMeta(html, [metaTag("og:title"), metaTagReversed("og:title")]) ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ||
      "";

    const description =
      extractMeta(html, [
        metaTag("og:description"),
        metaTagReversed("og:description"),
        metaTag("description"),
        metaTagReversed("description"),
      ]) || "";

    const ogImage = extractMeta(html, [metaTag("og:image"), metaTagReversed("og:image")]);
    const thumbnail = ogImage ? new URL(ogImage, url).toString() : null;

    const iconHref = html.match(
      /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i
    )?.[1];
    const favicon = iconHref
      ? new URL(iconHref, url).toString()
      : `${url.protocol}//${url.host}/favicon.ico`;

    return NextResponse.json({ title, description, favicon, thumbnail, domain });
  } catch {
    // Network failure, timeout, or parse error: still let the resource be saved.
    return NextResponse.json({ title: "", description: "", favicon: null, thumbnail: null, domain });
  }
}
