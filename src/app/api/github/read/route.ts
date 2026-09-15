import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/data/store";
import { isDataFileKey } from "@/lib/data/files";
import { errorResponse } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");
  if (!file || !isDataFileKey(file)) {
    return NextResponse.json(
      { error: "invalid_request", message: "Query param 'file' must be a known data file key." },
      { status: 400 }
    );
  }

  try {
    const { data, sha } = await readData(file);
    return NextResponse.json({ file, data, sha });
  } catch (err) {
    return errorResponse(err);
  }
}
