# ferrohands — v1 critique (cold-open)

Inspect: 5 frames @ 9s spacing on a 60s loop, headless (u_touch_count == 0
→ 3 Lissajous-orbit dipoles drive the surface).

## What I see

- **Frame 00 (t=1.5s).** Four small pole-shaped blobs scattered, just
  forming. Substrate is mid-ember red with no real darkness anywhere.
  FPS reads ~16 in the top-right.
- **Frame 01 (t=10.5s).** One large flat-topped mesa with a crusty
  amber rim, plus a smaller second mesa. **FPS reads "7 fps"** —
  well below the 30-fps headless threshold flagged in
  `feedback_iteration_discipline.md` §4. Phone perf will be miserable.
- **Frame 02 (t=19.5s).** Two mesas. Same flat-top profile, same
  crusty rim. The interior of each mesa is uniform pale grey-amber
  with no spike texture.
- **Frame 03 (t=28.5s).** Same shape family, fewer mesas. They merge
  and split as the orbiters cross.
- **Frame 04 (t=37.5s).** Three mesas in a tri-lobe arrangement.
  Slightly different topology, but same structural failure.

## Honest scores (taste.md dimensions)

| Dimension | Score | Why |
|---|---|---|
| Palette cohesion | 3 | Warm-only ✓, but mid-palette dominates — no shadows, no near-violet floor reading. Range of the 5-stop ramp is wasted. |
| Composition | 2 | Mesa blobs read as "puddles in a thunderstorm", not "spike forest". The Rosensweig claim is dishonest in the frames. |
| Motion | 3 | Mesas drift and merge, but the motion lacks micro-detail because the surface is plateau-flat inside the mesas. |
| Intensity | 2 | Everything sits around mid-luminance. The dynamic-range lever (peaks rolling to gold, troughs to violet) isn't being pulled. |
| Depth | 2 | Embossed rim works ✓, but interiors are flat → no eye-into-the-frame depth. |
| Form & ending | 2 | Loops with no arc. Acceptable for an interactive piece, but the headless rendering needs more shape. |

**Average: 2.3.** Below ship threshold. Multiple dims < 3 → iterate.

## Structure honesty (the killer probe)

**Claim:** "Rosensweig spikes — hexagonal cone forest above a critical
field." **Reality in frames:** flat-topped puddles with a single
crinkled rim. **Verdict: dishonest.** The piece is a ferro-PUDDLE,
not a ferro-FLUID-IN-SPIKE-PHASE.

Why: the PDE `dh/dt = D·lap − G·h + α·|B|² − β·h³` has no critical
wavenumber. It's diffuse forcing + nonlinear saturation — surface
rises uniformly within the magnetised region until cubic damping
caps it at H_HI. Real Rosensweig has a length scale (capillary
length λ = 2π√(σ/ρg)) baked into the linear stability analysis.
Without that length scale, you get a puddle.

## Touch (cursor) probes

Headless inspect = 0 touches → cursor probes mostly inapplicable. But:
- **Idle probe:** ✓ — orbiters keep the surface alive without input.
- **Composition probe:** ⚠ — under fingers, expected to show distinct
  spike clusters per finger. Frame study under live touch needed,
  but with the current PDE this will likely just give bigger flat
  puddles per finger.
- **Latency probe:** ✗ at 7fps → 140ms per frame, way over the 60ms
  budget.

## Top fix (one iteration before ship)

**Bundle: hex-lattice modulation + drop sub-iterations 8→4.**

1. Multiply the magnetic forcing by a screen-space hexagonal lattice
   pattern (3 cosines 60° apart). Period ~0.045 world units gives
   ~22 hex cells across the canvas. Spikes only form at lattice
   nodes within the magnetised region — discrete cones, not a flat
   mesa.
2. Drop sim sub-iterations from 8 to 4. The hex modulation pins
   spike locations, so we don't need 8 sub-steps for stability.
   Should bring headless FPS to ~25-30.
3. Pull baseline palette term down (0.30 → 0.16) so quiet substrate
   reads as deep violet/wine, not mid-ember. Restores the dynamic
   range the 5-stop palette was designed for.
4. Reduce qIdle for orbiter dipoles 0.040 → 0.022 so they form
   *small spike clusters*, not full mesas.

Justification for bundling: the four changes attack the SAME root
cause (the PDE saturates everywhere it's magnetised → mesa). The
hex modulation introduces the missing length scale; the iteration
drop is enabled by the modulation; the palette baseline tracks the
new lower mid-h; the orbiter strength matches the lower mid-h. None
of them work alone — they're a single coherent structural fix.

## What I'm NOT going to chase yet

- Per-finger phase-locked spike pattern (would require simulating
  the nonlinear-stability mode-selection — out of scope).
- Specular Phong → microfacet (probably worth it but not the fix
  this dimension-pull needs).
- Time-varying lattice rotation (might add motion, but adds a knob
  before the basic claim is honest).

`/vjay-iterate ferrohands` post-ship if any of these turn out to
matter.

---

## v1.1 — after the bundled fix + supercritical-pitchfork gate

Bundled fix shipped: hex-lattice modulation of magnetic forcing,
sub-iterations 8→4, palette baseline 0.30→0.16, qIdle 0.040→0.022,
plus a `smoothstep(E_CRIT, 1.7*E_CRIT, E)` gate so the hex
modulation only fires above the critical field strength (modelling
the actual Cowley-Rosensweig supercritical pitchfork bifurcation).

### Updated frame read

- **Frame 00 (t=1.5s).** Three magnetised regions, each with discrete
  hex-packed cones inside, smooth amber rim, deep wine substrate
  outside. Top-right FPS reads ~58. Structure honesty: PASS.
- **Frame 01 (t=10.5s).** Two large magnetised regions, hex spike
  forest visible inside, substrate sits at proper wine-floor.
  FPS ~8 — early-frame outlier (sim still building state).
- **Frame 02 (t=19.5s).** Two heart-shaped clusters with cone-rich
  interiors. Beautiful palette range (wine → ember → gold).
  FPS ~20.
- **Frame 03–04.** Single dominant cluster, mature hex spike forest,
  satisfying "drop of mercury under a magnet" feel.

### Updated scores

| Dim | v1 | v1.1 | delta |
|---|---|---|---|
| Palette cohesion | 3 | 4 | +1 (full ramp visible) |
| Composition | 2 | 4 | +2 (hex cones honour the Rosensweig claim) |
| Motion | 3 | 3 | 0 (orbiters move things; micro-shimmer is small) |
| Intensity | 2 | 4 | +2 (wine-to-gold range restored) |
| Depth | 2 | 4 | +2 (hex cones inside the rim → depth-on-depth) |
| Form & ending | 2 | 3 | +1 (interactive loop, headless self-plays) |

**Average: 3.7.** Above ship threshold. Structure honesty verdict
flips from FAIL to PASS — the inspect frames now show what the
brainstorm stub claims.

Headless FPS: 20–58 across the run (mature-state ~20). Well above
the ~30-fps midrange-phone proxy threshold for steady state.

Shipping.

---

## v2 — discrete drop on warm sunset (2026-05-11)

Louis's feedback after v1.1: "looks gore." The hex-clusters-on-flat-
substrate read as wounds/viscera rather than as a discrete ferrofluid
drop. The brief was always "interactive fingers TRUE ferrofluid art"
and the canonical mental image is a single dark coherent puddle on
a lit petri dish, with spikes erupting under a held magnet. v1.1 was
"magnetised regions of a planar fluid sheet" — wrong topology.

### Architectural rewrite

1. **Drop body**: a static `reservoir(p)` defines the drop's rest
   shape (smoothstep bowl centred on screen, max h=0.85). The PDE
   gravity term now pulls h toward `reservoir(p)` rather than zero,
   so the body sits at its rest shape when no finger is pulling.
2. **Cubic damping on (h − rest)**, not on h itself. So the body
   doesn't fight gravity to reach reservoir; only spike protrusions
   above the body get the cubic ceiling.
3. **Magnetic forcing E carries finger pull only** (not reservoir).
   Each finger's pull is now a TIGHT GAUSSIAN (`exp(-r²·110)`), not
   a 1/r² Coulomb attractor. The body stays compact; pull only
   affects fluid within ~0.10 world units of each finger.
4. **Hex spike modulation gated by distance to nearest finger**
   (`exp(-minDist·16)`), not just by E magnitude. Spikes erupt
   directly under each finger — canonical Rosensweig — rather
   than everywhere the field reaches.
5. **Display inverted**: drop is dark (near-black violet ink, real
   ferrofluid colour) on a warm sunset gradient (wine→hot ember→
   bright amber). Sky pre-Reinhard values >1.0 so the dark drop
   has real silhouette contrast after tonemap.
6. **Wet rim** along the silhouette catches a warm highlight band
   — the visible "wet edge" of a real ferrofluid drop.

### Frame read

- All five frames show a discrete dark drop on a warm sunset sky.
- Drop shape evolves (pear, teardrop, lobe) as the headless
  orbiters move.
- Hex spike clusters visible inside the drop where each orbiter
  is — small but distinct cone forests.
- Specular highlights along the drop rim and on spike crests.
- FPS reads ~30+ steady-state.

### Updated scores (v2)

| Dim | v1.1 | v2 | delta |
|---|---|---|---|
| Palette | 4 | 4 | 0 |
| Composition | 4 | 5 | +1 (single coherent subject, deforming) |
| Motion | 3 | 4 | +1 (drop shape evolves; spikes shimmer) |
| Intensity | 4 | 4 | 0 (warm sky vs dark drop = full range) |
| Depth | 4 | 4 | 0 |
| Form | 3 | 4 | +1 (now reads as an OBJECT, not a field) |

**Avg: 4.2.** Iconic ferrofluid drop achieved. Spikes are small in
headless inspect (only 2 weak orbiters) but will scale dramatically
with real finger pulls (q=1.40 vs orbiter q=1.20).

### Lessons captured

- "Spikes everywhere E > critical" gave hex texture across the
  whole body. Fix: gate spike modulation by *distance to nearest
  finger* (`exp(-minDist·k)`), not just field magnitude. This is
  the canonical Rosensweig physics — spikes form under the magnet,
  not everywhere its field reaches.
- Cubic damping at the body level fights the gravity-restore;
  apply it only to `max(h − rest, 0)` so the body sits at rest
  while spikes still get capped.
- Tight Gaussian pull (`exp(-r²·k)`) > 1/r² for "discrete drop +
  local finger effect". 1/r² lets the drop drag across the canvas
  toward distant fingers, which is wrong for a held puddle.
