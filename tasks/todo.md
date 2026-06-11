# le-mystere-abyssal — birthday piece for Alexandre

**Brief (Louis, 2026-06-11).** A chef-d'oeuvre on MPL's "Le mystère
abyssal" for his friend Alexandre's birthday. Lyrics drive the
narrative arc; blue palette sanctioned; multi-day, no rush; reuse the
best of every prior piece. Full design:
`brainstorming/pieces/le-mystere-abyssal.md` (approved by Louis
2026-06-11). Previous todo (studio grades view, shipped) in git history.

## Plan

### Phase 1 — spine (DONE, commit d6e1c81)
- [x] Identify song, download audio, analyze with stems
- [x] Synced lyrics (lyrics.lrc) + narrative timeline vs analysis
- [x] Research: piece survey, brainstorm digest, film/physics/shader refs
- [x] Brief written + approved
- [x] NARRATIVE block (stage machine + depth curve + extinction)
- [x] water-column layer (aerial lagoon + hole disc + depth gradient + milky stratum)
- [x] caustics-veil layer (worley filaments, bar-phase axis, cursor agitation)
- [x] light-shaft layer (Snell disc + god rays + silhouette + radio thread)
- [x] meta.yaml real stack; renders verified by eye
- [x] inspect renders at narrative timestamps (added --times to inspect-music)
- [x] commit phase 1

### Phase 2 — voice & events (DONE, commit c950bca)
- [x] bubbles layer (vocal-stem emission, wobble trains, key vents, cursor deflect; gold on choruses; NO u_history — trails skipped, u_history is full-composite and would smear)
- [x] events layer (sonar bar rings A3, dice hex snap @83.61, radio static 96–98.4, question lights ×5, chorus rings)
- [x] commit (note: inspect-music captures ~0.9s late; sample one-shots at t−0.9)

### Phase 3 — deep & sun (DONE, commit 74c83d4)
- [x] sun-bloom layer (distant star @67 → nearer chorus 2 → C3 flood + upward rays; key-fed gain; bypasses extinction)
- [x] deep-life layer (marine snow + C1 reversal flip, cursor dino-sparkle, lure, dissolution particles, key jelly-pulses)
- [x] full-song inspect-music run + clip-peak

### Phase 4 — critique & infra (2026-06-11 second session)
- [x] record-mode clip capture fixed (3 stacked bugs: headless-shell has no
      GPU → swiftshader at 3fps on FBO pieces → ~1 frame per clip; MediaRecorder
      flush-at-stop empty blob → timeslice; capture via 2D mirror). New
      bin/browser-launch.mjs (new headless + gl-egl → RTX 4090 @63fps); retry in
      inspect-music. Full clip set recorded.
- [x] pause bug fixed runtime-wide (u_time jumped to wall clock on pause and
      kept animating; now pins to audio clock when paused mid-track) — DEPLOYED
- [x] critic run v1: **structural-rethink** (prediction fail on final-act
      monotony, sun white-not-gold, zero coupling edges, reversal illegible)
      — brainstorming/critiques/le-mystere-abyssal-v1.md
- [x] grades view picks up the critique (API serves structured YAML ✓)

### Phase 5 — v2 redlines (Louis's watchthrough + v1 critique) — DONE
Part 1 (0–64s):
- [x] progressive accretion: calm → waves 4.5s → glitter 6.5s → sky
      reflections 8s → watercolor sky 10.5s → hole arrives 12.8s (chords)
- [x] sky watercolor wash (drifting pigment, lagoon color bleeding up)
- [x] hole integrated: contour displaced by the wave field, surface texture
      drowning over the edge, rim shimmer on the wave phase
- [x] sonar = warping pressure pulse in water-column + caustics (legend:
      gentle 8s; expedition: bar-locked); drawn overlay ring removed
Part 2 (64–143s):
- [x] dice on the words (~87.4s)
- [x] scaphandrier SDF (helmet/torso/arms/boots, slow limb clocks, helmet
      glint, line meets the helmet) — upright hard-hat suit per the lyric
- [x] bubbles as glass: u_below lens refraction, fresnel rim, mirrored
      glint, perfect circles, blend normal — first true coupling edge
- [x] chorus-2 narcosis: 5-wave interference dream (deep blue + gold seams,
      cursor-bent), slow lazy gold orbs
From the v1 critique (final act):
- [x] gold reads: sunPresence() carves darkness (water + window step back),
      saturated gold body + tiny white-hot heart
- [x] reversal legible: vertical streak-rain + dawn from above
- [x] C3 geometry reconfigures: bubbles + snow wheel around the risen sun
- [x] outro resurfaces: light-bloom crossfade → horizon bookend → the hole
      a small coin with her ember inside (recapitulation)
- [x] v2 evidence: 8 story-window clips (--clip-times added)
- [x] critic run v2: **chef-doeuvre** — mesmerizing 5/5 (Prediction hard
      gate passes), claim check pass (warm px 43 → 26k–49k, R/B 0.90 →
      1.16–1.35), all dims ≥ 4. Grades view shows v1 → v2.

### Phase 6 — remaining (post-watchthrough)
- [ ] Louis watchthrough #2 (the real gate) — especially 124–143s dream,
      195–228s bloom + resurfacing
- [ ] brief-level leftovers the critic ranked (no tweak invented at
      chef-doeuvre, recorded honestly): C2 remembrance ~26s one-vocabulary
      (the friend-light from the brief was never implemented), coupling
      still thin (1 real edge), bass never moves geometry, narcosis field
      low-contrast at normal exposure
- [ ] dedication on the studio page; publish

### Phase 6 — iterate & ship
- [ ] /vjay-iterate loops until ship-it/chef-d'oeuvre
- [ ] Louis watchthrough #2
- [ ] dedication line on studio page (meta notes already carry it)
- [ ] publish

## Review

- 2026-06-11 (phases 1-3, one session): all 7 layers live; every story
  beat verified on stills at the exact lyric timestamps. Tip-under
  choreography (disc swallows → darkness → window blooms) landed after
  one fix round; Snell window center had to slide down-frame with depth
  to stay visible; sun positions had to come INSIDE the frame (p.y >
  -0.5) to read; chorus-1 glimmer works as a tiny distant star, not a
  bottom-edge halo. Motion deltas (0.6s pairs): aerial 19%, descent
  4.5%, twilight 7%, reversal 6.5% (after snow boost; was 1%), bloom
  25% pixels changed.
- Capture gotcha for one-shots: inspect-music screenshots land ~0.9s
  after the requested seek — sample dice/static/questions at t-0.9.
- Bubble trails via u_history were cut deliberately: u_history holds
  the full composite, so trails would smear the window and caustics.
