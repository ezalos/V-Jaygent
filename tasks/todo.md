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
- [ ] critic run v1 (in progress — independent agent, evidence-based)
- [ ] verify grades view picks up the critique (studio /api + catalog chip)

### Phase 5 — v2 redlines (Louis's watchthrough, 2026-06-11)
Part 1 (0–64s):
- [ ] progressive accretion, one new element every ~5s: calm water+sky
      bisection → waves/texture → reflections+glitter → THE HOLE appears at
      ~12.8s (chord entry = analyzer section boundary) → echo rings → rim reef
      → growth. Hole NOT present from t=0.
- [ ] sky is dead — give it the watercolor treatment (drifting pigment/cloud
      texture, lagoon color reflected into it)
- [ ] integrate the hole into the water: wave field must displace the disc
      contour (same phase as glitter), rim refraction — kill the "pasted
      overlay" feel
- [ ] sonar rings → warping PULSE: radial displacement wave that bends water
      texture + glitter + rim light as it passes (shared sonarPulse() in
      NARRATIVE block consumed by water-column/caustics), not a drawn overlay
      ring. Keep the flowing white dots.
Part 2 (64–143s):
- [ ] dice resync: hexagons fire at 83.6 (line start) but "un double six est
      sorti" lands ~87.5 — move the event to the words
- [ ] diver: replace the capsule with an articulated human silhouette (torso,
      head, arms, legs + fins; slow kick cycle; descent posture) — SDF figure
- [ ] bubbles as glass: read u_below and refract it through each bubble
      (lens distortion + scene reflections + window/sun glints), perfect
      circles (drop the y-squish), keep per-trail varied motion
- [ ] chorus 2 (124.7–142.9) pivot: drop "yellow blinking bubbles" as the main
      event — this is l'ivresse des profondeurs (rapture of the deep): a
      dreamy/abstract narcosis vocabulary (candidates: 5-wave interference
      field à la glass-figure in deep blue+gold, soft kaleidoscopic fold of
      the scene, slow gold orbs in Lissajous orbit around the sun glimmer).
      Pick one and commit.

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
