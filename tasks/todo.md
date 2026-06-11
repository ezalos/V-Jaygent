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

### Phase 4 — critique & polish
- [ ] FIX FIRST: record-mode clip capture broken (see pbms.md 2026-06-11) —
      blocks clip-based critic probes
- [ ] /vjay-iterate le-mystere-abyssal (critic loops until ship-it/chef-d'oeuvre)
- [ ] Louis watchthrough + redlines (live at http://127.0.0.1:7777/le-mystere-abyssal)
- [ ] dedication line on studio page (meta notes already carry it)
- [ ] deploy check on vjaygent.develle.fr; publish

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
