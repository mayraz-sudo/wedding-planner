# Changelog

All notable work on the wedding planner app, summarized by phase. The app is
a static HTML/CSS/JS site with data stored in the browser (`localStorage`)
behind a `Repository`/`Adapter` layer, chosen specifically so persistence can
later move to a real backend without touching feature code.

## Architecture & foundation

- Split the original single-file HTML into `index.html` + `css/styles.css` +
  per-feature `js/*.js` modules, with `js/data/` and `js/ui/` subfolders.
- Introduced a `LocalStorageAdapter` + `Repository` seam: every feature talks
  to `Repository.<entity>.list/add/update/remove/replaceAll()`, never to
  `localStorage` directly. Records get UUID ids and `createdAt`/`updatedAt`
  timestamps.
- Shared design system: toast notifications, an accessible confirm modal
  (keyboard focus trap, Escape-to-close) replacing every `window.confirm()`
  in the app, reusable search/filter toolbars, and a responsive table→card
  layout for mobile.

## Features (in build order)

1. **Guest list** — phone and email fields (validated), search across
   name/phone/email, side/status filters, and Excel export via SheetJS
   (round-trips with the existing import).
2. **Attractions tab** (new) — name, category, phone, price, notes; add/
   edit/delete; search and category filter.
3. **Getting Ready villas tab** (new) — business name, contact person,
   phone, address, Google Maps link, price, notes; add/edit/delete; search.
4. **Vendors, extended** — contact person, phone, email, booked/pending/
   cancelled status, and a real payment schedule (multiple dated entries,
   each markable paid or planned) replacing the old single deposit number.
   Status filter added alongside the existing category filter.
5. **Budget, aggregated** — totals now combine vendors + attractions +
   getting-ready villas (previously vendors only); added a "breakdown by
   type" view, a budget target with a progress bar, and under/over-budget
   alerts showing the exact amount.
6. **Tasks, extended** — priority (low/medium/high), due date with an
   overdue warning, category, and a future-ready reminder date field (stored
   and displayed; no notification delivery yet), plus a visual progress bar.
7. **Link-based attachments** — an optional URL field (contract, photo, or
   document link) added to Vendors, Attractions, and Getting Ready, opened
   in a new tab safely (`rel="noopener noreferrer"`). No binary files are
   stored in the browser — external links only, by design.

## Quality passes

- Dedicated accessibility/mobile/RTL/performance audit on each feature as it
  shipped: correct keyboard tab order, Enter-to-submit on every form,
  `aria-invalid`/`aria-describedby` on validation errors, a keyboard focus
  trap in the shared confirm modal, verified `dir="rtl"` throughout with
  intentionally `ltr` phone/email/link inputs, mobile card layouts with no
  horizontal overflow, and render/filter performance checked at a 500-record
  scale.
- Final production audit: reviewed for dead code, debug leftovers, and XSS
  hygiene (every dynamic value verified to go through `escapeHtml`); found
  and fixed one real inconsistency (the backup-restore confirmation still
  called native `window.confirm()` instead of the app's own accessible
  modal).
- Deployment prep: added `DEPLOYMENT.md` with cPanel/uPress upload
  instructions, confirmed every internal file reference is relative and
  every filename's capitalization matches exactly (relevant on
  case-sensitive Linux hosting), and removed the original single-file
  version once it was no longer needed.

## Backward compatibility

Every feature above was shipped with an explicit compatibility check: data
saved by an earlier version of the app — including collections that didn't
exist yet (attractions, getting-ready, the budget target) and vendor records
with only the old flat `deposit` number — continues to load, render, and
export/import correctly. Vendor records with a pre-payment-schedule deposit
are lazily migrated into the new schedule format the first time they're
edited, with the total preserved exactly.
