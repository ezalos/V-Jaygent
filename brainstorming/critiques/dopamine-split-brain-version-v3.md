# dopamine-split-brain-version — v3 critique

## Why v3

v2 shipped at ship-it / 24-of-30 composite but Louis's read after
seeing it run was: not mesmerizing enough. The 20-second windows at
beginning / middle / end all looked similar in vocabulary — different
exact pixels but same "blinking dots on a lattice" generative rule.
Once you'd watched 20s, you could imagine the next 20s.

That feedback prompted a doctrine update — chaos and imprévisibilité
are now a HARD GATE in the rubric (taste.md Probe 2 + VISION.md §"On
unpredictability"). A piece that fails Prediction is automatically
`structural-rethink`, regardless of how many other probes pass.

v3 is the iteration response: a new `chaos-warp` piece-local layer
that domain-warps the entire composition through a two-scale
curl-noise flow field with stochastic tear events firing at
hash-unpredictable times and locations.

## The claim

Two coupled Kuramoto-style hex-oscillator hemispheres whose composite
field is viewed through a chaotic, turbulent flow lens — the lattice
provides rhythm and structure, the chaos-warp provides surprise.
Hemispheres drift apart / fuse / sever; chaos-warp tears the
composition at unpredictable moments throughout. The unified field
in section 4 is genuinely turbulent, not just bright.

## Frame-by-frame

| Frame | t (s) | Section | What's there |
|-------|-------|---------|--------------|
| 00 | 1.0 | Intro (0) | LEFT lattice with subtle dark rings forming around each cell as the chaos-warp barely begins to displace u_below. Right hemisphere still dark. Chaos budget 0.10 — minimal, by design (intro is the clean wake-up). |
| 04 | 22.1 | Quiet (1) | OSCILLATORS HAVE BECOME BUTTERFLIES — each cell is a 4-pointed wing-shape from the curl-noise pulling u_below in different directions. Left side cream-wine flutters, right side amber-gold flutters. Completely different vocabulary from v2's clean dots. |
| 01 | 40.9 | Verse (2) | Wings have grown into denser, more turbulent shapes. Each cell is now an irregular cluster of bright pixels surrounded by dark warp trails. Chaos budget 0.75. |
| 02 | 105.5 | Pre-peak (3) | Star-shaped cell clusters with petal explosions. Composition reads as a dense, layered turbulent texture, but the left-cream / right-gold separation is still visible. Chaos budget 1.05 — high. |
| 03 | 120.8 | Climax (4) | FULL TURBULENCE. Lattice has DISSOLVED into broken bright pieces. Star bursts, chromatic-separation fringes visible (red/blue offsets from the section-4-only chromatic split). The fusion isn't smooth-moiré anymore — it's a violently chaotic merger. Chaos budget 1.45. |
| 05 | 157.1 | Outro (5) | Chaos COLLAPSING back into order. Spiraling vortices visible in the right hemisphere (trails from u_history feedback as warp dies down). Cells reverting to dots-with-distortion. The piece visibly "decompresses" from its peak chaos. |

## Mesmerizing probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | **pass** | Four+ focal candidates per frame, migrating substantially between frames. Each section's vocabulary is different. |
| **Prediction** | **PASS (was fail in v2)** | Three 20s windows (early/middle/late) have *visibly different event vocabularies* — clean lattice → butterflies → star bursts → tear chaos → fading vortices. Stochastic tears fire at hash-unpredictable times/locations within each section. Curl-noise flow evolves continuously. The viewer cannot pre-compute what the next 20s will look like. **Hard gate cleared.** |
| Squint | **pass** | Macro hotzones still drift; the chaos-warp adds a secondary macro structure (the curl-noise flow field has its own slow drift). Two scales of macro composition layered. |
| Hue drift | **pass** | Cool/hot palettes preserved on each side. Section 4 chromatic-separation introduces brief red/blue fringes (visible warm-purple and warm-cyan) — controlled drift, not disco. |
| Mystery | **pass** | The viewer reads "two coupled patterns viewed through turbulent water" before they read "brain hemispheres". The tears appearing and dissolving don't disclose their mechanism. Honest mystery. |

**Mesmerizing passes: 5/5**

## Claim check

**PASS.** The piece delivers the dual claim:
- Structural (sections + fusion): all 6 frames visibly differ in section state, fusion event visible at frame 03.
- Chaos (turbulent lens): every frame shows the lattice as warped, never as clean dots after section 0. The chaos visibly intensifies into the climax and collapses in the outro.

## Lints

| Lint | Result | Note |
|------|--------|------|
| palette | PASS (0.84% cool) | Chromatic separation in section 4 adds a tiny cool fringe, well within 5% budget. |
| idle | PASS (mean motion 0.162) | Motion jumped from v2's 0.111 — 45% more activity from the chaos-warp. |
| composition | PASS (TL 31.9 / TR 22.0 / BL 25.5 / BR 20.5) | Balanced quadrants. |
| audit | 7 pass / 1 warn (u_bar_phase unused) | Same as v2. |

## Scores against taste.md

| Dimension | v2 | v3 | Note |
|-----------|----|----|------|
| Palette | 5 | 5 | Unchanged — chromatic separation stays within warm + near-cool fringe budget. |
| Composition | 4 | **5** | The chaos-warp's flow field adds a wandering macro brightness pattern *on top of* the hemisphere hotzones. Squint reveals a two-scale composition that drifts at human pace. |
| Motion | 4 | **5** | Multi-scale: oscillator sub-beat jitter + chaos-warp curl-noise + stochastic tears + u_history smear trails. Five distinct motion scales, none synchronised to one clock. |
| Intensity | 4 | **5** | Dynamic range now includes tear events (sudden bright bursts), section-4 chromatic separation (peak intensity), and outro collapse (genuine quiet with visible trails). |
| Depth | 3 | **4** | The chaos-warp adds a third scale — u_history trails give the appearance of motion blur and fluid texture. Fine cell-shape variation per pixel now visible. Not full fractal (4 not 5) but a real depth gain. |
| Form & ending | 4 | **5** | Outro is now visibly the *collapse* of chaos back into order — earned arc, not just a fade. The chaos rises through the piece and dies at the end. |

**Composite: 24/30 → 29/30**

## Verdict

**CHEF-D'OEUVRE**

5/5 mesmerizing probes (including the Prediction hard gate), claim
PASS, all testable dimensions ≥ 4. The 20-second-window test passes:
three windows from early/middle/late show categorically different
event vocabularies, not just brightness variations of the same rule.

## What changed

- New piece-local layer: `pieces/dopamine-split-brain-version/layers/chaos-warp/`
  with two-scale curl-noise displacement + stochastic 4.7s tear-bucket
  events + u_history feedback trails + cursor-suppresses-warp coupling
  + section-gated chaos budget (0.10 intro → 1.45 climax).
- meta.yaml: 3 layers → 4 layers, with `chaos-warp` (replace blend) on top.

## Doctrine added with v3

- `VISION.md` §"On unpredictability" — chaos as structural precondition,
  the 20-second test, predictability traps, strategies that work.
- `taste.md` Probe 2 (Prediction) — strengthened to a HARD GATE with
  explicit 20-second-window framing; FAIL is automatic
  `structural-rethink` regardless of other probes.
- `taste.md` verdict semantics — `ship-it` now requires Prediction
  passing; `structural-rethink` triggered by Prediction fail.

```yaml
slug: dopamine-split-brain-version
version: 3
verdict: chef-doeuvre
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
  squint: pass
  hue_drift: pass
  mystery: pass
scores:
  palette_cohesion: 5
  composition: 5
  motion: 5
  intensity: 5
  depth: 4
  form_and_ending: 5
  composite: 29/30
top_fix: ship as-is
caution: |
  Don't reduce section-4 chaos below 1.4 — the violence of the fusion
  IS the climax. Don't slow the curl-noise time evolution — its
  unpredictability is the whole point. The stochastic tear cadence
  (4.7s buckets, 45% fire rate) is tuned; halving the buckets makes
  the rhythm too predictable, doubling makes it feel random/noisy.
```
