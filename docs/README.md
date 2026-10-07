# GitHub Pages — Snowflake Loss Triangle Analysis

This `/docs` folder contains the static showcase site.

## Deployment

GitHub Pages is configured to serve from the `main` branch, `/docs` folder:

1. **Source:** `main` branch, `/docs` directory
2. **URL:** `https://sfc-gh-ooral.github.io/sfguide-loss-triangle-analysis/`
3. **`.nojekyll`** marker is included so GitHub serves the files as-is (no Jekyll processing)

## Files

| File | Purpose |
|---|---|
| `index.html` | Self-contained showcase page with inline CSS, JS, and data. No build step or external dependencies. |
| `.nojekyll` | Disables Jekyll processing on GitHub Pages |
| `README.md` | This file |

## Updating

Edit `index.html` directly. The page is fully self-contained. Push to `main` and GitHub Pages redeploys automatically.
