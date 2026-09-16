import { newId, now } from "@/lib/client/ids";
import { Collection, Resource, Space, Tag } from "@/lib/validation/schemas";
import { ParsedJsonExport } from "@/lib/import/parseJsonExport";

export interface RemappedImport {
  spaces: Space[];
  collections: Collection[];
  resources: Resource[];
  tags: Tag[];
}

/**
 * Re-issues IDs for every imported entity so they can never collide with
 * existing data, while preserving internal relationships (a resource that
 * pointed at an imported space/collection still points at the new copy).
 * A resource whose spaceId/collectionId isn't present in this same import
 * is assumed to reference something already in the current workspace, so
 * that reference is left untouched.
 */
export function remapImportIds(parsed: ParsedJsonExport): RemappedImport {
  const timestamp = now();
  const spaceIdMap = new Map<string, string>();
  const collectionIdMap = new Map<string, string>();

  const spaces: Space[] = parsed.spaces.map((s) => {
    const id = newId();
    spaceIdMap.set(s.id, id);
    return { ...s, id, createdAt: timestamp, updatedAt: timestamp };
  });

  const collections: Collection[] = parsed.collections.map((c) => {
    const id = newId();
    collectionIdMap.set(c.id, id);
    return {
      ...c,
      id,
      spaceId: spaceIdMap.get(c.spaceId) ?? c.spaceId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  const resources: Resource[] = parsed.resources.map((r) => ({
    ...r,
    id: newId(),
    spaceId: spaceIdMap.get(r.spaceId) ?? r.spaceId,
    collectionId: collectionIdMap.get(r.collectionId) ?? r.collectionId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const tags: Tag[] = parsed.tags.map((t) => ({ ...t, id: newId(), createdAt: timestamp, updatedAt: timestamp }));

  return { spaces, collections, resources, tags };
}
