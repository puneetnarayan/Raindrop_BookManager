"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/client/workspace-context";
import { createBackup } from "@/lib/client/api";
import { newId, now } from "@/lib/client/ids";
import { normalizeForDedup } from "@/lib/client/duplicates";
import { parseJsonExport, JsonImportValidationError } from "@/lib/import/parseJsonExport";
import { remapImportIds } from "@/lib/import/remap";
import { parseBookmarksHtml, summarizeFolders, ParsedBookmark } from "@/lib/import/parseBookmarksHtml";
import { Collection, Resource, Space } from "@/lib/validation/schemas";
import { FileJson, FileText, Loader2 } from "lucide-react";

type Tab = "json" | "bookmarks";

function JsonImportPanel() {
  const { resources, bulkImport } = useWorkspace();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof remapImportIds> | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const existingKeys = useMemo(
    () => new Set(resources.filter((r) => !r.trash).map((r) => normalizeForDedup(r.url)).filter(Boolean)),
    [resources]
  );

  const duplicateCount = parsed
    ? parsed.resources.filter((r) => existingKeys.has(normalizeForDedup(r.url))).length
    : 0;

  async function handleFile(file: File) {
    setError(null);
    setParsed(null);
    setDone(false);
    setFileName(file.name);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const validated = parseJsonExport(raw);
      setParsed(remapImportIds(validated));
    } catch (err) {
      setError(
        err instanceof JsonImportValidationError || err instanceof SyntaxError
          ? err.message
          : "Could not read this file."
      );
    }
  }

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);
    try {
      await createBackup("before-import-json");
      const resourcesToImport = skipDuplicates
        ? parsed.resources.filter((r) => !existingKeys.has(normalizeForDedup(r.url)))
        : parsed.resources;
      await bulkImport({
        spaces: parsed.spaces,
        collections: parsed.collections,
        tags: parsed.tags,
        resources: resourcesToImport,
      });
      setDone(true);
      setParsed(null);
      setFileName(null);
    } catch {
      // toast shown by context
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Import a JSON export produced by this app (Settings → Export, or a Space/Collection&apos;s own
        Export option). The file is validated before anything is written, and everything gets new
        IDs so it can never collide with what you already have.
      </p>

      <input
        type="file"
        accept="application/json,.json"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-emerald-600">Import complete.</p>}

      {parsed && (
        <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium">{fileName}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <li>{parsed.spaces.length} space(s)</li>
            <li>{parsed.collections.length} collection(s)</li>
            <li>{parsed.resources.length} resource(s)</li>
            <li>{parsed.tags.length} tag(s)</li>
          </ul>
          {duplicateCount > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              Skip {duplicateCount} resource(s) that look like duplicates of what you already have
            </label>
          )}
          <button onClick={handleImport} disabled={importing} className="btn-pastel-primary flex items-center gap-2">
            {importing && <Loader2 size={14} className="animate-spin" />}
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      )}
    </div>
  );
}

function BookmarksImportPanel() {
  const { spaces, resources, bulkImport } = useWorkspace();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<ParsedBookmark[] | null>(null);
  const [targetMode, setTargetMode] = useState<"new" | "existing">("new");
  const [newSpaceName, setNewSpaceName] = useState("Imported Bookmarks");
  const [existingSpaceId, setExistingSpaceId] = useState(spaces[0]?.id ?? "");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const folderSummary = bookmarks ? summarizeFolders(bookmarks) : [];
  const existingKeys = useMemo(
    () => new Set(resources.filter((r) => !r.trash).map((r) => normalizeForDedup(r.url)).filter(Boolean)),
    [resources]
  );
  const duplicateCount = bookmarks
    ? bookmarks.filter((b) => existingKeys.has(normalizeForDedup(b.url))).length
    : 0;

  async function handleFile(file: File) {
    setError(null);
    setBookmarks(null);
    setDone(false);
    setFileName(file.name);
    try {
      const html = await file.text();
      const parsed = parseBookmarksHtml(html);
      if (parsed.length === 0) {
        setError("No bookmarks found in this file — is it a browser bookmark export (.html)?");
        return;
      }
      setBookmarks(parsed);
    } catch {
      setError("Could not read this file.");
    }
  }

  async function handleImport() {
    if (!bookmarks) return;
    setImporting(true);
    try {
      await createBackup("before-import-bookmarks");

      let targetSpace: Space | null = null;
      const newSpaces: Space[] = [];
      if (targetMode === "new") {
        targetSpace = {
          id: newId(),
          createdAt: now(),
          updatedAt: now(),
          name: newSpaceName.trim() || "Imported Bookmarks",
          sortOrder: 0,
          pinned: false,
          archived: false,
          trash: false,
          shareMode: "private",
          shareToken: null,
        };
        newSpaces.push(targetSpace);
      }
      const spaceId = targetMode === "new" ? targetSpace!.id : existingSpaceId;

      const folderCollectionId = new Map<string, string>();
      const newCollections: Collection[] = [];
      for (const folder of folderSummary) {
        const id = newId();
        folderCollectionId.set(folder.name, id);
        newCollections.push({
          id,
          createdAt: now(),
          updatedAt: now(),
          spaceId,
          name: folder.name,
          sortOrder: newCollections.length,
          pinned: false,
          favorite: false,
          archived: false,
          trash: false,
          shareMode: "private",
          shareToken: null,
        });
      }

      const toImport = skipDuplicates
        ? bookmarks.filter((b) => !existingKeys.has(normalizeForDedup(b.url)))
        : bookmarks;

      const newResources: Resource[] = toImport.map((b) => {
        let domain: string | undefined;
        try {
          domain = new URL(b.url).hostname.replace(/^www\./, "");
        } catch {
          domain = undefined;
        }
        return {
          id: newId(),
          createdAt: now(),
          updatedAt: now(),
          url: b.url,
          title: b.title,
          domain,
          spaceId,
          collectionId: folderCollectionId.get(b.folder ?? "(no folder)")!,
          tags: [],
          highlights: [],
          resourceType: "website",
          favorite: false,
          pinned: false,
          next: false,
          priority: "normal",
          dueDate: null,
          archived: false,
          trash: false,
          lastOpenedAt: null,
          httpStatus: null,
          linkStatus: "unknown",
          lastCheckedAt: null,
          sortOrder: 0,
        };
      });

      await bulkImport({ spaces: newSpaces, collections: newCollections, resources: newResources });
      setDone(true);
      setBookmarks(null);
      setFileName(null);
    } catch {
      // toast shown by context
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Import a browser bookmark export (Chrome/Firefox/Safari/Edge → Export bookmarks → HTML).
        Folders become Collections within one Space; nested sub-folders are flattened into their
        own folder name rather than a full path.
      </p>

      <input
        type="file"
        accept="text/html,.html,.htm"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-emerald-600">Import complete.</p>}

      {bookmarks && (
        <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {bookmarks.length} bookmark(s) across {folderSummary.length} folder(s)
          </p>
          <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-neutral-500">
            {folderSummary.map((f) => (
              <li key={f.name}>
                {f.name} — {f.count}
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={targetMode === "new"} onChange={() => setTargetMode("new")} />
              Create new Space:
              <input
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                disabled={targetMode !== "new"}
                className="w-56 rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </label>
            {spaces.length > 0 && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={targetMode === "existing"}
                  onChange={() => setTargetMode("existing")}
                />
                Add into existing Space:
                <select
                  value={existingSpaceId}
                  onChange={(e) => setExistingSpaceId(e.target.value)}
                  disabled={targetMode !== "existing"}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {spaces.filter((s) => !s.trash && !s.archived).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {duplicateCount > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              Skip {duplicateCount} bookmark(s) that look like duplicates of what you already have
            </label>
          )}

          <button
            onClick={handleImport}
            disabled={importing || (targetMode === "existing" && !existingSpaceId)}
            className="btn-pastel-primary flex items-center gap-2"
          >
            {importing && <Loader2 size={14} className="animate-spin" />}
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  const [tab, setTab] = useState<Tab>("bookmarks");

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Import</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("bookmarks")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
            tab === "bookmarks"
              ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
              : "border border-neutral-300 text-neutral-500 dark:border-neutral-700"
          }`}
        >
          <FileText size={14} /> Browser Bookmarks
        </button>
        <button
          onClick={() => setTab("json")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
            tab === "json"
              ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
              : "border border-neutral-300 text-neutral-500 dark:border-neutral-700"
          }`}
        >
          <FileJson size={14} /> JSON Export
        </button>
      </div>

      {tab === "bookmarks" ? <BookmarksImportPanel /> : <JsonImportPanel />}
    </div>
  );
}
