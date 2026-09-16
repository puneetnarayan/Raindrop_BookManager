"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiError, ConflictError, readFile, writeFile } from "@/lib/client/api";
import { newId, now } from "@/lib/client/ids";
import {
  Collection,
  QuickLink,
  Resource,
  Settings,
  Space,
  Tag,
} from "@/lib/validation/schemas";
import { DATA_FILES, DataFileKey } from "@/lib/data/files";

interface FileSlice<T> {
  data: T;
  sha: string | null;
}

interface WorkspaceData {
  spaces: FileSlice<Space[]>;
  collections: FileSlice<Collection[]>;
  resources: FileSlice<Resource[]>;
  tags: FileSlice<Tag[]>;
  quickLinks: FileSlice<QuickLink[]>;
  settings: FileSlice<Settings>;
}

type LoadState = "loading" | "ready" | "error";

interface WorkspaceContextValue {
  loadState: LoadState;
  loadError: string | null;
  spaces: Space[];
  collections: Collection[];
  resources: Resource[];
  tags: Tag[];
  quickLinks: QuickLink[];
  settings: Settings;
  toast: string | null;
  dismissToast: () => void;
  reload: () => Promise<void>;
  /** null while unknown, then true/false once the connection check completes. */
  githubConnected: boolean | null;
  githubRepository: string | null;
  /** Increments on every successful write; UI can watch it to pulse a "saved" indicator. */
  saveSignal: number;

  createSpace: (input: { name: string; icon?: string; color?: string }) => Promise<Space>;
  updateSpace: (id: string, patch: Partial<Space>) => Promise<void>;
  deleteSpaceForever: (id: string) => Promise<void>;

  createCollection: (input: {
    spaceId: string;
    name: string;
    icon?: string;
    color?: string;
  }) => Promise<Collection>;
  updateCollection: (id: string, patch: Partial<Collection>) => Promise<void>;
  deleteCollectionForever: (id: string) => Promise<void>;

  createResource: (input: Partial<Resource> & { url: string; spaceId: string; collectionId: string }) => Promise<Resource>;
  updateResource: (id: string, patch: Partial<Resource>) => Promise<void>;
  deleteResourceForever: (id: string) => Promise<void>;
  /** Applies `updater(resource)` to every matching resource in a single write. */
  bulkUpdateResources: (ids: string[], updater: (r: Resource) => Partial<Resource>) => Promise<void>;
  bulkDeleteResourcesForever: (ids: string[]) => Promise<void>;

  /** Appends already-constructed entities from an import in one write per file. */
  bulkImport: (payload: {
    spaces?: Space[];
    collections?: Collection[];
    resources?: Resource[];
    tags?: Tag[];
  }) => Promise<void>;

  createTag: (name: string) => Promise<Tag>;
  renameTag: (id: string, newName: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  createQuickLink: (input: { name: string; url: string; icon?: string; color?: string }) => Promise<QuickLink>;
  updateQuickLink: (id: string, patch: Partial<QuickLink>) => Promise<void>;
  deleteQuickLink: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const EMPTY: WorkspaceData = {
  spaces: { data: [], sha: null },
  collections: { data: [], sha: null },
  resources: { data: [], sha: null },
  tags: { data: [], sha: null },
  quickLinks: { data: [], sha: null },
  settings: {
    data: {
      defaultSpaceId: null,
      defaultCollectionId: null,
      theme: "system",
      density: "comfortable",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
      linkCheckTimeoutMs: 8000,
      ignoredDuplicateGroupKeys: [],
    },
    sha: null,
  },
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<WorkspaceData>(EMPTY);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [githubRepository, setGithubRepository] = useState<string | null>(null);
  const [saveSignal, setSaveSignal] = useState(0);
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const [spaces, collections, resources, tags, quickLinks, settings] = await Promise.all([
        readFile("spaces"),
        readFile("collections"),
        readFile("resources"),
        readFile("tags"),
        readFile("quickLinks"),
        readFile("settings"),
      ]);
      setStore({ spaces, collections, resources, tags, quickLinks, settings });
      setLoadState("ready");
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load workspace data.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    load();
  }, [load]);

  const checkGithubConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/github/status", { cache: "no-store" });
      const json = await res.json();
      setGithubConnected(res.ok && json.connected === true);
      setGithubRepository(json.repository ?? null);
    } catch {
      setGithubConnected(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    checkGithubConnection();
  }, [checkGithubConnection]);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  /**
   * Generic optimistic-write helper: applies `updater` to the current slice
   * and reflects it in the UI immediately (before the network round-trip),
   * so actions like toggling favorite/pin/archive feel instant. The write to
   * GitHub happens in the background; on success the real sha is committed,
   * on failure the optimistic change is rolled back. On a 409 conflict, reloads
   * the latest remote version, surfaces a toast, and re-throws so the caller
   * can decide whether to retry against fresh state.
   */
  const commit = useCallback(
    async <K extends DataFileKey>(
      key: K,
      sliceKey: keyof WorkspaceData,
      updater: (current: unknown) => unknown,
      message: string
    ) => {
      const slice = storeRef.current[sliceKey] as FileSlice<unknown>;
      const previousData = slice.data;
      const previousSha = slice.sha;
      const nextData = updater(previousData);

      setStore((prev) => ({ ...prev, [sliceKey]: { data: nextData, sha: previousSha } }));

      try {
        const { sha } = await writeFile(key, nextData as never, previousSha, message);
        setStore((prev) => ({
          ...prev,
          [sliceKey]: { data: nextData, sha },
        }));
        setSaveSignal((s) => s + 1);
        setGithubConnected(true);
        return nextData;
      } catch (err) {
        setStore((prev) => ({ ...prev, [sliceKey]: { data: previousData, sha: previousSha } }));
        if (err instanceof ConflictError) {
          const fresh = await readFile(key);
          setStore((prev) => ({ ...prev, [sliceKey]: fresh }));
          showToast(
            `Someone/something else changed ${DATA_FILES[key].path} on GitHub. Reloaded the latest version — please retry.`
          );
        } else if (err instanceof ApiError) {
          showToast(err.message);
          setGithubConnected(false);
        }
        throw err;
      }
    },
    [showToast]
  );

  // --- Spaces ---
  const createSpace = useCallback<WorkspaceContextValue["createSpace"]>(
    async (input) => {
      const space: Space = {
        id: newId(),
        createdAt: now(),
        updatedAt: now(),
        name: input.name,
        icon: input.icon,
        color: input.color,
        sortOrder: storeRef.current.spaces.data.length,
        pinned: false,
        archived: false,
        trash: false,
        shareMode: "private",
        shareToken: null,
      };
      await commit("spaces", "spaces", (cur) => [...(cur as Space[]), space], `feat(data): add space "${space.name}"`);
      return space;
    },
    [commit]
  );

  const updateSpace = useCallback<WorkspaceContextValue["updateSpace"]>(
    async (id, patch) => {
      await commit(
        "spaces",
        "spaces",
        (cur) =>
          (cur as Space[]).map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now() } : s)),
        `chore(data): update space ${id}`
      );
    },
    [commit]
  );

  const deleteSpaceForever = useCallback<WorkspaceContextValue["deleteSpaceForever"]>(
    async (id) => {
      await commit(
        "spaces",
        "spaces",
        (cur) => (cur as Space[]).filter((s) => s.id !== id),
        `chore(data): permanently delete space ${id}`
      );
    },
    [commit]
  );

  // --- Collections ---
  const createCollection = useCallback<WorkspaceContextValue["createCollection"]>(
    async (input) => {
      const collection: Collection = {
        id: newId(),
        createdAt: now(),
        updatedAt: now(),
        spaceId: input.spaceId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        sortOrder: storeRef.current.collections.data.filter((c) => c.spaceId === input.spaceId).length,
        pinned: false,
        favorite: false,
        archived: false,
        trash: false,
        shareMode: "private",
        shareToken: null,
      };
      await commit(
        "collections",
        "collections",
        (cur) => [...(cur as Collection[]), collection],
        `feat(data): add collection "${collection.name}"`
      );
      return collection;
    },
    [commit]
  );

  const updateCollection = useCallback<WorkspaceContextValue["updateCollection"]>(
    async (id, patch) => {
      await commit(
        "collections",
        "collections",
        (cur) =>
          (cur as Collection[]).map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)),
        `chore(data): update collection ${id}`
      );
    },
    [commit]
  );

  const deleteCollectionForever = useCallback<WorkspaceContextValue["deleteCollectionForever"]>(
    async (id) => {
      await commit(
        "collections",
        "collections",
        (cur) => (cur as Collection[]).filter((c) => c.id !== id),
        `chore(data): permanently delete collection ${id}`
      );
    },
    [commit]
  );

  // --- Resources ---
  const createResource = useCallback<WorkspaceContextValue["createResource"]>(
    async (input) => {
      let domain: string | undefined;
      try {
        domain = new URL(input.url).hostname.replace(/^www\./, "");
      } catch {
        domain = undefined;
      }
      const resource: Resource = {
        id: newId(),
        createdAt: now(),
        updatedAt: now(),
        url: input.url,
        title: input.title || "",
        description: input.description,
        domain,
        favicon: input.favicon,
        thumbnail: input.thumbnail,
        spaceId: input.spaceId,
        collectionId: input.collectionId,
        tags: input.tags || [],
        notes: input.notes,
        highlights: [],
        resourceType: input.resourceType || "website",
        favorite: input.favorite || false,
        pinned: input.pinned || false,
        next: input.next || false,
        priority: input.priority || "normal",
        dueDate: input.dueDate || null,
        archived: false,
        trash: false,
        lastOpenedAt: null,
        httpStatus: null,
        linkStatus: "unknown",
        lastCheckedAt: null,
        sortOrder: storeRef.current.resources.data.length,
      };
      await commit(
        "resources",
        "resources",
        (cur) => [resource, ...(cur as Resource[])],
        `feat(data): add resource "${resource.title || resource.url}"`
      );
      return resource;
    },
    [commit]
  );

  const updateResource = useCallback<WorkspaceContextValue["updateResource"]>(
    async (id, patch) => {
      await commit(
        "resources",
        "resources",
        (cur) =>
          (cur as Resource[]).map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r)),
        `chore(data): update resource ${id}`
      );
    },
    [commit]
  );

  const deleteResourceForever = useCallback<WorkspaceContextValue["deleteResourceForever"]>(
    async (id) => {
      await commit(
        "resources",
        "resources",
        (cur) => (cur as Resource[]).filter((r) => r.id !== id),
        `chore(data): permanently delete resource ${id}`
      );
    },
    [commit]
  );

  const bulkUpdateResources = useCallback<WorkspaceContextValue["bulkUpdateResources"]>(
    async (ids, updater) => {
      const idSet = new Set(ids);
      await commit(
        "resources",
        "resources",
        (cur) =>
          (cur as Resource[]).map((r) =>
            idSet.has(r.id) ? { ...r, ...updater(r), updatedAt: now() } : r
          ),
        `chore(data): bulk update ${ids.length} resource(s)`
      );
    },
    [commit]
  );

  const bulkDeleteResourcesForever = useCallback<WorkspaceContextValue["bulkDeleteResourcesForever"]>(
    async (ids) => {
      const idSet = new Set(ids);
      await commit(
        "resources",
        "resources",
        (cur) => (cur as Resource[]).filter((r) => !idSet.has(r.id)),
        `chore(data): permanently delete ${ids.length} resource(s)`
      );
    },
    [commit]
  );

  const bulkImport = useCallback<WorkspaceContextValue["bulkImport"]>(
    async (payload) => {
      if (payload.spaces?.length) {
        await commit("spaces", "spaces", (cur) => [...(cur as Space[]), ...payload.spaces!], `feat(data): import ${payload.spaces.length} space(s)`);
      }
      if (payload.collections?.length) {
        await commit(
          "collections",
          "collections",
          (cur) => [...(cur as Collection[]), ...payload.collections!],
          `feat(data): import ${payload.collections.length} collection(s)`
        );
      }
      if (payload.tags?.length) {
        await commit(
          "tags",
          "tags",
          (cur) => {
            const existingNames = new Set((cur as Tag[]).map((t) => t.name.toLowerCase()));
            const toAdd = payload.tags!.filter((t) => !existingNames.has(t.name.toLowerCase()));
            return [...(cur as Tag[]), ...toAdd];
          },
          `feat(data): import ${payload.tags.length} tag(s)`
        );
      }
      if (payload.resources?.length) {
        await commit(
          "resources",
          "resources",
          (cur) => [...payload.resources!, ...(cur as Resource[])],
          `feat(data): import ${payload.resources.length} resource(s)`
        );
      }
    },
    [commit]
  );

  // --- Tags ---
  const createTag = useCallback<WorkspaceContextValue["createTag"]>(
    async (name) => {
      const trimmed = name.trim();
      const existing = storeRef.current.tags.data.find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return existing;
      const tag: Tag = { id: newId(), createdAt: now(), updatedAt: now(), name: trimmed };
      await commit("tags", "tags", (cur) => [...(cur as Tag[]), tag], `feat(data): add tag "${trimmed}"`);
      return tag;
    },
    [commit]
  );

  const renameTag = useCallback<WorkspaceContextValue["renameTag"]>(
    async (id, newName) => {
      const tag = storeRef.current.tags.data.find((t) => t.id === id);
      const trimmed = newName.trim();
      if (!tag || !trimmed || trimmed === tag.name) return;

      // Resources store tags by name, so a rename has to be propagated to every
      // resource that references the old name before the tag record itself changes.
      await commit(
        "resources",
        "resources",
        (cur) =>
          (cur as Resource[]).map((r) =>
            r.tags.includes(tag.name)
              ? { ...r, tags: r.tags.map((t) => (t === tag.name ? trimmed : t)), updatedAt: now() }
              : r
          ),
        `chore(data): rename tag "${tag.name}" to "${trimmed}" on resources`
      );
      await commit(
        "tags",
        "tags",
        (cur) => (cur as Tag[]).map((t) => (t.id === id ? { ...t, name: trimmed, updatedAt: now() } : t)),
        `chore(data): rename tag "${tag.name}" to "${trimmed}"`
      );
    },
    [commit]
  );

  const deleteTag = useCallback<WorkspaceContextValue["deleteTag"]>(
    async (id) => {
      const tag = storeRef.current.tags.data.find((t) => t.id === id);
      if (tag) {
        await commit(
          "resources",
          "resources",
          (cur) =>
            (cur as Resource[]).map((r) =>
              r.tags.includes(tag.name)
                ? { ...r, tags: r.tags.filter((t) => t !== tag.name), updatedAt: now() }
                : r
            ),
          `chore(data): remove tag "${tag.name}" from resources`
        );
      }
      await commit("tags", "tags", (cur) => (cur as Tag[]).filter((t) => t.id !== id), `chore(data): delete tag ${id}`);
    },
    [commit]
  );

  // --- Quick Links ---
  const createQuickLink = useCallback<WorkspaceContextValue["createQuickLink"]>(
    async (input) => {
      const quickLink: QuickLink = {
        id: newId(),
        createdAt: now(),
        updatedAt: now(),
        name: input.name,
        url: input.url,
        icon: input.icon,
        color: input.color,
        pinned: false,
        sortOrder: storeRef.current.quickLinks.data.length,
      };
      await commit(
        "quickLinks",
        "quickLinks",
        (cur) => [...(cur as QuickLink[]), quickLink],
        `feat(data): add quick link "${quickLink.name}"`
      );
      return quickLink;
    },
    [commit]
  );

  const updateQuickLink = useCallback<WorkspaceContextValue["updateQuickLink"]>(
    async (id, patch) => {
      await commit(
        "quickLinks",
        "quickLinks",
        (cur) => (cur as QuickLink[]).map((q) => (q.id === id ? { ...q, ...patch, updatedAt: now() } : q)),
        `chore(data): update quick link ${id}`
      );
    },
    [commit]
  );

  const deleteQuickLink = useCallback<WorkspaceContextValue["deleteQuickLink"]>(
    async (id) => {
      await commit(
        "quickLinks",
        "quickLinks",
        (cur) => (cur as QuickLink[]).filter((q) => q.id !== id),
        `chore(data): delete quick link ${id}`
      );
    },
    [commit]
  );

  // --- Settings ---
  const updateSettings = useCallback<WorkspaceContextValue["updateSettings"]>(
    async (patch) => {
      await commit("settings", "settings", (cur) => ({ ...(cur as Settings), ...patch }), "chore(data): update settings");
    },
    [commit]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      loadState,
      loadError,
      spaces: store.spaces.data,
      collections: store.collections.data,
      resources: store.resources.data,
      tags: store.tags.data,
      quickLinks: store.quickLinks.data,
      settings: store.settings.data,
      toast,
      dismissToast: () => setToast(null),
      reload: load,
      githubConnected,
      githubRepository,
      saveSignal,
      createSpace,
      updateSpace,
      deleteSpaceForever,
      createCollection,
      updateCollection,
      deleteCollectionForever,
      createResource,
      updateResource,
      deleteResourceForever,
      bulkUpdateResources,
      bulkDeleteResourcesForever,
      bulkImport,
      createTag,
      renameTag,
      deleteTag,
      createQuickLink,
      updateQuickLink,
      deleteQuickLink,
      updateSettings,
    }),
    [
      loadState,
      loadError,
      store,
      toast,
      load,
      githubConnected,
      githubRepository,
      saveSignal,
      createSpace,
      updateSpace,
      deleteSpaceForever,
      createCollection,
      updateCollection,
      deleteCollectionForever,
      createResource,
      updateResource,
      deleteResourceForever,
      bulkUpdateResources,
      bulkDeleteResourcesForever,
      bulkImport,
      createTag,
      renameTag,
      deleteTag,
      createQuickLink,
      updateQuickLink,
      deleteQuickLink,
      updateSettings,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
