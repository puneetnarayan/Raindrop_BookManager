import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/github/client";
import { writeData } from "@/lib/data/store";
import { DATA_FILES, isDataFileKey } from "@/lib/data/files";
import { errorResponse } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

interface WriteBody {
  file: string;
  data: unknown;
  expectedSha?: string | null;
  message?: string;
}

export async function POST(request: NextRequest) {
  let body: WriteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Request body must be JSON." },
      { status: 400 }
    );
  }

  if (!body.file || !isDataFileKey(body.file)) {
    return NextResponse.json(
      { error: "invalid_request", message: "'file' must be a known data file key." },
      { status: 400 }
    );
  }
  if (body.data === undefined) {
    return NextResponse.json(
      { error: "invalid_request", message: "'data' is required." },
      { status: 400 }
    );
  }

  try {
    const result = await writeData(body.file, body.data as never, {
      expectedSha: body.expectedSha,
      message: body.message,
    });

    // Best-effort: record last write time. Never fail the primary write over this.
    try {
      const meta = await getFile(DATA_FILES.metadata.path);
      const parsed = meta ? JSON.parse(meta.content) : {};
      await writeData(
        "metadata",
        { ...parsed, lastWriteAt: new Date().toISOString(), schemaVersion: parsed.schemaVersion ?? 1 },
        { expectedSha: meta?.sha ?? null, message: "chore(data): record last write time" }
      );
    } catch {
      // non-fatal
    }

    return NextResponse.json({ file: body.file, sha: result.sha, commitSha: result.commitSha });
  } catch (err) {
    return errorResponse(err);
  }
}
