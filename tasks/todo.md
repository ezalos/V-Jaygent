# Study 2swap → build a 2swap-inspired piece

**Context.** Louis asked to study the YouTube creator **2swap** (@twoswap)
— chaos / dynamical-systems visualizer, "Gravity Basins", "Double
Pendulums are Chaoticn't", fractals. His renderer is open-source:
`github.com/2swap/swaptube`. Louis wants this as inspiration AND a
piece built from it. Run: `R-20260522T114719-topic-chaotic-systems`.

Decision (asked 2026-05-22): **study, then build a piece.**

## Phase 1 — Study (vjay-study flow)

- [x] 1. **Deep research** — 2 background agents done. Key finding:
      `swaptube` has NO N-body code; gravity-basin recipe derived
      from primitives — and it works SINGLE-PASS (no ping-pong).
- [x] 2. **Distill to brainstorming/**
      - `inspirations/2swap-refs.md` — artist study (written)
      - `techniques/basins-of-attraction.md` — the technique note,
        4 single-pass GLSL recipes (written). Named for the general
        technique, not just gravity. Cross-linked `strange-attractors.md`.
- [x] 3. **Update taste.md** — extended the Structure-honesty lens
      with the basin clause (emergent boundary filigree).
- [x] 4. **Update /vjay-iterate critic** — added reading-order
      item 12 (the basins note, conditional); renumbered 13-16.
- [~] 5. **lib/ extraction** — SKIPPED. Bar is 3 pieces; only 1
      planned. Two reuse-candidate formulas noted in the technique
      file for later.
- [ ] 6. **Commit the study bundle** — DEFERRED. Tree has 83 dirty
      files; `taste.md` + `vjay-iterate/SKILL.md` carried pre-existing
      WIP before this session. Commit grouping needs Louis's call —
      handle at end of run with the piece.

## Phase 2 — Build the piece: `watershed`

- [x] 7. **Thesis + brainstorm** — gravity basins; stub at
      `brainstorming/pieces/watershed.md`.
- [x] 8. **Scaffold** — `pieces/watershed/`.
- [~] 9. **Build + inspect** — 8 renders, honest saga:
      - v1-v4 gravity/magnetic-pendulum: balloons → dust → fur →
        marbled paper. Never crisp basins. Architecture E→C en route.
      - Louis approved a pivot to the **Newton fractal** (2026-05-22).
      - v5-v7 Newton: chunky → coarse beads → dither-corrupted (the
        amortization made headless stills ungradeable).
      - v8: collapsed to single-pass monolithic (architecture A),
        de-amortized. CRISP, correct Newton-fractal basin map.
      - Standing issue: composition is thin — 2-3 flat zones + one
        beaded seam. Correct + crisp but not yet mesmerizing.
      - PAUSED for Louis's call (invest one more push / ship v8 /
        shelve). See handoff.
- [ ] 10. **Critique loop** — pending Phase 9 resolution.
- [ ] 11. **Commit the piece** — pending. NB: study commit (Phase 1
      item 6) still also deferred — bundle decision with Louis.

## Phase 3 — Wrap

- [ ] 12. `/wrap-up` — capture meta-lessons; end the run.

## Open question

Piece thesis presented to Louis 2026-05-22 — `watershed`, a
gravity-basin field. Awaiting his nod before scaffolding (Phase 2).
Commit grouping for the dirty tree also pending his call.

## Review

**Shipped.** Two commits on master:
- `f531512` study: 2swap — chaotic systems / basins of attraction
- `8e5c9b0` add watershed: Newton-fractal basin of attraction

Phase 1 (study) — `2swap-refs.md` + `basins-of-attraction.md` + a
`strange-attractors.md` cross-link, committed. The taste.md basin
clause + critic reading-order entry are written but left uncommitted
(taste.md + vjay-iterate/SKILL.md carry Louis's pre-existing WIP) —
Louis to fold those hunks in.

Phase 2 (watershed) — chef-doeuvre on critic v1 (5/5 mesmerizing, all
dimensions 5). It took 9 renders and one architecture pivot. The
honest arc: gravity/magnetic-pendulum basins (v1-v4) produced a
marbled field, never crisp Wada filigree — a realtime shader can't
resolve what 2swap renders offline. Louis approved a pivot to the
Newton fractal (intrinsically a crisp Wada fractal, ~10x cheaper);
v5-v8 got it crisp; v9's 6-root density push made it dense and
mesmerizing.

**Lessons** (also in memory): for a basin/fractal piece, default to
the Newton fractal, not integrated gravity dynamics. And amortized
ping-pong recompute makes a piece ungradeable from headless inspect
stills — it's invisible at 60fps but dither-corrupts the ~2fps
captures.

## Non-goals (held)

- No specific audio track — watershed is theme-only / self-playing.
  Could be bound to a song later via the audio pipeline.
- lib/ extraction skipped — the basin formulas stay per-piece until a
  3rd piece would reuse them.
