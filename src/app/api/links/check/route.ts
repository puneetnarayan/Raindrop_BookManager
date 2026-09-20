import { NextRequest, NextResponse } from "next/server";
import { checkUrls } from "@/lib/links/check";

export const dynamic = "force-dynamic";
// Best-effort — actual serverless function duration is capped by your hosting plan.
export const maxDuration = 60;

const MAX_URLS_PER_REQUEST = 25;
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TIMEOUT_MS = 15000;

interface CheckLinksBody {
  urls?: unknown;
  timeoutMs?: unknown;
}

export async function POST(request: NextRequest) {
  let body: CheckLinksBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Request body must be JSON." },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.urls) || body.urls.some((u) => typeof u !== "string")) {
    return NextResponse.json(
      { error: "invalid_request", message: "'urls' must be an array of strings." },
      { status: 400 }
    );
  }
  if (body.urls.length > MAX_URLS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: `Check at most ${MAX_URLS_PER_REQUEST} links per request — batch larger checks client-side.`,
      },
      { status: 400 }
    );
  }
  if (body.urls.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const timeoutMs =
    typeof body.timeoutMs === "number" && body.timeoutMs > 0
      ? Math.min(body.timeoutMs, MAX_TIMEOUT_MS)
      : DEFAULT_TIMEOUT_MS;

  const results = await checkUrls(body.urls as string[], timeoutMs);
  return NextResponse.json({ results });
}
