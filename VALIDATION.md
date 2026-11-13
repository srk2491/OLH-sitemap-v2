# v1.5.0 validation — 2026-10-17

Five Node suites pass, including bilingual announcement strings, signed/zero/missing quotas and bounded search summaries. Chromium checks at 390×844 and 1440×900 use mock English/Kannada voices to verify no autoplay, card/group/detail reading, speed, pause/resume/stop, missing Kannada voice, unavailable synthesis API, spoken results, focus reading, modal focus/return and text/contrast layout without horizontal overflow. Public deployment builder includes accessibility.js. Actual audio, pronunciation and real screen-reader usability were not tested; no WCAG conformance claim is made. Map tiles were blocked in browser QA.

# v1.4.2 checks — 2026-10-16

All four Node test suites passed. New assertions verify contiguous 1–51 and 1–11 numbering, identical results when each housing type is loaded alone, distinct per-type group IDs and unchanged project keys/quota values. Browser checks passed switching 1 BHK → 2 BHK → 1 BHK, independent result numbers, Nelaguli expansion and correct housing type in details. Existing multi-location search and signed-count data checks passed. No live source scrape/deployment was performed.

# v1.4.1 checks — 2026-10-16

Node regression and new English/Kannada multi-location/constituency OR-search checks passed. Browser checks at 390×844 and 1440×900 passed two accumulated speech segments, both places in the results, URL reload, Clear transcript, no horizontal overflow, and the Sadenahalli MLA General -70 / total 0 rendering in both card and detail table. Speech was mocked; live microphone recognition was not tested. Existing signed-figure tests also cover negative totals. No source data was altered.

# v1.4.0 checks — 2026-10-16

Four Node test suites passed. The grouping tests verify unchanged persistent keys and quota values, 53 total groups / 51 in 1 BHK mode, distinct parcel identities, number stability under reorder, missing-coordinate ordering and common English/Kannada voice intents.

Browser tests at 390×844 and 1440×900 passed location expansion, two parcel markers, detail/share-link reload, preserved demo gallery, manager options, equal-language titles (retained from 1.3.1), reduced-motion styling, and no horizontal overflow. Speech handlers were tested with a mock API for results, Kannada language selection and permission errors; actual speech recognition and microphone accuracy were not tested. Draft/media and public-build isolation tests passed. OpenStreetMap tile network requests were blocked during QA.

# v1.3.0 validation

Passed eight Python grouped-header parser tests, including separate stock/availability extraction and negative values. Passed three Node test files including 242+246=488, 35/34/33 versus 35/34/32, order invariance, tied/unequal groups, unrelated names/constituencies, negative public/MLA counts and existing inventory regressions. Browser regression passed responsive layouts and manager options; targeted browser test passed exact stock arithmetic, approximate warnings and negative quota rendering using synthetic intercepted report data. Test fixtures are not production data. Live scraping and map tile network delivery were not tested.

# v1.2.0 verification — 2026-10-15

Passed Node legacy/master data checks: source totals, 76 unique housing entries, independent quota validation, separate Nelaguli parcels, shared-contract ambiguity, agency/constituency search, missing-coordinate nearest sorting, media ID retention and report reorder stability.

Passed Chromium UI checks at 360×740, 390×844, 768×900, 1440×900, 1440×730 and 1366×640: no horizontal or outer-page overflow, scrollable results, search, housing type, constituency/reset/share-URL reload and availability filter. Checked missing-coordinate detail agency and absence of directions; media manager has 64/12 housing options. No page JS errors.

Passed local draft cover/hero/gallery, reload, empty draft, normal view and generated-public-build draft isolation checks. Public build includes the master JSON and excludes source workbook and official tools. Map tiles were blocked during browser tests; online tile delivery and a new live scrape were not verified.

Earlier validation records follow for historical context.

# Verification performed

## Passed

Version 2 also checks original Kannada identity, survey-qualified matching, saved-site hearts, automatic location, and nonmodal desktop detail/filter interaction.

- JavaScript syntax checks for core.js, script.js, media.js and media-manager.js.
- Data tests for all 63 stable site keys and valid source coordinates.
- Missing/negative/invalid counts, original Kannada identity, survey-number-qualified matches, true parcel ambiguities, repeated parcels and consistent breakdown totals.
- Verified source mappings survive row reordering and fail closed after source count changes.
- 1 BHK/2 BHK display numbering and source-ID media keys.
- Search, combined filters, reset, zero results, nearest sorting and Kannada-name search.
- Desktop/mobile browser layouts at 360, 390, 768 and 1440 px; no horizontal overflow.
- Saved-site hearts, shortlist filters and nonmodal desktop details.
- Selection from map markers and site cards; detail dialogs; keyboard Enter/Escape; selection cleared on housing-type changes.
- Share URL refresh restores housing type and selected site.
- Automatic location request on opening and retry: success, denied permission and timeout; browsing remains usable.
- Photo and WebM video uploads with synthetic test assets; unsupported file rejection.
- Local media persistence across reload; caption edits; reordering; removal; draft discard.
- Photo viewer and native video player controls.
- Local draft preview isolation: normal public view does not read device drafts.
- Exported ZIP contains the media bytes, manifest, captions and publication instructions.
- Published galleries and relative paths under /OLH-sitemap/.
- Project-data failure state and map-tile failure fallback.
- No uncaught JavaScript page errors in tested primary journeys.
- Site location files and scheduled workflow preserved. The report now includes the screenshot-supplied corrections below. Scraper improved to remove fuzzy translations; Python syntax checked.

## Scope and limits

The headless test browser rendered the UI and local assets. The external OpenStreetMap tile service returned access-blocked images for requests from this environment; further tile requests were stopped. Screenshots therefore show the explicit map-unavailable fallback. A normal basemap render has not been verified in this environment. Check it on the deployed public site. Source coordinates, Leaflet markers and directions retain their original behavior.

The live GitHub Pages deployment was not modified. No source-portal scrape or repository authentication was performed. Source accuracy, ambiguous availability mappings and administrative classification need local verification. Kannada source names and core interface strings are supported; supporting copy requires editorial review. Real-world MP4 playback depends on codec/browser support; browser tests exercised WebM video. No exhaustive accessibility audit or physical iPhone testing was performed.

Synthetic photos/videos were used only for tests and are not present in the published gallery manifest or product data. As of v1.1.1, exactly two galleries contain explicitly labelled Unsplash demo samples; all other galleries remain empty.

## Preview files

previews/explorer-desktop.png and previews/explorer-mobile.png show the redesigned explorer. previews/media-manager-desktop.png and previews/media-manager-mobile.png show the authoring workflow. Map screenshots document the tile fallback, not a production outage.

## RGHCL / MLA revision checks

- Official vector roof artwork extracted with its original geometry and colours; verified that the logo decodes in the browser.
- Rightmost MLA quota column checked with actual saved-report missing values.
- Synthetic MLA counts validated separate from public counts; not included in the shipped data or screenshots.
- Unit checks cover zero, missing/negative/inconsistent counts, independent quota validity, duplicate controls, and ignoring public/allotted controls.
- Full existing browser journeys passed again after the header/table changes, including 360px mobile.
- Current live source returned gateway/time-out failures here. MLA control names and real counts remain unverified; existing JSON retained.

## Horamavu Agara regression / upload correction

- Replaced quota ID guessing with grouped-header parsing. A screenshot-reconstructed table fixture verifies Horamavu Agara's MLA Available values 24/35/2/61, rather than total stock 96 or allotted stock 35.
- Six Python parser tests: group selection, changed quota order, missing Available group, missing/non-numeric cells, and zero retention. Node core tests pass with the screenshot-supplied records and unchanged parcel rules.
- Browser confirms Horamavu Agara's public total 0 / MLA total 61 and its category breakdown.
- Direct upload link selects Horamavu Agara and a 2 BHK site correctly. Local photo upload appears in preview and stays absent from normal public views.
- Existing full browser checks passed again at mobile/tablet/desktop widths.
- Current live portal returned gateway failure; no fresh scrape claimed. Supplied screenshots are the source of the three changed production rows. Capture time unknown.

## Public / official workspace separation

- Upload buttons and management links removed from the public explorer.
- Official tool moved to official-tools/ with corrected shared data/media paths; local image/video upload, captioning, export, and draft preview still pass the full browser checks.
- Public whitelist package excludes the official workspace and its upload page. Verified both /media-manager.html and /official-tools/media-manager.html return 404 when serving the public release.
- Public script disables local draft preview even when ?preview=1 is supplied; seeded browser draft remained absent. No file inputs or manager links rendered.
- Repository permissions control publication; the local official tool has no login. A hosted authenticated official-only upload backend is not implemented.

## v1.1.0 sample media / easier changes

- All three downloaded JPEGs decode; sizes 169 KB, 356 KB and 70 KB. Source pages mark them free under the Unsplash License. Attribution retained with the sample folder.
- Browser checks passed: Replace preserves caption and item position, rejects unsupported files without losing the previous media, Remove/Undo restores the former position, reload persists changes, sample uploads receive DEMO ONLY captions, and exporting an empty gallery contains no media bytes.
- Responsive official workspace at 390 px has no horizontal overflow after hiding the replacement input. Existing public journeys at 360/390/768/1440 px and no uncaught page errors passed.
- Node core/data checks and all six Python quota-parser tests passed.
- Public build excludes official-tools/ and demo-sample-photos/. In v1.1.0 the media manifest remained empty; v1.1.1 pre-attaches samples to two sites as documented below.

## v1.1.1 two preloaded demo sites

- Exactly two 1 BHK sites have media: Horamavu Agara (1-7, two photos) and Bidarahalli (1-6, one photo). Both have valid matched availability records in the bundled report. Existing figures are unchanged: Horamavu Agara public 0 / MLA 61; Bidarahalli public 934 / MLA unavailable. These are saved report values, not freshly checked live figures.
- Public-build browser checks verify sample image decoding, DEMO ONLY captions, photo viewer, gallery-free third site and exclusion of the official tool. Local official-workspace checks verify preloaded media removal and exported manifest changes.

## v1.1.2 Sadenahalli public zero

- Node data regression verifies Sadenahalli public 0 with 0/0/0 breakdown and MLA unknown; six Python quota-header parser tests pass.
- Public-build browser verifies the Sadenahalli quota table total public 0 / MLA Data unavailable, and 25 sites with reported public availability. Seeded gallery decoding/viewer/removal/export checks still pass.
- Correction based on user screenshots, not a fresh live report fetch. Public total stock and selected stock 261 are not used as available stock.

## v1.1.3 Sadenahalli MLA source inconsistency

Full-width screenshot values 47/-70/23/0 are preserved in raw MLA data; Node tests confirm the quota is invalid despite summing to zero. Browser verifies public 0 / MLA Data unavailable and its negative/inconsistent diagnostic. Public gallery/viewer/export journeys still pass. This is screenshot-backed source preservation, not a live scrape or a corrected official count.
