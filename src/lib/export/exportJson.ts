import { Collection, QuickLink, Resource, Space, Tag } from "@/lib/validation/schemas";

export interface JsonExportPayload {
  exportedAt: string;
  schemaVersion: 1;
  spaces: Space[];
  collections: Collection[];
  resources: Resource[];
  tags: Tag[];
  quickLinks?: QuickLink[];
}

export function buildFullExport(
  spaces: Space[],
  collections: Collection[],
  resources: Resource[],
  tags: Tag[],
  quickLinks: QuickLink[]
): JsonExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    spaces,
    collections,
    resources,
    tags,
    quickLinks,
  };
}

/** Exports one Space plus its collections, resources, and the tags those resources use. */
export function buildSpaceExport(
  spaceId: string,
  spaces: Space[],
  collections: Collection[],
  resources: Resource[],
  tags: Tag[]
): JsonExportPayload {
  const space = spaces.filter((s) => s.id === spaceId);
  const spaceCollections = collections.filter((c) => c.spaceId === spaceId);
  const spaceResources = resources.filter((r) => r.spaceId === spaceId);
  const usedTagNames = new Set(spaceResources.flatMap((r) => r.tags));
  const usedTags = tags.filter((t) => usedTagNames.has(t.name));

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    spaces: space,
    collections: spaceCollections,
    resources: spaceResources,
    tags: usedTags,
  };
}

/** Exports one Collection's resources, wrapped with its parent Space and Collection for context. */
export function buildCollectionExport(
  collectionId: string,
  spaces: Space[],
  collections: Collection[],
  resources: Resource[],
  tags: Tag[]
): JsonExportPayload {
  const collection = collections.find((c) => c.id === collectionId);
  const collectionResources = resources.filter((r) => r.collectionId === collectionId);
  const space = spaces.filter((s) => s.id === collection?.spaceId);
  const usedTagNames = new Set(collectionResources.flatMap((r) => r.tags));
  const usedTags = tags.filter((t) => usedTagNames.has(t.name));

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    spaces: space,
    collections: collection ? [collection] : [],
    resources: collectionResources,
    tags: usedTags,
  };
}
