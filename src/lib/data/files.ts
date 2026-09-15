import { z } from "zod";
import {
  CollectionsFileSchema,
  MetadataSchema,
  NotesFileSchema,
  QuickLinksFileSchema,
  ResourcesFileSchema,
  SettingsSchema,
  SpacesFileSchema,
  TagsFileSchema,
  TasksFileSchema,
  WorkspaceSchema,
} from "@/lib/validation/schemas";

/**
 * Every persistent data file lives under data/ in the data repo.
 * Adding a new data type means adding one entry here.
 */
export const DATA_FILES = {
  workspace: { path: "data/workspace.json", schema: WorkspaceSchema, default: { name: "My Workspace", schemaVersion: 1 } },
  spaces: { path: "data/spaces.json", schema: SpacesFileSchema, default: [] },
  collections: { path: "data/collections.json", schema: CollectionsFileSchema, default: [] },
  resources: { path: "data/resources.json", schema: ResourcesFileSchema, default: [] },
  tags: { path: "data/tags.json", schema: TagsFileSchema, default: [] },
  tasks: { path: "data/tasks.json", schema: TasksFileSchema, default: [] },
  notes: { path: "data/notes.json", schema: NotesFileSchema, default: [] },
  quickLinks: { path: "data/quick-links.json", schema: QuickLinksFileSchema, default: [] },
  settings: { path: "data/settings.json", schema: SettingsSchema, default: {} },
  metadata: { path: "data/metadata.json", schema: MetadataSchema, default: {} },
} as const;

export type DataFileKey = keyof typeof DATA_FILES;

export function isDataFileKey(key: string): key is DataFileKey {
  return Object.prototype.hasOwnProperty.call(DATA_FILES, key);
}

export type DataFileValue<K extends DataFileKey> = z.infer<(typeof DATA_FILES)[K]["schema"]>;
