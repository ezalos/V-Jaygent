# studio: critic-grades view + catalog sort fix

**Brief (Louis, 2026-06-11).** (1) A way to see, per piece, the grade
the critic gave on each individual probe, plus a grouped note —
"maybe some new view accessible from the catalog". (2) Make sure the
piece menu is sorted most-recent → oldest.

Previous todo (rosette, shipped chef-doeuvre) in git history.

## Findings

- The catalog *is* sorted server-side, but the sort is broken:
  js-yaml parses `created:` into a JS `Date`, and
  `String(date).localeCompare(...)` orders by **day-of-week name**
  ("Wed May 20…"). Live order confirmed garbage (all Wednesdays
  first). Fix: compare epoch ms.
- Critic data lives in `brainstorming/critiques/<slug>-vN[-iM].md`.
  30/44 files end in a structured ```yaml tail (verdict, claim_check,
  per-probe pass/fail/weak across up to 6 groups, 6 dimension scores,
  top_fix). Older ones are prose-only — fall back to scraping the
  verdict.
- The container has no view of `brainstorming/` — needs a read-only
  bind mount + Dockerfile COPY default.

## Plan

- [x] server.mjs: fix apiCatalog sort (epoch compare, robust to Date
      or string `created`)
- [x] server.mjs: `critiquesDir` option +
      `GET /api/pieces/:slug/critiques` (parsed YAML tails, sorted by
      version; fallback verdict-scrape for old files) +
      `GET /api/critic-summary` (latest verdict per slug, for catalog
      chips) + `GET /api/critiques/:file` (raw markdown)
- [x] runtime.mjs: verdict chip on catalog cards (click → grades
      panel, stopPropagation) + grades overlay: grouped note (latest
      verdict + avg dimension score + mesmerizing X/5 + claim),
      per-probe grades by group, dimension scores, version history
      with links to full critiques
- [x] index.html + styles.css: #grades overlay, verdict-pill colors
- [x] compose.yaml: `./brainstorming/critiques` ro mount; Dockerfile
      COPY fallback
- [x] tests: fixtures + sort regression test + critiques endpoints
- [x] run test suite (73/73 pass)
- [x] commit, docker compose build && up -d, verify live

## Review

- Sort root cause was data-type, not ordering logic: js-yaml turns
  `created:` into a Date, and `String(date)` starts with the
  day-of-week name, so localeCompare grouped pieces by weekday.
  Fixed with an epoch-ms compare; regression test pins it.
- Grades view: verdict chip on each catalog card (latest verdict +
  composite, color-coded) → full-screen overlay with the grouped
  note (verdict pill · avg dims · mesmerizing · claim · version ·
  critique count), every probe group from the latest structured
  critique, dimension score bars, and the full v1→vN history with
  links to the raw critique markdown.
- 21 slugs covered; prose-only critiques (pre-YAML-tail era) fall
  back to a scraped verdict or a plain "critique" chip.
- `rosette-v1.md` renamed to `anemone-v1.md` (piece was renamed in
  3f4b72c; critiques key off filename).
- Playwright smoke: chips render, panel opens, Esc closes grades
  then catalog, no new console errors.
