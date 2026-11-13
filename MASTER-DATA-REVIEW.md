# v1.3.0 matching update

The rules below for v1.2.0 are historical. Current matching now uses scraped public_stock.Total + mla_stock.Total against one_bhk_units, then explicitly labelled approximate remaining-row associations. Signed availability values are displayed with review notes. See README and RELEASE_NOTES for the exact matching policy. Agraharapalya30 can now resolve through a unique stock sum of 488 even when the report label lacks a survey suffix. Refresh with the new scraper to populate these fields. ChinnaKurchi Kannada crosswalk is based on the supplied screenshot image(20261015-072025).png; workbook and report stock differ, so the association is approximate. Screenshot counts were not inserted into the saved report.

# Master inventory and matching review — 1.2.0

Source: Project Details 03.12.2025.xlsx, Sheet3, rows 4–70. The original workbook is included; its SHA-256 and row provenance are in data/project-master.json. Unit totals: 45,124 1 BHK; 3,826 2 BHK. Blank values stay null; zero-stock housing types are not listed in that mode. Merged coordinates are inherited from their source cell, with provenance.

The workbook is the project inventory, not an availability report. Agency and constituency are transcribed from it. The English-to-Kannada crosswalk is explicitly maintained in tools/import_project_master.py using the supplied report labels and prior site identities. Those Kannada labels are annotations, not workbook columns. No machine translation or broad fuzzy name matching assigns counts.

Matching requires constituency and a reviewed Kannada location label, a unique report row and one eligible master contract. Numbered suffixes distinguish Nelaguli parcels 2/3 and Agraharapalya29. Counts are accepted only when nonnegative category figures sum to the total; MLA is validated independently. No report was scraped during this release.

## Outstanding review

- Agraharapalya30 (survey30): the plain Agraharapalya report row does not establish its survey. Show its source entry in the detail explanation, but do not assign its counts until confirmed.
- Devagere67/68/69 and Kukkanahalli77/78: duplicate or shared report names cannot identify each survey/contract.
- Muddayyanapalya28 and Muthagadhahalli20/22: one report name spans multiple master contracts. Do not repeat the counts.
- Newly added/relocated contracts without a report-label crosswalk retain unknown availability. Former locations in relocation notes are not aliases for current availability.
- Shettihalli has invalid negative public counts in the bundled old report. Agraharapalya29 also reflects the bundled snapshot, not the user's newer local scrape. Keep the user's newer report on upgrade.
- Avverhalli and Kannminiki: no workbook coordinates. Do not infer positions from constituency or nearby sites.
- Workbook agency names, spelling and coordinates are preserved; independent field verification was not performed.

## Stable identities and media

Displayed numbers follow workbook serial, while internal keys preserve legacy IDs only where coordinate and survey match one-to-one. Agraharapalya29 is a documented exception: name/survey agree but workbook coordinates changed; key 1-50 is retained. The `legacy_keys` object records all retained keys. New keys have the form 1-xls-057 / 2-xls-057. These serial-derived IDs must be reviewed before replacing the workbook with a reordered/new edition.

Do not rename media IDs according to the new display numbers. Existing keys 1-7 (Horamavu Agara) and 1-6 (Bidarahalli) retain their galleries. Ambiguous old IDs are not reused. Back up/export drafts and reassociate any affected galleries manually after confirming parcel/agency. Older DATA-REVIEW.md describes the pre-1.2 inventory; this document supersedes it for current master matching.
