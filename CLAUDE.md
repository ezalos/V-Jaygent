# V-Jaygent — Claude project context

V-Jaygent is Claude's visual-expression outlet — WebGL2 fragment-shader
art with audio reactivity, cursor interactivity, and an optional MIDI
keyboard synth. Pieces ship live at https://vjaygent.develle.fr.

## Conventions

- **Master branch only** for piece edits and ops fixes. No feature
  branches. Direct commit per Louis's CLAUDE.md.
- **Commit style:** one bundled commit per piece-creation /
  piece-iterate / study run. Co-Authored-By line at the end.
- **`ABOUTME:`** two-line header at top of every code file.
- **Pieces** live in `pieces/<slug>/` (kebab-case slug). Audio files
  live alongside as `audio.mp3`; analysis JSON as `audio.analysis.json`
  (run `bin/analyze-audio.mjs` to produce).
- **Layers** live in `layers/<name>/` for global / reusable, or
  `pieces/<slug>/layers/<name>/` for piece-local one-offs (resolution
  order: piece-local first).
- **Lib modules** at `lib/*.glsl` (shared math, one right answer
  per function); palettes are NOT in lib — they go to
  `brainstorming/snippets/` and copy-paste per piece (see
  `brainstorming/techniques/using-lib.md`).
- **Default piece architecture:** layer-stack with multi-input
  coupling (cursor + keyboard + audio). Single-shader monolithic
  pieces are the exception, not the default.

## Deploy

After committing changes that touch `studio/`, rebuild + restart the
docker container. Bind mounts cover `pieces/`, `lib/`, `layers/`,
`data/` — those don't need a rebuild.

```bash
docker compose build && docker compose up -d
```

Verification after deploy:

```bash
sleep 6
docker ps --format '{{.Names}}\t{{.Status}}' | grep vjaygent
curl -s https://vjaygent.develle.fr/runtime.mjs | grep -c '<distinctive marker from new code>'
```

The container is `vjaygent-studio`; `docker compose` reads `compose.yaml`
in the repo root. Studio listens on `:7777`; nginx on TinyButMighty
(192.168.1.74) proxies `vjaygent.develle.fr` and `studio.develle.fr` to
TheBeast:7777.

`auto-push: false` — pushes happen only when Louis asks.

## Skills

- `/vjay-from-url <url>` — download + analyze + scaffold a piece from
  a music URL.
- `/vjay-new-piece [brief]` — guided piece creation with research +
  brainstorm + scaffold + sanity render + critique.
- `/vjay-iterate <slug>` — critic-in-the-loop refinement of an
  existing piece.
- `/vjay-study <topic>` — promote a cross-cutting topic to formal
  treatment in `brainstorming/techniques/`.

All four skills auto-invoke `/wrap-up` at end of run (added 2026-05-05
by Louis's request).

## The lessons loop (contractual)

Every Louis watchthrough redline batch ends with a **lessons pass**
before the session closes: (1) generalize each redline into a pattern
(feedback memory file + one-line hook in `tasks/lessons.md`), (2)
decide whether it belongs in `taste.md` as a critic criterion and add
it, (3) state in the reply which lessons were extracted so Louis can
audit the loop. Aesthetic feedback IS correction — the global
CLAUDE.md lessons rule applies to taste, not just bugs. (Added
2026-06-11 after the loop was skipped on a redline batch.)

## Critic probes (taste.md)

Pieces are graded against:
- 5 mesmerizing probes (eye-landing, prediction, squint, hue-drift,
  mystery)
- claim check (does the piece deliver its stated thesis?)
- 7 cursor probes (interactivity)
- 4 per-frame music probes + 6 song-level music probes
- 11 layered-coupling probes (the original 8 + layer-distinctness +
  multi-input coupling + visible phase-lock added 2026-05-05)
- 6 dimensions (palette / composition / motion / intensity / depth /
  form & ending)

See `taste.md` for the full rubric and `brainstorming/techniques/`
for the supporting cross-cutting docs.

## Cross-references

- Architecture: `brainstorming/techniques/using-lib.md` (4-tier code
  organization + layer engine contract + audio analysis JSON schema)
- Lab pieces (POC an element outside the work — research → N switchable
  treatments → Louis picks → integrate): `brainstorming/techniques/lab-pieces.md`,
  canonical example `pieces/bubbles/`
- Aesthetic principles: `brainstorming/techniques/layered-composition.md`,
  `music-composition.md`, `music-to-shader.md`,
  `audio-cursor-together.md`, `keyboard-synth.md`, `interactivity.md`,
  `fluid-dynamics.md`, `polyrhythmic-motion.md`
- Vision: `VISION.md` (manifesto, palette rules, open questions)
- Layer authoring: `layers/README.md`
- Ops: `brainstorming/ops/studio-subdomain.md`
