## summary
As the normal magnetic field on a ferrofluid layer crosses successive thresholds, the surface walks an ordered ladder: flat → hexagonal lattice of peaks → penta–hepta defects appear → square lattice → labyrinth/disorder. The transitions are hysteretic and defect-mediated, not smooth pattern morphs (Cowley & Rosensweig 1967; Abou, Wesfreid & Roux 2000).

## why_mesmerizing
A pure hex grid is dead-decorative. A pure labyrinth is noise. The hypnotic state is the *coexistence frame*: a regular hex sea with a single 5-7 dislocation pair gliding through it, then a slow cascade where neighbouring cells flip to a different lattice as the field rises. The eye locks because it expected order, found a defect, then watched the defect propagate. This gives free narrative — "field is rising" — without text. Bar/section transitions in audio map naturally onto the threshold crossings.

## concrete_steal
Parameterise lattice state by a single audio-driven control `mu = mix(0.0, 1.6, audio.section_intensity)`:

- `mu < 0.4` — flat (`spike_amp = 0`)
- `0.4 ≤ mu < 0.8` — hex: peaks at `dot(p, k_i)` for three wavevectors at 0°/60°/120°, common wavenumber `k_c ≈ 2π / l_c` where `l_c = sqrt(σ/(ρg))` is the capillary length (use `l_c = 0.07` of screen height as the artistic stand-in)
- `0.8 ≤ mu < 1.2` — inject a penta-hepta defect: locally rotate one of the three k-vectors by `π/12` inside a Gaussian pocket centred on a slow-drifting point
- `mu ≥ 1.2` — blend toward 4-vector square pattern (k at 0°/45°/90°/135°), with the hex contribution decaying as `exp(-3*(mu-1.2))`

Field as height: `h = sum_i A_i(mu) * cos(dot(p, k_i) + phi_i(t))`. Defects = local phase singularity `phi_i += atan(p.y - dy, p.x - dx)`. Threshold crossings on the *downbeat* — visible phase-lock comes free.

## glsl_path
Sim pass (rgba16f), one MAD per wavevector → 3-7 cosines per pixel = cheap. Output stored as height field; spike geometry comes in display pass via gradient → faked normal. Don't try to evolve a full Cahn-Hilliard / amplitude-equation system in real time — pre-baked threshold ladder driven by `mu` is the mesmerizing part anyway.

## caveats
- Three k-vectors at exactly 60° give a hex pattern with peaks AND troughs equally tall; pick `cos(...) ` clamped to `max(0, .)` and offset, otherwise the inverted lattice reads wrong.
- Phase-singularity defects need to be smooth (Gaussian envelope, σ ≈ 3 cells) or they look like a blit error.
- Don't morph hex→square continuously in space across the whole frame — patches transitioning at different times reads as physics; uniform crossfade reads as a slider being dragged.

## references
- Cowley, M.D. & Rosensweig, R.E. (1967). *J. Fluid Mech.* 30, 671. https://doi.org/10.1017/S0022112067001697
- Abou, B., Wesfreid, J.-E. & Roux, S. (2000). The normal field instability in ferrofluids: hexagon–square transition mechanism and wavenumber selection. *J. Fluid Mech.* 416, 217–237. https://doi.org/10.1017/S002211200000882X
- Friedrichs, R. & Engel, A. (2001). Pattern and wave number selection in magnetic fluids. arXiv:nlin/0102004 https://arxiv.org/abs/nlin/0102004
- Richter, R. & Barashenkov, I.V. (2005). Two-dimensional solitons on the surface of magnetic fluids. *Phys. Rev. Lett.* 94, 184503. https://doi.org/10.1103/PhysRevLett.94.184503
- Lange, A., Reimann, B. & Richter, R. *Surface Instabilities of Ferrofluids* (Springer LNP). https://link.springer.com/chapter/10.1007/978-3-540-85387-9_3
