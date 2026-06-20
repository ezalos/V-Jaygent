# hush

**Track:** "Hush" — Atric & Frida Darko (Tipping Point, 2025). 187.5s,
123 BPM, D minor. Indie-dance / nu-disco with an organic-house lineage.

## Thesis

A slow-turning warm **eye that breathes with the song** — a single
Lamb-Oseen vortex of embered dust, sustained and rotating, that the
music opens and closes. It spins up and brightens through the grooves;
during the central **hush** (88–120s) the circulation drains to zero,
the core collapses, and the iris closes to near-black — a held breath —
then Act II reignites it brighter and fuller; the outro unwinds the
spiral and lets the dust drift out as the eye shuts for good.

## The song's arc (from audio.analysis.json + energy envelope)

- **0–32s intro** (E≈0.30) — eye half-open, barely turning, sparse dust.
- **32–88s Act I** (E≈0.55) — eye opens, spiral arms thicken, dust
  swirls, a ring each downbeat.
- **88–112s pre-hush** (E 0.41→0.18→0.14) — circulation drains, arms
  straighten, dust sinks toward the core, rings slow.
- **112–120s deep hush** (section 2, E≈0.14) — iris closes to near-black,
  Γ≈0, dust nearly still, one slow ring or none. The held breath.
- **120–168s Act II** (section 3, E≈0.55, fullest) — reignition: eye
  reopens *brighter, warmer, tighter-wound* than Act I (cream/amber, not
  just ember). Distinct vocabulary, not a repeat.
- **168–187.5s outro** (fade to 0) — Γ unwinds, arms loosen, dust lifts
  and fades, glow dims to black.

## Canonical-name check

**Lamb-Oseen vortex** (textbook): tangential velocity
`v_θ(r) = (Γ/2πr)·(1 − exp(−r²/r_c²))`. Solid-body rotation inside the
core radius `r_c`, decaying to 1/r outside — a non-singular swirl. The
visual subject. The dust is FBM density advected by a short backward
**semi-Lagrangian pathline** along (vortex + small curl-noise texture),
the canonical no-particle-system advected-smoke trick. `Γ` and `r_c`
are the breath: driven by `u_energy_smooth` + section state.

Curl-noise gotcha (noise.glsl + memory): finite-difference curl of FBM
grid-aligns and bands at low render_scale → use `fbmRot`, keep the
curl-texture amplitude small (it's texture, not the flow), jitter FD,
render_scale ≈ 0.6.

## Distinctness (vs catalog — see hush-refs.md)

`plume` = same algorithm (curl-FBM advected ember smoke). NOT a reskin
**iff** three things lead: (1) the analytic vortex/eye is the dominant
subject, not garnish; (2) the composed closing-eye breathing arc plume
lacks; (3) a *sustained* centered spiral (vs throb's transient strobe,
breath's heat-diffusion silence-response). The eye is non-negotiable —
drop it and it's a plume reskin.

## Decision — layer-stack, eye as subject

Five piece-local layers (bottom → top). Flow is analytic per frame
(Lamb-Oseen + curl-noise from `u_time`); dust trails come from in-shader
backward pathline, **not** `u_history` feedback — sidesteps the
banding/washout class entirely. No `passes:` needed.

1. **hush-bed** — near-black warm radial ground; faint central ember
   glow whose radius+brightness = eye openness (`u_energy_smooth`). The
   negative-space carrier (warm-soup prevention) + macro brightness
   envelope. Eye center slowly wanders so it isn't dead-center static.
2. **eye-vortex** (SUBJECT) — Lamb-Oseen tangential field + small
   `fbmRot` curl texture; dust = FBM along 5-step backward pathline,
   embered. Γ, r_c, rotation ← `u_energy_smooth`, `u_bar_phase`,
   `u_section_id`. Cursor injects a secondary local vortex (stir). Keys
   spawn mote-bursts caught in the circulation.
3. **iris-core** (focal) — SDF-clean dark pupil + bright warm rim at the
   center; openness ← `u_energy_smooth` (closes to a point during the
   hush). **Lead-layer band:** rim brightness = `max(silhouette*0.30,
   accent)` so it's always visible, not only on accents. Keys tint the
   rim (white→amber, black→wine).
4. **hush-rings** (phase-lock) — expanding warm rings on `u_downbeat`,
   concentric from the eye. Crisp each bar in grooves; stop / one slow
   ring during the deep hush. Visible phase-lock. blend max.
5. **post-haze** — reinhard tonemap + film grain + vignette pulling
   edges to near-black. blend replace.

### Coupling DAG / inputs
- **audio:** `u_energy_smooth` → breath (Γ, r_c, openness, glow);
  `u_bar_phase` → rotation; `u_downbeat` → rings + circulation kick;
  `u_audio_bass/mid` → dust turbulence/brightness; `u_section_id` →
  vocab; `u_song_progress` → Act-I-ember vs Act-II-cream palette ramp.
- **cursor:** `vjMouseWorld` → secondary vortex + heat stirring the
  dust; nudges the eye center. Cursor as instrument.
- **keyboard:** `keyboard_synth: true`; keys spawn motes + tint the rim.
- Three liveness timescales: section vocab switch (chaos), per-bar
  rotation + downbeat ring (mid), always-on >2 Hz dust shimmer (sub-beat).

## What I don't want

- Plume-reskin: uniform turbulent haze with no center. The eye leads.
- All-mid-warm soup: bed stays near-black; eye is the only bright thing.
- A field with no eye-landing: the iris + arms + rings are the anchors.
- Act II as a recolored Act I: it must read fuller/warmer/tighter.
- u_history feedback for the dust (banding trap) — pathline only.

## Open questions (know only after it runs)

- Does `u_energy_smooth` swing enough live to read the hush as a *visible
  close*, or do I need to gate harder on `u_section_id == 2`?
- Does the centered composition trip `lint-composition` (single-region)?
  Mitigation: eye wander + arms filling the frame + rings.
- Curl-texture banding at render_scale 0.6 — check the diagnostic.

## Brief gates (vjay-new-piece §1b + §1c)
```
canonical_ref: "Lamb-Oseen vortex + semi-Lagrangian curl-noise dust advection (novel framing: vortex-as-subject + composed closing-eye breath; distinct from plume/throb/breath)"
eye_landing_candidates:
  - central iris / pupil (closes during hush)
  - spiraling vortex arms
  - downbeat concentric rings
  - bright iris rim
warm_cycle: [near-black, ember, terracotta-rust, amber, cream]
idle_behaviour: "eye self-breathes via sin(u_time): slowly opens/closes, dust turns; bed glow pulses. Never an empty frame."
architecture: E   # layer stack — cursor + keyboard + audio + section state machine over an audio timeline
arch_rationale: "Multi-input (3 channels) + section state over the audio timeline → §1c rule 4 → E. Flow is analytic per-frame (Lamb-Oseen + curl-noise from u_time), dust advection is a gather-only in-shader backward pathline — no cross-frame state, so no passes/ping-pong. u_history deliberately NOT used for the dust (banding trap)."
```
