# Local fix: availability hidden by stock mismatch

Bidarahalli has one master project (3,967 1BHK units) and one Ashraya report row (combined public + MLA stock 4,199). The previous matching rule rejected this unique location solely because stocks differ, hiding the reported public availability of 1,219.

The revised matching rule first uses exact stock matches for multi-project locations. When there is exactly one project and one report row in a constituency + Kannada location group, it assigns the report row despite a stock mismatch and flags it for review. No availability is allocated to ambiguous multi-project locations.

This patch is for local testing. The ZIP includes the saved scraper report, not the user's newly scraped local report. Keep the newly scraped `ashraya_master_report.json` from your own computer when updating.
