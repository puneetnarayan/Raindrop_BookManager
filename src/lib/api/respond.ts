import { NextResponse } from "next/server";
import { GitHubApiError, GitHubConflictError } from "@/lib/github/client";
import { GitHubConfigError } from "@/lib/github/env";
import { DataValidationError } from "@/lib/data/store";

/**
 * Maps known error types to a consistent, user-understandable JSON error response.
 * Every API route should route caught errors through this.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof GitHubConflictError) {
    return NextResponse.json(
      {
        error: "conflict",
        message:
          "This data changed on GitHub since you last loaded it. Reload the latest version before saving again.",
        path: err.path,
      },
      { status: 409 }
    );
  }

  if (err instanceof DataValidationError) {
    return NextResponse.json(
      {
        error: "validation_failed",
        message: err.message,
        issues: err.issues,
      },
      { status: 400 }
    );
  }

  if (err instanceof GitHubConfigError) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: err.message,
      },
      { status: 503 }
    );
  }

  if (err instanceof GitHubApiError) {
    const status = err.status === 404 ? 404 : err.status === 401 || err.status === 403 ? 401 : 502;
    const message =
      status === 401
        ? "GitHub authentication failed. Check that GITHUB_TOKEN is valid and has access to the data repository."
        : status === 404
          ? "Repository or branch not found. Check GITHUB_DATA_OWNER, GITHUB_DATA_REPO and GITHUB_DATA_BRANCH."
          : "GitHub is currently unavailable. Please retry.";
    return NextResponse.json({ error: "github_error", message }, { status });
  }

  console.error("Unhandled API error:", err);
  return NextResponse.json(
    { error: "internal_error", message: "Something went wrong. Please retry." },
    { status: 500 }
  );
}
