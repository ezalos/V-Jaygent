# shoal — Lyapunov chaos map of the double pendulum

**Context.** Continuing the basins-of-attraction series after watershed.
Louis: "let's do the lyapunov chaos map next." Recipe 4 of
`brainstorming/techniques/basins-of-attraction.md` — 2swap's *Double
Pendulums are Chaoticn't* in V-Jaygent form.

Previous todo (watershed) preserved in git history (commit `3a8503d`).

## Thesis (committed)

Each pixel is the initial state (θ1, θ2) of a double pendulum,
released from rest. Integrate it AND a twin perturbed by 1e-4 for
~30 RK4 steps; pixel brightness = `log(separation / 1e-4)`. Stable
regions (KAM islands) read as soft solid colour; chaotic regions
saturate bright/hot. The viewer sees phase-space architecture —
islands of regularity in a chaotic sea, which is what `shoal` means.

## Plan

- [x] 1. Brief + start run (`R-20260523T104021-shoal-new`).
- [x] 2. Scaffold `pieces/shoal/`.
- [ ] 3. Write `shader.frag` + `meta.yaml` (monolithic, A).
- [ ] 4. Brainstorm stub + refs.
- [ ] 5. Sanity render (`bin/publish.mjs shoal --duration 4`).
- [ ] 6. Inspect (`bin/inspect.mjs shoal 6 14`).
- [ ] 7. Read frames; tune at most ONE thing if needed (watershed
      discipline — don't grind).
- [ ] 8. Lints (palette/idle/composition) + audit.
- [ ] 9. Critic grade (dispatch independent Explore agent).
- [ ] 10. Commit the piece.
- [ ] 11. `/wrap-up`.

## Non-goals

- Passes / amortization. Watershed proved the headless-inspect cost
  isn't worth it; gradeable from stills > marginal perf win.
- A separate substrate / glow / ring layer. The chaos map IS the
  thesis — adornments distract.
- Per-pixel mass-ratio (would require generalising the Hamiltonian);
  cursor.x drives an initial momentum kick instead.

## Open question

Will 30 RK4 steps × dt=0.065 (≈ 2s of system time) resolve the
characteristic KAM-island structure, or does it need 50+ for clean
edges? Tune at inspect.

## Review

**Shipped — critic ship-it on iteration 2 (build v4).**

Build arc: v1 monolithic single-pass twin-trajectory Lyapunov, with a
slight gravity drift. Lints all pass, but the critic returned
**structural-rethink** — the pixel-to-state map was static, so the
basin field couldn't breathe (only ±12% gravity modulation, no
field-level evolution). Saved `shoal-v1.md` (blocked critique).

Louis chose option A: the critic's recommendation — animate parameters
to reshape basins in real time. v4 added (a) phase-space pan + zoom
drift (periods ~100s / ~150s) so the pixel-to-state map evolves
frame-to-frame, and (b) strong gravity oscillation (range 4–16 over
~70s) so the KAM islands grow and shrink. Combined, the field is now
unrecognisable between distant frames.

Critic v2 verdict: **ship-it, 5/5 mesmerizing**, claim pass, scores
5/5/4/4/4/n.a. Reconciliation note: data technically meets the
chef-doeuvre bar; critic chose the conservative label given three
craft-level imperfections (motion lacks beat-churn, interior chaos
lacks sub-texture, no structural silence). Both proceed to commit.

**Lessons** (worth a memory): for any pixel-to-state-map visualisation
(Lyapunov, basin, escape-time, anything where pixel = sample of a
mathematical landscape), the static-field problem is the failure
mode. **Animate a global parameter** (or pan / zoom the sampling)
so the landscape reorganises frame-to-frame; cursor/keyboard alone
won't do it in idle.

Total renders: 4 (well inside the discipline budget; watershed's
lesson held).

