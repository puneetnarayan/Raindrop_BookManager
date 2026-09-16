import { z } from "zod";

// Every persistent record shares these fields.
const baseFields = {
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};

export const ResourceTypeSchema = z.enum([
  "website",
  "article",
  "tool",
  "document",
  "video",
  "repository",
  "other",
]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const LinkStatusSchema = z.enum([
  "unknown",
  "healthy",
  "redirected",
  "warning",
  "dead",
]);
export type LinkStatus = z.infer<typeof LinkStatusSchema>;

export const PrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const ShareModeSchema = z.enum(["private", "public"]);
export type ShareMode = z.infer<typeof ShareModeSchema>;

export const SpaceSchema = z.object({
  ...baseFields,
  name: z.string().min(1).max(200),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  sortOrder: z.number().default(0),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  trash: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  notes: z.string().max(20000).optional(),
  shareMode: ShareModeSchema.default("private"),
  shareToken: z.string().nullable().default(null),
});
export type Space = z.infer<typeof SpaceSchema>;

export const CollectionSchema = z.object({
  ...baseFields,
  spaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(20000).optional(),
  sortOrder: z.number().default(0),
  pinned: z.boolean().default(false),
  favorite: z.boolean().default(false),
  archived: z.boolean().default(false),
  trash: z.boolean().default(false),
  shareMode: ShareModeSchema.default("private"),
  shareToken: z.string().nullable().default(null),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const HighlightSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(5000),
  color: z.string().max(20).default("yellow"),
  note: z.string().max(2000).optional(),
  createdAt: z.string().datetime(),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const ResourceSchema = z.object({
  ...baseFields,
  url: z.string().url(),
  title: z.string().max(500).default(""),
  description: z.string().max(2000).optional(),
  domain: z.string().max(300).optional(),
  favicon: z.string().max(2000).optional(),
  thumbnail: z.string().max(2000).optional(),
  spaceId: z.string().uuid(),
  collectionId: z.string().uuid(),
  tags: z.array(z.string().max(100)).default([]),
  notes: z.string().max(20000).optional(),
  highlights: z.array(HighlightSchema).default([]),
  resourceType: ResourceTypeSchema.default("website"),
  favorite: z.boolean().default(false),
  pinned: z.boolean().default(false),
  next: z.boolean().default(false),
  priority: PrioritySchema.default("normal"),
  dueDate: z.string().datetime().nullable().default(null),
  archived: z.boolean().default(false),
  trash: z.boolean().default(false),
  lastOpenedAt: z.string().datetime().nullable().default(null),
  httpStatus: z.number().nullable().default(null),
  linkStatus: LinkStatusSchema.default("unknown"),
  lastCheckedAt: z.string().datetime().nullable().default(null),
  sortOrder: z.number().default(0),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const TagSchema = z.object({
  ...baseFields,
  name: z.string().min(1).max(100),
  color: z.string().max(20).optional(),
});
export type Tag = z.infer<typeof TagSchema>;

export const TaskSchema = z.object({
  ...baseFields,
  resourceId: z.string().uuid().nullable().default(null),
  collectionId: z.string().uuid().nullable().default(null),
  title: z.string().min(1).max(500),
  note: z.string().max(20000).optional(),
  priority: PrioritySchema.default("normal"),
  dueDate: z.string().datetime().nullable().default(null),
  completed: z.boolean().default(false),
  completedAt: z.string().datetime().nullable().default(null),
  archived: z.boolean().default(false),
  sortOrder: z.number().default(0),
});
export type Task = z.infer<typeof TaskSchema>;

export const NoteSchema = z.object({
  ...baseFields,
  scope: z.enum(["space", "collection", "resource", "task"]),
  scopeId: z.string().uuid(),
  content: z.string().max(50000),
});
export type Note = z.infer<typeof NoteSchema>;

export const QuickLinkSchema = z.object({
  ...baseFields,
  name: z.string().min(1).max(200),
  url: z.string().url(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  pinned: z.boolean().default(false),
  sortOrder: z.number().default(0),
});
export type QuickLink = z.infer<typeof QuickLinkSchema>;

export const SettingsSchema = z.object({
  defaultSpaceId: z.string().uuid().nullable().default(null),
  defaultCollectionId: z.string().uuid().nullable().default(null),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  dateFormat: z.string().default("YYYY-MM-DD"),
  timeFormat: z.enum(["12h", "24h"]).default("24h"),
  linkCheckTimeoutMs: z.number().default(8000),
  /** Normalized-URL group keys the user has explicitly said are not duplicates. */
  ignoredDuplicateGroupKeys: z.array(z.string()).default([]),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const MetadataSchema = z.object({
  schemaVersion: z.number().default(1),
  lastBackupAt: z.string().datetime().nullable().default(null),
  lastWriteAt: z.string().datetime().nullable().default(null),
});
export type Metadata = z.infer<typeof MetadataSchema>;

export const WorkspaceSchema = z.object({
  name: z.string().default("My Workspace"),
  schemaVersion: z.number().default(1),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

// Wrapper schemas for the array-of-record files.
export const SpacesFileSchema = z.array(SpaceSchema);
export const CollectionsFileSchema = z.array(CollectionSchema);
export const ResourcesFileSchema = z.array(ResourceSchema);
export const TagsFileSchema = z.array(TagSchema);
export const TasksFileSchema = z.array(TaskSchema);
export const NotesFileSchema = z.array(NoteSchema);
export const QuickLinksFileSchema = z.array(QuickLinkSchema);
