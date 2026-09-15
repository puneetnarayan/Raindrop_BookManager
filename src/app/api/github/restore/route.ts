import { NextRequest, NextResponse } from "next/server";
import { restoreBackup } from "@/lib/backup/backup";
import { errorResponse } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Request body must be JSON." },
      { status: 400 }
    );
  }

  if (!body.path || typeof body.path !== "string" || !body.path.startsWith("backups/")) {
    return NextResponse.json(
      { error: "invalid_request", message: "'path' must be a backup file path." },
      { status: 400 }
    );
  }

  try {
    const result = await restoreBackup(body.path);
    return NextResponse.json({ restored: body.path, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
