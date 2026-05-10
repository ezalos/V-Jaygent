# 13 — Pinch-off, satellites, drumhead wobble — secondary motions

## summary
Real ferrofluid is not just spikes — it also pinches off satellite droplets,
the body skin wobbles like a drumhead after a kick, and capillary ripples
fan out from each spike base. Cheap GLSL nods to all three are what move
the piece from "spiky thing" to "alive fluid".

## why_mesmerizing
Secondary motions are the eye's tell that something is *governed by physics*
rather than scripted. A spike that simply rises and falls is animation; a
spike that rises, sheds a droplet at threshold, and leaves a ringing
membrane behind is a *system*. The eye locks onto the satellite as it
drifts free (slow, persistent), while the wobble adds high-frequency
texture — exactly the foreground/background frequency separation that
hypnotises (see item 14).

## concrete_steal
Three independently-cheap GLSL moves, all in the SDF/heightfield pass:

1. **Pinch-off (Plateau–Rayleigh nod):** when a spike's height `h` exceeds
   `h_crit` AND its neck radius (sampled `r(h*0.7)`) drops below
   `0.6 * r_base`, spawn a satellite. Cheapest implementation: a small
   ring buffer of `vec4(pos.xy, birth_t, radius)` satellites in a UBO,
   advected by a slow upward drift + tiny noise; render as soft black
   discs additively into the SDF before lighting. Lifetime ~3–6s, fade
   on radius shrink.
2. **Drumhead wobble:** add a low-amplitude radial mode to the body
   surface — `disp = sum_n A_n * J_0(k_n * r) * sin(omega_n * t + phi_n)`
   approximated as `0.005 * cos(6.0*r - 8.0*t) * exp(-0.7*r) * env(t-t_kick)`
   with `env` a one-pole decay (~400ms half-life) re-triggered on each
   downbeat. Two modes is plenty; three reads as noise.
3. **Capillary ripple from spike base:** at each active spike, emit a
   travelling crest `cos(k*(r-c*t)) * exp(-(r-c*t)^2 / sigma^2)` with
   `c ~ sqrt(sigma_T * k / rho)` (anomalous dispersion: short
   wavelengths faster — sample two `k` and offset). Additive height
   into the membrane.

Palette respect: ripples and satellites are *darker* than the body, lit
only by warm rim — never blue, never chrome.

## glsl_path
All three live in the SDF/height pass (the same one that already builds
the blob). Per-pixel cost: drumhead = ~6 ops; capillary = ~10 ops per
active spike (cap at 8 spikes); satellites = N_sat texture reads from a
1×N data texture — cap at 16 satellites. Total budget < 0.3ms at 1080p
on a mid GPU. Spawning logic runs on CPU once per frame using a
1024-tap sampling of the spike field, not in-shader.

## caveats
- Don't render satellites as perfect circles — anisotropic squish along
  velocity sells "drop" vs "dot".
- Drumhead amplitude must stay tiny (<1% of radius) or the blob looks
  jittery, not alive. Decay must finish before next kick or it becomes
  metronomic vibration.
- Capillary `c` should taste right, not match real surface tension
  (which would be invisibly fast at our scale). Treat as art parameter.
- Satellite ring buffer overflow: silently drop oldest, never alloc.

## references
- Eggers, J. (1997). "Nonlinear dynamics and breakup of free-surface
  flows." *Reviews of Modern Physics* 69(3), 865–930. The canonical
  pinch-off review.
- [Plateau–Rayleigh instability — Wikipedia](https://en.wikipedia.org/wiki/Plateau%E2%80%93Rayleigh_instability)
- [Fluctuating hydrodynamics and the Rayleigh–Plateau instability — PNAS](https://www.pnas.org/doi/10.1073/pnas.2306088120)
- [Satellite and subsatellite formation in capillary breakup — JFM](https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/abs/satellite-and-subsatellite-formation-in-capillary-breakup/8ECF0419A8D9981169480B621CD734AB)
- [Ferrofluid droplet neck breakup — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0009250924001829)
- [Capillary wave — Wikipedia](https://en.wikipedia.org/wiki/Capillary_wave) (anomalous dispersion `c ~ sqrt(sigma*k/rho)`)
