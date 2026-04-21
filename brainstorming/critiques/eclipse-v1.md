# eclipse — v1 critique

## The claim

Two colliding Julia sets inside ballistic bodies — one small and bright with warm ember palette, one large and black with shadow palette. Collision physics drives the encounter; bass slightly drifts the Julia parameter on kicks. Set to DJ Huntsman's "Neuroknobs 1," a slow heavy-hitting piece.

## Frame-by-frame

| Frame | t    | What's there |
|-------|------|------|
| 0 | 1.5s | Small bright Julia ball (warm amber, fractal interior) upper-centre; large black void (nearly black with faint ember traces) below-left. Deep wine-red field. Both disks crisp; rim structure visible. |
| 1 | 13.5s | Large black void drifted left; small warm ball now upper-right. Palette identical warm deep red. Black ball rim faint against darkness. |
| 2 | 25.5s | Positions swapped further — black now large left-centre, warm small upper-right. Warm rim + fractal structure read clearly. Black interior barely registers beyond silhouette. |
| 3 | 37.5s | Black ball centre-left dominating frame; warm shrunk lower-right. Both show collision-aftermath rim tints. Background field consistent. |

## Mesmerizing probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | pass | Eye lands on small bright ball in frame 0 (high contrast). Frames 1–3 gaze shifts between moving bodies; landing zone moves with physics. |
| Prediction | pass | Macro motion is ballistic — readable. But interior fractal banding is non-trivial; exact pixel texture unpredictable frame-to-frame. Almost-but-not-quite zone. |
| Squint | pass | On blur: clear two-body composition with black mass dominant by area, warm point-source lighting from small ball. Fine banding survives close inspection. |
| Hue drift | pass | Monochromatic warm throughout: deep burgundy/wine base with amber highlights. No hue jumps, no cold tones, no complementary clashes. |
| Mystery | fail | Frame 0 discloses both bodies' shapes, sizes, positions, relative motion. By frame 3 the collision is fully witnessed. Interior banding reads as noise (random-looking), not hidden structure. No depth flip, no edge that won't resolve. Piece is compositionally legible after one pass. |

**Mesmerizing passes: 4/5.**

## Interaction probes

Not applicable — piece is not cursor-reactive. `u_mouse` is declared but unused; meta.yaml confirms autonomy.

## Music reactivity probes

### Probe 1: Motion-over-luminance

**Bass terms:**
- Line 113: `cDrift += 0.05 * bass * vec2(cos(u_time * 0.7), sin(u_time * 0.9));` → **GEOMETRY** (Julia c-parameter displacement; removing bass stops the kick-shudder and leaves only the slow u_time drift).

**Mid terms:** ZERO. `mid` is computed at line 165 but never used anywhere in the shader body.

**High terms:** ZERO. `high` is computed at line 166 but never used.

**Level terms:**
- Line 173: `col = ember(0.25 + 0.35 * bg) * (0.28 + 0.55 * level);` → **Brightness** (background envelope).

**Verdict: shader-fail.** Bass has one geometric usage, but mid and high are **ghost uniforms** — computed and ignored. Level is brightness-only. The shader declares audio channels it doesn't route. For a piece that claims music reactivity beyond bass, this is a structural bug.

### Probe 2: Bass→movement

Bass appears in cDrift (geometric). But the amplitude is **0.05** — tiny compared to the slow u_time drift of 0.08. A kick produces delta-c ≤ 0.05 on top of a 0.08 baseline; the Julia interior shudders sub-perceptibly, not dramatically recomposes. Mechanism passes, amplitude is anemic.

**Verdict: shader-pass, but anemic.**

### Probe 3: Rhythm-in-stills

Captured 1.5–37.5s window (early track, sparse kicks). No frame shows a visibly recomposed Julia interior on a kick or a stretched one in silence. Mechanism exists but capture is too quiet.

**Verdict: weak.**

### Probe 4: Quiet-reads-quiet

At silence: background dims (0.28 envelope vs 0.83 at peak), bass-driven c-shudder vanishes. But balls continue moving (billiard physics independent of audio), and Julia iteration doesn't slow structurally. Partial honest — brightness drops but geometry continues.

**Verdict: pass (on grace).**

**Music passes: 2/4.** Below the 3/4 threshold. Bass is geometric but anemic; mid/high are ghost uniforms.

## Claim check

**Pass** — meta.yaml claims bass-shudder on Julia c; shader delivers. No explicit claim about mid/high in meta.yaml (piece was designed bass-primary). Technically claim check passes, but the ghost mid/high uniforms are a wasted design slot worth naming.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5/5 | Monolithic warm family: burgundy → wine → amber. No hue jumps. Contrast by luminance. |
| Composition | 3/5 | Two-body ballistic readable and drifts across frame. But composition is reactive to physics rather than composed; no macro rhythm or section arcs. Interior fractal doesn't participate. |
| Motion | 3/5 | Two clocks: slow u_time drift + collision shockwaves. Bass perturbation on c-drift is tiny (0.05). Piece oscillates between "drifting gently" and "slight kick shimmer" — both slow. |
| Intensity & dynamic range | 3/5 | Background responds to level (0.28–0.83 envelope), balls don't. Geometry doesn't de-energize on silence — billiards and Julia iteration continue. Luminance-only quiet dimming. |
| Depth | 4/5 | Orbit-trap banding renders fractal detail inside and outside Julia boundary at multiple scales. Interior is not flat; bands reward zooming. But field depth (layering/lensing/relief) is absent; balls sit at same z-plane on flat background. |
| Form & ending | n/a | Not testable from early-track stills. |

## What's working

1. Palette flawless — deep burgundy base, warm amber highlights, zero hue violations.
2. Fractal interiors genuinely detailed via orbit-trap banding (lines 76–92).
3. Two-body physics reads clearly — mass/radius differentiation visible.
4. Rim and collision tints work cleanly; collision rings don't muddy the silhouette.
5. Background fbm grounds the balls in atmosphere, not void.

## What's imperfect

1. **Music passes 2/4 — binding failure per priority order.** Ghost uniforms (mid, high computed-but-unused), bass amplitude anemic at 0.05, level brightness-only.
2. Mesmerizing fails on Mystery (frame-visible): piece discloses in one look; interior banding reads as random, not hidden structure.
3. Bass geometry subtle relative to its potential: 0.05 amplitude on cDrift vs the 0.08 slow drift means kicks are sub-perceptual.
4. Composition is physics-driven not composed — simulation rather than VJ work. No section state machine, no beat-driven geometry.
5. Motion is single-clock dominant — all time-varying terms tied to u_time with different scalars; no emergent polyrhythm.

## Verdict

**needs-tweak.** Per priority order (claim→mesmerizing→interaction→music→scores): claim passes, mesmerizing passes 4/5 (threshold met), interaction n/a, **music 2/4 is the #1 failure**. Top_fix must address music reactivity, not Mystery. The piece has a mechanism (bass → cDrift) — it just needs more bass coupling points and amplitude, and real routing for mid/high.

---

```yaml
piece: eclipse
iteration: 1
verdict: needs-tweak
claim_check: pass
mesmerizing_passes: 4
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: fail
interaction_passes: n/a
music_passes: 2
music_probes:
  motion_over_luminance: shader-fail
  bass_movement: shader-pass
  rhythm_in_stills: weak
  quiet_reads_quiet: pass
scores:
  palette_cohesion: 5
  composition: 3
  motion: 3
  intensity: 3
  depth: 4
  form_ending: n/a
top_fix:
  dimension: music_reactivity
  what: |
    Three-part music fix:
    (1) Boost bass amplitude on cDrift: line 113 `cDrift += 0.05 * bass * vec2(...)`
        becomes `cDrift += 0.18 * bass * vec2(...)` so kicks visibly recompose the
        Julia interior rather than shudder sub-perceptibly.
    (2) Route mid to geometry: in fractalBall (around line 113), add a bass-free
        mid-driven c-warp. E.g. `cDrift += 0.08 * mid * vec2(sin(u_time*0.43),
        cos(u_time*0.31));` so mid-range energy slowly deforms Julia parameter
        on a different clock than bass.
    (3) Route high to geometry: high drives a ring-thickness or radial modulation
        on the ball. E.g. after line 170 add `float highRipple = 0.015 * high *
        sin(u_time * 11.0);` and add it to the ball radius used in `ballMask`
        so high-frequency energy shivers the ball edges.
  why: |
    Current state: only bass is geometric, and anemic. Mid and high are ghost
    uniforms — computed at lines 165–166 and never referenced. Per taste.md
    music probe definition and priority order, music_passes = 2/4 is the binding
    failure for this piece. Mystery fix can wait; bass-movement amplitude +
    real mid/high routing is the priority.
  caution: |
    Keep cDrift amplitude bounded — the Julia landscape is smooth for small
    c-delta but can become visually noisy past ~0.3 delta. 0.18 + 0.08 = 0.26
    max when both bass and mid peak, which is still within stable range.
    For the high ripple, keep amplitude ≤ 0.02 so ball silhouettes stay crisp.
```
