# 16 — Scientific footage + slow-mo videos — what reads as "real"

## summary
Real-ferrofluid footage is the ground-truth dataset. The visual moves
that read as "real" (not CGI) are: silent eruption (no anticipation),
post-eruption skin recoil, defects flowing through the lattice as the
magnet moves, and the audible-but-invisible wetness of the surface.

## why_mesmerizing
The eye trusts physical footage in a way it never trusts shaders. By
stealing the *timing curves* — not just the shapes — from real video,
the piece inherits credibility. The signature move is the silent
erupt: a flat surface goes from glassy-still to fully-spiked in
~120ms with NO wind-up frame. CGI almost always cheats with an
inhale/anticipation; real ferrofluid does not. Locking that timing
curve makes the blob feel governed, not performed.

## concrete_steal
Lift four timing/geometry curves directly from the footage below:

1. **Silent erupt curve (NightHawkInLight, 1000fps clip).** Eruption
   from flat to fully-spiked occupies ~6–8 frames at 1000fps =
   6–8ms of real time, ~120ms in 60fps screen time. Use as
   `f(t) = pow(smoothstep(0,1,t/0.12), 0.4)` — the `0.4` exponent is
   the snap. No anticipation easing-in. Hard cut from 0 strength to
   ramp-on at the downbeat.
2. **Skin recoil (Slow Mo Guys "Magnetic Liquid").** After magnet
   release, surface relaxes with a single low-frequency wobble
   (~3–4Hz screen-time), NOT a multi-mode ringing. One drumhead
   mode, decaying over ~600ms. Anything richer reads as foam, not
   ferrofluid.
3. **Defect flow (Sixty Symbols).** When magnet translates laterally,
   the hex lattice re-tiles via row-by-row dislocations gliding at
   ~0.3 lattice-spacings/sec. Implement as a 2D Voronoi seed field
   advected by `u_mouse - u_mouse_prev` with seeds rejected/spawned
   on a `length(seed - mouse) < r_field` threshold.
4. **Apex highlight kill.** In real footage spikes are *matte black*
   at the tip — almost zero specular — because the field-aligned
   nanoparticles scatter rather than mirror. Resist the urge to chrome
   the tips. Specular should peak at ~30 deg off-axis on the *flank*,
   never the apex.

## glsl_path
Curves go into the field-strength driver (downbeat → silent-erupt
LUT) and the skin-relaxation pass (drumhead from item 13, retuned).
Defect flow lives in the lattice-seed pass (`u_mouse` driver).
Apex-highlight kill is a one-line fix in the BRDF: multiply specular
by `1.0 - smoothstep(0.85, 1.0, dot(N, field_dir))`.

## caveats
- Don't average multiple footage sources; their lighting differs and
  the timing curves blur into mush. Pick ONE clip per move.
- 1000fps footage played at 60fps is already 16x slowed; remember to
  remap when porting to screen time.
- Skin recoil amplitude must not grow with bass — it's a *release*
  signature, not a hit signature.

## references
- [Over 50 Minutes of Ferrofluid in Slow Motion — NightHawkInLight](https://www.youtube.com/watch?v=vGhKNLxJjYk) — silent-erupt reference
- [SLOW MOTION SCIENCE! Ferrofluid dropping on magnet — NightHawkInLight, 1000fps](https://www.youtube.com/watch?v=04v4qWVtdPs)
- [Super Hydrophobic Surface and Magnetic Liquid — Slow Mo Guys, 2500fps](https://www.youtube.com/watch?v=i3jA40arq9Y) — skin recoil
- [Ferrofluid in Slow Motion — Sixty Symbols (Mark Miodownik / Cambridge)](https://www.youtube.com/watch?v=E2hHbgAAnjc) — defect flow on translating magnet
- [Ferrofluid and the Rosensweig Instability](https://www.youtube.com/watch?v=YlrszoiGzJ4) — clean lattice formation reference
- "Concerning Reality" channel: searched and could not confirm a ferrofluid episode exists under that exact name — likely misremembered. The four sources above cover the same ground.
