# Interactivity — cursor as instrument, not decoration

Research note. V-Jaygent's runtime gives every piece one interaction
channel: `u_mouse` in pixel coords, `(0,0)` when idle. No click state,
no scroll, no gesture. Within that single channel, the cursor must
*compose* the image, not decorate it. This note is the reference for
how the critic probes interaction and how future pieces choose their
mapping.

The failure mode we're reacting to: a piece mapped `mouse.y`
exponentially to zoom (up = zoom in). It felt gimmicky. That is one
symptom of a wider gap — so this note first catalogues the artists
who've solved this well, then the patterns themselves, then the
specific "mouse-Y as zoom" question, then criteria and probes.

## Artists / works worth stealing from

- **Golan Levin — *Yellowtail* (1998, part of the *Audiovisual
  Environment Suite*).** Cursor velocity (not position) becomes an
  animated self-advancing line. Gesture is the score; the piece
  replays your stroke forever after. Manifesto of cursor-as-instrument.
  <https://www.flong.com/archive/projects/yellowtail/index.html>
- **Golan Levin — *Scribble* (2000, with Shakar & Gibbons).** Audio-
  visual concert; cursor = both brush and performer. Variation on
  *Yellowtail*. <http://www.flong.com/archive/projects/scribble/index.html>
- **Golan Levin — *Painterly Interfaces for Audiovisual Performance*
  (MIT thesis, 2000).** The taxonomy reference. Defines cursor-driven
  art as the gestural creation/manipulation of an "inexhaustible,
  infinitely variable, time-based, audiovisual *substance*". This
  phrase is the closest thing to a mission statement for V-Jaygent-
  style interaction.
  <https://acg.media.mit.edu/people/golan/thesis/thesis300.pdf>
- **Golan Levin & Zach Lieberman — *Manual Input Workstation*
  (2004–06).** Hand gestures probed through computer vision; synthetic
  graphics "tightly coupled to the forms and movements of the
  visitors' actions." The principle translates to cursor: output must
  feel welded to input, not post-processed from it.
  <https://www.flong.com/archive/projects/miw/index.html>
- **Zach Lieberman — daily sketches (2016–present).** A decade of
  one-screen Instagram pieces, many of which use the cursor as a
  single-point brush, trail-seed, or field source. Study them for
  how to exhaust a single cursor channel without adding more inputs.
  <https://zachlieberman.medium.com/daily-sketches-2016-28586d8f008e>
- **Memo Akten — *Learning to See: Gloomy Sunday* (2017).** Not a
  cursor piece — a webcam piece — but the lesson is identical: the
  *input is re-interpreted by a learned prior* before it ever touches
  the visuals. Generalises to: the cursor shouldn't drive visuals
  directly, it should drive a *field* and the field drives the
  visuals. <https://www.memo.tv/works/gloomy-sunday/>
- **Jared Tarbell — *Substrate*, *Gallery of Computation*.** The cursor
  is notably *absent* as an image-composer; a mouse press just restarts
  the system. A warning: generative pieces can be so autonomous that
  the cursor has nothing honest to do. Not every piece needs an
  interaction channel. <http://www.complexification.net/gallery/machines/substrate/>
- **Robert Hodgin / Flight404 — *Magnetosphere* (2007, became iTunes
  visualiser).** Particles driven by charges; external forces (audio,
  cursor) perturb those charges. Cursor is a *field source*, not a
  pointer. The single best pattern for warm-palette ambient pieces
  with a light interaction layer.
  <https://roberthodgin.com/project/magnetosphere>
- **Rafaël Rozendaal — single-URL works (e.g. *Into Time*, *Abstract
  Browsing*).** UX pattern: no instructions, no UI, one screen, one
  mapping. The viewer discovers the rule in 2–3 seconds or the piece
  fails. Directly relevant to V-Jaygent's "readable in 3 seconds"
  bar. <https://www.newrafael.com/>
- **Lia — *re-move.org* (1999–2003).** Ten interactive pieces, "no
  instructions, unlabeled buttons, playful interaction" — the same
  discovery ethic as Rozendaal but with more visual density. P5.js
  rebuild now online.
  <https://www.liaworks.com/software-art/re-move-org-an-interactive-exploration-1999-present/>
- **Iñigo Quílez — Shadertoy practice.** Interactive pieces on
  Shadertoy almost universally use `iMouse.xy` for *camera orbit*
  (yaw + pitch on an SDF scene) — never zoom. The convention is worth
  noting: Shadertoy's entire ecosystem converged on
  "mouse = camera angle" as the only mapping that doesn't fight the
  viewer's priors.
  <https://inspirnathan.com/posts/55-shadertoy-tutorial-part-9/>
- **Casey Reas — *Process* series.** Cursor as *seed*, not driver:
  you draw a mark; autonomous behaviours take it over; your
  authorship decays. Dual agency (human + algorithm). A useful
  middle state between Yellowtail (pure replay) and Substrate (pure
  autonomy). <https://reas.com/process>
- **teamLab — *Resonating Life* and related.** Installation-scale:
  touch propagates through a field. The mapping is *local input →
  global ripple*. Translates cleanly to cursor: one cursor position
  seeds a disturbance, the field carries it everywhere.
  <https://www.teamlab.art/e/living_digital_space/>

## Core interaction patterns

Each pattern gets: a one-line mapping, a GLSL recipe (where it has
one), and a suitability note.

### 1. Direct manipulation — cursor IS a mark

The cursor deposits paint / drags an object / draws a trail. Input
position maps 1:1 to a screen feature. *Yellowtail*, Lieberman
sketches, Tarbell restarts.

```glsl
float brush = smoothstep(brushR, 0.0, length(p - uMouse));
col = mix(col, brushCol, brush);
```

Suits: stateful pieces, loud VJ moments, pieces that want evidence
of human authorship. Weak for meditative fields because the cursor
dominates.

### 2. Field modulation — cursor is a source

Cursor position becomes an attractor, repulsor, heat source, phase
anchor in a field. Hodgin, teamLab. The field does the composing;
the cursor just perturbs the field.

```glsl
vec2  d    = p - uMouse;
float r    = length(d) + 1e-4;
vec2  pull = -d / r * exp(-r * r / (2.0 * sigma * sigma));  // attractor
velocity  += pull * strength;
```

Suits: meditative fields, fluid-family pieces, ambient. The
V-Jaygent default. Works with warm-palette luminance-only because
the cursor changes *structure* rather than hue.

### 3. Parameter pilot — cursor drags through parameter space

Cursor is 2-DoF joystick into a hidden parameter. Julia `c`,
kaleidoscope segment count, fractal iteration depth, warp strength.
The *image* is the visualisation of parameter space.

```glsl
vec2 c = mix(vec2(-0.8, 0.156), vec2(0.285, 0.01), uMouse01);
// iterate Julia with c
```

Suits: mathematical pieces where the piece's *identity* is a family
of images. Readable because hue/composition varies meaningfully
with tiny movements. Weak when the parameter landscape is flat
over most of the input range — then moving the cursor feels dead.

### 4. Camera control — pan / rotate / dolly

Shadertoy's default. Mouse.x = yaw, mouse.y = pitch on an SDF
scene. Zoom is usually *excluded* from the cursor and bound to
autonomous motion or scroll (which we don't have).

```glsl
float yaw   = (uMouse01.x - 0.5) * 6.2831;
float pitch = (uMouse01.y - 0.5) * 1.0;   // clamp — don't flip over
// build ray direction, orbit around lookAt
```

Suits: 3D SDF scenes. Our single-pass 2D pieces rarely have a
"camera" in a meaningful sense, so this maps poorly to most of
V-Jaygent's catalogue — but it's the right mapping when a piece
*has* a scene.

### 5. Velocity-driven — cursor speed matters, not position

What Lieberman and Levin's *Yellowtail* do. Fast strokes = more
energy, slow = less. Requires remembering previous cursor position
per frame (JS side, passed as a uniform).

```glsl
// uMouseVel: (currMouse - prevMouse) / dt, smoothed JS-side
float energy = clamp(length(uMouseVel) * k, 0.0, 1.0);
intensity   *= 1.0 + energy * 2.0;
```

Suits: pieces that want the cursor to feel *alive* — slowing down
calms the piece, flicking excites it. Strong match with
breath/plume/fluid pieces. Requires a JS helper; not free.

### 6. Momentum / damping — low-pass the cursor

Whatever mapping you pick, the *raw* cursor is too jittery for a
meditative piece. Exponential smoothing in JS or in shader (with a
previous-mouse uniform):

```glsl
// alpha ~= 0.08 for slow inertia, 0.3 for quick-but-stable
vec2 smooth = mix(prevMouseSmooth, rawMouse, alpha);
```

Critical pairing: always combine smoothing with an *idle return*
(mouse goes back to a resting position when off-screen, so the piece
self-plays). V-Jaygent convention: `u_mouse == (0,0)` means idle, use
a synthesised lissajous/perlin cursor in that branch.

### 7. Stateful trails — previous positions

Requires multi-pass (ping-pong framebuffer). Not available in the
current single-pass runtime, but worth noting because the most
famous cursor pieces (Yellowtail, Magnetosphere) all need it. The
single-pass fake: sample the cursor along an analytic trail (ring
buffer of last N positions passed as uniforms, drawn as a polyline
with exponential fade).

### 8. Time scrubbing — X is time, not space

Cursor X scrubs `iTime`, Y does something else (or nothing). Reveals
the piece's clock as a *controllable* axis. Used in Reas's scored
pieces. Good for the critic's "readability" test because the viewer
immediately grasps the mapping (drag left, past; drag right, future).

### 9. Dwell detection — hovering builds state

Without click, you can still detect *stillness*:

```glsl
float still = exp(-length(uMouseVel) * 30.0);      // 0..1
dwell       = clamp(dwell + still * 0.01, 0.0, 1.0); // JS-side, persistent
```

Dwell can trigger bloom, zoom, focus, revelation. The only
click-replacement we've got. Suits contemplative pieces where the
reward is for *stopping*.

### 10. Hybrid — cursor composes with audio or an autonomous clock

The cursor is one voice in a multi-clock system (see taste.md's
"desynchronised clocks" lens). Bass shapes macro structure; cursor
shapes local detail; an autonomous slow drift keeps the piece alive
when both are idle.

This is the pattern V-Jaygent pieces should reach for by default.
Cursor *alone* driving a piece is fragile — it makes the piece
boring when the cursor is off-screen, and taste.md explicitly wants
idle pieces to play themselves.

## The "mouse-Y → zoom" question, head-on

**Why it usually feels bad:**

1. **Fights priors.** Every app the viewer has ever used does
   scroll-to-zoom, drag-to-pan. Mouse-Y-to-zoom inverts both
   conventions. Industry standard on canvases (Figma, Miro, Google
   Maps) is `ctrl+scroll = zoom`, raw-drag = pan; there is no
   precedent for `raw Y-position = zoom`.
   <https://www.mappedin.com/resources/blog/why-panning-and-zooming-in-a-web-app-cant-be-perfect/>
2. **Costs a pan axis.** Now Y doesn't pan, so you have half a
   camera. Half-cameras feel broken.
3. **Exponential is worse than linear.** The viewer at mid-screen
   expects "neutral zoom"; exponential put 50% of the useful range
   in the top 10% of the screen. Asymmetric mappings without a
   neutral resting state feel twitchy.
4. **Direction is arbitrary.** Up-is-in and down-is-in both lose —
   there's no universal convention the way there is for scroll.

**Alternatives that actually work in single-channel `u_mouse`:**

- **Radial zoom.** `zoom = 1 + k * length(uMouse01 - 0.5)`. Distance
  from centre drives zoom; both pan axes survive (centre of screen =
  resting, drag in any direction = zoom). Symmetric, idle-friendly.
- **Autonomous zoom + cursor modulator.** Zoom is a slow sin/ease
  cycle; cursor biases its *speed* or *amplitude*, not its value.
  Piece self-plays idle.
- **Dead-zone radial.** Central disc (r < 0.3) = free pan; annulus
  (0.3 < r < 0.5) = zoom. Clear two-region mapping, readable.
- **Velocity → zoom.** Fast cursor = zoom out (survey), still cursor
  = zoom in (detail). Matches breath. This is the strongest match
  for V-Jaygent's meditative palette.
- **Dwell → zoom.** Hover builds dwell, dwell zooms in. Piece only
  rewards the still viewer. Very V-Jaygent.

**Shadertoy consensus:** Zoom is almost never bound to mouse. When
it is, it's always `iMouse.w` (scroll-proxy via click), never raw
pixel coords. For a single-pass cursor-only piece, the conventions
converge on camera-orbit (patterns 4/2) with zoom being autonomous
or absent.

**Legitimate case for mouse-Y → zoom:** exploration / debug pieces
where the viewer is *explicitly asked to navigate a structure*
(Mandelbrot explorer, deep-zoom demo). Then Y-as-zoom is fine
because it's the thesis of the piece. Unlikely to apply to
V-Jaygent; our pieces are performances, not explorers.

## Instrument vs gimmick — criteria

Ideas adapted from Levin's thesis and *Painterly Interfaces* — the
cursor is an instrument when it modifies an *inexhaustible
substance* gesturally, not when it scrubs a UI slider.

1. **Composes or decorates?** Does moving the cursor change *where
   the eye lands*, the macro composition? Or only the local
   appearance of a small region?
2. **Latency.** Bret Victor's line: immediate response. <~60ms from
   move to pixel change. At 60fps that's 3 frames. Anything slower
   *reads* as broken input.
3. **Idle behaviour.** When cursor is off-screen, does the piece
   still mesmerize? taste.md Probe 1 (eye-landing) must still pass
   with a synthesised or absent cursor. *Plume* passes; a pure
   cursor-painter like Yellowtail-clone would fail.
4. **Readability in 3 seconds.** Rozendaal bar. A cold viewer should
   grasp the mapping within one or two moves without any UI.
5. **Reversibility.** Can you un-do what you just did by moving back?
   Direct manipulation (1) and parameter-pilot (3) always pass;
   stateful trails and dwell (7, 9) often don't — that asymmetry is
   the *point* of those patterns, but call it out explicitly.

## Anti-patterns

- **Cursor lock to centre.** Easy trap when debugging: piece only
  reads well with cursor at `(0.5, 0.5)`. Then the default state
  (idle, off-screen, `(0,0)`) looks wrong. Always design for idle.
- **Interaction dominating the piece.** Swirl overpowers quasicrystal;
  attractor eats the field. If cursor strength > 0.3 of total
  structural energy, the piece becomes an interaction demo, not a
  V-Jaygent piece.
- **Post-hoc interaction.** Finishing a piece then bolting `u_mouse`
  onto its warp coordinates is always detectable. Interaction has
  to be designed in from the thesis.
- **Leaking uniforms.** Using `iMouse.z`/`.w` (click state) or scroll
  uniforms the V-Jaygent runtime doesn't provide. The piece breaks
  silently when deployed.
- **Too many channels.** Trying to map X to one thing, Y to another,
  velocity to a third, dwell to a fourth. Viewer can't learn four
  mappings in 3 seconds. Pick one or two.

## Pass/fail probes (critic agent)

Short yes/no probes. These extend taste.md's "Interaction agency"
lens with operational tests the critic can run on a piece with
cursor support.

1. **Composition test.** Put the cursor at three distinct positions
   (a, b, c). Does the *macro composition* differ between frames, or
   only the local region near the cursor? *Fail if only local.*
2. **Idle test.** With cursor at `(0,0)` for 30 s, does the piece
   still pass taste.md's eye-landing and mesmerizing probes? *Fail
   if the piece visibly dies without cursor.*
3. **Readability test.** Can a cold viewer guess the mapping within
   3 seconds and two cursor moves, with no UI? *Fail if no.*
4. **Reversibility test.** Move cursor to a, note the frame; move to
   b; move back to a. Does the frame return? *Stateful patterns
   legitimately fail this — call it out but don't auto-fail.*
5. **Dominance test.** Is the cursor's contribution to the rendered
   energy ≤ ~30% of the total structural energy? *Fail if cursor
   drowns the piece.*
6. **Convention test.** Does the mapping fight standard priors
   (mouse-Y to zoom, drag-to-rotate-around-Z, etc.)? *Fail if
   viewer's first instinct produces the wrong behaviour.*
7. **Latency test.** Render a visible feature directly under the
   cursor. Move fast. Does the feature lag by more than ~3 frames?
   *Fail if yes — that's input-smoothing eating responsiveness.*

A piece should pass 5/7 of these to claim "cursor as instrument".
3/7 or fewer and the interaction is decorative — either remove it
or redesign around a different pattern from the list above.

## References

- Golan Levin, *Painterly Interfaces for Audiovisual Performance*
  (MIT, 2000) —
  <https://acg.media.mit.edu/people/golan/thesis/thesis300.pdf>
- Golan Levin & collaborators, *Yellowtail* —
  <https://www.flong.com/archive/projects/yellowtail/index.html>
- Golan Levin, *Scribble* —
  <http://www.flong.com/archive/projects/scribble/index.html>
- Golan Levin & Zach Lieberman, *Manual Input Workstation* —
  <https://www.flong.com/archive/projects/miw/index.html>
- Zach Lieberman, *Daily Sketches* (2016 intro) —
  <https://zachlieberman.medium.com/daily-sketches-2016-28586d8f008e>
- Memo Akten, *Learning to See: Gloomy Sunday* —
  <https://www.memo.tv/works/gloomy-sunday/>
- Robert Hodgin, *Magnetosphere* —
  <https://roberthodgin.com/project/magnetosphere>
- Jared Tarbell, *Substrate* —
  <http://www.complexification.net/gallery/machines/substrate/>
- Rafaël Rozendaal, single-URL works —
  <https://www.newrafael.com/>
- Lia, *re-move.org* —
  <https://www.liaworks.com/software-art/re-move-org-an-interactive-exploration-1999-present/>
- Casey Reas, *Process* series —
  <https://reas.com/process>
- teamLab interactive works —
  <https://www.teamlab.art/e/living_digital_space/>
- Inspirnathan, *Shadertoy Camera Movement* tutorial —
  <https://inspirnathan.com/posts/55-shadertoy-tutorial-part-9/>
- Shadertoy *Input - Mouse* reference —
  <https://www.shadertoy.com/view/Mss3zH>
- Mappedin, *Why panning and zooming can't be perfect* —
  <https://www.mappedin.com/resources/blog/why-panning-and-zooming-in-a-web-app-cant-be-perfect/>
- Bret Victor, essays on direct manipulation —
  <https://worrydream.com/>
