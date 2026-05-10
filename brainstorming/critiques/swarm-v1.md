# swarm — v1 critique

Captured: 4 frames at t ≈ 1.5, 9.5, 17.5, 25.5 s in headless render
(no real touches → 4 ghost orbiters driving the field).

## What I see

**Frame 00 (t ≈ 1.5s).** A bright cream-amber blob fills the centre-left
half of the screen with a soft bone-white core. The right edge of the
blob shows wispy displaced "claw" shapes — that's the velocity field
deflecting density at the boundary, exactly the boid-fluid character I
wanted. One faint ring glyph is visible bottom-right. So far the piece
*is doing the right thing* in the abstract — but the blob is already
near-saturation by t=1.5s.

**Frame 01 (t ≈ 9.5s).** Catastrophe. The cream blob has expanded to
cover ~70% of the canvas. A second mauve/wine zone has bloomed in the
right third, with similar saturation. The boundary between them
contains the only readable detail — wispy, almost stratus-cloud
texture. The interior of each zone is flat cream/flat mauve. The
finger glyphs are invisible against the saturation. The viewer
reads "two paint splats", not "a swarm".

**Frame 02 (t ≈ 17.5s).** Worse. The field is nearly fully covered, a
dense pink-violet sky with creamy underbelly. There is no negative
space. The eye has nowhere to land — the entire image is hot. A faint
cursor dot is visible centre-right.

**Frame 03 (t ≈ 25.5s).** Fully saturated frame in violet/mauve with a
small unspoiled cream patch in the upper-left. The piece has lost its
swarm character entirely; it reads as fluid simulation aftermath.

## Diagnosis

Density injection per finger per sim tick:
`DT * (1.6 + 2.4 * newness) * blob = 0.04 * 4.0 * blob ≈ 0.16 * blob` (at
newness=1).

Density decay: 0.9925 per tick → ~1.5% per frame at iter=2. Steady-state
at finger centre ≈ injection / (1 − decay²) ≈ 0.16 / 0.0149 ≈ 10.7 per
pixel — clamped to the 6.5 cap, then through `pow(d, 0.78)` to ≈ 4.0,
multiplied by 1.55 in `col`, then Reinhard-rolled to peak. The piece is
running at saturation by design.

Compounding: density diffusion coefficient 0.35 spreads bright cells into
neighbours, so density saturates not just where fingers are but
*everywhere their advected paths sweep*. With 4 ghost orbiters tracing
broad Lissajous curves, "everywhere" is most of the screen within 5
seconds.

The boid character is on screen — I see it in the wispy displaced
boundaries — but it's hidden behind a wash of fully-cooked density.

## Scores (vs. `taste.md`)

```yaml
piece: swarm
version: v1
scores:
  palette_cohesion: 4   # warm-extended (red→cream→mauve→violet) holds together; no green/cyan
  composition:      1   # full-screen wash, no negative space, eye pinned nowhere
  motion:           2   # boundary wisps move but interiors flat — saturation kills perceived motion
  intensity:        2   # plenty of brightness but no dynamic range; uniform-bright is exhausting, not intense
  depth:            2   # one layer at saturation reads as flat
  form_and_ending:  3   # 60s with no end-state arc baked in (acceptable for an open-ended interactive piece)
  mesmerizing:      1   # nothing for the eye to predict or chase — no swarm character visible
  cursor:           — # cursor not exercised in headless inspect; ghosts substituted
```

## Top fix (single change, applied as iteration)

The piece doesn't need a redesign. It needs five linked numbers retuned.
Apply as one bundle:

1. **Density injection** `DT * (1.6 + 2.4 * newness)` → `DT * (0.45 + 0.9 * newness)`.
   ~3-4× lower steady-state.
2. **Density cap** 6.5 → 1.6. Forces sharp falloff at the rim.
3. **Density decay** 0.9925 → 0.965. Half-life ~1s instead of ~3s.
4. **Density diffusion coefficient** 0.35 → 0.05. Stop smearing density into
   ambient — let advection alone carry it.
5. **Inject sigma** 0.055 → 0.028. Tighter blob = readable boid clusters
   instead of broad clouds.
6. **Glow exponent** 0.78 → 0.55. Brighter response to density gradients
   makes the swarm body pop against negative space.
7. **Finger ring weight** 0.65 → 1.5. Glyphs need to be readable against
   the brighter density now.

Expected after fix: density forms tight stirred clusters around fingers,
with negative space between them. The whole screen is no longer hot;
~50%+ should be near-black. Streaks become visible because they're not
drowned in saturated background. Finger rings legible.

## Open questions for v2 (post-iterate)

- After tuning, is the swarm character readable? Should I see "a flock"
  or "a fluid"? If still fluid, the per-finger swirl coefficient may
  need raising relative to the radial attraction.
- Do the ghost orbiters read as "alive but autonomous" or as boring
  Lissajous loops? Frame 04 of the inspect run will tell.
- Is `passes:` overkill given how little of the simulation state ends
  up visible? Probably no — the wispy claws at frame 01's boundary are
  where the boid-fluid earns the rgba16f cost.

## After applying the fix

Re-rendered with all 7 numbers retuned. The piece now reads correctly:

- **Frame 00 (1.5s)**: amber/gold density blob in left-centre with three
  legible ring glyphs (one finger near upper-right is a fresh orange
  ring with hot core). Negative space ~30%; the swarm has a body and
  a context.
- **Frame 01 (9.5s)**: negative space ~55%. Two distinct density
  clusters — olive-green-yellow on the left, wine-violet on the right
  — with clear wispy boundary structure (the boid character). Four
  finger rings spread around the field, each a different hue from the
  warm-extended palette.
- **Frame 02 (17.5s)**: similar — looser, with motion-line streaks
  visible inside the still-warm regions. Field has "settled" between
  ghost orbiter cycles, which reads as the swarm taking a breath
  rather than a saturation event.
- **Frame 03 (25.5s)**: the cleanest moment. Two vortex eyes (cream-
  white left, magenta right) clearly stirring the field. Negative
  space ~50%. The image is *legibly a swarm*, with motion direction
  readable from the swirl pattern. This is what the piece is for.

Updated scores:

```yaml
piece: swarm
version: v2
scores:
  palette_cohesion: 5   # warm-extended holds; multi-finger gives multi-hue without confetti
  composition:      4   # negative space + paired vortex eyes; eye has somewhere to land
  motion:           4   # velocity-aligned streaks + swirl boundaries; field never freezes
  intensity:        4   # peaks roll to warm-white at finger cores, but field stays mostly dark
  depth:            3   # one layer; reads as 2D field. Acceptable for the thesis.
  form_and_ending:  3   # 60s loop with no end-state arc; that's correct for an interactive piece
  mesmerizing:      4   # vortex eyes pull the eye, ghosts keep changing — predict + chase loop intact
```

Shipping v2 as-is. Touch-driven runs will look meaningfully different
from these headless ghost-only renders — the user can park a finger
and watch a tight cluster persist while ghosts orbit around it.
