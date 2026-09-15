import { NextResponse } from "next/server";
import { getRepoInfo } from "@/lib/github/client";
import { getGitHubConfig } from "@/lib/github/env";
import { getFile } from "@/lib/github/client";
import { DATA_FILES } from "@/lib/data/files";
import { errorResponse } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cfg = getGitHubConfig();
    const repo = await getRepoInfo();
    const metaFile = await getFile(DATA_FILES.metadata.path);
    const metadata = metaFile ? JSON.parse(metaFile.content) : null;

    return NextResponse.json({
      connected: true,
      repository: repo.fullName,
      branch: cfg.branch,
      private: repo.private,
      lastBackupAt: metadata?.lastBackupAt ?? null,
      lastWriteAt: metadata?.lastWriteAt ?? null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
