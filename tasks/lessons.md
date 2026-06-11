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
