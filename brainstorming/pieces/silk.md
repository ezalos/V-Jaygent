# silk — Clifford filament with chaos-game lace overlay

## One-line concept

A continuously-drifting Clifford attractor (the filament) braided with a
section-snapped chaos-game polygonal lace (the structure), accumulated
into `u_history` as a density plot — fractal-flame aesthetic, music
modulates the attractor parameters, sections snap the polygon order.

## Why this piece

`brainstorming/techniques/strange-attractors.md` and the new
`brainstorming/techniques/chaos-game.md` are sister generators. Each one
alone has a known failure mode:

- **Clifford alone** is impressionistic — always alive, but the structure
  has no legible *vocabulary change* across sections (cf.
  `feedback_section_vocabulary_not_params`).
- **Chaos-game alone** is structurally legible at any single n / k but the
  body is *static between snaps* — would need slow drift to survive idle
  (cf. `feedback_animate_the_landscape`).

The two together cover both timescales. Clifford carries the continuous
liveness, chaos-game carries the section identity.

## Brief gates (vjay-new-piece §1b)

canonical_ref: |
  Two canonical references, layered.
  
  (1) Clifford attractor (Pickover, 1990): a 2D map
      x' = sin(a·y) + c·cos(a·x)
      y' = sin(b·x) + d·cos(b·y)
  with parameters (a,b,c,d). codingclubuc3m's R/Rcpp walkthrough
  (https://codingclubuc3m.rbind.io/post/2019-10-15/) uses 10M iterations
  with shape=46 alpha=0.01 ggplot2 dots over a transparent / black
  background. Canonical seed sets we verified beautiful via
  `bin/explore-attractor.mjs gallery clifford`:
    - web:  (−1.25, −1.25, −1.82, −1.91)
    - lace: (−1.20, −1.90,  1.80, −1.60)
    - fold: (−1.70,  1.80, −1.90, −0.40)
    - curl: ( 1.70,  1.70,  0.60,  1.20)
  
  (2) Chaos-game polygon (Barnsley / Sierpiński / Fronkonstin 2019,
      https://github.com/aschinchon/the-chaos-game): repeatedly jump
  halfway from current point to a randomly chosen polygon vertex, with
  a restriction rule on consecutive vertex picks. The aschinchon repo
  publishes three restrictions:
    - k=1: v ≠ v_prev
    - k=2: if last two vertices equal, reject neighbors of v_prev
    - k=3: same neighbor rule, triggered when last three equal
  With (n=5, k=2) the result is the pentagonal lace seen in our
  smoke render — five-fold symmetry, central pentagonal void,
  recursive lobes. Canonical seeds: (n=3, k=0) Sierpiński; (n=4, k=1)
  square carpet; (n=5..7, k=2) flower-fractals.
  
  Closest siblings in canonical-pieces.md: `shoal` (basin-of-attraction
  / static landscape needing parameter drift) and the unbuilt
  attractor pieces hinted at in `strange-attractors.md`. silk is the
  first piece to use the **u_history scatter** path described there.

eye_landing_candidates:
  - Clifford filament centroid (the densest knot of the attractor —
    typically one or two bright lobes; landing zone wanders as
    (a,b,c,d) drift)
  - chaos-game polygon vertices (n bright spotlight points around the
    rim — these *snap to new positions* at section boundaries which
    is itself the eye-landing event)
  - the chaos-game central void (pentagonal/hexagonal "hole" in the
    overlay reads as architectural negative space — the eye keeps
    returning to it)
  - cursor pull (when active — a temporary 7th vertex / a Clifford
    seed displacement creates a localised swelling)

warm_cycle: [near-black, wine, rust, amber, cream]
  # near-black BG (the bare canvas of fractal-flame rendering).
  # wine for the lowest-density orbit pixels (the haze around the
  # filament). rust→amber for the mid-density body of the
  # Clifford lace. cream for the chaos-game vertex spotlights and
  # the densest Clifford knot. Inverse to most warm pieces: bright
  # *foreground* on dark *background*, not bright-on-glow. This is
  # the "cream-on-near-black" mandate from
  # `feedback_warm_on_warm_collapse` — the fractal-flame aesthetic
  # demands max contrast or the filigree dissolves into mud.

idle_behaviour: |
  At u_mouse=(0,0) the Clifford parameters drift on two coprime
  clocks (0.041 Hz on (a,b), 0.067 Hz on (c,d)) so the filament
  morphs visibly even without audio. The chaos-game overlay
  *also* rotates its polygon at 0.013 Hz (one full rotation per
  ~77s) so vertex spotlights wander around the rim. u_history
  decay constant 0.96/frame means old paths fade in ~1.5s, so the
  piece reads "drawn" not "scribbled-on-forever". The idle test
  is: park cursor, walk away for 60s, come back — the filament
  has visibly recomposed, the polygon has rotated, no element is
  frozen.

## Layer architecture

```
layers:
  - clifford     # scatter pass writing into u_history
  - chaos_game   # second scatter pass writing into the same u_history
  - tone_map     # log-density tone-map → warm cycle → final composite
  - bloom        # mild gaussian for the bright vertices (cream)
```

### layer 1 — clifford

Per-fragment: seed = hash(uv, frame_index). Iterate 48 steps of the
Clifford map. If final point ∈ this fragment's ±0.5px UV neighbourhood,
write `weight_clifford * (1 - keyboard_spike)` to u_history. Clifford
seeds are normalised to [-1,1]² then mapped to canvas with aspect-fit.

Parameter modulation (decoupled from chaos-game):
- a ← lerp(web.a, lace.a, u_audio_bass_stem)
- b ← lerp(web.b, lace.b, u_audio_mid)
- c ← lerp(web.c, fold.c, u_audio_treble)
- d ← lerp(web.d, curl.d, u_audio_other_stem)

Slow drift (idle): each param gets a sin(u_time * f_i) * 0.15 wobble on
top so silent passages still morph.

### layer 2 — chaos_game

Same scatter trick. Per fragment: 64 chaos-game iterations starting from
hash(uv, frame). Polygon: n vertices on a circle radius 0.85, rotated by
`polygon_rotation_phase` (slow idle rotation + section-boundary snap).
Restriction depth k snaps with n at section boundaries.

Section snap table (driven by u_audio_section_index):
| section | n | k |
|---|---|---|
| intro    | 3 | 0  | (Sierpiński — minimal intro vocabulary) |
| verse    | 5 | 2  | (pentagonal lace) |
| pre-peak | 6 | 2  | (hexagonal flower — six lobes, voids) |
| peak     | 7 | 2  | (seven-fold maximum complexity) |
| quiet    | 5 | 2  | (return to pentagon — recapitulation) |
| outro    | 3 | 0  | (Sierpiński again — closes the arc) |

Section transitions: 600ms tween of an "old_n" / "new_n" blend in the
scatter pass — each fragment picks old-polygon-or-new-polygon at the
ratio, so the polygon **morphs through fragmentation** rather than
hard-cutting. This is the visible phase-lock from
`feedback_visual_phase_lock` — the section boundary is unmissable.

### layer 3 — tone_map

Sample u_history. Apply log(1+x) / log(1+max) tone-map then gamma 0.45.
Map to warm cycle (near-black→wine→rust→amber→cream) by `t`. Standard
warmCycle from snippets.

### layer 4 — bloom

3-tap gaussian on the cream end of the spectrum (`t > 0.8` mask). Cheap,
makes the vertex spotlights and densest Clifford knot pop.

## Multi-input coupling (per-layer interactivity audit —
   `feedback_per_layer_interactivity`)

| layer | cursor reaction | keyboard reaction | audio reaction |
|---|---|---|---|
| clifford | seed origin offset by (u_mouse * 0.4) — filament shifts on hover | key-pressed-this-frame momentarily boosts iteration count from 48 → 64 (filament thickens on each note) | (a,b,c,d) modulated by stems as above |
| chaos_game | cursor adds a *7th vertex* at click position with weight ramp 0–1 over 800ms (only on active click+drag — per `reference_multi_touch_contract`) | each key spotlights one polygon vertex (key index mod n → highlighted vertex gets ×3 weight for 200ms) — visible as a flash on the rim | n / k snap at section boundaries; per-beat weight spike rotates the spotlight at sub-beat rate |
| tone_map | none (composition layer — input handled below) | none | u_audio_energy controls gamma (0.5 quiet → 0.4 loud — image opens up on energy) |
| bloom | none | none | u_audio_energy → bloom strength (0.0 quiet → 0.4 peak) |

This satisfies the "2–4 layers must each visibly react to cursor +
keyboard" rule from `feedback_per_layer_interactivity` — the two
*active* layers (clifford + chaos_game) both react to all three input
classes.

## Audio probes (per-frame + song-level taste targets)

- per-beat: chaos-game spotlight rotation snaps on downbeat (visible);
  clifford iteration-count pulse on every beat (subtle thickening)
- per-bar: vertex 4-tap rotation pattern around the polygon perimeter
- section: n / k snap + 600ms tween (unmissable)
- energy: gamma + bloom strength + Clifford iteration count

## Music slot (Louis to source)

The piece **demands a track with legible section structure** — clear
intro/verse/pre-peak/peak/quiet/outro boundaries that the section-index
analyser will pick up. Candidates that fit:

- **Ambient / IDM with build-and-release**: Bonobo, Tycho, Jon Hopkins
  ("Singularity", "Open Eye Signal"). Slow drift suits the Clifford
  morph; clear builds suit the polygon-snap.
- **Melodic techno**: Ben Böhmer, Nora En Pure, RÜFÜS DU SOL. Strong
  drops give the n=7 peak section real impact.
- **Post-rock**: Explosions in the Sky, Mogwai. Long crescendos =
  beautiful Clifford parameter drifts.

Louis to drop a URL via `/vjay-from-url <url> silk` once chosen. The
section index is then automatic.

## Build sequence (gates we want to pass before shipping)

1. Build the **clifford layer alone** with hand-tuned params → confirm
   filament looks like the gallery render at realtime res.
2. Add the **chaos-game overlay** with manual n / k from console → confirm
   the lace reads on top of the filament without burying it.
3. Wire the **u_history decay** and confirm idle morph passes the
   60-second walk-away test.
4. Add the warm tone-map + bloom.
5. Drop in audio via `/vjay-from-url`, wire section index → polygon snap.
6. /vjay-iterate until 5/5 mesmerizing + claim-check passes.

## Risks (pre-mortem)

- **Scatter pass coverage too sparse**. Need to verify u_history fills
  fast enough at 60fps. Fallback: increase iteration count per fragment
  (48 → 96) at cost of GPU; if still sparse, switch to **two scatter
  passes** per layer per frame (interleaved seeds).
- **Two attractors compete for visual attention**. Mitigate by colouring
  them differently inside the warm cycle — Clifford uses wine→amber
  (the haze), chaos-game uses amber→cream (the rim). The contrast is
  density-based not hue-based.
- **The chaos-game lace might bury the Clifford filament**. Counter via
  the `feedback_lead_layer_always_on_band` rule: chaos-game is the
  *structural* layer (always-on at low density), Clifford is the *lead*
  with a brightness ceiling — `lead = max(silhouette*0.30, accent)` not
  `silhouette*accent`.

## See also

- `brainstorming/techniques/chaos-game.md` (new — primary algorithm)
- `brainstorming/techniques/strange-attractors.md` (updated — Clifford
  + 2D-Map + u_history scatter section)
- `bin/explore-attractor.mjs` (parameter exploration tool — use to
  pre-vet (a,b,c,d) and (n,k) candidates before piece commitment)
