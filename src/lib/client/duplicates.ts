import { Resource } from "@/lib/validation/schemas";

/**
 * Normalizes a URL for duplicate comparison. Deliberately conservative:
 * only strips a bare-path trailing slash, hash fragments, and known pure
 * tracking params — never touches query params that could materially
 * change the resource, per the "don't incorrectly merge" requirement.
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
]);

export function normalizeForDedup(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    u.hash = "";
    for (const param of Array.from(u.searchParams.keys())) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) u.searchParams.delete(param);
    }
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    if (u.pathname === "/") u.pathname = "";
    else if (u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    const search = u.searchParams.toString();
    return `${u.hostname}${u.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return null;
  }
}

export interface DuplicateGroup {
  key: string;
  resources: Resource[];
}

/** Groups active (non-trashed) resources that normalize to the same URL. */
export function findDuplicateGroups(resources: Resource[], ignoredKeys: string[]): DuplicateGroup[] {
  const ignored = new Set(ignoredKeys);
  const byKey = new Map<string, Resource[]>();

  for (const r of resources) {
    if (r.trash) continue;
    const key = normalizeForDedup(r.url);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }

  const groups: DuplicateGroup[] = [];
  for (const [key, list] of byKey) {
    if (list.length < 2 || ignored.has(key)) continue;
    groups.push({ key, resources: list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
  }
  return groups.sort((a, b) => b.resources.length - a.resources.length);
}
