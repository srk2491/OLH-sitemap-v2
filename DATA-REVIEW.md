# Availability data review — version 2

## What caused the apparent duplicate names

The earlier scraper used fuzzy Kannada-to-English matching with a low threshold. Some English labels therefore describe a different village than the original Kannada entry. The explorer now uses original Kannada identity, narrowly listed spelling aliases and source survey suffixes. It does not guess from user proximity, phase or constituency-to-taluk assumptions.

| Site | Source entry actually used | Available count |
|---|---|---|
| Kyalasanahalli · Survey 15 | ಕ್ಯಾಲಸನಹಳ್ಳಿ | 0 |
| Bidarahalli · Survey 193 | ಬಿದರಹಳ್ಳಿ | 934 |
| Punagamaranahalli · Survey 13 | ಪುನಗಮಾರನಹಳ್ಲಿ | 80 |
| Pillahalli · Survey 53 | ಪಿಲ್ಲಹಳ್ಳಿ | 2 |
| Agraharapalya · Survey 29 | ಅಗ್ರಹಾರ ಪಾಳ್ಯ 29 | 132 |

This raises the number of valid matched site counts from 19 to 25 in the supplied snapshot. These are reported counts, not independently verified current inventory.

## Remaining unresolved sites

| Key | Site / survey | Reason | Candidate Kannada entries |
|---|---|---|---|
| 1-3 | Chikkajala- / 76/4 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-4 | Chikkajala / 76/7 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-8 | Nimbekayipura / 52 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-12 | Heggondanahalli / 4 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-13 | Kodathi / 82/83 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-14 | Biduruguppe / 329 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-17 | Menasiganahalli / 145 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-19 | S. Bhangipura / 179 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-21 | Koppa / 110 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-23 | Nelaguli / 145 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-24 | Devagere / 67 | The report has location-level entries, but it does not identify this parcel clearly. | ದೇವಗೆರೆ (2), ಯಶವಂತಪುರ, report-2b8f6f0a; ದೇವಗೆರೆ (7), ಯಶವಂತಪುರ, report-818671e2 |
| 1-26 | Bheemanakuppe / 118 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-28 | Muddayyanapalya / 28 | The report has location-level entries, but it does not identify this parcel clearly. | ಮುದ್ದಯನಪಾಳ್ಯ (3055), ಯಶವಂತಪುರ, report-51d549f0 |
| 1-29 | Muddayyanapalya / 28 | The report has location-level entries, but it does not identify this parcel clearly. | ಮುದ್ದಯನಪಾಳ್ಯ (3055), ಯಶವಂತಪುರ, report-51d549f0 |
| 1-31 | Mallasandra / 35 | The report has location-level entries, but it does not identify this parcel clearly. | ಮಲ್ಲಸಂದ್ರ (63), ಯಲಹಂಕ, report-a59e7de5 |
| 1-32 | Mallasandra / 17 | The report has location-level entries, but it does not identify this parcel clearly. | ಮಲ್ಲಸಂದ್ರ (63), ಯಲಹಂಕ, report-a59e7de5 |
| 1-33 | Avverahalli / 10 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-34 | Lakshmipura / 69 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-38 | Aluru / 25 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-40 | Agrahara Palya / 30 | The report has location-level entries, but it does not identify this parcel clearly. | ಅಗ್ರಹಾರ ಪಾಳ್ಯ (13), ಯಲಹಂಕ, report-fb2f56fe; ಅಗ್ರಹಾರ ಪಾಳ್ಯ 29 (132), ಯಲಹಂಕ, report-44b4471 |
| 1-42 | Kukkanahalli / 80 | The report has location-level entries, but it does not identify this parcel clearly. | ಕುಕ್ಕನಹಳ್ಳಿ (49), ಯಲಹಂಕ, report-aadc8cb8; ಕುಕ್ಕನಹಳ್ಳಿ (90), ಯಲಹಂಕ, report-8f4df88b |
| 1-43 | Kukkanahalli / 80 | The report has location-level entries, but it does not identify this parcel clearly. | ಕುಕ್ಕನಹಳ್ಳಿ (49), ಯಲಹಂಕ, report-aadc8cb8; ಕುಕ್ಕನಹಳ್ಳಿ (90), ಯಲಹಂಕ, report-8f4df88b |
| 1-44 | Guddadahalli / 45 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-46 | Shettihalli / 59 | The source contains negative or inconsistent counts. Current availability needs checking. | ಶೆಟ್ಟಿ ಹಳ್ಳಿ (invalid count), ದಾಸರಹಳ್ಳಿ, report-4a7f2c |
| 1-48 | Yamare / 195 | No matching availability entry was supplied for this site. | No matching Kannada identity |
| 1-49 | Yamare / 88 | No matching availability entry was supplied for this site. | No matching Kannada identity |

Two Kukkanahalli sites share survey 80; the source has two counts but no phase/parcel identifier. Two Muddayyanapalya sites share survey 28; a location count cannot safely be copied to both parcels. Mallasandra has two surveys but the supplied source does not identify which survey its row describes. These remain unavailable at parcel level.

For a verified manual assignment, set data/availability-mappings.json using a site key and report fingerprint. Fingerprints invalidate when a record changes. Only assign after checking the real parcel identity; do not split or sum records by guesswork.

The scraper now uses exact/explicit Kannada aliases and retains the original Kannada fields. The portal could not be reached for a fresh scrape in this session. The source report snapshot has not been overwritten.
## Supplied screenshot correction (2026-10-06)

Krishna Rajapuram report screenshots show local constituency **Available** columns: Kyalasanahalli 43/57/10 = 110; Horamavu Agara 24/35/2 = 61; Horamavu survey 82 10/13/3 = 26. Public available stock is zero for all three. These manually transcribed source figures carry screenshot provenance in JSON; actual capture time is unknown. No fresh live portal scrape was possible. The Horamavu Agara public stock of 0 must not be conflated with its separately displayed MLA stock of 61.

## Sadenahalli correction — v1.1.2 (6 October 2026)

Sadenahalli / survey 30 now has verified screenshot public available values 0/0/0/0, replacing saved negatives -1/-2/0/-3. Source row is image(8).png, grouped public column headers are image(9).png. Public stock and selected: 104/131/26/261. These are not available flats. MLA remains unconfirmed; image(10).png shows local-quota headers and upper rows but not Sadenahalli. Screenshot capture time not established.

Remaining unresolved public records: 26 = 1 invalid (Shettihalli), 8 ambiguous parcel matches, 17 without matching rows in the saved report. This does not establish that rows are missing from the live portal.

## Full-width Sadenahalli screenshot — v1.1.3

image(20261006-070242).png resolves the previously unseen MLA row. Public available 0/0/0/0 is reconfirmed. MLA available 47/-70/23/0 is now preserved as screenshot source data. The official source displays a negative General count and selected General 201 exceeds General stock 131. This requires RGHCL/source-system reconciliation; it is not a name ambiguity. Do not clamp -70 to zero, advertise 70 positive available units, or interpret total 0 as valid usable category stock. MLA remains unavailable with a negative/inconsistent-source explanation.
