# mozart-rondo-alla-turca-turkish-march — blocked

Critic verdict: **structural-rethink** (v2 critique). Iteration 1 already
attempted a layer-balance fix (court-ground replacing solid-warm,
haze_strength dropped to 0.10, brighter ring_presence, geometric
high-band binding) — the result is mechanically correct but visually
the same: a warm beige field with 8 faint cream spokes from a tiny
center dot. The girih star and the four coprime tooth-wheels are
rendering but they read as ambient texture, not as composition.

Per the memory entry "Force-iterate plateau", pushing past
structural-rethink yields +4.5 composite max with plateau at iter 4–5.
Trust the verdict, fix at the brief stage instead.

## What the bisect proved

The layer engine works correctly. With `layers: [court-ground]` alone
the frame is the dim-ember radial gradient (debug-blue test confirmed).
With `layers: [..., ottoman-star]` debug-green covers the full frame
(replace blend works). Adding back haze + wheels + bloom + vignette
produces the uniform warm beige + 8 faint spokes I see — that IS the
correct render of my layer stack. The issue is aesthetic, not
mechanical.

## Why the brief plateaus here

1. **Warm-on-warm low-contrast palette.** Court-ground (ember at
   ~0.10–0.18 luminance) + haze (warm at +0.10 brightness via screen) +
   ottoman-star body (gold/ember at ~0.40 luminance) all sit in
   adjacent luminance bands of the same warm cycle. The cream rim
   (1.0, 0.85, 0.55) is the only high-luminance feature — but the
   star is too small (radius 0.18) for the rim to register as a
   focal element from a normal viewing distance. Geometry that
   shares the palette family of the ground reads as ambient
   variation, not as figure.

2. **Layer stack is right architecture, wrong staging.** A
   layer-stack piece (architecture E) presupposes that each layer
   contributes a visible region or movement that the eye can read
   distinctly. Here, four of the six layers contribute thin warm
   accents on a warm field — the eye-distribution probe fails (one
   region dominates, no migration). The brief should have either:
   - Picked a higher-contrast palette (deep ember background +
     near-cream geometry, with ZERO mid-tones — true Caravaggio
     chiaroscuro), or
   - Made the central girih star much LARGER (radius 0.40+) so it
     occupies the eye's natural fixation zone and its rim has
     visual weight, or
   - Pinned to architecture A (monolithic) — a single shader could
     give the star and rings the bright cream-against-near-black
     contrast the brief actually needs, without the layer-stack's
     blend math compressing all the values into the warm mid-tone
     band.

3. **Geometric output is correct but invisibly thin.** The 8
   spokes I see are real: they're the alignment-axis glow + the
   ottoman-star tipBoost + the triplet-bloom petal-tips, all at
   the right angles. The wheels rotate, the star pulses, the
   palette shifts per section — none of it reads in stills because
   the brightness contrast between geometry and ground is < 0.15.

## What to do next (Louis's call)

Three options, in order of brief-rework severity:

1. **Re-tune palette only** — drop haze entirely, swap court-ground
   to true near-black (max luminance 0.04), bump ottoman-star body
   palette to high-saturation cream against the dark ground. Keeps
   the layer-stack architecture. Lowest-risk; might reach ship-it.

2. **Convert to monolithic (architecture A)** — write one shader.frag
   that draws court (deep ember radial gradient, max ~0.05) + the
   8-pointed star (radius ~0.35, bright cream against ember) + four
   coprime tooth-wheels (radii 0.40/0.55/0.70/0.85, cream teeth) +
   downbeat scale impulse + section-flip palette flip + cursor warp.
   This gets the contrast Caravaggio-tight without the layer-stack
   compression. Closest sibling: `aperture` (cubic Julia, monolithic,
   high cream-against-near-black contrast). Medium risk; likely path
   to chef-d'oeuvre.

3. **Reframe the brief** — the Turkish March is ALSO a piece about
   the dance pulse and the right-hand triplet ornaments, not just
   the rondo geometry. Could pivot to a percussion-driven piece in
   the `throb` family (kick → expanding ring at every downbeat,
   cymbal-equivalent → sparks at the triplet runs, snare-equivalent
   → rotating cross at bar boundaries). Throws away the girih
   thesis but lands a more honest rendering of the music's
   physicality. Highest-risk; highest-reward if the original
   ottoman-rosette concept doesn't fit V-Jaygent's palette
   constraints.

## Files committed in this state

- `pieces/mozart-rondo-alla-turca-turkish-march/` — the piece dir
  with audio, analysis JSON, fallback shader, six piece-local layers
  (court-ground, haze-drift, ottoman-star, coprime-wheels-turca,
  triplet-bloom, vignette-grain), and meta.yaml declaring
  architecture: E.
- `brainstorming/pieces/mozart-rondo-alla-turca-turkish-march.md` —
  brief with §1b/§1c gates passing on paper.
- `brainstorming/inspirations/mozart-rondo-alla-turca-turkish-march-refs.md`
  — research pass (Shadertoy + girih + Ottoman geometry refs).
- `brainstorming/critiques/mozart-rondo-alla-turca-turkish-march-v1.md`
  — first-person v1 critique.
- `brainstorming/critiques/mozart-rondo-alla-turca-turkish-march-v2.md`
  — independent critic's v2 critique with structural-rethink verdict.
- `brainstorming/critiques/mozart-rondo-alla-turca-turkish-march-blocked.md`
  — this file.

`pieces/current.txt` is NOT being switched to this piece. The studio
keeps showing whatever it was on. Louis can preview at
`https://vjaygent.develle.fr/mozart-rondo-alla-turca-turkish-march`
to see the warm-beige-with-faint-spokes state, or pick one of the
three options above to take it forward.
