import {
  CollectionsFileSchema,
  QuickLinksFileSchema,
  ResourcesFileSchema,
  SpacesFileSchema,
  TagsFileSchema,
  Collection,
  QuickLink,
  Resource,
  Space,
  Tag,
} from "@/lib/validation/schemas";

export interface ParsedJsonExport {
  spaces: Space[];
  collections: Collection[];
  resources: Resource[];
  tags: Tag[];
  quickLinks: QuickLink[];
}

export class JsonImportValidationError extends Error {}

/** Validates a parsed JSON export payload against our schemas before anything is written. */
export function parseJsonExport(raw: unknown): ParsedJsonExport {
  if (typeof raw !== "object" || raw === null) {
    throw new JsonImportValidationError("File does not contain a JSON object.");
  }
  const obj = raw as Record<string, unknown>;

  const spacesResult = SpacesFileSchema.safeParse(obj.spaces ?? []);
  if (!spacesResult.success) {
    throw new JsonImportValidationError(`Invalid "spaces": ${spacesResult.error.issues[0]?.message}`);
  }
  const collectionsResult = CollectionsFileSchema.safeParse(obj.collections ?? []);
  if (!collectionsResult.success) {
    throw new JsonImportValidationError(`Invalid "collections": ${collectionsResult.error.issues[0]?.message}`);
  }
  const resourcesResult = ResourcesFileSchema.safeParse(obj.resources ?? []);
  if (!resourcesResult.success) {
    throw new JsonImportValidationError(`Invalid "resources": ${resourcesResult.error.issues[0]?.message}`);
  }
  const tagsResult = TagsFileSchema.safeParse(obj.tags ?? []);
  if (!tagsResult.success) {
    throw new JsonImportValidationError(`Invalid "tags": ${tagsResult.error.issues[0]?.message}`);
  }
  const quickLinksResult = QuickLinksFileSchema.safeParse(obj.quickLinks ?? []);
  if (!quickLinksResult.success) {
    throw new JsonImportValidationError(`Invalid "quickLinks": ${quickLinksResult.error.issues[0]?.message}`);
  }

  return {
    spaces: spacesResult.data,
    collections: collectionsResult.data,
    resources: resourcesResult.data,
    tags: tagsResult.data,
    quickLinks: quickLinksResult.data,
  };
}
