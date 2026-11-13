# Voice search validation — 6 November 2026

## Passed

- JavaScript syntax for voice-search.js and script.js.
- Node regression suite: English/Kannada multiple locations; Shettyhalli and Sadenahalli spelling variants; longest-name/parcel precedence; no embedded-word false match; uncertain names suggested without automatic selection; unknown words retained for review; 1/2 BHK separation; constituency intent; OR result filtering.
- Recorder tests with simulated events: connecting before listening; interim text not committed as final; delayed final result accepted after Stop; no abort on normal Stop; repeated final events do not duplicate text; second recording preserves earlier transcript; close/cancel suppress late callbacks; errors and startup/finalisation timeouts return control and clear timers.
- Chromium browser with a simulated webkitSpeechRecognition API: no microphone autoplay; connection/listening/processing/review; final text after Finish listening; multi-session selection; removal; spelling confirmation; Kannada interface and search; denied-permission errors survive end events; closed-dialog late results are ignored; typing fallback with no speech API; home-type and constituency filters.
- Dialog overflow checks and visual inspection at 1440×900, 390×844 and 360×740. Reduced-motion styling disables the listening animation. No application page errors in these browser scenarios. External map tiles were blocked in UI tests.
- Byte comparisons of all 26 supplied JSON/photo/workbook/core/smoke-test files selected from the uploaded archive: identical to this release. No source counts or photos changed.

## Existing failing test

`node tests/check.js` fails at `matched.every(s=>s.sourceStock===s.units)` on BOTH the unmodified uploaded baseline and this release. This conflicts with the existing unique-location stock-mismatch feature described in RELEASE_NOTES_STOCK_MISMATCH_FIX.md. The assertion and matching logic were preserved; the complete historical suite is not claimed to pass.

## Limits and device checks

Recognition was simulated in Chromium, including the webkit-prefixed constructor. This is NOT a real Safari/iPhone audio test. The WebKit test browser was not available in this environment. Safari's speech-service availability, user permissions, language support, pronunciation, noisy-room performance, and real screen-reader usability still require device testing.

No audio backend or paid speech service was added. Availability and photos are the uploaded snapshot. No live deployment or fresh scrape was performed.
