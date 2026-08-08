# Deployment Guide — Wedding Planner

This is a **fully static site**: plain HTML, CSS, and JavaScript, no build step,
no server-side code, no database, no environment variables. It runs on any
standard web hosting account (cPanel, uPress, or similar) exactly as-is — you
only need to upload the files.

Data (guests, vendors, attractions, villas, tasks, budget target) is stored in
the visitor's own browser (`localStorage`), not on the server. See
**"How data storage works"** below before you rely on this for real planning.

## 1. Required files and folders

Upload the entire project, preserving the folder structure exactly:

```
index.html                          ← entry point, must stay at the site root you visit
css/
  styles.css
js/
  utils.js
  main.js
  overview.js
  guests.js
  attractions.js
  gettingReady.js                   ← capital "R" — case matters on Linux hosting
  vendors.js
  budget.js
  tasks.js
  data/
    localStorageAdapter.js
    repository.js
  ui/
    confirmModal.js
    toast.js
README.md                           ← optional, not used by the site itself
DEPLOYMENT.md                       ← this file, optional, not used by the site itself
```

That's the complete list — nothing else is required. No `node_modules`, no
`package.json`, no build output folder: none of that exists in this project
because none of it is needed.

**Do not rename any file or folder**, especially `js/gettingReady.js` and
`js/data/localStorageAdapter.js` — their capitalization must match exactly
what `index.html` references, because standard Linux-based hosting (which is
what cPanel/uPress run on) treats filenames as case-sensitive, unlike Windows.
This has already been verified to match.

## 2. Step-by-step upload (cPanel File Manager — recommended, no extra tools needed)

1. Log in to cPanel and open **File Manager**.
2. Navigate to `public_html` (or the subfolder for the domain/subdomain you're
   deploying to, e.g. `public_html/wedding` if you want it at
   `yourdomain.com/wedding`).
3. Click **Upload**, and upload all the files/folders listed above, keeping
   the same structure. If your project is already zipped, upload the zip and
   use File Manager's **Extract** action instead of uploading file-by-file.
4. Confirm the folder structure looks identical to section 1 above once
   uploaded (i.e. `css/`, `js/`, and `js/data/`, `js/ui/` subfolders all
   present under the same directory as `index.html`).
5. Open `https://yourdomain.com/` (or `/wedding/` if you used a subfolder) in
   a browser to confirm it loads.

### Alternative: FTP/SFTP

Same idea — connect with any FTP client (FileZilla, Cyberduck, etc.) using the
credentials from your hosting provider, and upload the same file/folder
structure into `public_html` (or your chosen subfolder). Make sure your FTP
client is set to **binary/auto transfer mode** (the default in virtually all
modern clients) so files aren't corrupted by text-mode line-ending conversion.

## 3. What must be configured after upload

**Nothing is required for the site to run.** It's static HTML/CSS/JS —
there's no server config, no `.htaccess` needed, no dependencies to install,
no database to connect.

Two things worth checking, not because they're required but because they
affect the experience:

- **HTTPS/SSL** — most hosts (including uPress) issue a free SSL certificate
  automatically. If yours doesn't yet, enable it in cPanel's **SSL/TLS
  Status** or **Let's Encrypt** section. The app doesn't strictly require
  HTTPS to function, but you generally want a real site running on `https://`
  rather than `http://`.
- **Directory index** — Apache (what cPanel uses) serves `index.html`
  automatically when someone visits a folder URL. This is the default on
  essentially every host, so normally there's nothing to do; if visiting your
  domain doesn't load the site, check cPanel's **MIME Types**/**Indexes**
  settings or ask your host to confirm `index.html` is in the default
  `DirectoryIndex` list.

There is **no `.htaccess` file in this project**, and none is needed for the
site to function.

## 4. How data storage works (important — please read)

The app has no backend and no database. Every guest, vendor, attraction,
villa, task, and the budget target are saved via the browser's `localStorage`
API, scoped to **the exact domain the visitor is using**. Practical
consequences:

- Data lives **only on the device/browser** where it was entered — it does
  not sync between your phone and your computer, and it does not live "on
  the server" in any retrievable way.
- If you ever change domains, move to different hosting, or someone clears
  their browser data, that browser's data is gone unless it was backed up.
- Use the **"הורדת גיבוי" (Download Backup)** button on the Overview tab
  regularly — it exports everything to a JSON file you can keep safe and
  restore from later, on the same device or a different one, via **"שחזור
  מגיבוי" (Restore from Backup)**.

This is a deliberate architecture choice already made earlier in this
project specifically so that a future move to a real backend (Supabase/
Firebase, multi-device sync, user accounts) is a contained change — see the
`Repository`/`Adapter` pattern in `js/data/`. It does not change what you
need to do for *this* static deployment.

## 5. Post-upload checklist

- [ ] `index.html` opens at your domain (or chosen subfolder) without errors
- [ ] All 7 tabs (סקירה כללית, רשימת מוזמנים, אטרקציות, וילות התארגנות,
      ספקים, תקציב, משימות) switch correctly
- [ ] Adding a guest/vendor/attraction/villa/task works and persists after a
      page refresh
- [ ] Excel import/export on the guest list works (requires internet access
      to load the SheetJS library from its CDN — see below)
- [ ] Browser devtools console shows no errors on load

## 6. External dependencies (already wired up, nothing to install)

Two resources are loaded from external CDNs via `<script>`/`<link>` tags in
`index.html` — these use absolute HTTPS URLs because they're third-party
services, not part of this project, so they can't be made "relative":

- Google Fonts (`fonts.googleapis.com`) — for the site's typography
- SheetJS (`cdnjs.cloudflare.com`) — powers Excel import/export on the guest
  list

Both require the visitor's browser to have normal internet access, which is
true for virtually every real-world visitor; no action needed on your part
beyond having the site publicly reachable over the internet as usual.

## 7. Confirmation

This project is a static site with zero server-side requirements, all
internal file references already use relative paths (verified — the app
works identically whether placed at your domain root or in a subfolder), and
it has been through a full functional/regression/security audit. **It is
ready to upload and run as-is on a standard cPanel/uPress hosting account.**
