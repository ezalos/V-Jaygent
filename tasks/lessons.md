# lessons — pointer file

V-Jaygent's lessons live in **auto-memory feedback files**, not in this
flat document. The global `~/.claude/CLAUDE.md` self-improvement loop
asks for "update `tasks/lessons.md` with the pattern" — for V-Jaygent
that means **save a new feedback memory under V-Jaygent's project
memory directory and add a one-line entry below**. The structured
frontmatter + auto-injection of memories into context is strictly
better than a flat append-only log.

Canonical location:
`~/.claude/projects/-home-ezalos-42-V-Jaygent/memory/feedback_*.md`

Each entry below is a one-line hook. Open the named file for full
context, the `Why:` line, and the `How to apply:` rule.

## Current lessons

- **Aesthetic autonomy** — commit to taste; reserve `AskUserQuestion`
  for scope, not aesthetic menus. (`feedback_creative_autonomy.md`)
- **Liveness default** — pieces err alive/chaotic/fast; cursor as
  instrument with ≥2 axes. (`feedback_liveness_interactivity.md`)
- **Multi-layer + multi-input default** — 3-7 layers, cursor +
  keyboard + audio coupled into one piece.
  (`feedback_multi_layer_multi_input_default.md`)
- **Per-layer interactivity audit** — STRONGER: 2-4 layers must each
  visibly react to cursor + keyboard, not just one ripple-layer.
  (`feedback_per_layer_interactivity.md`)
- **Music phase-lock visible on screen** — bar/beat/downbeat drive
  GEOMETRY (rotation, snap, expanding ring), not amplitude →
  brightness. Sections must announce themselves visibly.
  (`feedback_visual_phase_lock.md`)
- **Time-series probes when iterating** — capture frames at multiple
  timestamps + measure pixel delta; single stills miss frozen /
  decoupled-from-music failures. (`feedback_iterate_with_motion_probes.md`)
- **inspect.mjs cursor sentinel caveat** — historically u_mouse landed
  near canvas centre even though the script claimed to park it at
  (0,0); fixed in this commit. Older inspect frames may still show
  centred cursor effects. (`feedback_inspect_cursor_sentinel.md`)
- **Runtime caveats (12 items)** — TDZ on top-level await, time_source
  freeze, antialias blit, GPU init race, u_mouse=(0,0) is corner not
  centre, rg-encoded leak, fbm grid artifacts, smoke-passes-but-broken,
  uvx env, container rebuild rules, decay-constant ≠ half-life,
  headless AudioContext autoplay. (`feedback_runtime_caveats.md`)
- **Layer authoring traps** — `fire = u_below*gain` bleaches palette;
  glitch-rgb above u_history consumers in headless inspect = white-
  static feedback loop. (`feedback_layer_authoring_traps.md`)
- **Plan mode use** — Claude's judgment call; either asking or
  switching autonomously is fine. (`feedback_ask_before_plan_mode.md`)
- **Realtime basin/fractal pieces** — use the Newton fractal, not
  integrated gravity dynamics (marbles at realtime res); when a brief
  names something a reference renders OFFLINE, check the algorithm's
  realtime fit at the brief stage. (`feedback_realtime_basin_pieces.md`)
- **Animate the landscape** — pixel-to-state-map pieces (Lyapunov,
  basin, escape-time) need a slow drift of a global parameter OR
  pan/zoom of the sampling, else the field is static frame-to-frame;
  cursor/keyboard alone won't break the freeze in idle.
  (`feedback_animate_the_landscape.md`)
- **Cyclic palette** — for basin/index-rotation pieces, a linear
  palette ramp blinks visibly at the wrap point (cream→wine jump);
  use an N-waypoint cyclic palette sampled with rotational index +
  lerp so the wrap is invisible. Same memory also catches the
  diagonal-flow shimmer gotcha (same time multiplier on both axes
  of `vnoise(p*A + time*B)` slides the field diagonally).
  (`feedback_cyclic_palette.md`)
- **Critique files are the record** — every piece-creation/iterate
  run must write `brainstorming/critiques/<slug>-vN.md` and commit
  it; the studio grades view renders only from those files, so a
  verdict that lives in conversation or a commit message is
  invisible to the catalog. Check `ls brainstorming/critiques/<slug>-*`
  before the run's commit. (`feedback_critique_files_are_the_record.md`)

## How to add a new lesson

1. Save a new memory file under
   `~/.claude/projects/-home-ezalos-42-V-Jaygent/memory/feedback_<topic>.md`
   with frontmatter (`name`, `description`, `type: feedback`) and a
   body structured as `<rule>` + `**Why:**` + `**How to apply:**`.
2. Add a one-line entry to `MEMORY.md` in the same directory.
3. Append a one-line bullet here, pointing at the new feedback file.

Memory entries get auto-injected into future Claude sessions; this
file is the human-readable index.
- **Test player controls by hand** — pause/seek/resume are part of the
  piece; headless stills/clips never press them (the pause wall-clock
  bug shipped on every audio piece). (`feedback_test_player_controls.md`)
- **Compact-support emission kernels + lint-seams** — box early-outs chop audio-widened glows into straight seams (luminous-verse peak, user-caught); kernels fade to zero inside the box, swell lives in the bloom pass, `bin/lint-seams.mjs` in every verification. (`feedback_compact_support_emission_kernels.md`)
- **Integration probes** — orphan events, pasted overlays, perspective,
  boundary clips, accretion causality: live-watch patterns the stills
  critic missed, now a taste.md probe group.
  (`feedback_integration_probes.md`)
- **Watchthrough lessons loop** — aesthetic redlines ARE corrections;
  every batch ends with a lessons pass, now contractual in CLAUDE.md.
  (`feedback_watchthrough_lessons_loop.md`)
- **Binary critic criteria** — every critic criterion must be a simple
  unambiguous binary question; weak/weak-pass, shader-\*, and
  \*-unclear grades are abolished (can't-tell = fail; harness gaps get
  new captures, not code-reading); the 1–5 dimensions get decomposed
  too. Rework staged behind the deep-research pass — brief at
  `learning/critic-rework-research-brief.md`.
  (`feedback_binary_critic_criteria.md`)
- **Fix without regrade** — post-critique geometry/motion fixes get a
  clip watched before handback; stills + "motion will tell" shipped
  the perspective-pulse regression. (`feedback_fix_without_regrade.md`)
- **Cahn-Hilliard / conserved-field craft** — global pulls flatten
  conserved fields (bulk has no restoring force; bias = single-phase
  evaporation instead); grid isotropy needs 9-pt stencils AND
  rotation-not-translation drift AND alternating shear; explicit-CH
  stability ceiling DT·mob·γ ≈ 0.078 (debris that self-heals = CFL,
  not content); beat displacement must exceed half the pattern period.
  (`feedback_cahn_hilliard_craft.md`)
- **Stripe-aperture trackability misfire** — warp_err fails on
  stripe-dominated fields regardless of real smoothness; override kit =
  jerk_smooth passing + 12fps dense slice + fail-magnitude ∝ stripe
  fineness. Harness wishlist: stripe-aware trackability + a
  keyboard-event capture tool (both gaps shipped in no-son-of-mine's
  critiques). (`feedback_cahn_hilliard_craft.md`)
- **rot2d is CLOCKWISE** — `lib/math.glsl rot2d(a)` is column-major
  `mat2(c,-s,s,c)` = CW (the comment said CCW; corrected 2026-06-14).
  For sign-sensitive integration pass `rot2d(-a)`; `rot2d(a)` turned the
  soudarded Kuramoto coupling into anti-diffusion → Nyquist checkerboard.
  Suspect this first when a rotation has the wrong sign.
  (`reference_rot2d_handedness.md`)
- **Kuramoto / oscillatory-media craft** — pure Kuramoto α≈0 (Sakaguchi
  α large = frustrated fine static + stabilises the antiphase
  checkerboard); seed smooth near-uniform phase + planted `atan` spiral
  cores (random seed = a defect labyrinth that won't coarsen in a song);
  coarse sim lattice (~0.20) for screen-visible spirals; trackability +
  depth_octaves both misfire on smooth cyclic phase fields.
  (`feedback_kuramoto_phase_field_craft.md`)
- **Headless idle cells go black for time_source:audio multipass** —
  inspect-interaction's no-audio cells (matrix-cursor/neither) capture
  pure black (autoplay/rAF artifact, NOT a shader bug — render loop isn't
  audio-gated); grade idle/cursor-only via matrix-music + wall-clock.
  (`reference_headless_idle_audio_black.md`)
- **/vjay-* skills aren't Skill-tool registered** — read
  `skills/vjay-*/SKILL.md` and follow manually; the independent critic
  loop isn't auto-invokable. (`reference_vjay_skills_invocation.md`)
- **Catalog-distinctness check before locking a thesis** — grep
  `pieces/*/meta.yaml` + `brainstorming/pieces` for the canonical
  algorithm AND the visual language; the catalog is ~55 pieces and a
  near-duplicate fails the distinctness bar. kaaris-63's first dark-trap
  thesis was nearly identical to `we-owe-no-one`'s Voronoi fracture
  forge — caught only by reading its meta. Now a gate in vjay-new-piece
  §1b. (`feedback_catalog_distinctness_check.md`)
- **GLSL reserved words bite as shader locals** — `patch`, `active`,
  `sample`, `filter`, `input`, `output` etc. compile-error as `Illegal
  use of reserved word`; cost 2 round-trips on kaaris-63. Now a caution
  in vjay-new-piece §7. (`reference_glsl_reserved_words.md`)
- **Zoom/tunnel-piece craft** — compact the central glow (additive core
  + audio envelope blows to a white disc at the drop; let clench/rings/
  flares carry drop intensity); trackability/jerk misfire on the
  radial-zoom 1/r singularity + headless fps — grade continuity by a
  0.1s temporal strip and document the override.
  (`feedback_zoom_tunnel_pieces.md`)
- **Drops must escalate to chaos** — at the drop the lead transforms to a
  wilder mode (flythrough/tunnel = radial 1/r streaks rushing out, over
  the edge), not just brighter; "unpredictable, unlike music" = chaos
  from fbm(depth,time), not the beat. taste.md intensity `drop_escalates`.
  (yaktin-beni watchthrough redline #1 → `feedback_drops_escalate_to_chaos.md`)
- **Point-lights must read round** — N-tap ring bloom = N-gon corona (use
  golden-angle); `pow(angular field, n)` = diamond dots; round glow ×
  angular field = carved corners. Render lights as round gaussians gated
  by SMOOTH terms only. taste.md composition `glints_round`.
  (yaktin-beni watchthrough redline #2 → `feedback_round_point_lights.md`)
- **Nested mirror richness** — Louis likes a kaleidoscope inside each fold
  wedge ("mirror stuff inside the triangle mirrors"); 2-level kaleidoFold
  (KIFS), bigK matched to the pattern symmetry, subN 2-3; keep round
  lights on the UNFOLDED coords.
  (yaktin-beni watchthrough redline #3 → `feedback_nested_mirror_richness.md`)
