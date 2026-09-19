# BookManager Tab Saver (browser extension)

A small Manifest V3 extension that captures every open tab's URL in one
click, so you can paste them straight into the app's **Save Session**
flow instead of copying tabs one at a time.

It does **not** talk to any backend directly and needs no login of its
own — it only reads your open tabs (via the browser's `tabs` API) and
either copies their URLs to the clipboard or opens the app for you.

## Install (unpacked, for now)

1. Deploy the app (see the main README) and note its URL.
2. In Chrome or Edge, go to `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this `extension/` folder.
5. Click the extension's icon → the options link → paste your app's URL → Save.

## Use

1. Open the tabs you want to save.
2. Click the extension icon.
3. Click **Copy all tab URLs** (check "Include all windows" if you want tabs
   from every open window, not just the current one).
4. Click **Open Save Session** — it opens the app straight to the Save
   Session dialog. Paste (Cmd/Ctrl+V) into the URLs field and save.

Steps 3 and 4 can happen in either order — the URLs stay on your
clipboard until you copy something else.

## Why copy-to-clipboard instead of sending tabs directly?

The app has no user accounts or extension-specific write endpoint (it's
a single-user, GitHub-backed app). Routing tab data through the
clipboard means the extension never needs new server-side permissions
or CORS configuration, and nothing about your tabs leaves the browser
until you choose to paste and save.

## Packaging for the Chrome Web Store / Firefox Add-ons

This folder is a valid unpacked extension as-is. To publish it, zip the
contents of `extension/` (not the folder itself) and follow the
respective store's submission process. You'll want your own icons/
branding before a public listing — the bundled icons are placeholders.

## Reference

Built independently for this project. The general idea of a popup that
reads open tabs via the browser's extension APIs was informed by
reviewing (not copying) the publicly available `raindropio/app`
repository's browser-extension code as UX reference, per this project's
own licensing guidelines — no code from that repository is reused here.
