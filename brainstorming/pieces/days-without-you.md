# days-without-you

Track: **Days Without You** — Satori feat. Miou Amadée (organic/deep house,
80.7 BPM, C minor, 401s). Source (Spotify):
https://open.spotify.com/track/4FBfibrcrzJ2aqeNMbPYGu — audio sourced from
the KROOKS Records YouTube upload (duration-matched 401s, the 2015 album
version, NOT the 643s Crussen Remix).

## Thesis

A Bose–Einstein condensate trapped in a **double-well potential** — a bosonic
Josephson junction. The nonlinear Schrödinger (Gross–Pitaevskii) equation. The
condensate *tunnels* between the two wells (being together) — but when the
barrier rises or the self-interaction dominates, it undergoes **macroscopic
quantum self-trapping**: it gets stuck on one side, unable to cross. That is
the literal physics of "days without you" — the longing to reach the other
well and the inability to. The tunnel-splitting beat period IS the song's
rhythm of presence and absence.

## Canonical-name check

**Time-dependent Schrödinger equation**, `iħ ∂ψ/∂t = -ħ²/2m ∇²ψ + Vψ`, extended
to the **Gross–Pitaevskii / nonlinear Schrödinger equation** with a `g·|ψ|²ψ`
self-interaction term (canonical model for a Bose–Einstein condensate). Integrated
by the **Visscher (1991) staggered-leapfrog** scheme — ψ split into real/imag parts
updated at staggered half-time-steps; explicit and stable (FTCS is unstable). See
`brainstorming/inspirations/days-without-you-refs.md` for the exact update equations
and stability condition.

Double-well = `V(x,y) = A·(x²/w² − 1)² + ½·ωy²·y²` (quartic in x → two minima at
x=±w with a barrier of height A at x=0; harmonic confinement in y). Barrier height
A(t) and nonlinearity g(t) are the audio-coupled knobs. **No length-scale-mesa risk**
(this is a wave-propagation PDE seeded with a defined packet, not a pattern-former
growing from noise): the de Broglie wavelength and well geometry set the scale
explicitly.

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: "novel for this catalog: time-dependent (nonlinear) Schrödinger
  equation in a double well — bosonic Josephson junction. Nearest sibling is
  ferment (Gray-Scott) for the ping-pong state-bearing-PDE architecture; the
  physics is entirely different (unitary complex wave vs. dissipative chemistry)."
eye_landing_candidates:
  - two probability lobes (the two wells — |ψ|² cores)
  - interference fringes over the barrier (the de Broglie ripples where the lobes overlap)
  - the tunneling slosh / self-trapping slam (probability crossing or rebounding — section events)
  - probability-current streaks (flowing warm filaments showing where ψ flows)
  - drum-kick scatter rings (momentum kicks exciting higher modes)
warm_cycle: [near-black, deep-wine, ember, amber, cream]
idle_behaviour: "the condensate Josephson-oscillates between the wells on its own
  (the PDE evolves autonomously from the seeded packet); a slow idle drift of the
  barrier height cycles it through tunneling↔self-trapping regimes. Rich without cursor."
architecture: C   # ping-pong feedback — TDSE/GPE is state-bearing complex field
arch_rationale: "ψ must persist between frames (a wave equation). Two coupled
  passes per frame implement the Visscher stagger: pass psi_i updates Im(ψ) from
  the old Re(ψ); pass psi_r then updates Re(ψ) from the just-computed Im(ψ). A
  single pass cannot do this (the I-update needs the NEW R at neighbors). Display
  pass reads both. Wrong choices: A loses state every frame; B is for ≤200 discrete
  agents not a continuous field; E (layers) has no clean rgba16f persistent publish."
```

## Realtime-fit pivot (build note, 2026-06-20)

First implementation was the full 2D time-dependent Schrödinger/GP PDE via the
Visscher staggered-leapfrog (two coupled passes). It compiled and was stable,
BUT explicit Schrödinger integration is `dt ~ dx²`-bound: at any grid fine
enough for crisp de Broglie fringes the q-space dynamics are far too slow to
read (the packet barely tunnels in 30s), and coarsening the grid to speed it up
destroys the fringes. Confirmed live=headless at 60fps, so it wasn't a capture
artifact — it's the algorithm. This is exactly the "offline-ref needs a realtime
algorithm check at the brief stage" lesson ([[feedback_realtime_basin_pieces]]).

Pivoted to the **two-mode reduction** (Smerzi/Raghavan bosonic Josephson
junction): a 2-variable ODE (z, φ) integrated in a tiny pass, with the
wavefunction `ψ = c_L g_L e^{ikx} + c_R g_R e^{-ikx+iφ}` rendered analytically.
Crisp fringes at full resolution, exact tunneling/self-trapping control, and the
honest canonical model for this exact physics. The thesis is unchanged.

## Two-timescale unpredictability (VISION)

- **Continuity ~0.6s:** the wavefunction sloshes smoothly; |ψ|² flows continuously,
  the eye tracks the probability mass moving between wells.
- **Divergence ~25s:** the **nonlinearity (g·|ψ|²) makes the dynamics genuinely
  Lyapunov-divergent** — anharmonic Josephson oscillation, self-trapping transitions,
  higher-mode scatter after kicks — so the field never settles into a clean fixed
  beat period (the failure mode for oscillator/lattice pieces). Section-driven barrier
  + nonlinearity changes give each ~25s window a different regime: ghostly slow
  tunneling vs. fast sloshing vs. locked self-trapping vs. turbulent scatter.

This is the explicit fix for VISION's "pattern-grid pieces are systematically at
risk" warning: it's NOT a lattice of independent oscillators — it's a single
nonlinear PDE with genuine state-bearing chaotic dynamics.

## Section → regime map (derived from per-stem analysis)

```
0  0–31s    intro, no voice        packet localized in LEFT well, alone. high barrier.
1  31–126s  verse, voice enters    barrier lowers, slow tunneling begins (vocals → coupling)
2  126–158s instrumental peak/drop bass+synth max, voice recedes → barrier SPIKES, self-trap slam
3  158–236s vocal centerpiece      vocals MAX → barrier lowest, full coherent beating (together)
4  236–284s melodic build          synth (other) MAX → wide gentle sloshing, current-streak bloom
5  284–331s percussion climax      drums MAX → repeated momentum kicks, turbulent higher modes
6  331–378s outro wind-down        barrier rises, packet settles back toward one well, decoheres
7  378–401s fade to silence        amplitude damped to near-zero; single dim lobe; flash-to-black end
```

## Audio bindings (motion, not brightness)

- `u_audio_vocals_stem` → **lowers the barrier height** (vocals = the wells connect;
  tunneling speeds up, probability floods across). The single most thesis-load-bearing
  binding.
- `u_audio_bass_stem` → well depth + condensate amplitude (deeper wells, brighter cores).
- `u_audio_drums_stem` / `u_audio_kick` → momentum kick: injects a phase ramp
  `ψ·exp(i k·x)` pulse → higher-mode excitation + a scatter ring.
- `u_audio_other_stem` → nonlinearity g + probability-current streak intensity.
- `u_section_id` / `u_section_progress` → the regime map above (barrier baseline,
  well separation, g baseline).
- `u_downbeat` / `u_bar_phase` → small barrier "breathing" so the slosh phase-locks
  to the bar.

## Inputs (multi-input coupling)

- **Cursor** (`u_mouse`): a draggable Gaussian potential bump — push the probability
  around, stir the condensate, dam one well. Idle → no bump.
- **Keyboard synth** (`keyboard_synth: true`): each key injects a fresh Gaussian
  wavepacket with momentum at a key-mapped position — the synth literally launches
  condensate. (Uniforms fed regardless; audio + injection fire only with the flag.)

## What I don't want

- Clinical blue-on-black "physics demo" look (warm palette, luminance contrast).
- Two fuzzy blobs with no structure (the interference fringes + current streaks +
  well cores are the richness; keep the de Broglie wavelength visible).
- A clean periodic beat (the nonlinearity + section modulation prevent this — verify
  with cross-window clips, not stills).
- Blow-up / wash-to-flat-bright (renormalize gently + absorbing boundary ring).

## Open questions (know only after it runs)

- Visscher dt vs. visible slosh speed at headless 17fps vs. live 60fps (sim advances
  per rendered frame, not audio time — headless lags ~3.5x; grade live clips).
- Does g need to be small to avoid blow-up, costing the self-trapping drama? Fallback:
  g=0 (linear) is still beautiful; lean harder on barrier modulation + kicks for divergence.
- Are the de Broglie fringes visible at sim scale 0.5, or do I need 0.6+?
