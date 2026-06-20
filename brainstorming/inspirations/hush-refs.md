# hush — inspirations & references

Track: **"Hush" — Atric & Frida Darko** (Tipping Point TP049, 2025-11-14).
187.5s, 123 BPM, D minor. Beatport tag: **Indie Dance / Nu Disco**
(verify-later) — the artists' lineage is organic house (Frida Darko @
Boom 2025; prior TP cuts "Higher Level"/"My Dog" are organic house; an
Oliver Koletzki remix exists), but the track itself leans more
nu-disco/indie-dance. Read warm + hypnotic, not "shamanic."

## Artist & genre

Organic-house / desert-house visual language (All Day I Dream / Lee
Burridge, Bedouin, Boom/Burning Man sunrise sets): **sunbaked
terracotta, dusty pink, ochre, warm neutrals, deep shadow**; motifs of
desert haze, low sun, **slow rotation, mandala / concentric symmetry**,
hand-drawn organic line. Scenic and long-form — never a "drop."

**The one move to steal:** *unhurried rotational symmetry over a hazy
warm ground* — a single slow-turning centered form that rewards
staring (the visual analog of a 9-minute sunrise set). The central eye
delivers exactly this.

Sources: [Beatport – Hush](https://www.beatport.com/release/hush/5546743),
[Master Music Production – organic deep house](https://www.mastermusicproduction.com/2022/how-to-make-organic-deep-house-like-all-day-i-dream-artists/),
[Belarte – desert-haze terracotta palette](https://belartestudio.com/collections/desert-haze-a-warm-embrace-of-earthy-elegance)

## Technique refs

- **[Curl-noise dust — Shadertoy csySDR](https://www.shadertoy.com/view/csySDR)**
  — per-pixel dust advected by curl-of-noise, no particle system; the
  exact motes-over-dark look.
- **[atyuwen – divergence-free / bitangent noise](https://atyuwen.github.io/posts/bitangent-noise/)**
  — analytic divergence-free noise so you skip `ddx/ddy` curl of FBM.
  **Gotcha:** finite-difference curl of FBM at low render_scale →
  axis-aligned banding + grid lattice in the dust. Sample curl
  analytically or jitter the FD offset; use `fbmRot` not `fbmGrid`.
- **[Lamb–Oseen vortex (Wikipedia)](https://en.wikipedia.org/wiki/Lamb%E2%80%93Oseen_vortex)**
  — `v_θ = (Γ/2πr)·(1 − exp(−r²/r_c²))`: solid-body rotation at the
  core blending to 1/r far-field — a non-singular "eye." Drive Γ and
  r_c from song structure: **Γ→0, r_c→0 = eye closes during the hush.**
  **Warm-palette gotcha:** warm-on-warm dust collapses to mud — carry
  the dark end with genuine near-black negative space.

## Distinctness verdict — DISTINCT *only if* the eye + breathing lead

`pieces/plume` is the **same canonical algorithm** (curl of FBM
potential, six backward pathline steps, ember ramp, render_scale 0.48).
If hush is "curl-noise ember smoke," it is a recolored plume. Three
non-negotiable differentiators:

1. **Analytic central Lamb-Oseen vortex/eye is the SUBJECT** — plume is
   uniform turbulent smoke with no center. Make the vortex rotation the
   visual subject; the FBM curl is only texture *on* it.
2. **Composed breathing / closing eye** — plume reacts continuously and
   nothing closes. Hush's thesis is the iris *closing to black during
   88–120s*, a dynamic-range-downward gesture. (`breath` owns
   silence-response via heat-diffusion — different form; lineage, not
   duplicate.)
3. **Sustained centered spiral** — plume/aurora are unstructured
   fields; `throb` owns transient beat-fired centered geometry (strobe,
   near-black between hits). Hush is the missing middle: a *sustained
   turning eye*. No catalog piece is a slow rotating vortex/eye.
