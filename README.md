# Raindrop BookManager

A personal internet workspace for organizing bookmarks, tabs and research —
inspired by Toby and Raindrop.io, built independently, deployed on Vercel,
with **GitHub as the persistent data store**.

> Status: All 7 planned phases implemented (the Next work queue was
> intentionally skipped by request). See "Roadmap" and "Hardening" below
> for what's been verified vs. what you should check yourself once
> deployed.

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

1. **Push this repo to GitHub** (already done if you're reading this from
   the repo) — the app code repo, not the data repo.
2. **In Vercel:** New Project → Import the app repo (not the data repo).
   Framework preset should auto-detect as Next.js; leave build settings
   at their defaults.
3. **Before the first deploy**, add environment variables in
   Project Settings → Environment Variables — set all four for
   **Production**, **Preview**, and **Development**:
   ```text
   GITHUB_DATA_OWNER=your-username
   GITHUB_DATA_REPO=your-data-repo-name
   GITHUB_DATA_BRANCH=main
   GITHUB_TOKEN=github_pat_...
   ```
   Use the same fine-grained PAT described in Setup above, scoped only to
   the data repo.
4. **Deploy.** Vercel builds and gives you a `*.vercel.app` URL (or your
   custom domain if you add one).
5. **Verify it actually works end-to-end** — don't just trust a green
   build:
   - Open `/diagnostics` on the deployed URL → **Test Connection** should
     show your data repo/branch. If it doesn't, re-check the four env vars
     (a typo in `GITHUB_DATA_OWNER`/`GITHUB_DATA_REPO` is the most common
     cause of a 404 here).
   - **Initialize data files**, then **Test read/write**, then **Backup
     now** — confirm each shows a new commit in the data repo on GitHub.
   - Reload the deployed app and confirm your data is still there (proves
     persistence isn't accidentally relying on anything local to a single
     serverless invocation).
   - Redeploy (push an empty commit or any change) and confirm your data
     survives the new deployment — this is the whole point of storing data
     outside the app's own build/runtime.
   - Add a resource, refresh, confirm it's there. Try it on your phone's
     browser too — check the mobile layout (sidebar becomes a slide-in
     drawer below the `sm` breakpoint; a hamburger button appears in a
     small top bar).

### Read this before you share the URL with anyone

**This app has no login system.** Anyone who has the deployed URL can
read and write all of your bookmark data — there's no username/password,
no session, nothing gating the API routes beyond "you know the URL." This
was a deliberate V1 scope decision (see the original spec: "single-user
first"), not an oversight, but it means the URL itself is your only
access control. Before relying on this for anything you'd mind a stranger
seeing or editing:

- Don't publicly link to your deployment's URL anywhere (that's separate
  from `/shared/<token>` links, which are meant to be public and only
  expose the one Space/Collection you explicitly shared).
- If your Vercel plan supports it, turn on Vercel's built-in
  [Deployment Protection](https://vercel.com/docs/deployment-protection)
  (password protection or Vercel Authentication) for the project — this
  is the simplest real fix and needs no code changes.
- Treat the `GITHUB_TOKEN` env var as fully sensitive: it's the one thing
  standing between the public internet and write access to your data
  repo if the app URL ever leaks.

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
- All writes are validated against Zod schemas server-side before being
  committed (`src/lib/data/store.ts`) — a malformed request can't corrupt
  the data files.
- Notes/descriptions rendered as Markdown (`src/lib/client/markdown.ts`)
  are HTML-escaped before any formatting tag is added, so there's no
  stored-XSS path through them — no HTML sanitizer library needed because
  nothing raw ever reaches `dangerouslySetInnerHTML`.
- The two endpoints that fetch a user-supplied URL server-side (link
  metadata, link-health checks) are guarded against the obvious SSRF
  cases — `src/lib/security/ssrf.ts` resolves the hostname and rejects
  loopback/private/link-local addresses before fetching. This is a
  meaningful reduction of risk, not a complete guarantee (it doesn't
  defend against DNS-rebinding, where the same hostname resolves
  differently a moment later).
- Common security response headers are set for every route in
  `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`).
- **Known limitations, by design for a single-user V1**: there's no
  authentication (see the deployment section above), and no persistent
  rate limiting on any API route (Vercel's serverless functions don't
  share memory between invocations, so an in-memory limiter wouldn't be
  meaningfully effective without an external store like Redis/Upstash —
  not added here to avoid a paid dependency you didn't ask for). If you
  ever open this app up beyond yourself, both are worth revisiting.

## Browser extension (optional)

`extension/` is a small Manifest V3 browser extension that captures every
open tab's URL in one click (copies them to your clipboard) and can open
the app straight to Save Session for pasting. See `extension/README.md`
for how to load it as an unpacked extension. It talks to nothing but your
clipboard and your browser's tab list — no new server endpoints, no login.

## Link checking

Manual only — nothing runs automatically or on a schedule. From a resource
card, click the link icon to check just that one; from a selection or
Settings → Link Checking, check many at once. Each check is a HEAD request
(GET only as a fallback) with a configurable timeout, batched at low
concurrency so it doesn't hammer the sites being checked. Statuses:
Healthy, Redirected, Warning (401/403/429/503 — the site is up but
blocking or rate-limiting the check), Dead (4xx/5xx/DNS/timeout), Unknown
(not yet checked). I have not verified the exact serverless function
duration limit on Vercel Hobby for large batches — `maxDuration` is set to
60s in `src/app/api/links/check/route.ts` as a best effort; if very large
batches ever time out, check your plan's actual limit and adjust the
client-side batch size in `src/lib/client/api.ts` accordingly.

## Sharing

Any Space or Collection can be shared read-only via its own menu → Share…
This generates a random token and a `/shared/<token>` link that renders a
clean, standalone public page (no sidebar, no login, no editing) — visitors
never get your other Spaces/Collections, and resource notes are excluded
from what's sent to the page. Turning sharing off (or generating a new
link) immediately invalidates the old link, since the page is looked up by
token + a "public" flag together, both stored on the Space/Collection
itself, and rendered fresh on every request. Sharing is opt-in per item —
nothing is public by default.

## Hardening (Phase 7)

What changed in this pass, and what's still worth knowing:

- **Accessibility**: every modal now moves keyboard focus into itself on
  open, traps Tab/Shift+Tab inside it, and returns focus to whatever
  triggered it on close — previously focus just stayed wherever it was,
  which is disorienting for keyboard and screen-reader users.
- **Mobile**: the sidebar is now a proper off-canvas drawer below the `sm`
  breakpoint (opened via a hamburger button in a small top bar) instead of
  always being docked at fixed width, which used to squeeze the whole
  layout on a phone.
- **Performance**: resource lists now render in pages of 60 with a "Load
  more" button, instead of mounting every card at once — matters once a
  library has hundreds/thousands of resources.
- **Security**: see the Security notes section above (SSRF guard, response
  headers, Zod validation on every write, XSS-safe Markdown rendering).

**What I have not been able to verify directly in this environment**:
this sandbox has no configured `GITHUB_TOKEN`, so I could not click
through the actual logged-in app UI on a phone-sized viewport or a
real screen reader to confirm these changes look/behave as intended —
only that the code builds, lints, and the underlying logic (verified via
direct API calls) is correct. Please do a quick pass yourself once
deployed: open the app on your phone, try tabbing through a modal with
only the keyboard, and add a large batch of resources to confirm "Load
more" appears and works.

### Automated tests

None are set up. Everything in this app has been exercised through
manual/direct testing during development (curl against API routes,
clicking through the UI, `npm run build`/`npm run lint`), but there is no
`npm test` script or test runner installed. If you want unit coverage
going forward, the highest-value, lowest-effort places to start are the
pure functions with no DOM/network dependency: `src/lib/client/duplicates.ts`
(URL normalization), `src/lib/client/markdown.ts` (the Markdown-subset
renderer), `src/lib/export/exportCsv.ts` (CSV escaping), and
`src/lib/import/parseBookmarksHtml.ts` (needs a DOM — `jsdom` via Vitest
would cover it).

### Definition of Done — where this stands

- [x] Builds successfully (`npm run build`) and lints clean (`npm run lint`)
- [x] GitHub data connection works (verified via `/diagnostics` and the
      API routes directly, both configured and unconfigured)
- [x] Data persists after reload (by construction — GitHub is the only
      store; not re-verified against a live deploy in this session)
- [ ] Data persists after a new Vercel deployment — **verify this
      yourself once deployed**; I have not deployed this app to Vercel
      from this session
- [x] CRUD, bulk operations, search, import, export, backup, restore,
      trash, duplicate detection, link checking all implemented and
      exercised via direct API/browser testing in this session
- [x] No GitHub credentials exposed to the browser (server-only env var
      access, verified by inspection)
- [x] No secrets committed (`.gitignore` covers `.env*`, verified by
      reviewing every commit's staged files before pushing)
- [ ] Mobile layout — implemented, **not visually verified** in this
      session (no live, authenticated app to screenshot on a mobile
      viewport here)
- [x] Keyboard navigation — shortcuts implemented and modal focus
      management added; not tested with an actual screen reader
- [x] Major error states handled with user-understandable messages
      (GitHub unavailable/unauthenticated, validation failures,
      conflicts, import/export failures)
- [x] Production build succeeds with no console errors observed during
      local smoke testing

## Roadmap

- [x] Phase 1 — Foundation: GitHub data layer, backups, error handling
- [x] Phase 2 — Spaces, Collections, Resources, tags, favorites, archive, trash
- [x] Phase 3 — Quick Links, Notes, search, keyboard shortcuts (Next queue skipped by request)
- [x] Phase 4 — Bulk operations, duplicate detection, import/export
- [x] Phase 5 — Dead-link checking
- [x] Phase 6 — Read-only collection/space sharing
- [x] Phase 7 — Security/accessibility/performance hardening (final live deploy verification is on you — see the checklist above)

## Attribution

Built independently. `raindropio/app` (MIT licensed) was consulted only
as UX/pattern reference (never copied) — see `THIRD_PARTY_NOTICES.md` for
details. No Raindrop.io branding, backend, or account is used; this app
does not depend on Raindrop.io at all.
