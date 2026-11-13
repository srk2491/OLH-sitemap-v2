# OLH Sitemap v1.15.0 — Online site media

Built from your uploaded **OLH-sitemap-v17** project on 6 November 2026. The archive called itself v17 but its internal VERSION was 1.5.1. v1.13.0 fixes clipped result cards on short desktop windows, tightens cards to keep the first result fully visible, and displays labelled demo plans without cropping. The Kannada scheme eyebrow identifies the same CM One Lakh Housing Scheme and Bengaluru as English. Earlier releases added the Evergreen visual design, Public/MLA availability, removable search chips, independent 1/2 BHK datasets, voice search and accessibility controls. Locations without photos use a clearly labelled illustration. Your report, project master, stock-matching logic, photos and media manifest are preserved. This release has not been deployed to GitHub. v1.15 adds an optional authenticated online upload page. See [MEDIA-UPLOAD-SETUP.md](MEDIA-UPLOAD-SETUP.md) before using it; a Supabase project and allowlist setup are required. Without that configuration, the map keeps using the existing committed media manifest.

v1.13 compacts the site list and cards on shorter desktop screens so the first result is not hidden behind the footer. v1.12 translates the scheme eyebrow as “ಮುಖ್ಯಮಂತ್ರಿಗಳ ಒಂದು ಲಕ್ಷ ವಸತಿ ಯೋಜನೆ · ಬೆಂಗಳೂರು,” preserving the CM One Lakh Housing and Bengaluru identity in Kannada.

v1.11 keeps English and Kannada headings, labels, and project text on consistent font sizes and line-height, with a fixed two-line hero area so the header does not jump when switching languages. The numbering helper is translated as well.

v1.10 adds browser suggestions for location, constituency and contractor searches, and lets users apply availability status to either Public or MLA quota. Active filter chips can be removed individually.

Voice-search and accessibility improvements from v1.6.0 remain included. See the sections below for how to run the dashboard and use voice search.

## Try the new search

1. Extract the complete folder and double-click `run-dashboard.bat`. Open **http://localhost:8000**. No scraper rerun is needed for voice-search changes. On macOS, run `python3 -m http.server 8000` inside the extracted folder and open the same localhost address in Safari. On an iPhone/iPad, test microphone access using an HTTPS-hosted copy; the phone’s localhost does not point to your laptop.
2. Press the microphone beside search. Select English (India) or Kannada and the home type.
3. Press **Start listening** and wait until **Listening** appears. Say a short phrase, for example “Nelaguli and Sadenahalli”. The provisional words appear while you speak.
4. Press **Finish listening** or allow the short recording to finish. Wait for **Review your selections**. Stop attempts to collect the final words; closing or clearing cancels the session.
5. Check the location selections. Remove one with its × button. **Add another location** starts another short recording and keeps prior confirmed words. You may also edit the transcript.
6. If recognition misspells a name, choose a **Did you mean…?** suggestion. Approximate suggestions are never automatically selected. Check any unrecognised words; only the displayed selections will be searched.
7. Choose 1 BHK or 2 BHK, optionally select **Nearest first**, then press **Search selections**. Several locations/constituencies use OR matching within the chosen home type. Parcels remain grouped as before.

The dialog follows the dashboard's display language. Speaking language can be chosen independently. Each recording is a short session on all browsers, including Safari; continuous listening and automatic microphone restarts are not required. No new backend, API key, or transcription subscription is used.

## Safari / iPhone checks

Open the HTTPS website directly in Safari, allow microphone access, and check that Siri/Dictation is enabled. Select the language you are actually speaking. A language option in the app does not guarantee that the browser's speech service supports it. If the microphone fails, type in the transcript or use the keyboard's dictation feature. Existing selections remain editable. Browser speech services may process audio online; this app does not store recordings.

Try these cases on your real device: one location; two in one phrase; a second location after **Add another location**; Stop while speaking; deny permission; correct a misspelling; Kannada; close and reopen. The automated browser tests use simulated recognition, so real Safari/iOS microphone behaviour and Kannada accuracy still need your device check.

## Public deployment

Run `py build_public.py` from this folder. It creates `publish/` containing the app, public data/media and bundled libraries, including **voice-search.js**, **upbeat.css** and the generic neighbourhood illustration. Upload the **contents** of `publish/` to the demo repository. The builder excludes official-tools and scraper source. Back up or rename any existing `publish/` folder before rebuilding. There is no server-side authentication in this static project.

The earlier helper's preview-setting assertion has been corrected for this project's `preview=false` setting. Leaflet now loads from the already-included vendor files; map tiles still require internet. No GitHub changes were made for this release.

## Checks

- `node tests/voice-search.test.cjs` checks bilingual multi-location matching, spelling suggestions, filters and recording lifecycle.
- `tests/check.js` already fails on the uploaded baseline because it demands equal master/report stocks despite the documented stock-mismatch feature. The same failure is retained and documented; core.js and source data were not changed to conceal it.
- See `VOICE_SEARCH_VALIDATION.md` for actual checks and known limits.

---

# OLH Sitemap v2 — Complete local testing project

This is a merged local test package: the corrected v2 dashboard/master from our prior test package plus the original scraper and supporting files from your uploaded v1.5.1 archive. It has **not** been deployed or live-scraped in this environment.

## Windows instructions

1. Extract the ZIP, keeping its subfolders. Install Python and Google Chrome if necessary.
2. Double-click `install-scraper.bat` once (installs Selenium). ChromeDriver is normally resolved by Selenium Manager; Chrome and network access are required.
3. Double-click `run-scraper.bat`. This backs up the existing report, opens Chrome, and scrapes the Ashraya website into `ashraya_master_report.json`. Do not interrupt Chrome while it works. If the site layout has changed, the script may fail; do not replace the report with incomplete data.
4. Double-click `run-dashboard.bat`; visit http://localhost:8000 and hard-refresh (Ctrl+F5) after scraping.
5. Run `node tests/check.js` if Node.js is installed for the conservative master-data checks.

## Important

- The supplied **updated** `data/project-master.json` and `ashraya_master_report.json` are retained, rather than overwritten by older v1.5.1 versions. The scraper regenerates only the report, not the master.
- The scraper depends on `data/sites.json`, `data/kannada-name-aliases.json` and `quota_parser.py` from v1.5.1, all restored. It outputs Public and MLA stock totals used for matching.
- The 67-project master retains distinct survey/project identities; unmatched sites show **Availability not published**, not zero. A stock match is a heuristic requiring review. 1BHK/2BHK are separate and negative figures remain visible.
- The official media manager, media files, fonts, Leaflet and project assets have been restored from v1.5.1. Media keys may need review against the new master; check images before publishing.
- `MATCH_AUDIT.csv` was generated for the **included snapshot** and will become stale after a new scrape. Do not rely on it for a refreshed report.
- Historical note: the original public-build warning below has been superseded by the v1.6.0 public deployment instructions above.
- `legacy-tests/` contains v1.5.1 tests for reference; they may assert legacy behavior. The v2 smoke test is `tests/check.js`.
- No GitHub changes have been made. Do not publish the entire project folder; it contains official tools and scraper source.

## Scraper safety

`run-scraper.bat` makes a backup before running. `Scraping.py` writes a temporary report and replaces the JSON only after its own completeness checks pass. Scraper success still does not guarantee every not-yet-bookable project appears in the report.
