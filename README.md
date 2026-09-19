# Raindrop BookManager

A personal internet workspace for organizing bookmarks, tabs and research —
inspired by Toby and Raindrop.io, built independently, deployed on Vercel,
with **GitHub as the persistent data store**.

> Status: Phase 1 of 7 complete (foundation — GitHub data layer & backups).
> The rest of the UI (Spaces, Collections, Resources, Next, Search, etc.)
> is being built incrementally. See "Roadmap" below.

## Architecture

```text
Browser
   |
   v
Vercel / Next.js (this repo) — App Router, server-side API routes
   |
   v
GitHub Contents API
   |
   v
A separate, private GitHub repository (the "data repo")
   |
   +-- data/*.json       current state
   +-- backups/*.json    timestamped full snapshots
   +-- Git history        every write is a commit
```

There is no conventional database. All reads/writes to the data repo happen
**server-side only** — a GitHub token is never sent to the browser.

## Data model

See `src/lib/validation/schemas.ts` for the full Zod schemas (Space,
Collection, Resource, Tag, Task, Note, QuickLink, Settings, Metadata).
Every write is validated against these schemas before being committed.

## Setup

### 1. Create the data repository

Create a **separate, private** GitHub repository to hold your data (e.g.
`your-username/bookmanager-data`). It can start empty — the app creates
`data/*.json` on first run via "Initialize data files".

### 2. Create a GitHub token

Create a fine-grained Personal Access Token:
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.

- **Repository access:** only the data repo you created above.
- **Permissions:** Contents → Read and write.

Never use a broad/classic token with access to other repositories.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

```text
GITHUB_DATA_OWNER=your-username
GITHUB_DATA_REPO=bookmanager-data
GITHUB_DATA_BRANCH=main
GITHUB_TOKEN=github_pat_...
```

`.env.local` is git-ignored and must never be committed.

### 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The Phase 1 diagnostics page lets you:

- **Test Connection** — verifies the token/repo/branch are correct.
- **Initialize data files** — creates `data/*.json` in the data repo if missing.
- **Test read/write** — round-trips `settings.json` to confirm writes commit correctly.
- **Backup now / List backups** — exercises the backup system.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Vercel: New Project → import this repo.
3. Add the same four environment variables from step 3 above in
   Project Settings → Environment Variables (do this for Production,
   Preview, and Development).
4. Deploy. Vercel's Git-based deploys work out of the box — no build
   configuration needed beyond the defaults.

## Backup & recovery

Every write commits directly to `data/*.json` in the data repo, so Git
history there is already a recovery mechanism. In addition:

- A **full snapshot** backup is taken automatically before bulk/destructive
  operations (bulk delete, import, restore), and on demand from
  Settings → Data & Backup → Backup Now.
- Snapshots live at `backups/YYYY/YYYY-MM-DD/backup-HH-mm-ss-<reason>.json`
  in the data repo and are never deleted automatically.
- Restoring a backup first takes a fresh backup of current state, so a
  bad restore is itself recoverable.

## Conflict handling

Every write from the app sends the `sha` of the file it last read. If the
file changed on GitHub in the meantime, the write is rejected with a 409
and the app must re-read before retrying — this prevents silently
overwriting newer data.

## Security notes

- `GITHUB_TOKEN` and other secrets are only read in server-side API routes
  (`src/app/api/**`) and are never included in client bundles.
- Scope the token to the data repo only, with the minimum permission
  (Contents: Read & write).
- No secrets are committed to this repository; `.env.local` is git-ignored.

## Browser extension (optional)

`extension/` is a small Manifest V3 browser extension that captures every
open tab's URL in one click (copies them to your clipboard) and can open
the app straight to Save Session for pasting. See `extension/README.md`
for how to load it as an unpacked extension. It talks to nothing but your
clipboard and your browser's tab list — no new server endpoints, no login.

## Roadmap

- [x] Phase 1 — Foundation: GitHub data layer, backups, error handling
- [x] Phase 2 — Spaces, Collections, Resources, tags, favorites, archive, trash
- [x] Phase 3 — Quick Links, Notes, search, keyboard shortcuts (Next queue skipped by request)
- [x] Phase 4 — Bulk operations, duplicate detection, import/export
- [ ] Phase 5 — Dead-link checking
- [ ] Phase 6 — Read-only collection sharing
- [ ] Phase 7 — Security/accessibility/performance hardening, final deploy

## Attribution

Built independently. `raindropio/app` (MIT licensed) was consulted only
as UX/pattern reference (never copied) — see `THIRD_PARTY_NOTICES.md` for
details. No Raindrop.io branding, backend, or account is used; this app
does not depend on Raindrop.io at all.
