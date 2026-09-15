import { NextResponse } from "next/server";
import { getFile } from "@/lib/github/client";
import { writeData } from "@/lib/data/store";
import { DATA_FILES, DataFileKey } from "@/lib/data/files";
import { errorResponse } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/**
 * Creates any data files that don't exist yet, using their schema defaults.
 * Safe to call repeatedly: existing files are left untouched.
 */
export async function POST() {
  try {
    const keys = Object.keys(DATA_FILES) as DataFileKey[];
    const created: string[] = [];

    for (const key of keys) {
      const def = DATA_FILES[key];
      const existing = await getFile(def.path);
      if (existing) continue;
      await writeData(key, def.default as never, {
        message: `chore(init): create ${def.path}`,
      });
      created.push(def.path);
    }

    return NextResponse.json({ created });
  } catch (err) {
    return errorResponse(err);
  }
}
