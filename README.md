# The Wind's Scent

A cozy, offline rooftop farming game that runs in the browser and installs on phones as a PWA.

**Play / test:** https://phuocbalo.github.io/the-wind-scent/ (after GitHub Pages is turned on — see below)

## Current status: Sprint 0 — Foundations
| Part | Requirement | File |
|---|---|---|
| PWA shell, install, iPhone install guide | N02 | `index.html`, `manifest.webmanifest` |
| Works offline after first launch | N01 | `sw.js` |
| Auto-save, retry, export/import, save upgrades | N03, N04, N05 | `src/save.js` |
| Forward-only game clock | N06 | `src/clock.js` |
| Portrait frame, centered on computers | N09 | `styles.css` |
| All text in a Vietnamese file | N11 | `text/vi.json` |
| All balance numbers in one table | — | `data/config.json` |
| Style guide and art source | — | `docs/style-guide.md` |
| Testing tools removed from release build | N13 | `scripts/build-release.js` |

## How to change things without coding
- **Text:** edit `text/vi.json`.
- **Balance numbers:** edit `data/config.json`.
- After changing any file, bump `CACHE_VERSION` in `sw.js` so installed games update.

## For developers
- Run locally: `npm start`, open http://localhost:8080
- Unit tests: `npm test`
- Release build (no testing tools): `npm run build:release` → `dist/`
- No build step or libraries: plain HTML, CSS and JavaScript modules.

## Turning on GitHub Pages (one time)
Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**. Every push to `main` then deploys automatically.

## Known limit (clock)
Turning the device clock **back** never loses or doubles progress. Turning it **forward** while offline cannot be detected (no internet time), so it speeds up the game for that player only.
