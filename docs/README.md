# GitHub Pages: Loss Triangle Analysis

This `/docs` folder is the GitHub Pages site, served from the `main` branch, `/docs` folder at
`https://sfc-gh-ooral.github.io/sfguide-loss-triangle-analysis/`.

| Path | Purpose |
|---|---|
| `index.html` | Landing page. Inline CSS, no scripts, no external dependencies. |
| `images/` | App screenshots used by the landing page (`npm run capture`). |
| `catalog/` | 960×600 card images for the Snow Packs catalog (`npm run capture`). |
| `try/` | Hosted no-account example (`npm run build:example`). |
| `.nojekyll` | Serves folders that start with `_` as-is. |

After UI changes, run `npm run build:example`, then `npm run capture`, and review every image.
