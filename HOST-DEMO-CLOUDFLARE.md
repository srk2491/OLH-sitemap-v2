# Deploy this demo to the existing Cloudflare Pages site

Use the existing Pages project `olh-sitemap-preview` to keep the same address:
`https://olh-sitemap-preview.pages.dev/?bhk=1`.

## Prepare the demo files

1. Extract `OLH-sitemap-v1.15.0.zip`.
2. Open Command Prompt in the `OLH-sitemap-v1.15.0` folder.
3. Run `py build_public.py`. It creates a `publish` folder containing only the public app and required assets. If `publish` already exists, rename or remove it first.
4. If you want online photo/video uploads in the demo, first complete `MEDIA-UPLOAD-SETUP.md`, then rebuild `publish`. Without that setup, the map works with its included galleries, while `/media-admin.html` remains disabled.

## Deploy based on the Pages project type

In the Cloudflare dashboard open **Workers & Pages → olh-sitemap-preview → Settings → Builds**. Check whether a Git repository is connected.

### If it is a Direct Upload project

Open **Deployments → Create deployment**, select **Production**, and upload the `publish` folder. Cloudflare replaces the files at the existing production URL after deployment completes. You can also use Wrangler from the project folder:

```bat
npx wrangler pages deploy publish --project-name=olh-sitemap-preview
```

If Wrangler asks, sign in to Cloudflare and choose the account that owns the Pages project.

### If it is connected to GitHub

Copy the updated project source into the repository connected to this Pages project, then commit and push it. In the Pages build settings, use build command `python build_public.py` and output directory `publish`. Cloudflare deploys the push automatically. Choose the production branch to update the existing public URL; another branch creates a preview URL.

Do not drag and drop into a Git-integrated Pages project. Cloudflare supports dashboard drag-and-drop deployments for Direct Upload projects; Git-integrated projects deploy from their repository or through Wrangler.

## Verify the demo

When the production deployment says **Success**, open:

- `https://olh-sitemap-preview.pages.dev/?bhk=1`
- `https://olh-sitemap-preview.pages.dev/?bhk=2`
- `https://olh-sitemap-preview.pages.dev/media-admin.html` (online media setup required to sign in and upload)

Hard-refresh with **Ctrl+F5** if your browser still shows the previous version. Keep the scraper and local-only `official-tools` out of the deployment; the `publish` folder already excludes them.
