# humbleangmoh.xyz

Luke's personal site. Static HTML, monospace typography, hand-edited. Deployed via GitHub Pages at humbleangmoh.xyz (custom domain via `CNAME`).

Slug: `humbleangmoh` · folder: `~/0.projects/260218-humbleangmoh/`

## What this is

A deliberately old-school static site: no SSG, no React, no build step. Just `index.html` + sibling pages, a shared three-CSS stack (`reset.css`, `monospace.css`, `styles.css`), and a small `theme.js` for light/dark toggle. The whole point is to keep the site stable, fast, and editable in a plain text editor for the next 20 years.

Posts live as standalone HTML files under `notes/`, `projects/`, `about/`. The navigation in `index.html` is hand-maintained (intentional — forces curation).

## Run

```bash
# Preview locally
python3 -m http.server -d ~/0.projects/260218-humbleangmoh 8080
# open http://localhost:8080

# Or just open index.html directly
open ~/0.projects/260218-humbleangmoh/index.html
```

There is no dev server. `_generate.sh` is the local helper for converting drafts into site pages (see header of the file).

## Architecture

- `index.html` — landing + nav (hand-maintained sidebar)
- `about/*.html` — intro, contact
- `projects/*.html` — project write-ups (currently placeholders)
- `notes/*.html` — published notes / posts
- `styles.css`, `monospace.css`, `reset.css` — typography-first CSS
- `theme.js` — light/dark toggle, persists to `localStorage`
- `CNAME` — `humbleangmoh.xyz` (GitHub Pages custom domain)

## Status

Active. First real post ("it's happening", 2026-05-10) shipped recently. WIP across many pages — see `git status`.

## Constraints (per user memory)

- Draft → preview → push. Never push directly. Generate locally in `/Users/lukemelican/site/`, send the user a `file://` URL, push only on explicit approval.
- After cert/PUT operations on GitHub Pages there is API lag — verify cert on the wire, wait, don't CNAME-clear.

## Related

- `~/0.projects/260505-whatsapp-viewer/` — shares the typographic / monospace CSS approach

## Orchestration

This project's slug is `humbleangmoh`. Registered in `mission_control.db`.

- `PROJECT.html` at this directory is **auto-generated** by `~/infra/scripts/build_project_html.py` on SessionEnd. Don't hand-edit it — changes will be overwritten.
- Sessions in this dir auto-log to `mission_control.db` via the `auto_devlog.py` SessionEnd hook.
- Cross-project view at <http://localhost:3000> when the dashboard is running (start from `~/0.projects/260510-mission-control/code/` via `npm run dev`).
- G Drive mirror at `~/My Drive/0.projects-mirror/humbleangmoh/` (read-only from other devices).

See `~/CLAUDE.md` for the full Mission Control architecture.
