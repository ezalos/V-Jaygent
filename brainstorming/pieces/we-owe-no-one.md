# we-owe-no-one — brainstorm

Track: **HIRAES — "We Owe No One"** (melodic death metal, 2022 album
*Solitary*). 4:34, 86 BPM half-time / ~172 double-time feel, F# major,
defiant anthem.

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: throb (percussion -> geometry) + brick (Worley material + cursor)
  -- Voronoi / Worley fracture-plate tessellation, percussion-driven
     geometric jolt of the cell centres.
eye_landing_candidates:
  - molten cell interiors (2-3 brightest plates migrate as the field warps)
  - white-hot seam network (the crack lattice ignites on downbeats)
  - ember showers (bursts on high-frequency transients)
  - the hammer crater (cursor sends a shockwave that re-fractures locally)
warm_cycle: [near-black, wine, ember, amber, white-hot]
  -- physically a blackbody curve: cold iron near-black/wine, molten
     metal ember->amber->white-hot. No cool intrusions.
idle_behaviour: "the forge breathes slowly (slow energy sine); Voronoi
  cell centres drift on a Lloyd-relaxation wander; seams glow faint and
  migrate; lone embers rise. ~8s visible refresh. Self-plays with
  synthetic drivers when u_audio_playing == 0."
architecture: E  # layer stack with multi-input coupling
arch_rationale: "4:34 audio track + 8-section state machine + cursor as
  the hammer + polyrhythmic clocks (plates on downbeat, embers on high,
  base on section, haze on level). The Voronoi jolt is closed-form per
  pixel (decaying per-cell hash displacement keyed to u_bar_phase /
  u_downbeat) so no persistent state is needed -- C unnecessary. Not A:
  multi-input + section machine + distinct layer roles. Not B: the cells
  are a continuous hashed tessellation, not <=200 discrete simulated
  agents. Not D: no sub-pixel particle aggregate."
```

## Thesis

The forge. Tempered iron under the hammer — struck on every downbeat,
the crack lattice flaring white-hot, but the plates hold their shape
and cool back to ember. Metal self-forged and unbroken: *we owe no
one*. Not literal illustration — it answers the song's structural
truth (relentless percussive drive + a melodic lead that wants to
hold its line) and the warm-only palette IS a blackbody curve, so the
forge metaphor and the VISION constraint are the same thing.

## Canonical-name check

**Voronoi tessellation** (Worley, 1996). Partition the plane into
cells, each the set of points nearer to one seed than any other.
F1 = distance to nearest seed; the cell *edge* is the locus where
F1 ties with F2 (the bisector with the second-nearest seed). The
F1/F2 edge-distance trick (IQ, *smoothvoronoi*) gives crisp seams
without a second derivative. Cracks in a fractured solid follow
Voronoi cell boundaries (stress-relief minimum-energy paths) — so
"fracture plates" is the canonical, not-reinterpreted reading.

No reduced PDE here, so the length-scale sub-rule doesn't apply: the
cell grid frequency *is* the length scale, set explicitly.

## Form candidates

1. **Voronoi fracture-plates** (chosen). Cell interiors carry a molten
   temperature; cell edges are white-hot seams. Downbeat strikes
   displace cell centres by a per-cell hash, decaying over the bar.
   Leans on inline hash22 (cell seeds) + an inline blackbody ramp.
2. Chladni nodal plate (cymatic sibling) — rejected: standing-wave
   lattice reads as orderly/serene, wrong for a defiant metal track,
   and has no natural "struck and holds" gesture.
3. Curl-noise ember storm (plume sibling) — rejected as the *lead*:
   smoke has no structure that can "hold unbroken", so it can't
   carry the thesis. Kept as a supporting layer (embers).

## What I don't want

- FFT bars / waveform — heart-monitor metal-cliché. No.
- Literal chains, fists, skulls. Respond to meter + dynamics.
- Seams that only exist at accent peaks — the cirrus v1 failure
  (lead invisible between hits). Plate interiors carry an always-on
  molten band; the seam flare brightens, never solely reveals.
- A flat 208-second body. The auto-segmenter collapsed the body to
  one blob; the hand-edited 8-section arc + per-downbeat jolt +
  song-progress temperature keep it moving across all three
  time-scales.

## Decision

Layer-stack (architecture E), 5 piece-local layers, bottom→top:

1. **forge-base** — near-black hearth with a deep ember coal-glow
   rising from bottom-centre; slow fbm in the coals so it is not a
   flat gradient. Breathes on u_energy_smooth; collapses dark in the
   breakdown section. No reads.
2. **fracture-plates** — THE LEAD. Voronoi tessellation. Reads
   `u_below` (heat-refraction: bends the cell sample coords along the
   hearth-glow gradient — geometric use) and `u_history` (struck
   seams cool through the warm cycle over the next bar). Cursor =
   the hammer.
3. **embers** — sparks that *rise* (forge sparks go up), bursts on
   `u_audio_high`, emitted denser over bright/hot plate zones. Reads
   `u_history` for trails. max blend.
4. **heat-haze** — fbm displacement of `u_below`, amount scaled by
   `u_audio_level` + `u_energy_smooth`. The forge shimmer.
5. **vignette-grain** — warm vignette + 1/f grain on `u_audio_high`,
   gentle bloom roll-off. Reads `u_below`.

Coupling DAG: fracture-plates reads u_below + u_history; embers reads
u_history; heat-haze reads u_below; vignette-grain reads u_below. The
hearth heat travels up the stack through u_below (base glow → plate
temperature → composite → haze strength). No formal publish/consume
— the `#include`-with-3+-layers compile bug (noted in ember-spark)
makes inlining + u_below coupling the safer path.

Audio bindings — all PASS shapes (geometry, never audio-on-brightness):
- `u_downbeat` / `u_bar_phase` → per-cell hammer-jolt displacement
  (moves every seam — geometric)
- `u_audio_bass` → Voronoi cell grid scale (plates contract on the kick)
- `u_audio_mid` (melodic lead) → domain-warp amount of the cell field
- `u_audio_high` → seam micro-jitter + ember burst rate
- `u_beat_phase` → lattice rotation step (one increment per beat —
  visible phase-lock)
- `u_song_progress` → master temperature + warm-cycle palette ramp
- `u_to_section_change` → pre-tension: lattice contracts + desaturates
  approaching the breakdown
- `u_section_id` → forge-base brightness floor (dark in breakdown)

Cursor (`u_mouse`): the hammer. Presence sends a radial shockwave that
re-fractures locally — extra seam ignition + cell displacement around
the cursor. Disjoint from audio (audio drives the global lattice;
cursor adds a local crater) → no additive arms-race.

## Arc (hand-edited 8 sections, energy-envelope derived)

| #  | t (s)       | section    | forge state                                  |
|----|-------------|------------|-----------------------------------------------|
| 1  | 0–0.7       | intro      | black, cold iron                              |
| 2  | 0.7–24      | intro      | first strike lights the coals; quiet build    |
| 3  | 24–48       | build      | band enters; lattice ignites, full blaze rises|
| 4  | 48–120      | chorus     | sustained blaze, hammer on every downbeat     |
| 5  | 120–198     | chorus     | blaze continues; warp deepens                 |
| 6  | 198–232     | build      | energy creeps to max; seams whitest           |
| 7  | 232–254.7   | breakdown  | forge GOES DARK — cools to wine/near-black,    |
|    |             |            | a single ember drifts. Silence as form.       |
| 8  | 254.7–274.5 | outro      | re-ignition, final blaze, fade to black       |

## Open questions

- Will the per-downbeat jolt read in stills, or only in motion? The
  jolt decays over the bar — inspect-music frames at downbeat-aligned
  times should catch a mid-flight lattice. Watch the
  stills-under-grade-motion trap.
- Does the 72s + 78s body chorus pair (sections 4–5) feel like two
  things or one? The 118–120s energy dip is the seam; warp depth and
  palette ramp must visibly differ across it.
- Is heat-refraction off u_below strong enough to read as coupling,
  or will it look like an independent stack?
