# Publishing Replated Recipes inside the Sandbox site

Replated Recipes stays in this repository (the source of truth). The Sandbox by Cristian Perez
site imports a built copy and serves it at `/apps/replated-recipes/`.

## The contract

| | |
|---|---|
| Source repository | `https://github.com/cristianxperez-dev/replated` |
| Build | `node tools/build.js` (Node 18+, no `npm install`, no network) |
| Deployable directory | `dist/` (created by the build; not committed) |
| Contents | `index.html` (the whole app), `build.json` (version, commit, counts), `.nojekyll` |
| Mount path | any; intended: `/apps/replated-recipes/` |

The app is a single self-contained HTML file. Fonts, logos, illustrations and recipe-card PDFs
are embedded; routes are hash-based (`#/recipe/<id>?mode=chef`), so nothing depends on the URL
path and there is no base path to configure. `tools/build.js` fails the build if the data is
invalid or if a root-absolute path (`/…`), external script, external stylesheet or network fetch
ever appears in the page.

Deep links look like `https://<sandbox-site>/apps/replated-recipes/#/recipe/roast-prime-rib?mode=chef`.

## Which version to import

Pin a ref with the Sandbox repository variable `REPLATED_REF`:

- a release tag such as `v1.0.0` (recommended once tagged), or
- an exact commit SHA, or
- `main` to always follow the latest merged version.

## Workflow for the Sandbox repository

Save as `.github/workflows/import-replated.yml` in the Sandbox repository. It shows both common
GitHub Pages setups; keep the one that matches how the Sandbox is published.

```yaml
name: Import Replated Recipes

on:
  workflow_dispatch:
  repository_dispatch:
    types: [replated-updated]   # sent by Replated's workflow on pushes to main (optional)
  schedule:
    - cron: "23 6 * * *"        # daily safety net

permissions:
  contents: write

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check out Replated Recipes
        uses: actions/checkout@v4
        with:
          repository: cristianxperez-dev/replated
          ref: ${{ vars.REPLATED_REF || 'main' }}
          path: .replated-src

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build
        run: node .replated-src/tools/build.js

      - name: Place under /apps/replated-recipes/
        run: |
          rm -rf apps/replated-recipes
          mkdir -p apps/replated-recipes
          cp -R .replated-src/dist/. apps/replated-recipes/
          rm -rf .replated-src
          cat apps/replated-recipes/build.json

      # Option A: the Sandbox is published from a branch. Commit the imported copy.
      - name: Commit the import
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add apps/replated-recipes
          git diff --cached --quiet || git commit -m "Import Replated Recipes $(jq -r '.version + " @ " + .commit[0:7]' apps/replated-recipes/build.json)"
          git push

      # Option B: the Sandbox is published with GitHub Actions. Skip the commit step and instead
      # run this job's steps inside the Sandbox's existing Pages build, before
      # actions/upload-pages-artifact, so apps/replated-recipes/ is included in the artifact.
```

To trigger the import automatically whenever Replated's `main` changes, set in **this**
repository: the variable `SANDBOX_REPO` (e.g. `cristianxperez-dev/sandbox`) and the secret
`SANDBOX_DISPATCH_TOKEN`, a fine-grained token with Contents: read and write on the Sandbox
repository. Without them, the Sandbox still imports on its schedule or on demand.

## Notes

- **Storage:** the app saves only checked-off ingredients/steps and the preferred mode in
  `localStorage`, all under keys beginning `replated:`. On a shared Sandbox domain these keys
  share the origin with other apps but cannot collide with them.
- **Size:** `index.html` is about 3.5 MB (embedded fonts, logos and PDFs). GitHub Pages serves it
  compressed; no other requests are made.
- **Jekyll:** the page has no front matter and needs no processing; a Jekyll-built Sandbox copies
  it unchanged.
- **Browsers:** current Safari, Chrome, Firefox and Edge, including iOS Safari.
