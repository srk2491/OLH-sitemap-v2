# Official media workspace

This tool is separate from the public site. Do not publish this folder to GitHub Pages.

An authorised official opens the project folder locally, runs `py -m http.server 8000 --bind 127.0.0.1`, and visits `http://localhost:8000/official-tools/media-manager.html`. Choose the housing type and site, upload photos/videos, edit captions, preview, and export a publishing pack. Only officials with repository write access should commit the exported media files and manifest to the live repository.

This local draft tool does not authenticate its operator. Distribute it to officials using your internal channels. Repository write permissions control publication. The public release contains no upload page or upload endpoint.

For an online official-only upload portal, use a separately hosted authenticated backend. Verify each login against an administrator-maintained official account allowlist, check the uploader role on every upload/edit/delete request, validate file type/size on the server, and log the official, site and change. Signing out or revoking a role must stop future mutations. Public visitors may only read published media. Do not store admin passwords or privileged API keys in public JavaScript. This backend has not been implemented in the current static build.

## Change a gallery

Use Replace to choose a new photo/video while preserving the caption and position. Remove hides an item from the saved local draft. Undo last removal restores the most recent removal for the current site; it resets when you reload, change sites or discard the draft. Captions save automatically. Invalid replacement files leave the previous item intact.

Try the three JPGs in ../demo-sample-photos/. Keep their automatically added DEMO ONLY captions visible; these are not actual RGHCL photos. Preview the selected site, export, and publish the pack to update the public link. After the new manifest is deployed, delete obsolete published files if their old direct URLs should stop working. The public gallery remains view-only.
