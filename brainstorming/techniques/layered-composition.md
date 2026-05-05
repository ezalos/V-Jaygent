# Layered composition — coupling, not stacking

Research note. V-Jaygent has been monolithic — every piece a single
fragment shader, the composition emerging *inside* one function. The
new layer-stack architecture (each layer its own `.frag`, its own
framebuffer, composited bottom-to-top, with `u_below` for read-only
distort, named `publish` / `consume` channels for shared state, and
`u_history` for trails) lets layers actually *interact*. This note is
the reference for how the critic probes that interaction and how
future pieces choose what to put on which layer.

The failure to react against: layers as decoration. Three warm fbm
fields stacked on `add` is not a layered piece — it's a single muddy
field with extra cost. Layered composition is the *non-alignment* of
layers in space, time, and reading-rate, plus enough coupling that you
can't predict the next two seconds. Coupling is what separates a stack
from a system.

## Why now

Trigger: the layer-engine spec accepted 2026-05-05, alongside the
audio-pipeline upgrade (BPM / sections / per-stem). Decisions this
note must answer:

1. What makes 2-4 layers interact (mesmerizing) vs simply stack
   (decorative)?
2. Which inter-layer coupling mechanisms produce the strongest
   "I can't predict the next two seconds" effect?
3. Which blend modes work for 3-4 simultaneous warm-palette layers
   without going muddy?
4. What per-layer time-bases avoid the "everything pulses on the same
   beat" failure?
5. Anti-patterns specific to layered work, beyond the monolithic-
   shader anti-patterns we already track.
6. Pass/fail probes the critic agent can run on a layer-stack piece.

## Artists / works worth stealing from

- **Robert Hodgin / Flight404 — *Magnetosphere* (2007).** Particles
  assigned charges; FFT bands push the charges; positive/negative
  species attract and repel. The visible image is a *consequence of
  a coupled physics field*, not a render of one. Steal: shared force
  field as the coupling between two layers (a "field" layer publishes
  `vec2 force`, a "particles" layer consumes it). The strongest
  single pattern for warm-palette ambient pieces.
  <https://roberthodgin.com/project/magnetosphere>
- **Memo Akten & Quayola — *Forms* (2012).** Athlete motion-capture
  drives layered geometric reverberations through space and time.
  The on-site installation explicitly let visitors "explore the
  individual layers that comprise each segment" — meaning the piece
  was authored as separable, meaningfully-ordered layers. Steal: each
  layer must survive being soloed; if a layer alone is meaningless,
  it's filler.
  <https://www.memo.tv/works/forms/>
- **Quayola — *Iconographies* and *Captives*.** Quayola explicitly
  uses "strata" — geological layering — as the metaphor: differently-
  coloured strata that interact through erosion across time. Steal:
  layers shouldn't be at the same scale of detail; treat them as
  strata of different *grain* (macro mass / mid waves / fine grit),
  so the eye can resolve them separately.
  <https://quayola.com/iconographies-20/> ·
  <https://quayola.com/captives-1/>
- **Joshue Ott — *superDraw*.** Hand-drawn forms manipulated live as
  a musical instrument; layers are voices, not slides. Steal: think
  of each layer as an *instrument in an ensemble* — what is its
  register? Bass / mid / lead / decoration? A piece without a bass
  layer reads thin; without a lead, undirected.
  <https://superdraw.intervalstudios.com/>
- **MFO / Marcel Weber.** Builds compositions by layering analogue
  projection (celluloid, mirrors, lenses) over digital generative
  content — *deliberate medium contrast per layer*. Steal: even
  within all-procedural content, force per-layer technique contrast
  (one SDF layer + one fluid layer + one tile layer reads better
  than three fbm layers, even if all are warm).
  <https://mfoptik.de/>
- **Refik Anadol — *Machine Hallucinations*.** AI "data sculptures"
  where high-dimensional latent walks form the slow base layer, and
  short bursts of ML-generated detail sit on top. Steal: the slow
  layer has 1000× the duration of the fast layer; their tempo ratio
  is the piece.
  <https://refikanadol.com/works/machine-hallucination/>
- **Universal Everything (Matt Pyke).** Studio practice of starting
  every piece on coloured pencil on black paper, then growing rule-
  based digital lifeforms from those storyboards. Steal: every layer
  should have a one-sentence verbal identity ("the wind", "the
  embers", "the wound"). If you can't name a layer in three words,
  it doesn't have a job.
  <https://www.universaleverything.com/processes/generative>
- **Casey Reas — *Process* series.** Each *Process* declares Elements
  + Behaviours (B1 move straight, B3 change direction on touch, B4
  move away on overlap). Composition emerges from *interaction rules
  between elements*, not from authored frames. Steal: write the
  layer-coupling rules first ("layer C bends where layer B's SDF is
  positive"), pick the content second. The rules are the piece.
  <https://reas.com/process>
- **Joshua Davis — generative practice.** Long career of combinatorial
  generative work where the same building blocks recombine under rule
  sets. Steal: a small library of layer types (fbm-ground, ring-
  emitter, kaleido-mid, trail-feedback) is more useful than five
  bespoke shaders; deck-style pieces want a *vocabulary*, not
  one-offs.
  <https://joshuadavis.com/Generative-Generate>
- **Notch (real-time graphics tool) practitioners.** "Full compositing
  engine, ready for traditional comping techniques as well as more
  radical processing techniques like you'd find in a VJ set." Notch's
  idiom is a node graph where every render is a stack of typed
  buffers explicitly composed — a working model for our `meta.yaml`
  layer manifest. Steal: blend mode and z-order are *first-class*
  parameters, declared, not computed inside the shader.
  <https://www.notch.one/>
- **TouchDesigner feedback-loop idiom.** Standard practice: feed the
  previous frame back through a Composite TOP with opacity 0.89-0.95
  so trails fade exponentially over ~10-20 frames; ensure the
  feedback layer sits at top of the composite with `Over`. Steal:
  this is exactly the `u_history` pattern, with empirical numbers.
  Trail-fade outside `[0.85, 0.97]` is almost always wrong (too short
  = strobe; too long = mush).
  <https://interactiveimmersive.io/blog/touchdesigner-lessons/understanding-feedback-loops-in-touchdesigner/>
- **flockaroo — Shadertoy multipass fluid.** The reference for buffer-
  feedback fluid in the demoscene/Shadertoy idiom: state in `Buffer
  A`, semi-Lagrangian advection of `Buffer A` against itself,
  displayed in `Image`. Steal: when a layer needs persistence, the
  right model is *state texture + advection*, not an exotic blend
  mode on a stateless layer.
  <https://www.shadertoy.com/user/flockaroo>
- **Iñigo Quílez — depth-aware compositing of raymarched and
  rasterised content.** Output a converted depth value from the SDF
  pass so the rasteriser's z-buffer composites it correctly. Steal:
  layers can publish more than RGBA — a depth/SDF channel published
  by an upstream layer lets a downstream layer make *spatial*
  decisions, not just colour decisions. (verify URL — IQ has notes
  on this in articles + tweets, no single canonical page.)
  <https://iquilezles.org/articles/>
- **Brian Eno — *Generative Music 1* / Koan (1996).** 150 parameters
  per piece, system improvises within them, no two playbacks
  identical. Compositional thinking-tool: per-layer rate ranges, not
  fixed rates; per-layer probabilities, not fixed events. Steal:
  every layer parameter that *could* be a single number should be a
  range with a slow LFO walking through it.
  <https://intermorphic.com/archive/sseyo/koan/generativemusic1/>
- **John Knoll (ILM, co-author of Photoshop).** The Photoshop layer
  model — `Normal/Multiply/Screen/Overlay/Add` blends as named,
  declarative compositing operators — *is* the architecture we're
  adopting. The lesson from 35 years of compositors using it:
  **`Normal` over a mask is the workhorse**; `Add` and `Screen` are
  accents; `Multiply` is for darkening only; `Overlay` is suspect
  because it's two modes glued at 50% grey and unstable on warm-only
  palettes.
  <https://helpx.adobe.com/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html>

## Core principles

1. **Coupling, not stacking.** A layer earns its place if it changes
   what a layer beneath looks like (`u_below` distort) *or* what a
   layer above does (`publish` shared state). A layer that is
   independent of every other layer is a separate piece sharing a
   frame buffer. Reads-from-below or publishes-to-above: pick one
   minimum per layer. The bottom layer is exempt; the top layer often
   is too if it's pure decoration (grain, vignette).

2. **Strata of grain, not strata of brightness.** Quayola's lesson:
   differentiate layers by *spatial frequency*, not by colour or
   brightness. Layer 1: low-frequency mass (wavelength > 1/4 screen).
   Layer 2: mid (wavelength ~ 1/16 screen). Layer 3: high-frequency
   grit (per-pixel grain, fine sparks). The eye reads the strata
   because they live at separable scales. Two layers at the same
   spatial frequency are the same layer pretending to be two.

3. **One bass, one lead, the rest are fill.** Borrow the band model.
   Bass = slow, large-area, stable (the "ground"). Lead = the fast
   figure that draws the eye (the "fire" / "lightning" / "ribbon").
   Fill = texture, atmosphere, history (trails, grain, glow). 4
   layers = 1 bass + 1 lead + 2 fill. 6 layers = 1 bass + 1 lead + 4
   fill, but at this point you're probably wasting compute. There is
   rarely a case for 2 leads — they fight (anti-pattern 4).

4. **Polyrhythmic clocks, distinct audio drivers.** No two layers
   should respond to the same audio uniform unless one is an octave-
   displaced echo of the other. Bass → ground motion. Mid → mid-
   layer warp. Highs/transients → lead bursts. Section progress
   (`u_section_progress`) → palette/structure shifts that *only happen
   at boundaries*. Extends `polyrhythmic-motion.md`'s coprime-rates
   rule from rotation to *audio-binding selection*.

5. **Order must be load-bearing.** Swapping z-order should *visibly
   break* the piece. If layer 1 ↔ layer 3 swap produces a roughly-
   equivalent frame, you have an unsorted bag of effects, not a
   composition. Test: every coupling edge (layer i reads layer j via
   `u_below` or `consume`) must require i > j in declaration order.
   The DAG is the piece.

6. **Eye-distribution: 2-4 dominance regions.** In any given frame,
   the eye should have 2 to 4 regions where a *different layer*
   dominates. 1 region = one layer ate the rest (monolithic). 8+
   regions = nothing dominates anywhere (chaotic). Fluid distribution
   between these states across time is the piece breathing — not bug,
   *feature*.

7. **Quiet must compose too.** Mentally zero out the loudest layer
   (typically the lead) for 10 seconds. The remaining layers must
   still pass `taste.md`'s eye-landing and prediction probes. If
   muting the lead leaves a flat substrate, the piece is monolithic-
   with-a-flash, not layered.

8. **Couple sparsely.** Every layer reading every other layer is no
   readability at all (Reas's *Process* doesn't have N² rules — it
   has 2-3 typed behaviours per element). Aim for ~1.5 coupling edges
   per layer on average. A 4-layer piece with 6 coupling edges is
   over-coupled; 4-6 edges total is the sweet spot.

## Coupling patterns

### Refraction — read `u_below` at displaced UVs

The simplest non-trivial coupling. The current layer computes a
normal/gradient field, samples the composited buffer at offset
coordinates:

```glsl
vec2 grad = vec2(dFdx(h), dFdy(h));         // h is local height/density
vec2 uvR  = vUv - grad * iorStrength;       // refraction
vec3 below = texture(u_below, uvR).rgb;
fragColor.rgb = mix(below, ownColor, ownAlpha);
```

Strong coupling: the layer beneath *moves* under the layer above, not
just dims. `iorStrength` ~ 0.01-0.04 of screen for water-like, 0.1+
for "molten glass". Above 0.2, illegible.

### Chromatic dispersion — per-channel offset

Cheap way to make refraction feel like a prism without leaving warm
palette globally (the warm palette is a *post* concern; channels can
disagree mid-pipeline as long as the final luminance stays in
palette):

```glsl
vec2 dir = normalize(grad + 1e-4);
float r = texture(u_below, vUv - grad * (k + 0.6)).r;
float g = texture(u_below, vUv - grad *  k        ).g;
float b = texture(u_below, vUv - grad * (k - 0.4)).b;
vec3 below = vec3(r, g, b);
```

Use sparingly — the "spectrum exception" rules in V-Jaygent's palette
only allow this on prism/kaleido pieces. On a warm-only piece,
dispersion is a tell.

### Advection — velocity field displaces sample of the layer beneath

A `velocity` layer publishes a `vec2` field (curl noise from
`fluid-dynamics.md`, or the gradient of an SDF, or a force-field
driven by audio). A downstream layer advects `u_below`:

```glsl
// upstream "field" layer publishes:
//   layout(location = 0) out vec4 oField;
//   oField = vec4(curlVel(p, t), 0.0, 1.0);
//
// downstream "ink" layer consumes:
vec2 v = texture(u_field, vUv).xy;
vec2 q = vUv - v * dt;                     // semi-Lagrangian backstep
vec3 below = texture(u_below, q).rgb;
```

This is the strongest "I can't predict the next 2 seconds" coupling
V-Jaygent has. The viewer sees pixels of the layer beneath being
*carried* somewhere by an invisible flow.

### Force-field shared state — `publish` a `vec2`, `consume` in particles

The Magnetosphere pattern. A "gravity" layer renders a smooth radial
force from a moving attractor; a "particles" layer integrates that
force:

```glsl
// "gravity" layer (publishes u_force):
vec2 d = uvCentred - mouseCentred;
oForce = vec4(-d / (length(d) + 0.05), 0.0, 1.0);

// "particles" layer (consumes u_force, plus its own ping-pong state):
vec2 vel = texture(u_state, vUv).zw;
vec2 f   = texture(u_force, vUv).xy;
vel += f * dt - vel * 0.02;                // Euler + drag
```

Two layers, real physics coupling, neither layer can be removed
without the piece collapsing. The structural test of layer-stack
architecture working at all.

### Mask-driven reveal — top alpha gates generative below

A geometric layer (SDF letters, ring, lissajous) outputs only alpha;
the layer beneath becomes *visible only inside that shape*:

```glsl
// top "mask" layer:
oColor = vec4(0.0, 0.0, 0.0, smoothstep(0.0, 0.005, sdRing(p)));
// composer:
fragColor.rgb = mix(below.rgb, here.rgb, here.a);  // Normal blend
```

The mask layer's audio binding should be on its *shape* (radius,
segments), not its alpha — otherwise it's a decoration on top of
monolithic content.

### Feedback / trails via `u_history`

Last frame's composited output is a uniform sampler. The classic
trail:

```glsl
vec3 hist = texture(u_history, vUv - displacement).rgb * 0.92;
vec3 cur  = computeCurrent(vUv);
fragColor.rgb = max(cur, hist);             // Max-blend feedback
```

The 0.92 falloff is the half-life: log(0.5)/log(0.92) ≈ 8.3 frames at
60 fps = ~140 ms. TouchDesigner's empirical 0.89-0.95 range agrees.
Couple `displacement` to a velocity field and you have streamlines
without a real fluid solve.

### Boolean SDF intersection — A visible only where B's SDF is positive

Cleanest "spatial coupling" with hard edges. Layer B publishes its SDF
(signed distance) to a single channel; layer A consumes:

```glsl
float sdfB = texture(u_sdf_B, vUv).r;
float gate = smoothstep(0.0, 0.003, sdfB);  // soft inside-test
fragColor.rgb = ownColor * gate;
fragColor.a   = ownAlpha * gate;
```

Same trick with subtraction (`-sdfB` for "outside B"), or
`max(sdfA, -sdfB)` for "A minus B". The SDF channel doubles as a
refraction normal source via gradient — one publish, two consumers.

## Blend modes for layered warm palettes

V-Jaygent's palette rules out hue-contrast separation; the only
contrast is luminance. Adobe defines the canonical math
(<https://helpx.adobe.com/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html>);
the question here is *behaviour on three warm layers*. Recipes belong
in `lib/blend.glsl`.

```glsl
// lib/blend.glsl
vec3 blend_normal  (vec3 b, vec3 a, float alpha) { return mix(b, a, alpha); }
vec3 blend_add     (vec3 b, vec3 a, float alpha) { return b + a * alpha; }
vec3 blend_screen  (vec3 b, vec3 a, float alpha) { return b + (1.0 - b) * a * alpha; }
vec3 blend_multiply(vec3 b, vec3 a, float alpha) { return mix(b, b * a, alpha); }
vec3 blend_max     (vec3 b, vec3 a, float alpha) { return mix(b, max(b, a), alpha); }
vec3 blend_replace (vec3 b, vec3 a, float alpha) { return mix(b, a, alpha); }  // alias of normal
```

- **`normal` (over).** The workhorse. With a non-trivial alpha mask
  it's the *only* mode that respects partial coverage cleanly.
  Luminance contrast survives because `b` is preserved outside the
  mask. Default for any layer that has a real mask.
- **`add`.** Saturates white fast; on three warm layers (gold + amber
  + wine), the sum is cream — palette failure. Safe rule: only for
  *one* lead layer at a time, and clamp alpha so the maximum sum
  across all layers ≤ 1.4. Above 1.4 luminance starts grey-clipping.
- **`screen`.** `1 - (1-a)(1-b)`. Mathematically it's an "inverse
  multiply". Tonally it brightens but, unlike `add`, it asymptotes to
  1 instead of overshooting. Better than `add` for warm-on-warm
  because the warm-warm overlap stays warm rather than going cream.
  Default for "lights" / glow layers.
- **`multiply`.** Darkens. Useful for one specific job: a **warm
  filter / tint** layer at the very top (e.g. a slow-moving wine
  vignette that pulls bright spots into deeper red). Multiplying two
  textured warm layers produces mud — only ever multiply
  *texture × tint*, never *texture × texture*.
- **`max` (lighten).** Per-channel `max(a, b)`. Hardest mode —
  preserves the brighter pixel always. Reads as "winner-takes-all".
  Excellent for layers where you want sharp edges to survive (sparks,
  lightning, ring fronts). The mode that most preserves luminance
  contrast across three layers because each pixel is fully one
  layer's, never an average.
- **`replace` / hard `over` at alpha=1.** Equivalent to `normal` with
  a hard mask. Used when a top layer must *occlude* (e.g. a SDF mass
  with no see-through), forcing the eye to read it as "in front"
  rather than "blending with".

The canonical V-Jaygent stack: `normal` for the bottom (it sets the
palette floor), `screen` or `max` for one lead, `normal` or
`multiply` for tint/grade on top. **Never `add` for three+ layers.**
The "cream soup" failure mode is so reliable it's a probe.

## Polyrhythmic clocks

Extends `polyrhythmic-motion.md`. There, the rule is coprime *integers*
on `u_time`; here, the rule is *clock-source diversity* across layers.

Available clocks per layer:

1. `u_time` (free-running) — drift, ambient layers.
2. `u_beat_phase` (0..1, resets on beat) — beat-locked sweeps.
3. `u_bar_phase` (0..1, resets on bar) — phrase-level structure.
4. `u_section_progress` (0..1, monotonic across a track section) —
   slow palette/structure walks.
5. `u_audio_bass / mid / high` (and per-stem `u_audio_*_stem`) —
   short-window envelopes.
6. `u_downbeat` (impulse) — discrete events.
7. Cursor / interaction.

A 4-layer piece with all four layers driven by `u_audio_bass` is one
fat layer pretending to be four. A passing distribution looks like:

- **Layer 0 (ground).** Clock: `u_time` only, rate `1.0`. Bass-section
  influences it via `u_section_progress`, not `u_audio_bass`.
  Refreshes its character per section, ignores per-beat events.
- **Layer 1 (mid waves).** Clock: `u_bar_phase * φ` where φ = 1.618.
  Audio: `u_audio_mid`. Couples spatially to layer 0 via `u_below`
  warp.
- **Layer 2 (lead figure).** Clock: `u_beat_phase`, rate 1.0 of beat,
  but *drifts* off it with `+ 0.1 * sin(u_time * 0.083)` so it's never
  quite locked. Audio: `u_audio_high` for transient bursts.
- **Layer 3 (history / grain).** Clock: pure `u_history` feedback
  loop, no explicit time. Decays at fixed rate 0.93/frame.

Realignment period: lcm of the symbolic ratios is irrational (φ, π
drift), so practically infinite. Numeric example at 120 BPM: layer 1
cycles every 1.618 bars (3.24s), layer 2 cycles every beat ± drift
(0.5s ± slow walk), layer 0 changes feel only at section boundaries
(every 16 or 32 bars). The viewer never catches all three on the same
phase.

The canonical "everything pulses on the kick" failure: every layer
reads `u_audio_bass` on the multiplier of an envelope. Replace with
the distribution above and the piece stops feeling like a strobe with
decoration.

## Anti-patterns

1. **Cream soup.** Three warm layers on `add`. Each layer alone reads
   warm-and-rich; together they sum past 1.0 across every channel and
   clip to a uniform pale cream. Detect: histogram the rendered frame
   — if mean luminance is > 0.7 *and* the warmest channel's separation
   from the coolest is < 0.1, you have cream. Fix: switch the top two
   to `screen` or `max`; cap one layer's alpha to ≤ 0.4.

2. **Synchronised epilepsy.** All N layers brighten on every kick
   (`1 + k * u_audio_bass` somewhere in each layer). The piece becomes
   a strobe with texture. Detect: read the shaders and count layers
   where `u_audio_bass` appears in a brightness-shaped expression
   (`1 + k*bass`, `a + b*bass`, additive flash). If ≥ 2 of N layers
   have this, fail. Fix: only one layer (the lead) gets bass-on-
   brightness; others get bass on geometry, or no bass at all.

3. **Twin layers.** Two layers running fbm with similar octaves and
   similar warm palettes. The viewer can't separate them, so they
   read as one noisy layer at 2× the cost. Detect: solo each layer.
   If two layers solo'd look like the same shader with a parameter
   tweak, they're twins. Fix: make them differ by a *technique
   class*, not a parameter — fbm + SDF + tile + fluid is a
   vocabulary; `fbm(scale=3) + fbm(scale=4)` is not.

4. **Layer wars.** Two leads. Both pulse on transients, both have
   hard edges, both occupy the screen centre. The eye flinches between
   them and lands nowhere. Detect: count layers with hard luminance
   edges (`smoothstep` / SDF threshold) that *also* react to high-
   energy audio. If > 1, fail. Fix: demote one to fill (soften edges,
   slow the audio binding), or split spatially (one centre-anchored,
   one perimeter-anchored).

5. **Decorative coupling.** A "distort" layer that distorts uniformly
   with no audio, no cursor, no field input — i.e. a static post-
   effect cosplaying as a layer. Detect: the distortion strength is a
   constant or a slow `sin(u_time)`, not bound to anything *the
   viewer can perceive a cause for*. Fix: bind the distortion
   magnitude to `u_audio_*` or `u_mouse_vel` or `u_section_progress`,
   or bind the distortion *shape* to a published field from another
   layer.

6. **Z-order chaos.** Layers declared in arbitrary order, swapping any
   two produces approximately the same image. Means none of the
   layers are reading-from-below; the stack is a flat union. Detect:
   mentally swap layer 1 and layer 3. Frame substantially identical =
   fail. Fix: introduce a `u_below`-reading layer near the top
   (refraction or mask-reveal); now order is load-bearing.

7. **Over-coupling.** Every layer reads every layer beneath; every
   layer publishes; the dependency graph is a complete DAG. The
   viewer can't pick out a structure because everything is everything
   else. Detect: count edges in the coupling graph. With N layers, >
   N edges is suspicious; > 2N is broken. Fix: keep the bottom layer
   self-contained (a `u_time`-only ground), couple only adjacent
   layers (i+1 reads from i), reserve cross-layer publishes for the
   *one* shared physics field.

8. **Per-layer audio blink.** Each layer has its own brightness
   multiplier on its own audio band (`(1 + k*bass) * (1 + k*mid) *
   (1 + k*high)`). Independently sensible, jointly they multiply into
   a four-strobe tachycardia. Detect: in a single frame at audio peak,
   dynamic range < 1.5 stops because everything peaked together. Fix:
   at most one *brightness* audio binding per piece total; other
   layers respond to audio in geometry only.

9. **Static composite.** All layers exist, all layers do their thing,
   but the composite is the same composite for the whole piece because
   nothing crosses spatial regions. Detect: sample the dominance map
   (which layer's contribution is largest at each pixel) at t=0 and
   t=15s. If the maps are nearly identical, the piece is static at
   the layer level even if individual pixels are moving. Fix: at
   least one layer must *migrate* — its dominant region moves across
   the frame over the duration.

## Pass/fail probes (critic agent)

Match the form of `taste.md`'s music probes — `shader-pass` /
`shader-fail` / `shader-unclear` with line citations on the
`meta.yaml` or a layer's `.frag`, or `frame-pass` / `frame-fail` on
captured frames.

1. **Spatial-coupling probe.** Read `meta.yaml`'s layer list. Does at
   least one layer declare `u_below` or a `consume:` channel? Then
   read that layer's shader: does the consumed value affect a
   *coordinate / UV / position* (geometric use), not just a colour
   multiplier (decorative use)? **Fail** if no layer reads from below
   at all; **fail** if every read-from-below is colour-only
   (decorative coupling, anti-pattern 5); **pass** if at least one
   layer's output visibly repositions pixels of the layers beneath.
   Shader-verdict with line citation. Mental visualisation: zero out
   that layer's `u_below` term — would pixels beneath move to a
   different place? If not, fail.

2. **Polyrhythm-of-clocks probe.** Read each layer's audio bindings
   and time source. Count the distinct clock sources used across the
   stack (members of `{u_time, u_beat_phase, u_bar_phase,
   u_section_progress, u_audio_bass, u_audio_mid, u_audio_high,
   u_audio_*_stem, u_downbeat, u_mouse}`). **Fail** if all layers
   share a single clock; **weak** if the count is 2 of N layers;
   **pass** if ≥ 3 distinct clocks across ≤ 4 layers. Shader-verdict.

3. **Eye-distribution probe.** From the captured frames, compute (or
   by-eye estimate) the dominance map: per-pixel which layer
   contributes the largest luminance. Count contiguous regions where
   one layer wins. **Fail** if 1 region (one layer dominates the
   whole frame — monolithic-with-decoration); **fail** if 8+ small
   regions (chaotic stack, layer wars); **pass** if 2-4 regions per
   frame, ideally migrating across captured frames. Frame-verdict.

4. **Quiet-survives probe.** Mentally (or programmatically) zero out
   the loudest single layer by alpha for ~10s. Do the remaining
   layers still pass `taste.md`'s eye-landing and prediction probes?
   **Fail** if removing the lead leaves a flat or motionless frame
   (the piece was monolithic-with-a-flash); **pass** if the remaining
   stack still composes. Shader-verdict on the layer manifest plus
   reasoning.

5. **Order-meaningfulness probe.** Mentally swap declaration order of
   layer 1 and layer N (or any two non-adjacent layers). Would the
   composite change meaningfully? **Fail** if the swap produces a
   near-identical frame (layers aren't actually coupled — z-order
   chaos, anti-pattern 6); **pass** if the swap produces visible
   breakage (occlusion changes, refraction targets change, blend mode
   wins shift). Shader-verdict on the coupling DAG.

6. **Blend-saturation probe.** From a *peak-energy* captured frame,
   sample mean luminance and per-channel range. **Fail** if mean L >
   0.7 AND max-channel minus min-channel < 0.1 (cream soup, anti-
   pattern 1); **pass** if luminance contrast within the frame ≥ 0.3
   (something is bright, something is dark, the warm palette holds).
   Frame-verdict.

7. **Coupling-cost probe.** Count coupling edges in the layer DAG
   (each `u_below` read = 1 edge; each `consume` = 1 edge; each
   `u_history` self-loop = 0.5 edge). **Pass** if 1.0 ≤ edges/N ≤ 1.5
   (sparsely but meaningfully coupled); **weak** outside that band;
   **fail** if 0 edges total (it's a stack of independent pieces) or
   if edges ≥ 2N (over-coupling, anti-pattern 7). Manifest-verdict.

8. **Brightness-strobe probe.** Grep the layer shaders for audio-on-
   brightness expressions (the FAIL shapes from `taste.md`'s music-
   probes — `1 + k*bass`, additive flashes on `u_audio_*`, glow
   envelopes). Count layers with at least one such expression. **Fail**
   if ≥ 2 of N layers have brightness-shaped audio bindings (per-
   layer blink, anti-pattern 8); **pass** if ≤ 1 layer drives
   brightness from audio and the others drive geometry. Shader-
   verdict.

A piece should pass 6/8 to claim "layered composition". 4/8 or fewer
= the layer-stack architecture isn't doing work the piece couldn't do
in a single shader; the piece is monolithic with extra steps. Same
threshold-and-citation pattern as `interactivity.md`'s 5/7 cursor
probes; the critic agent treats this section the same way.

## Patterns from the 2026-05-05 piece builds

Three patterns surfaced while building `kindling`, `tide`, and
`stronger` that didn't fit cleanly into the original §"Coupling
patterns" but are now part of how V-Jaygent layered pieces work.

### Alpha-0 publish: data without visual leak

A layer that publishes a vec2 force in the rg channels of its
fragColor visibly leaks green/red into the warm palette when its
output is composited. v1 of the layer engine has no MRT, so a
layer can't easily output (visible RGBA) AND (data RG) separately.

**Pattern:** Set `alpha: 0` on the publishing layer in the piece's
`meta.yaml`. The layer's outputTex still carries the rg-encoded
data for downstream consumers (the consumer reads from outputTex
directly via `consumes:`); the compositor's blend skips the visual
contribution because `above.a * u_alpha == 0`. Used in
`pieces/stronger/meta.yaml` for `lodestone-pull`.

```yaml
- layer: lodestone-pull
  blend: normal
  alpha: 0.0           # data-only — invisible visual contribution
  publishes:
    force: vec2
```

### Field-driven dominance, not field-decoration

When a layer consumes a force field, the consumed signal must
DOMINATE the visual, not modulate a 5% offset on top of an
internal fbm. v1 of `tide` had `flow-warm` advecting `u_below` by
`force * 0.05` (decorative) on top of a noisy fbm at warpAmt 0.55
(the actual visual). Result: the field looked uncoupled because
the fbm was carrying the visual weight. v3 inverted the ratios:

```glsl
// Bad: field decorates fbm
vec2 q = uv - force * 0.05;
float n = fbm(q * 3.6 + u_time);    // dominant
// ...

// Good: field drives, fbm textures
vec2 q1 = uv + force * 0.55;        // field warps the sample coord
float n1 = fbm(q1 * 3.5);
vec2 q2 = uv + force * 0.55 + n1 * 0.35;
float n2 = fbm(q2 * 8.5);            // texture INSIDE the warped field
```

Plus visualise the field's structure directly — divergence /
curl at each pixel, with convergent zones glowing warm. The
consumer should make the field's topology readable.

### Post-process layer (top-of-stack `u_below` filter)

A layer that reads `u_below` (the composite of everything beneath)
and outputs a transformed version is a post-process. Place it at
the top of the stack to filter the entire composition. Pattern
used by `glitch-rgb` (section-transition glitch) and `black-holes`
(gravitational lensing of everything beneath).

```yaml
layers:
  - layer: solid-warm
  - layer: mirror-bloom
  - layer: black-holes      # lenses mirror-bloom + solid-warm
  - layer: glitch-rgb       # filters everything beneath on section transitions
  - layer: key-rays         # over the whole post-processed composition
```

The post-process layer should gate its intensity on a clear
signal so it's quiet when not wanted — `glitch-rgb` only fires
when `u_section_progress < 0.05` (i.e. just after a section
boundary), staying near-transparent the rest of the time. Don't
post-process every frame at full intensity; the eye fatigues.

### Multi-input coupling (cursor + keyboard + audio)

The layer-engine's input contract isn't just audio. With
`keyboard_synth: true` in meta, layers also receive `u_keys[15]`
and `u_key_event[15]`. Plus the always-on `u_mouse`. Pieces that
compose well use AT LEAST TWO of {cursor, keyboard, audio} as
visible drivers across the stack.

`stronger` couples all three:
- cursor → mirror-bloom centre + black-holes 5th well
- keyboard → flow-particles spawn density + mirror-bloom teeth +
  key-rays beams + core inflation
- audio → lodestone-pull strength + flow-particles bass + mirror-
  bloom rotation/scale/palette/rings + black-holes downbeat
  pulse + glitch-rgb section transitions

The Multi-input coupling probe (probe 10 in `taste.md` §"VJ
lenses / Layered coupling") makes this binding.

## How to apply in V-Jaygent

**What the critic checks (added to `/vjay-iterate`):**

- Reading order #9 — `brainstorming/techniques/layered-composition.md`
  (this file), conditional on the piece declaring `layers:` in its
  `meta.yaml`.
- New "Layered composition probes" section in the critique Markdown
  output, mirroring the cursor (5/7) and music (3/4) probe sections.
  Threshold: 6/8 passes to claim layered composition.
- New `taste.md` lens: "Layered coupling" — terse summary of the 8
  probes, body lives here.

**Lib helpers extracted in this study:**

- `lib/blend.glsl` — canonical `blend_normal`, `blend_add`,
  `blend_screen`, `blend_multiply`, `blend_max`, `blend_replace`.
  Used by every layer that composites onto `u_below`.

**Lib helpers deferred (extract when ≥3 layers reuse):**

- `lib/refraction.glsl` — chromatic dispersion + normal-driven
  displacement of `u_below`. Wait for the first two distort layers to
  ship, then extract whichever subset stabilises.
- `lib/feedback.glsl` — `u_history` sampling helpers (decay rates,
  displacement coupling). Wait for ferment / first feedback layer.

**Pieces that would benefit from retro-fit (do not retrofit eagerly,
only when the piece is being iterated for other reasons):**

- `strata` — already simulates 5 layers in one shader. Once layer
  engine ships, refactor into 5 actual layers; the spec-test for the
  engine.
- `chamber`, `plume`, `eclipse` — monolithic; not retrofit candidates.
  These succeed as monoliths and adding layers post-hoc would be
  decorative coupling (anti-pattern 5).
- `prism` — kaleidoscope sub-elements *are* layers waiting to be
  separated; the spectrum exception in palette is exactly the case
  for per-layer hue signatures.

**Cross-references:**

- `brainstorming/techniques/polyrhythmic-motion.md` — extended in §
  "Polyrhythmic clocks" with audio-binding diversity, not just time-
  rate diversity.
- `brainstorming/techniques/fluid-dynamics.md` — the curl-noise
  velocity field there is the canonical "field" layer for advection
  coupling.
- `brainstorming/techniques/sdf-masks.md` — SDF intersection coupling
  recipe builds directly on it.
- `brainstorming/techniques/using-lib.md` — extended to cover the
  fourth tier (components/layers) and the layer-engine contract.
- `lib/blend.glsl` — extracted by this study.

## References

- Robert Hodgin, *Magnetosphere* —
  <https://roberthodgin.com/project/magnetosphere>
- Memo Akten & Quayola, *Forms* (2012) —
  <https://www.memo.tv/works/forms/>
- Quayola, *Iconographies* — <https://quayola.com/iconographies-20/>
- Quayola, *Captives* — <https://quayola.com/captives-1/>
- Joshue Ott, *superDraw* — <https://superdraw.intervalstudios.com/>
- MFO / Marcel Weber — <https://mfoptik.de/>
- Refik Anadol, *Machine Hallucination* —
  <https://refikanadol.com/works/machine-hallucination/>
- Universal Everything, generative process —
  <https://www.universaleverything.com/processes/generative>
- Casey Reas, *Process* series — <https://reas.com/process>
- Joshua Davis Studios, generative —
  <https://joshuadavis.com/Generative-Generate>
- Notch (real-time graphics tool) — <https://www.notch.one/>
- TouchDesigner feedback loops, Interactive & Immersive HQ —
  <https://interactiveimmersive.io/blog/touchdesigner-lessons/understanding-feedback-loops-in-touchdesigner/>
- flockaroo Shadertoy — <https://www.shadertoy.com/user/flockaroo>
- Iñigo Quílez, articles index (depth/SDF/compositing — verify per-
  article URL) — <https://iquilezles.org/articles/>
- Brian Eno / SSEYO, *Generative Music 1* —
  <https://intermorphic.com/archive/sseyo/koan/generativemusic1/>
- Adobe, blending-mode descriptions (canonical blend math) —
  <https://helpx.adobe.com/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html>
- Lettier, *Screen Space Refraction* —
  <https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-refraction.html>
- Lettier, *Chromatic Aberration* —
  <https://lettier.github.io/3d-game-shaders-for-beginners/chromatic-aberration.html>
- LearnOpenGL, *Deferred Shading* —
  <https://learnopengl.com/Advanced-Lighting/Deferred-Shading>
- Olha Stefanishyna, *Stateful Rendering with Ping-Pong* —
  <https://ostefani.dev/tech-notes/ping-pong-technique>
- Codrops, *Real-time Multiside Refraction* —
  <https://tympanus.net/codrops/2019/10/29/real-time-multiside-refraction-in-three-steps/>
- Companion in this repo:
  `brainstorming/techniques/polyrhythmic-motion.md`,
  `brainstorming/techniques/fluid-dynamics.md`,
  `brainstorming/techniques/interactivity.md`,
  `brainstorming/techniques/sdf-masks.md`,
  `brainstorming/techniques/using-lib.md`.
