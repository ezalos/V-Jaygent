# V-Jaygent

Claude's visual flux studio. A live WebGL2 shader playground with a
Telegram-ready publishing pipeline. Each piece is a GLSL fragment
shader plus a small `meta.yaml`; the studio hot-reloads on edit, the
publisher renders a 60fps mp4 clip via headless Chromium + ffmpeg.

## Quick start

```bash
npm install
npx playwright install chromium      # one-time

# run the live studio (serves on http://127.0.0.1:7777 by default)
npm run studio

# in a separate shell: scaffold a new piece
node bin/new-piece.mjs my-slug
echo my-slug > pieces/current.txt    # point the studio at it

# render it to mp4 for Telegram (studio must be running)
node bin/publish.mjs my-slug --duration 8
# writes pieces/my-slug/clip.mp4 and prints a json summary.
```

Watching over SSH: `ssh -L 7777:localhost:7777 <host>` then open
`http://localhost:7777` in a browser locally.

## Layout

```
pieces/<slug>/shader.frag   the art
pieces/<slug>/meta.yaml     title, date, notes, duration, uniforms
pieces/current.txt          one-line slug — what the studio shows now
studio/                     server + browser runtime
bin/                        scaffolder + publisher
tests/                      node:test suite (npm test)
```

## Shader conventions

Standard uniforms, bound automatically:

| name           | type  | what                                           |
|----------------|-------|------------------------------------------------|
| `u_resolution` | vec2  | framebuffer size in pixels                     |
| `u_time`       | float | seconds since the piece loaded                 |
| `u_mouse`      | vec2  | cursor in pixels (origin bottom-left)          |
| `u_frame`      | int   | frames since load                              |

Custom uniforms can be declared in `meta.yaml` under `uniforms`.

`#version 300 es` on the first line of GLSL is required by the language.
The studio hoists a `#version` directive from anywhere in the source up
to the top, so `// ABOUTME:` comments above it are fine.

## Keybindings (live studio)

- `← / →` — cycle through the catalog
- `r`     — reset `u_time` to zero
- `h`     — toggle HUD overlays

## Visitor stats

The studio counts page views (`/` and `/<slug>`) into a JSON file. Bots
and link-preview fetchers are filtered by user-agent; uniques are
counted per day via SHA-256 of `daily-salt | ip | ua` (no raw IPs
persist). Read the IP from `CF-Connecting-IP` / `X-Real-IP` /
`X-Forwarded-For` so it works behind Cloudflare and nginx.

```bash
# protect /api/stats with a token (recommended in prod)
STATS_TOKEN=some-long-secret npm run studio

# read the stats
curl 'https://vjaygent.develle.fr/api/stats?token=some-long-secret'
```

Override the storage path with `STATS_FILE=/var/lib/vjaygent/stats.json`.
Default is `studio/.stats.json` (gitignored).

## Tests

```bash
npm test
```
