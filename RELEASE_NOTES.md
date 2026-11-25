# v1.16.1 — Constituency numbering and logbook filters — 2026-11-25

- Number presentation sites consecutively in clockwise order within each constituency; each constituency starts at 1. Persistent project keys and source serials are unchanged.
- When switching the logbook home-type filter to All home types, reset the site filter to All sites so action tickets and notes across the full dashboard are visible.
- Checks: logbook inline JavaScript syntax and isolated constituency-numbering/filter regression checks pass. No database schema change.
- Upgrade: replace the project files with this release, commit and push to `main`; the existing workflow builds and deploys the updated logbook and dashboard to Cloudflare Pages.

# v1.16.0 — Logbook meeting and all-sites views — 2026-11-24

- Default the logbook to All sites and All home types so notes and action tickets are visible without first picking a site.
- Add an All meetings / selected meeting filter; applying a meeting shows its site-specific notes and action tickets linked to its site discussions.
- Fetch action tickets and their update history across all sites. Add an explicit site selector to action-ticket creation, and show the site and meeting on tickets.
- Rename the follow-up board to Action tickets and explain that an action ticket is an assigned task with an owner, due date, priority, status and later progress updates.
- Checks: logbook inline JavaScript syntax passes; extracted filter-logic checks pass for all-sites default and meeting/site/home-type filtering; bilingual voice-search regression tests pass; Python sources compile; public build includes site-board.html and excludes official-tools/. The existing tests/check.js data-integrity check fails at its sourceStock-versus-units assertion, which is outside the logbook files changed here.
- Limitation: tickets appear under a meeting when linked to a site discussion from that meeting. Existing unlinked tickets remain visible under All meetings.
- Upgrade: replace the project files with this release, commit and push to `main`; the existing workflow builds and deploys the logbook page to Cloudflare Pages.

# v1.13.0 — Compact desktop layout repair — 2026-11-11

- Correct the short-window layout that left the first housing card clipped under the fixed footer. At desktop heights of 620px and above, the first result now fits fully while search, home-type tabs, filters and location totals remain visible.
- Tighten project cards for short desktop windows and display labelled demo/sample plans in full instead of cropping them like photographs. The Kannada scheme eyebrow remains aligned with the English “CM One Lakh Housing · Bengaluru” label.
- Checks: Chromium visual review and element-bound checks at 1366×620, 1366×685, 1366×768, and 390×844; first desktop result fits in the list at each desktop size. English/Kannada scheme eyebrow and version badge verified; JavaScript syntax and bilingual voice regression tests pass; Python sources compile; public build includes the compact-layout stylesheet and excludes `official-tools/`.
- Limitations: browser speech is simulated; real Safari microphone behavior, screen-reader audit, and live map tiles were not verified in this check. No scrape or hosting deployment performed.
- Upgrade: extract the complete v1.13.0 folder, stop the old local server, run `py -m http.server 8000` from the extracted folder, open `http://localhost:8000`, hard-refresh, and confirm the v1.13.0 badge.

# v1.12.0 — 2026-11-11

- Correct the Kannada hero eyebrow: it now identifies the Chief Minister's One Lakh Housing Scheme and Bengaluru, matching the English scheme/location label instead of switching to a generic homes message.
- Preserve the English/Kannada layout parity, search and quota filtering, voice workflow and data.
- Checks: JavaScript syntax and bilingual voice-search regression tests passed. The Kannada eyebrow text is wired through the existing language translation mechanism.
- No scrape or deployment performed. Extract the full release and start the server from this folder; confirm v1.12.0 in the header.

# v1.11.0 — 2026-11-11

- Normalize font sizes, line heights and spacing for major headings, summaries, project names and quota labels across English and Kannada.
- Reserve a consistent two-line hero heading height so switching languages does not shift the page layout. Translate the location-numbering helper in Kannada.
- Keep the v1.10 search autocomplete, Public/MLA quota filter, removable chips, voice search and underlying data intact.
- Checks: JS syntax, voice regression suite, public build asset inclusion and Chromium computed-style comparison between English/Kannada for page heading, result heading, site name and quota labels. The title now retains equal height in either language.
- Limitation: Kannada speech accuracy and full screen-reader audit remain unverified. No scrape or hosting deployment performed.
- Upgrade: extract this version, restart the local server from the new folder, open localhost:8000 and hard-refresh. Confirm v1.11.0 in the header.

# v1.10.0 — 2026-11-11

- Add native suggestions for site names, Kannada names, location names, constituencies and contractors while typing.
- Add a quota selector so availability status can be filtered against Public or MLA quota. Show active quota/status as removable chips and reset all fields consistently; preserve quota filters in shareable URLs.
- Refine the filter form spacing and responsive layout. Keep bilingual, multi-location voice search and source-backed values intact.
- Checks: JavaScript syntax; Node voice regression tests; Chromium checks for autocomplete, MLA filtering, removable chips, reset and no page errors; public build contains both new stylesheets and excludes official tools.
- Limitations: browser speech remains simulated; Safari microphone and full assistive-technology checks remain pending. No source scrape or hosting deployment performed.
- Upgrade: extract the full v1.10.0 folder, stop the previous local server, run `py -m http.server 8000`, open localhost:8000, hard-refresh and confirm v1.10.0 badge. Rebuild public contents before updating hosted copy.

# v1.9.0 — 2026-11-07

- Introduce the Evergreen visual identity: dark heading panel, warm paper surfaces, refined typography, clearer housing-type selection, balanced result cards, quota panels and map/details controls.
- Add a visible v1.9.0 badge to identify the running copy. Preserve source data, media, signed quota values, bilingual search, voice and read-aloud logic.
- Checks: JS syntax, Node voice regression suite, Chromium simulated speech and 360/390/1440px voice-dialog checks, desktop/mobile visual inspection and public build. Actual speech on Safari and a full accessibility audit remain unverified; map tiles were blocked during browser checks.
- Upgrade: stop your previous local server, extract this complete folder, run `py -m http.server 8000`, open localhost:8000 and hard-refresh. The header must show v1.9.0. Run build_public.py for hosting; include design.css. Public gallery remains view-only; official tools are excluded from that build. No scrape or deployment performed.

# v1.8.0 — 2026-11-07

- Refine the desktop list/map proportions, typography, search controls, project cards, quota summaries, map controls and details surfaces into a cohesive cream/green design.
- Improve mobile navigation contrast and match English/Kannada detail-name sizes. Retain reduced-motion support, signed availability and existing voice workflow.
- Checks: JavaScript syntax, Node voice regressions, Chromium simulated speech/browser checks at 360/390/1440px, visual desktop/mobile inspection, and public build completed successfully.
- Limitations: map tiles were blocked in automated checks; real Safari speech and a full accessibility audit remain unverified. No source-data refresh or deployment performed.
- Upgrade: extract this full folder, stop any old local server, and run `py -m http.server 8000` here. Open http://localhost:8000 and hard-refresh. Public hosting: run build_public.py and upload publish contents. Public uploads remain view-only; official-tools excluded.

# v1.7.0 — 2026-11-07

Based on v1.6.0, which in turn is based on the user-uploaded OLH-sitemap-v17 archive.

- Refresh the explorer with a warm cream, green and terracotta palette; stronger page hierarchy; larger photo-led project cards; clearer public and MLA availability summaries; and a more spacious project details panel.
- Add removable active-search chips, richer map hover previews, and a bundled generic neighbourhood illustration for locations without a project photo. Demo/sample images remain visibly labelled as such; the illustration is not presented as a site photo.
- Preserve the bilingual multi-location voice-search workflow, independent 1/2 BHK data, negative and missing quota display, source notes, read-aloud controls and reduced-motion accessibility preference.
- Keep the public gallery view-only and exclude official-tools and scraper source from public builds. `build_public.py` now includes `upbeat.css`.
- Checks run: `node --check script.js`; `node tests/voice-search.test.cjs`; Chromium desktop/detail/mobile layout and mobile map/list checks at 390px and 360px; simulated voice-browser regressions at 360px, 390px and 1440px; Python syntax for the public builder; public output asset check. No browser page errors were observed. Speech capture remains simulated in automation.
- Limits: no real Safari/iOS microphone or Kannada recognition run, no full screen-reader audit, and no live-site scrape or hosting/deployment performed. Existing baseline stock-matching test limitation is documented in v1.6.0 and `VOICE_SEARCH_VALIDATION.md`.
- Upgrade: extract the complete v1.7.0 folder and run `run-dashboard.bat` on Windows or `python3 -m http.server 8000` on macOS/Linux. A scraper run is not needed for the visual update. Rebuild the public folder and upload its contents to update a hosted copy.

# v1.6.0 — 2026-11-06

Based on the user-uploaded OLH-sitemap-v17 archive (internal version 1.5.1).

- Replace continuous speech capture with short user-started sessions. Connecting, listening, processing and review reflect lifecycle events. Interim words appear separately from final text.
- Finish listening uses stop() and waits for final results. Cancel/close invalidates stale callbacks before aborting; timeouts, permission failures, service errors and backgrounding preserve confirmed text. No automatic microphone restart, overlapping session, or automatic submission.
- Add a bilingual selection review: removable location/constituency chips, Add another location, editable transcript, confirmation-only approximate spelling suggestions, explicit home-type and nearest-first controls. Search only confirmed selections. Keep multiple places across recordings.
- Add reviewed search-only English/Kannada spelling aliases. These never change canonical project names, report joins, stock counts, quota availability or media keys. Speech alternatives can suggest locations but cannot select them silently.
- Preserve every supplied data JSON, photo, workbook and core matching file byte-for-byte. The existing matching test's stock-equality assertion fails identically on the original upload and this release; see VOICE_SEARCH_VALIDATION.md.
- Use bundled Leaflet, include voice-search.js in public builds and fix the public builder's incompatible preview assertion. Public gallery remains view-only; official tools and scraper source are excluded from generated public files. No official authentication is claimed.
- Verified JavaScript syntax, the new Node voice regression suite, Chromium desktop/mobile UI with simulated prefixed recognition, and public-build asset completeness. Actual Safari/iOS microphone handling, Kannada recognition accuracy and a full assistive-technology audit remain unverified.
- Upgrade: extract the whole folder, use run-dashboard.bat, and hard refresh. Preserve any data/photos newer than the uploaded archive. No scraper run is required. Public deployments must include voice-search.js. No GitHub deployment or fresh scrape performed in this release.

Previous local release history is preserved in RELEASE_NOTES_LOCAL.md and RELEASE_NOTES_STOCK_MISMATCH_FIX.md.
