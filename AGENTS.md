# Project release requirements

For every delivered update to this project:

1. Increment VERSION using MAJOR.MINOR.PATCH: patch for compatible fixes, minor for compatible features, major for breaking changes.
2. Add a dated entry at the top of RELEASE_NOTES.md describing changes, fixes, checks actually run, known limitations, and any upgrade/deployment steps. Keep previous entries.
3. Update README.md when the current version or run/deployment instructions change.
4. Deliver one versioned ZIP containing one complete project folder. Do not include generated nested release ZIPs, publish/ output, caches, or synthetic QA uploads.
5. Keep the public gallery view-only and exclude official-tools/ from public deployment. Do not claim official authentication exists until a real server-side mechanism is implemented and verified.
6. Preserve source-data provenance and distinguish verified source figures, screenshots and test fixtures.
