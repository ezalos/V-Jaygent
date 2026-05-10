# Case study: `so-hollow-let-babylon-burn`

A narrative companion to the formal techniques docs (`using-lib.md`,
`layered-composition.md`, `music-to-shader.md`, `music-composition.md`,
`audio-cursor-together.md`). Those tell you the rules; this tells you
how a flagship piece actually came together — what got tried, what
broke, what the failure modes felt like. Read after the others, not
instead of them.

## What it is

A 6:18 apocalyptic skyline at 152 BPM. Eight upright pillars (count
varies 6–12 by section) silhouetted against a smoking horizon, fire
bleeding through horizontal cracks in the towers, ember rain falling
through the foreground, and a heat-haze shimmer trembling the whole
composition. Cursor blows heat. Each of 15 keys strikes one pillar
and fires a radial beam. Bass widens pillars and sways the row, mid
widens the cracks, high sparkles their edges, downbeats flash the
horizon, section transitions announce themselves with a fissure
that pre-tensions 2.5 s before the bar boundary and snaps on the new
downbeat.

Final stack, bottom-up: `burning-sky / ember-spark / babylon /
fire-columns / falling-debris / key-rays / heat-shimmer`. Three
input channels (cursor, keyboard, audio), seven simultaneously
visible layers, 8 sections × 7 layers ≈ 56 distinct visual
configurations stamped out by per-section parameter arrays.

## The thesis

`meta.yaml` states it cleanly: *"What if Babylon's hollow towers
held a dying sun? Pillars are vertical bands of warm fire-rim and
column shadow. Through horizontal cracks, fire bleeds outward.
Behind/between the pillars, a pulsing fire-core acts as the eye-
anchor. The whole composition trembles in heat-haze."*

The thesis is **architecture + firestorm + tremor**, in that order.
The pillars are the figure. The fire is what they're hiding. The
shimmer is how unstable everything is. Each input channel ties
into all three: cursor heat blows into the nearest pillar
(architecture), keyboard strikes flash a pillar's flame and fire a
beam through the firestorm (firestorm), audio sways the row and
shimmers the haze (tremor). No input owns one dimension cleanly;
they coordinate.

## The DAG (final stack)

```
burning-sky          (smoking horizon, no shared state, no inputs)
    ↓ u_below
ember-spark          (warm hash-grid sparks with u_history trails)
    ↓ u_below
babylon              (the towers — reads u_below to composite over
    ↓ u_below         sky+embers; per-section count/lean/zoom; cracks
                      driven by mid; beat-snap pillar width;
                      bar-phase bright vertical sweep; downbeat
                      base flash; section-transition fissure)
fire-columns         (vertical flames climbing each pillar; reads
    ↓ u_below         u_history for trails; bass + key envelope
                      inflate height; cursor lateral push)
falling-debris       (hash-grid ember rain; reads u_history for
    ↓ u_below         streak trails; per-section density 0→1.20;
                      bar-phase wind drift; cursor lateral push)
key-rays             (15 radial beams from each key; reads u_below
    ↓ u_below         + u_history; held key sustains, press fires
                      an inward spear)
heat-shimmer         (curl-noise UV displacement of u_below; per-
                      section mass 0.10→0.85; bass wobble at 18 Hz,
                      high wobble at 60 Hz, cursor local turbulence)
```

The DAG isn't decorative. Order is load-bearing:

- `ember-spark` BEFORE `babylon` so the embers read as "behind the
  city" — pillars occlude them inside the tower body, leaving a
  band of glowing ash visible only between and behind columns.
- `key-rays` AFTER `babylon` so beams strike across everything,
  including the tower silhouettes — they're celestial, not
  internal.
- `heat-shimmer` LAST so the entire composition trembles uniformly.
  Putting it lower would shimmer only the layers beneath, leaving
  the post layers reading as a separate, unaffected plane.

`u_history` feedback chains: `fire-columns`, `falling-debris`,
`key-rays` all read `u_history` at 0.78–0.86 decay per frame. This
is what gives the falling debris its motion-blur streaks, the
flames their lick-residue, and the keyboard beams their lensing
trails. Crucially, these layers were paired with `glitch-rgb` in an
earlier version and produced a feedback loop that bleached the
whole frame to white static (the `feedback_layer_authoring_traps.md`
lesson came directly out of this). The current stack drops glitch-
rgb entirely — the pre-tension fissure on `babylon` reads `u_to_section_change`
inline, so section transitions still announce themselves without
needing a glitch layer.

## The iteration arc

Six commits. Each was a real pivot, not a polish.

### v1 — `765259734` add so-hollow-let-babylon-burn: 4-layer apocalyptic skyline

Initial stack: `burning-sky / ember-spark / babylon / key-rays`.
Per-section tower count, per-key strikes, cursor heat. Worked
mechanically, but: **"no focal anchor, monotone."** The pillars
were the only thing the eye could land on, and pillars don't move.
Sky drifted, embers drifted, but neither was loud enough to compete
for attention. The piece was technically multi-input but visually
one-trick.

### v2 — `98355fd` section-driven stage transformation + phase-lock receipts

Added per-section parameter arrays to `babylon` (count, lean
angle, fire intensity, height-spread, camera tilt, sway amplitude),
plus visible phase-lock: bar-phase bright vertical sweep across the
horizon, beat-phase pillar-width snap, downbeat base flash,
section-transition fissure with pre-tension reading
`u_to_section_change`. Failure mode being addressed: *"static /
weakly music-linked"*. Pieces that flicker brightness on bass
amplitude don't read as music-locked even though they technically
react. The bar-phase sweep ("ringR = 0.10 + (1 - u_downbeat) *
0.95" pattern) is what made the music *visible* — eye sees one
sweep per bar, can predict the next. This commit produced the
working draft of `feedback_visual_phase_lock.md`.

### v3 — `86a78b5` add fire-core + heat-shimmer for mesmerizing pull

Two new layers: `fire-core` (a pulsating warm portal behind the
pillars with Lissajous drift, cursor pull, downbeat expanding rings,
bar-phase radial rays, per-section intensity) and `heat-shimmer`
(top-of-stack curl-noise UV displacement reading u_below). Failure
mode: *"visually monotone (one trick: pillars)"*. The fire-core was
the focal anchor the eye needed; the shimmer turned the static
composition into a trembling one. This was the commit where the
piece started to feel mesmerizing — eye landed on the core,
wandered between pillars, surrendered to the shimmer.

### v4 — `cf29c2d` section-driven dynamic-range pass

Polish on per-section gating. Per-section wheel scale on fire-core
(`0.45` calm → `1.55` peak → `0` outro) with early-out at scale
< 0.05. Per-section well count on fire-eyes (`1` calm → `4` peak →
`0` outro). Late-ramp `smoothstep(0.70, 0.95, u_section_progress)`
on the gating so intimate sections didn't ramp into vortex
configurations mid-transition. Failure: section-readability probe
soft — the arc was there in numbers but not visibly extreme enough.

### v5 — `6802dea` per-section wheel/eyes gating breaks repetition

Pushed the per-section extremes harder. Wheel scale array
`[0.0, 0.42, 1.10, 0.35, 1.70, 1.05, 0.28, 0.0]` — section 0
(intro) and 7 (outro) have NO wheel at all; section 4 (peak 2)
runs the wheel at 1.7× its baseline. Wheel centre offset arrays
so the wheel never sits in the same spot twice across the song.
Vortex (lensing) sections are 2, 4, 5 only — sections 0, 1, 3, 6,
7 have lensing OFF entirely. Burning-sky palette extremes pushed:
peak 2 at 1.85× brightness multipliers (white-hot yellow), dip and
outro at 0.08–0.40× (deep night wine, near-black). Failure:
*"frames were too similar across sections"* — fixed by making
sections actually look like different stages of the same world,
not just brightness scalings of one stage.

### v6 — `d9e5774` drop wheel/lensing for vertical-flow vocabulary

The biggest pivot. Removed `fire-core` (the wheel) and `fire-eyes`
(the gravitational lensing wells) entirely — they were direct
ports of `stronger`'s `mirror-bloom` and `black-holes`, and a
review caught that so-hollow looked too much like stronger. The
piece was solving the same compositional problem with the same
mechanics; it didn't have its own visual identity.

Replacement: two new piece-local layers in **vertical-flow
vocabulary**.

- `fire-columns` — vertical flame columns climbing up at each
  pillar's x position (matching babylon's tower layout exactly so
  the flames climb the right pillars). FBM jitter on the edges +
  upward-streaming "tongue" noise so the flames actually lick.
  Per-section flame height (small base flames in calm sections,
  full apocalyptic columns at peak 2). Bass + key envelope inflate
  height; cursor blows flames sideways with lateral push
  proportional to pillar-cursor distance. Color hot at base
  (white-yellow), ember mid, deep red at top.
- `falling-debris` — hash-grid particles falling from top with
  varying speeds. Per-section density (0 in calm sections, 1.20 at
  apocalypse, fading in cooldown). Wind drift modulated by
  bar-phase. Cursor lateral push so debris isn't perfectly vertical.
  Streak trails via u_history so falling reads as motion-blurred
  ember rain. Color shifts hot to red as particle ages.

Stack became 7 layers: `burning-sky / ember-spark / babylon /
fire-columns / falling-debris / key-rays / heat-shimmer`. The
vocabulary shifted from radial-kaleidoscope (mesmerizing as a
mandala) to architectural-vertical (mesmerizing as a city under
siege). That's the piece.

## Section-state machine (8 sections, 7 layers, ≈56 configurations)

The sections aren't named; they're indexed 0..7 by `u_section_id`,
with `u_section_progress` ∈ [0, 1] giving fraction-into-current-
section. Energy curve: `[0.14, 0.31, 0.45, 0.26, 0.46, 0.35, 0.22,
0.21]` — quiet intro, build, peak 1, dip, PEAK 2 (longest, 182–286
s), cool, fade, outro.

The per-section parameter arrays are scattered across the layers
(this is the right granularity — each layer knows what its own
parameters mean for each section). Examples:

- `babylon`: count, lean, fire, chaos, sway, camY, zoom — 8-element
  arrays each
- `burning-sky`: 6 palette multipliers (topMul, midAMul, midBMul,
  horMul, groundMul, horYellow) — 8 elements each
- `fire-columns`: matches babylon's tower count (so flames climb
  the right pillars); per-section flame height
- `falling-debris`: density `[0.0, 0.05, 0.45, 0.0, 1.20, 0.85,
  0.20, 0.05]`
- `heat-shimmer`: mass `[0.10, 0.10, 0.50, 0.08, 0.85, 0.45, 0.10,
  0.05]`

Pre-tension is a separate move. `babylon` reads `u_to_section_change`
(seconds until the next section starts) and fires the fissure 2.5 s
before the boundary:

```glsl
float preFire  = 1.0 - smoothstep(0.0, 2.5, max(toChange, 0.0));
float postFire = 1.0 - smoothstep(0.0, 0.10, sp);
```

The post-fire is a 0.1-second snap on the new downbeat. Together
they form the section-transition fissure: a slow, building horizon
crack that flashes hard on the boundary. This is the
"music-composition pre-tension" probe (`taste.md`) made literal.

Late-ramp on the gating arrays uses `smoothstep(0.70, 0.95,
u_section_progress)` so intimate sections (0, 1, 3, 6, 7) hold
their character until the last 5–30% of their duration, then
pre-blend toward the next section's configuration. Without the
late-ramp, transitions felt smeared — section 0's quiet would
ramp into section 1's build at section 0's start, weakening the
intro entirely.

## Polyrhythmic clocks

Every layer reads at least 3 distinct time sources. None of them
are synchronised:

- **`u_time`** (wall-clock) — burning-sky smoke drift, babylon
  crack seam phase + pillar lean vnoise + top erosion, fire-columns
  fbm upward drift, heat-shimmer curl-noise base + 60 Hz high
  wobble + 18 Hz bass wobble.
- **`u_bar_phase`** (0..1 per bar) — babylon camera tilt + sway +
  bar shockwave sweep, fire-columns sway matching babylon,
  falling-debris wind drift modulation.
- **`u_beat_phase`** (0..1 within beat) — babylon pillar-width snap
  at `phase < 0.12`, beat-component sway, fire-columns matching
  babylon's snap.
- **`u_downbeat`** (impulse, decays per frame) — babylon camera
  kick + base flash, fire-core ring expansion (deleted), fire-eyes
  inflation (deleted).
- **`u_section_id`** — per-section parameter arrays in burning-sky,
  babylon, fire-columns, falling-debris, heat-shimmer.
- **`u_section_progress`** — pre-tension on babylon fissure,
  late-ramp gating on multiple layers.
- **`u_song_progress`** — babylon "journey" bell-curve zoom
  peaking ~0.55, burning-sky section palette mix, heat-shimmer
  energy multiplication.
- **`u_audio_*`** — bass widens pillars + sways + brightens fire,
  mid widens cracks, high sparkles edges, kick boosts beat sway,
  level scales ember spawn density.
- **`u_keys[15]` + `u_key_event[15]`** — per-pillar envelopes on
  babylon (each key strikes one pillar), keysSum on burning-sky
  (horizon glow boost from total keyboard activity),
  fire-columns key-driven height inflation, key-rays per-key beam
  state.

This is the polyrhythm-of-clocks probe (`taste.md` §"VJ lenses /
Layered coupling") at full strength. Audit ran on the final piece:
all 6 song-level uniforms consumed, 6/7 layers read u_mouse, 4/7
layers read u_keys, 7/7 read at least one audio uniform, all in one
piece.

## Lessons that came from this build

Five of the ten V-Jaygent feedback memories are tagged with a
session ID that traces back to the so-hollow build:

1. **`feedback_layer_authoring_traps.md`** — the explicit "born
   here" lesson. Two traps: (a) `fire = u_below × gain` is a bleach
   generator (any bright pixel underneath gets multiplied to clamped
   white); (b) `glitch-rgb` above `u_history` consumers becomes a
   feedback loop in headless playwright, where audio doesn't autoplay
   so `u_section_progress` stays near 0 and the glitch fires forever,
   feeding the bleached static into key-rays' `u_history` reads at
   0.86 decay per frame.

2. **`feedback_inspect_cursor_sentinel.md`** — caught while debugging
   so-hollow's centred cursor effects in inspect frames. The sentinel
   wasn't taking effect; what looked like a phantom bullseye in the
   centre of a frame was the cursor vortex working as designed,
   triggered by Playwright's stuck cursor. (Now fixed in
   `bin/inspect.mjs` — see commit `13d5c8d`.)

3. **`feedback_per_layer_interactivity.md`** — strengthened the
   multi-input-default rule: not "have multiple inputs" but "≥2 layers
   visibly react to cursor + keyboard each". The original rule passed
   pieces that pushed all input handling into one ripple-only layer.
   So-hollow does it the right way: babylon, fire-columns, key-rays
   all visibly react to the keyboard; babylon, fire-columns,
   falling-debris, heat-shimmer all visibly react to the cursor.

4. **`feedback_iterate_with_motion_probes.md`** — the time-series
   probe pattern (frames at t=[1.5, 3.5, 6, 12, 30] s, pixel-delta
   between consecutive). So-hollow's 33 inspect frames came from
   this: the early commits passed smoke but the iterate loop kept
   surfacing "still broken" / "still boring", and single-still
   probes missed it because the failures were temporal (frozen
   audio time, decoupled motion).

5. **`feedback_visual_phase_lock.md`** — the v2 commit's pivot
   captured here: amplitude-to-brightness coupling reads as "not
   music-locked" even when technically reactive. Bar/beat/downbeat
   must drive geometry. So-hollow does: bar-phase rotates the
   horizon sweep, beat-phase snaps pillar widths, downbeat fires
   the base flash, section transitions trigger the fissure.

The v6 pivot (drop wheel/lensing for vertical-flow vocabulary)
isn't in any saved feedback memory but probably should be — *"if
your piece's mechanics are direct ports of another piece, the
piece doesn't have its own identity"* is a rule worth saving. Open
question for the wrap-up loop.

## What I'd do differently

Honest critique against the audit + taste.md, given the final state:

1. **Spread the section-progress reads.** Five layers consume
   `u_section_id` but only one (`babylon`) consumes
   `u_to_section_change` for pre-tension. Heat-shimmer or
   fire-columns could pre-tension as well — the shimmer mass could
   compress 4 bars before peak 2 and snap-release on the downbeat,
   adding a second pre-tension axis.

2. **Audit the bleach checks.** `fire-columns` does color from
   palette correctly (per the lesson), but a quick grep for
   `* u_below` patterns in the four `u_below`-reading layers would
   confirm none of them re-introduced the original bleach trap.
   `bin/audit-piece.mjs`'s mechanical check doesn't catch this
   yet — it's exactly the kind of subtle compositional bug a
   future v2 of the audit could encode.

3. **Fewer commits, bigger pivots.** Six commits over three days,
   four of which were polish. The two real pivots (v3 adding
   fire-core/shimmer, v6 dropping them for vertical vocabulary)
   were where the piece gained identity. The polish commits in
   between matter for the rubric but not for the eye. A leaner
   iterate loop would identify the structural pivots faster.

4. **The deleted layers should leave.** `pieces/so-hollow-let-babylon-burn/layers/fire-core/`
   and `.../fire-eyes/` directories still exist, even though the
   final stack doesn't reference them. They're frozen sketches.
   Either delete them (git history holds the v3–v5 state) or move
   to `brainstorming/snippets/` if their mechanics deserve preservation
   as reusable phrases. Right now they're carrying-cost without
   benefit.

## What this piece is good for

If you're building the next 7-layer flagship, this is the working
example of: section-state machines as composition (not just
parameter arrays), polyrhythmic clocks across the stack, multi-
input coupling that doesn't degenerate into one-layer-handles-all,
pre-tension as a structural transition tool, and the value of a
hard pivot when a piece's mechanics aren't its own.

If you're learning the layer engine, read `using-lib.md` and
`layered-composition.md` first for the rules, then read this for
how the rules actually got applied — including which ones bent.

If you're stuck on iterate loop output that says "still boring"
even though the rubric scores look fine: read the v3 and v6 commit
bodies. The fix is almost always vocabulary, not parameters.
