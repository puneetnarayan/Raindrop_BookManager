import { NextRequest, NextResponse } from "next/server";
import { createBackup, listBackups } from "@/lib/backup/backup";
import { errorResponse } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backups = await listBackups();
    return NextResponse.json({ backups });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  let reason = "manual";
  try {
    const body = await request.json();
    if (typeof body?.reason === "string" && body.reason.trim()) {
      reason = body.reason.trim();
    }
  } catch {
    // no body provided is fine; default reason is used
  }

  try {
    const result = await createBackup(reason);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
