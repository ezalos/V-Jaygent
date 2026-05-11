# Critique: cirrus v2-i3 — Iter 1 + Iter 2 Applied

## Anchor
**Louis's anchor (unchanged from v2-i1):** "too static, not chaos enough"

## Iteration History
- **v2-i1:** Section-driven ring-centre drift triggered during final 35% of each section (sp > 0.65). Visible at pre-peak / pre-outro frames; invisible at section centres.
- **v2-i2:** Peak-section-only per-beat radial wobble (isPeak * 0.030 * cos(bp * TAU)). Pulses ring radii during the 65s climax.
- **v2-i3:** Both fixes in place. Fresh frame audit.

## Frame Analysis

**Frame 0 — intro (sp ≈ 0.06, section centre)**
- Geometry: Perfectly concentric, locked-mandala symmetry.
- Motion: None. Rings and teeth are stable, evenly aligned.
- Triggers: buildIntensity ≈ 0 (sp far below 0.65), isPeak = 0.
- Reading: Still, monument-like.

**Frame 1 — verse (sp ≈ 0.18, section centre)**
- Geometry: Perfectly concentric, locked-mandala symmetry.
- Motion: None. Identical stability to frame 0.
- Triggers: buildIntensity ≈ 0, isPeak = 0.
- Reading: Still, monument-like.

**Frame 2 — pre-peak (sp ≈ 0.95, trigger-active boundary)**
- Geometry: Visibly offset from centre, teeth scattered, destabilized.
- Motion: Ring centres orbit away from origin (driftCentre pulling hard).
- Triggers: buildIntensity ≈ smoothstep(0.65, 1.0, 0.95) ≈ 0.93 (max trigger).
- Reading: Chaotic, energetic. Drift fix is working as intended.

**Frame 3 — peak mid (sp ≈ 0.33, inside peak section, but mid-section)**
- Geometry: Concentric, locked-mandala symmetry.
- Motion: Subtle per-beat radial pulsing (beatWobble = 0.030 * cos(bp * TAU)), but too small to dominate visual reading.
- Triggers: buildIntensity ≈ 0 (sp below 0.65, even within peak), isPeak = 1.0 (section_id == 4).
- Reading: Calm. Peak-section wobble is present but undershoots its mandate; the frame reads as locked, not alive.

**Frame 4 — outro mid (sp ≈ 0.51, section centre)**
- Geometry: Perfectly concentric, locked-mandala symmetry.
- Motion: None.
- Triggers: buildIntensity ≈ 0, isPeak = 0.
- Reading: Still, monument-like.

**Frame 5 — outro late (sp ≈ 0.99, trigger-active boundary)**
- Geometry: Visibly offset from centre, teeth scattered, destabilized.
- Motion: Ring centres orbit away from origin.
- Triggers: buildIntensity ≈ 1.0 (max trigger).
- Reading: Chaotic, energetic. Drift fix working as intended.

## Assessment

**What iter 1 + 2 achieved:**
- **Iter 1 (drift):** Successfully destabilizes the geometry during pre-peak and pre-outro boundaries (sp > 0.65). Frames 2 and 5 show visible, energetic macro motion. The macro state is clear: orbiting ring centres create scattered, unpredictable tooth alignments.
- **Iter 2 (wobble):** Adds per-beat radial pulsing within the peak section (section_id == 4), but the amplitude (0.030) is too small relative to ring size (0.12–0.44 range). The visual effect is subtle—the frame reads calm despite the wobble being present.

**The core problem:**
Frames 0, 1, 4 (calm section centres: intro, verse-mid, outro-mid) remain **perfectly locked mandala geometry**. They are stable, predictable, geometrically aligned—the antithesis of chaos. Louis's anchor is "too static, not chaos enough," and these three frames directly contradict that mandate.

The piece currently oscillates between two states:
- **Locked:** Intro, verse-mid, outro-mid, peak-mid—perfectly concentric, symmetrical, still.
- **Chaotic:** Pre-peak, pre-outro—rings orbit away, teeth scatter.

This is a compositional contrast (locked ↔ chaotic), but it is **not** a solution to "too static, not chaos enough." The locked frames are genuinely static. Louis is asking for the piece to be **alive throughout**, with the baseline level of motion always visible, and then larger, punctuated chaos layered on top during peak/pre-peak moments.

## Verdict: NEEDS-TWEAK

**The piece does NOT meet Louis's bar.** Iterations 1 and 2 have addressed the pre-peak and peak moments well, but calm section centres are still too static. The "locked mandala" geometry is the problem—it needs to be perturbed at the baseline level, always.

## Proposed Fix

**Strategy:** Add a constant, song-wide **per-beat angular jitter** on each ring's rotation phase. This is a small, continuous random walk of the phase space that fires on every beat, ensuring visible motion even at calm section centres. The pre-peak drift and peak wobble remain on top, providing larger, punctuated chaos.

**File:** `/home/ezalos/42/V-Jaygent/pieces/cirrus/layers/coprime-wheels/shader.frag`

**Change 1:** After line 80 (after the `beatWobble` definition), add:

```glsl
// Per-beat angular jitter — small phase noise fired every beat song-wide,
// so even calm sections show continuous subtle rotation instability.
// This keeps the mandala "alive" even at section centres (intro/verse/outro-mid),
// answering Louis's "too static" anchor by ensuring motion happens everywhere,
// with bigger chaos (drift/wobble) layered on top during peak/pre-peak.
float jitterPhase = sin(bp * TAU * 2.0 + sp * 0.5) * 0.015;
```

**Change 2:** Modify line 117 inside the ring loop. Change:

```glsl
float toothPhase = ang * P + omega[i];
```

To:

```glsl
float toothPhase = ang * P + omega[i] + jitterPhase;
```

**Why this works:**
- **Jitter amplitude (0.015 rad ≈ 0.86°):** Small enough to preserve tooth visibility and mandala structure, large enough to create visible continuous shimmer.
- **Oscillation rate (2× per beat):** Even at calm section centres where buildIntensity and isPeak are both 0, teeth rotate back and forth twice per beat, creating soft breathing motion.
- **Modulation by sp:** Jitter grows slightly as sections build toward peaks (via `sin(... + sp * 0.5)`), reinforcing the macro build structure without changing the fundamental mechanism.
- **Layering:** Pre-peak drift (frames 2, 5) and peak wobble (frame 3) add their bigger effects on top, so punctuated chaos still dominates peak moments.

**Expected results:**
- Frame 0 (intro): Softly breathing, slightly shimmering teeth instead of locked geometry.
- Frame 1 (verse): Same soft shimmer.
- Frame 3 (peak): Wobble + jitter, more alive than before.
- Frame 4 (outro-mid): Soft shimmer.
- Frames 2, 5 (pre-peak/pre-outro): Drift + jitter underneath, chaos still dominant.

The piece becomes "alive throughout, with punctuated moments of larger chaos," answering Louis's anchor directly.

---

## Metadata

**iteration:** 3  
**status:** needs-tweak  
**anchor-met:** false  
**author:** V-Jaygent critic  
**date:** 2026-05-11  
**piece:** cirrus  
**layer:** coprime-wheels  
**shader:** `/home/ezalos/42/V-Jaygent/pieces/cirrus/layers/coprime-wheels/shader.frag`  
**frames-audited:** 6  
  - music-00-t2.0-intro.png  
  - music-01-t92.5-verse.png  
  - music-02-t112.0-pre-peak.png  
  - music-03-t135.0-peak.png  
  - music-04-t186.6-quiet.png  
  - music-05-t198.5-outro.png  
**proposed-fix:** Per-beat angular jitter (0.015 rad, 2× beat rate) applied song-wide to ring rotation phase.  
**fix-type:** Constant baseline motion + layered punctuated chaos.  
**lines-changed:** 2 (add jitterPhase def after line 80; modify toothPhase at line 117).
