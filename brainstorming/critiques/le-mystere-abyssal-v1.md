# le-mystere-abyssal — iteration 1 critique (first recorded)

Independent critic, first recorded critique for this piece. Birthday-gift
piece (Pour Alexandre) set to MPL "Le mystère abyssal" (L'Étoile, 2020),
228.5 s, 95.7 BPM, G minor. Architecture: 7-layer `layers:` stack
(water-column / caustics-veil / light-shaft / sun-bloom / bubbles /
deep-life / events), every layer carrying an identical hand-authored
NARRATIVE state machine gated on `u_time` (11 stages, synced to
lyrics.lrc), `time_source: audio`, `keyboard_synth: true`. Sanctioned
BLUE palette (VISION cold exception: form = water; the warm accent is
the underwater sun of the chorus myth). Build phase 3 of 4 — this is
the phase-4 entry critique.

**Evidence basis.** The six canonical `inspect-music` stills (19:30
render, full final stack), frames extracted at fps=1 from all five
window clips (w0–w4), and 17 build-phase stills covering the narrative
stages the clips miss. Everything graded from is snapshotted in
`evidence/le-mystere-abyssal-v1/`. Pixel measurements (luminance,
warm-pixel counts, inter-frame deltas) via numpy. Four evidence
caveats, established before grading:

1. **clip-peak.mp4 is byte-identical to clip-w3** (md5
   `44891b2a…` both). "Peak" = energy-envelope peak at t=187.8 (C2
   remembrance) — NOT the narrative climax C3 sun-bloom (195.2–215),
   which has **zero clip coverage**. C3 is graded from build stills
   (t206.5, t210.9) plus the canonical t219.6 still.
2. **The clip windows oversample the final act and skip the middle.**
   Windows at 3.8 / 64.2 / 173.0 / 187.8 / 223.0 — nothing between
   69.2 and 173.0, i.e. B2 descent, B3 twilight, B4 abyss and most of
   C1 (45 % of the piece, the narrative-densest stretch) have no
   motion coverage. Graded there from build stills, which were
   rendered at t+0.9 s by design (one-shots sampled mid-flight) and
   some of which predate the last edits to deep-life (12:58) and
   sun-bloom (12:45). Where a build still and the shader disagree, the
   shader is cited.
3. **Cursor sentinel.** `bin/inspect.mjs` parks `u_mouse` near canvas
   centre, not (0,0); every layer's `mouseIdle` test (`u_mouse < 1px`)
   is therefore FALSE in all captures — the pressure pocket, sparkle
   halo and ray-bend are live at frame centre throughout. Central
   darkening or centre glints in captures are partly cursor artefacts.
4. **No u_history anywhere** in this stack, so stills do not suffer
   the accumulation under-representation problem — stills and clips
   agree wherever both exist.

## The claim

This piece claims that depth is loss and light is memory: one unbroken
fall through a water column where the channel-ordered death of colour
(red by depth 0.25, green by 0.70, blue dimming to near-black) tells
the story of the diver who never resurfaced — while the warm sun under
the water, **the only warmth in the piece**, deliberately bypasses
extinction and blooms exactly on the choruses, when the friends choose
myth over grief.

## Frame-by-frame

| Frame | t (s) | Stage | What's there |
|-------|-------|-------|--------------|
| still t1.0 / clip-w0 | 1–8.8 | A1 surface | Sugimoto bisected horizon, bright turquoise lagoon (meanL 0.561), drifting glitter, the small dark disc of the blue hole dead centre with pale reef rim. Within-clip deltas 0.012 — calm shimmer. |
| still t30.6 | ~31.5 | A2 legend | Same aerial scene; disc slightly larger, faint echo-ring radiating from it. To a cold eye, near-identical to A1. |
| still t50.0 | ~50.9 | A3 expedition | Disc visibly grown; a concentric sonar ripple around it mid-flight — the bar-grid ping caught frozen. Still the aerial vocabulary. |
| clip-w1 f01→f05 | 64.7–68.2 | B1 tip-under | The piece's best 5 seconds: the disc swallows the frame (deltas 0.20, meanL 0.494→0.037), teal rim sliding off-screen, then near-black "eyes adjusting" (f05 maxL 0.091). A genuinely cinematic fall. The chorus-1 "warm star" (due 67–71 s) shows **zero warm pixels** in f05. |
| still t71.0 | ~71.9 | B1 | Near-black navy; one tiny star bottom-centre — measured peak RGB (0.173, 0.165, 0.157): **grey, not amber**. |
| still t83.0 | ~83.9 | B2 dice | Two pale hexagon outlines mid-expansion against the dim window — the double-six snap reads clearly. |
| still t95.0 | ~95.9 | B2 | Diver silhouette (dark capsule, blue rim) below the Snell window, the radio thread a wobbling bright line to the surface — visibly fraying. Strong story pixel. |
| still t97.0 | ~97.9 | B2 sever | Thread GONE; diver alone with two bubbles above her. The before/after of the sever lands. |
| still t100.0 / t107.0 | ~101/108 | B2 | Bubble field everywhere (vocal-stem emission on from 98.9); a soft cyan question-light glows lower-left at t108. |
| stills t130.0, t135.6 | B3 twilight | midnight field, dense bubbles with **champagne-gold rims** (2 970 / 7 883 warm px — the only honestly warm captures in the piece), warm sun-glow seeping in from below (peak RGB 0.66, 0.56, 0.41). |
| still t146.0 | ~146.9 | B4 milky | Grey H₂S stratum band across the frame, biolum-blue dissolution motes arcing below — a real vocabulary change. |
| still t150.0 | ~150.9 | B4 abyss | Near-flat dark field (p5–p95 luminance range 0.006!), faint blue blobs, the lure-light. Quietest, emptiest frame. |
| still t160.6 | ~161.5 | C1 reversal | Near-black (meanL 0.027) with barely-visible snow motes. The Viola reversal — the act's whole idea — is **illegible** here. |
| clip-w2 | 173–178 | C1→C2 | Bright Snell window top-centre, blue gradient, sparse specks, god rays. Deltas 0.007–0.010, slow smooth drift. |
| clip-w3 (=clip-peak) | 187.8–192.8 | C2 | Same configuration; bubble trains arrive (the 189.2 event) — more and brighter bubbles by f03. |
| stills t205.6, t210.0 | C3 sun-bloom | Window above, dense bubbles, and the sun: a large **white** glow (core RGB 0.872, 0.921, 0.966 — R/B 0.90, bluer than white; 43 warm px in the whole frame). The myth blooms cold. |
| clip-w4 / stills t219.6, t222, t226.4 | 215–228 | D outro | Window top-centre, faint whitish floor-glow receding (bottom-centre R/B 0.36→0.18 across the clip), sparse bubbles. No horizon bookend — the camera never resurfaces. meanL rising 0.354→0.378; the end state is tonally the same scene as C2. |

## Mesmerizing probes

Declared timescales for Prediction: **continuity 1 s** (95.7 BPM
chanson, gentle ballad — slow end of the range), **divergence 20 s**
(228 s narrative long-form with an 11-stage score).

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | weak | Candidates do migrate across the piece (disc → diver/thread → gold bubbles → lure → window/sun-glow), but within long stretches the gaze is parked: the disc sits dead-centre for the entire first 64 s, and the Snell window owns top-centre for the final ~73 s. In the canonical six stills the landing spot changes exactly once (disc-centre → window-top). t161 offers nothing at all. Not a single locked spot across all frames, but not a wandering composition either. |
| Prediction | **fail (b)** | (a) Continuity at 1 s: **pass** — every clip is smooth continuous drift (deltas 0.007–0.02; even the w1 fall is a coherent zoom at 0.20, trackable, no tears, no chromatic separation, no pixel noise). (b) Divergence at 20 s: **fail** — w2 (173), w3 (187.8) and w4 (223) are the same picture: bright window top-centre + blue gradient + specks drifting up. Cross-window mean deltas 0.055–0.140, mostly luminance; same flow configuration, same event vocabulary. Seven still samples across 173–228 corroborate: the C3 "climax" reads as *the same scene plus a white glow* (t206), not a reconfiguration — the brief's "gentle orbital drift of everything around it" was never implemented (sun-bloom/shader.frag draws the glow; no layer's geometry references the sun). A viewer who watched 173–178 can fully imagine 223–228. The first half diverges magnificently (aerial → fall → descent → abyss are categorically different vocabularies, stills prove it), but the captured final third — a full act of the piece — is one vocabulary, and per the house calibration rule "learnable/predictable" notes must grade fail, not weak. |
| Squint | pass | Aerial blurs to bright-field-with-dark-coin; the fall to a teal annulus on black; descent frames to bright-window-over-dark; t146 to a grey band splitting dark halves. Fine texture (caustic filaments, bubble rims and glints, snow) rewards stepping close. Exceptions: t150/t161 blur to uniform dark — graded as silence-as-form, but they are ~20 s of no composition. |
| Hue drift | pass | Turquoise lagoon → cobalt → midnight → abyss-black → blue → azure: one cold family, drifting slowly with depth, luminance doing the contrast work. No frame-to-frame hue jumps anywhere in the captures. The drift is the extinction spine working as designed. |
| Mystery | pass | The piece withholds well: what's at the bottom of the disc, whether the star below is real, the figure-ground inversion (dark-disc-in-bright-sea becomes bright-disc-in-dark-sea), the thread that snaps mid-frame, a lone lure blinking in nothing. The strongest mystery beats (sever, stratum, dissolution) are genuinely cinematic. |

**Mesmerizing result: 3/5 passes; Prediction — the hard gate — fails
on sub-test (b), too predictable in the final act.** Per taste.md this
forces `structural-rethink` regardless of the other probes.

## Interaction probes

Piece declares `cursor: true`; `u_mouse` reaches 5 of 7 layers.

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | shader-pass | The god-ray fan re-orients toward the cursor (light-shaft.frag:126–127, `bend` up to ±0.6 rad on the whole fan) — a macro feature, not just a local halo. The other four bindings are local (pocket, agitation, deflection, sparkle). Marginal but real. |
| Idle | pass | The narrative machine + synthetic drivers self-play the full 228 s; all captures are near-idle-cursor and the piece composes throughout (caveat 3: cursor parked centre, not truly idle). |
| Readability | shader-pass | Hover → water parts (water-column:177–181), filaments sparkle (caustics:107), bubbles bow away (bubbles:107–111), sparkles ignite (deep-life:119–133) — "my hand stirs the water" needs no instructions. |
| Reversibility | shader-pass | Every cursor term is a memoryless function of current position; frame returns exactly when the cursor does. |
| Dominance | shader-pass | All cursor Gaussians are exp(−d²·6…9) local; ray-bend tops at 0.3·0.6 rad. Well under the 30 % energy ceiling. |
| Convention | shader-pass | Water parts around the hand, light leans toward it, bubbles avoid it — physical priors, nothing inverted. |
| Latency | shader-pass | No smoothing anywhere in the u_mouse paths; same-frame response. |
| **In the abyss, touch is the only light** | (bonus) | deep-life:121–122 scales sparkle ×1.6 as dep→1 — the brief's best interaction idea is wired, though no capture can show it. |

**Interaction result: 7/7** (all shader-verdicts; no live-cursor capture exists).

## Music reactivity probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Motion-over-luminance | shader-pass | Thin but real: `u_audio_vocals_stem` gates which bubble columns EXIST (bubbles.frag:75–83 emissionBase, :132 `alive = step(…emission…)`) — replace it with a constant and the bubble field's structure changes, not just its brightness. Everything else is brightness-family: bass→swell (water-column:159), mid→caustic gain (caustics:129,146), high→rayGain (light-shaft:134), vocals→thread pulse (light-shaft:180), level+bass→sun breath (sun-bloom:111). One geometric binding out of six is the minimum honest pass. |
| Bass→movement | shader-fail | `u_audio_bass` appears exactly twice: water-column:197→159 (`col += vec3(0,0.04,0.09)*bassDrive*…` — a brightness swell) and sun-bloom:97→111 (`breath = 0.85+0.30*drive` — a glow envelope). The canonical fail shape: bass only ever modulates how bright independent motion reads. The kick never moves a pixel. |
| Rhythm-in-stills | pass | t50.9 freezes a sonar ring mid-flight (bar-phase radius, events.frag:72–74); t83.9 freezes both dice hexes mid-expansion; w3 catches the 189.2 bubble trains arriving. Frozen time shows propagation, not just brightness states. |
| Quiet-reads-quiet | pass | The instrumental break lands on the abyss: t150 is dark AND becalmed (no rings, no thread, no bubbles emission at voc-low, lure only). Frame-verdict pass — with the honest note that this is the hand-authored score aligning quiet-to-quiet, not amplitude responding. |

**Music result: 3/4.**

## Song-level composition probes

`audio.analysis.json` present; layers reference `u_bar_phase`,
`u_bar_index`, `u_audio_vocals_stem`. No layer references
`u_section_*`, `u_downbeat`, `u_to_section_change`, or
`u_song_progress` (deliberate per the brief — the story is gated on
`u_time` against lyric timestamps).

| Probe | Verdict | Why |
|-------|---------|-----|
| Section-readability | pass | Frames at progress 0.05/0.25/0.45/0.65/0.85 ≈ t11/57/103/149/194: aerial lagoon / grown disc / diver+thread+bubbles / near-black abyss / window+bubbles+glow. Four of five unambiguously distinct (the 0.85 frame is the weak one — it reads like 0.65 C2 material). |
| Downbeat-anchored | shader-pass | Structural events are composed, not amplitude-triggered: caustic axis advances with the bar grid (caustics:111), sonar rings fire per bar (events:72–74), and every one-shot (dice 83.61, sever 97.0, chorus rings 64.04/124.66/195.25) is a hand-placed downbeat-aligned timestamp. Zero amplitude-triggered "big changes". |
| Pre-tension | shader-fail | `u_to_section_change` / `u_section_progress` appear nowhere. Nothing inhales before the B4 break or before chorus 3; stages arrive, announced only by their own first event. |
| Per-stem-discrimination | shader-fail | Exactly one stem is consumed (`u_audio_vocals_stem`, bubbles + thread pulse). Drums/bass/other stems unused — the probe needs two stems in visually different roles. |
| Long-arc | pass | Measured luminance arc: 0.561 (surface) → 0.037 (fall) → mid-water → 0.027–0.148 (abyss/reversal trough) → 0.321 (C3 bloom) → 0.37 (outro). A clear trough and a clear (if mis-coloured) bloom maximum. The arc is the piece's spine and it is real. |
| Recapitulation | weak | Intro: small dark disc centred in bright turquoise. Outro: large bright disc top-centre in dark blue — a genuine value-inversion of the same composition, which is elegant, but the brief's promised horizon bookend never happens (aerialAmount returns 0 for every stage ≥ 4 — the camera cannot resurface) and a cold viewer may not connect the two discs. Related-with-delta at best, unrelated at worst; ambiguous rounds down. |

**Song-level result: 3/6.** Below the 4/6 "song-aware composition"
bar — ironic for the most score-driven piece in the repo: the
hand-authored u_time machine does the composing, but the probe-visible
engine vocabulary (stems, pre-tension, section uniforms) is thin.

## Dual-input probes

Both `u_mouse` and `u_audio_*` declared and wired; `u_keys` besides.

| Probe | Verdict | Why |
|-------|---------|-----|
| Dual-channel readability | interaction-unclear | Needs a live cursor+music capture; not testable from these artefacts. |
| Channel-non-overlap | shader-pass | Audio owns emission/gain envelopes; cursor owns spatial perturbations (pocket, deflection, bend, sparkle). Where both touch one term (caustics: `(0.75+0.45*midDrive)*(1.0+1.8*agit)`, line 146) it's floor-and-ceiling multiplicative, not additive. |
| Music-without-cursor | pass | The captures are effectively this cell and the passing music probes pass in them. |
| Cursor-without-music | shader-pass | Every layer mixes a synthetic driver when `u_audio_playing = 0` (water-column:197, caustics:103, light-shaft:96–97, sun-bloom:96, bubbles:99, events:72); the narrative machine runs on u_time regardless; all cursor paths ungated. |
| Conflict-resolution | shader-pass | No additive arms race on any scalar. |
| Authority-during-build | shader-pass | No cursor term is gated by energy, section, or stage (the sparkle even gains in the abyss). |
| Idle-cell | shader-pass | The neither-cell self-plays: synthetic sin-drivers + the u_time story. Not captured, but this is the strongest possible shader case — the piece is a film before it is an instrument. |

**Dual-input result: 6/7.**

## Layered composition probes

`layers:` stack with 7 layers — all 11 probes apply.

| Probe | Verdict | Why |
|-------|---------|-----|
| Spatial-coupling | shader-fail | Zero coupling: every layer's meta declares `reads: []`, `consumes: []`, `publishes: []`; no `u_below` in any shader. No layer's consumed value moves another layer's pixels. The stack is a pure z-composite. |
| Polyrhythm-of-clocks | pass | Distinct clocks across the stack: u_time (all, at many rates), u_bar_phase/index (caustics, events), u_audio_bass (water, sun), u_audio_mid (caustics), u_audio_high (light-shaft), u_audio_vocals_stem (light-shaft, bubbles), u_mouse (5 layers), u_keys (3 layers). Well over 3. |
| Eye-distribution | weak | Mid-piece frames offer 2–3 regions (window / diver / bubbles); but A-act frames have exactly one (the disc), abyss frames zero, and the final act parks everything around the window. The dominance map migrates at act boundaries only. |
| Quiet-survives | shader-fail | Zero out light-shaft (the dominant underwater layer — it owns the window, rays, diver AND thread): B2–D collapses to a blue gradient with specks; eye-landing dies. The lead layer is load-bearing for the whole underwater composition. |
| Order-meaningfulness | shader-fail | Layers 2–7 are screen/add blends — commutative within each mode; swapping caustics-veil (#2) with bubbles (#5), or light-shaft (#3) with events (#7), changes nothing perceptible. Only the base layer's position matters. |
| Blend-saturation | pass | Peak-energy frame t206: meanL 0.321, p5 0.158 / p95 0.565 — luminance contrast well over 0.3, no cream soup. The add-budget discipline (soft saturates in every additive layer) held. |
| Coupling-cost | shader-fail | Edges: u_below 0 + consume 0 + u_history 0 = 0.0 edges / 7 layers. Independent stack — the probe's exact fail case. |
| Brightness-strobe | shader-fail | Four of seven layers carry brightness-shaped audio bindings (water-column:159, caustics:129/146, light-shaft:134/180, sun-bloom:111) — over the ≤1 bar. Mitigating: the gains are gentle and the clips show no visible per-beat blink; this is a letter-of-the-probe fail, not a strobe on camera. |
| Layer-distinctness | pass | Each layer's contribution is nameable in captures: the water+disc+stratum (water-column), the dapple/glitter (caustics), window+rays+diver+thread (light-shaft), the warm/white glow (sun-bloom), bubbles (bubbles), snow/lure/dissolution/sparkle (deep-life), rings/dice/static/questions (events). Removing any one visibly subtracts a vocabulary. |
| Multi-input coupling | pass | Three input channels reach the shaders (cursor 5 layers, keyboard 3, audio 6). Per-key distinctness holds: each key vents bubbles at its own x (bubbles:64–67, 137–145, white aqua / black violet) and rings its own jelly-pulse (deep-life:160–174); held-key sum feeds the sun (sun-bloom:100–102). |
| Visible phase-lock | pass | Three song-locked geometric receipts: sonar ring radius = bar phase (events:72–74), caustic axis = bar index + phase (caustics:111), bubble-column existence = vocal stem (bubbles:132); plus the lyric-timestamp one-shots (dice, sever, chorus rings) captured on camera at t83.9/t95.9/t97.9. The score IS the phase-lock. |

**Layered result: 5/11** (2/8 on the original eight — the stack
composes in parallel, it does not interact; everything here could ship
as one big shader with the same pixels).

## Claim check

**Fail — on its central pixel.** The extinction half of the thesis is
delivered beautifully: turquoise dies into cobalt, midnight, and a
near-black abyss exactly on the dive (w1's fall; t146→t161 captures),
and colour returns changed on the rise. But the myth half — *the warm
sun under the water, the only warmth, blooming on the choruses* — does
not survive compositing. Measured: **zero warm pixels in every clip
frame of the piece**; the chorus-1 star is grey (peak RGB 0.173/0.165/
0.157 at t71.9); the chorus-3 flood — the emotional climax the whole
piece builds to — renders as a *white-blue* glow (core R/B = 0.90,
43 warm px in 921 600 at t206.5). The cause is structural, not a
constant: sun-bloom is an `add` layer whose soft-saturate
(sun-bloom.frag:127) caps its emission near 2.0, while the C3 water
beneath it (depth 0.18 azure + Snell window + rays + caustics) carries
enough G/B that the sum goes white — gold-on-bright-blue cannot read
warm under add. The proof is in the piece's own captures: at B3
twilight, where the water is dark (depth 0.55–0.78), the SAME code
reads honestly gold (champagne bubble rims, warm glow at t130/t136 —
the only warm pixels in the evidence set). The myth ignores physics;
the compositing physics ignores the myth, exactly where the claim
needs it most.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 4 | One disciplined cold blue family, luminance-led, zero hue wars across 228 s — the sanctioned exception done properly. Not 5: the one intended warm accent reads white at its climax, and the C3 core bleaches. |
| Composition | 3 | The macro composition wanders at act pace (disc → fall → diver → band → window) with intrinsic empty zones — but it parks for ~64 s on a centred disc, ~73 s on a top-centre window, and t150/t161 are flat fields (p5–p95 range 0.006). |
| Motion | 4 | Multiple desynchronised scales everywhere: caustic churn, bubble rise + wobble, snow drift (which FLIPS direction at C1), glitter, slow narrative zoom; never frozen, direction always felt. Not 5: no beat-scale geometric motion anywhere — the mid-scale is missing, and the final act's motion is homogeneous drift. |
| Intensity & dynamic range | 4 | Real range, measured: meanL 0.561 surface → 0.037 fall → 0.027 reversal → 0.321 bloom. Quiet is structural (the break lands on an empty abyss). Not 5: within sections the response to the music is thin — amplitude only breathes gentle gains, so windows hold near-constant energy (w2–w4 meanL varies < 0.03). |
| Depth | 3 | Three z-cues (window above, gradient, parallax snow/bubbles) and fine texture up close — but it's base+texture; the fine scale never rewrites the coarse, and the abyss collapses to one flat resolution. |
| Form & ending | 3 | The arc is the piece's pride — a true through-composed score with an 11-stage spine, captured trough and bloom. But the ending doesn't land: the promised horizon bookend is unreachable in code (aerialAmount = 0 for stage ≥ 4), the sun's retreat is too subtle to read (w4 deltas 0.009–0.013, meanL *rising*), and the last frame is tonally a C2 frame. The track ends; the picture is still mid-water. |

## What's working

- **The tip-under is the best 5 seconds in the evidence set.** The
  disc swallowing the frame (w1, deltas 0.20 on a smooth zoom, light
  dying from 0.49 to 0.04) is genuinely cinematic — a one-shot camera
  fall that no other piece in the repo attempts.
- **The story reads in pixels, without the lyrics.** Dice hexes
  (t83.9), the diver under the window, the radio thread fraying
  (t95.9) then GONE (t97.9), bubbles becoming the only voice, the grey
  stratum (t146.9), a lure blinking in nothing — a cold viewer
  watching 83–155 s receives an actual narrative. This is the rarest
  thing the repo makes.
- **The extinction spine is honest physics, honestly rendered.** The
  same `extinction()` curve in all seven layers, and the captures walk
  it: red gone by mid-descent, green by twilight, blue starved in the
  abyss, colour returning changed on the rise.
- **Dynamic range is real** — 0.561 to 0.027 mean luminance with the
  trough exactly on the song's instrumental break, and add-budget
  discipline keeps the bright end from souping (t206 p95 = 0.565).
- **Multi-input wiring is complete and idiomatic.** Cursor reaches 5
  layers with distinct physical metaphors, all unsmoothed and ungated;
  15 keys map to per-column vents + jelly rings + sun gain; the
  abyss-sparkle ("touch is the only light") is the kind of
  depth-coupled interaction the interactivity doc asks for.
- **B3 twilight proves the gold CAN work** — champagne bubble rims and
  a warm under-glow at t130/t136, the only warm pixels captured, and
  they appear exactly where the water is dark enough to let them.

## What's imperfect

1. **The final act is one vocabulary for ~73 seconds (Prediction
   sub-test b — the hard gate).** w2/w3/w4 and seven stills from
   173–228 are interchangeable: window top-centre, blue gradient,
   specks drifting up. C3 — the climax — adds only a white glow to
   the same composition; the brief's "gentle orbital drift of
   everything around it" does not exist in any shader, and no layer's
   geometry knows where the sun is. C1's reversal, the one idea that
   could make the act distinct, is illegible (t161: meanL 0.027, snow
   barely visible — the direction flip has nothing visible to flip).
   The piece spends its narrative capital in the first 155 s and
   coasts home.
2. **The sun is white where the claim needs gold** (claim-check fail,
   detail above). The myth's warmth survives only at B3, inverting
   the thesis: warmth reads at the *secondary* chorus and dies at the
   chorus the piece is named for. Fixing this means carving darkness
   under the bloom (a local extinction well / multiplicative
   absorption under the sun before the add) or letting the sun's
   emission dominate the composite tonemap — not nudging gain.
3. **The layer stack doesn't interact** — 0 coupling edges across 7
   layers (all meta: `reads/consumes/publishes: []`, no u_below
   anywhere); quiet-survives and order-meaningfulness fail with it.
   The NARRATIVE block synchronises the layers in parallel, which
   makes the film coherent, but nothing any layer does changes where
   another layer's pixels go — these pixels could ship from one
   shader.
4. **Bass never moves geometry; one stem; no pre-tension.** The two
   `u_audio_bass` bindings are brightness envelopes
   (water-column:159, sun-bloom:111); drums/bass/other stems are
   unused; `u_to_section_change` is unreferenced, so choruses and the
   break arrive unannounced. For a 95.7 BPM song the visual beat
   floor is carried entirely by caustic flicker.
5. **The ending doesn't resolve.** The brief's horizon bookend is
   structurally impossible (aerialAmount hard-zero past B1), the
   outro's only gesture (sun receding, R/B 0.36→0.18) is beneath
   notice at clip frame rate, and the final frame is a C2 lookalike.
   Recapitulation survives only as the elegant-but-unstated
   disc/window value-inversion.
6. **Evidence pipeline gaps** (for the next run, not the piece): the
   "peak" clip duplicates w3 and misses C3 entirely; no clip samples
   83.6–173.0; the build stills that cover that stretch predate the
   final deep-life/sun-bloom edits. Sample windows inside B2, B4 and
   C3 before regrading.

## Verdict

**structural-rethink.** The hard gate decides it: Prediction fails on
divergence — three of five windows (everything after 173 s) are the
same picture, my own probe notes say a viewer could imagine one window
from another, and per the house calibration rule that is a fail, which
forces structural-rethink regardless of the strong groups (cursor 7/7,
music 3/4, dual-input 6/7). The claim check independently fails on the
thesis pixel: the sun that "blooms exactly when the friends choose
myth over grief" measures R/B 0.90 — white — at chorus 3, with zero
warm pixels in any clip. Neither is a parameter tweak: the first needs
the final act re-composed as three distinct vocabularies (a reversal
that visibly RUSHES upward, a sun-bloom that reconfigures geometry
around itself — the brief's own orbital drift — and an outro that
resurfaces to the horizon bookend), the second needs the compositing
relationship between sun and water rebuilt (darkness carved beneath
the bloom, or emission that dominates the tonemap) so gold can exist
over bright water. Combine both handbacks — they touch the same 60
seconds, and the first 155 s already carry a piece worth finishing:
the fall, the thread, the sever, the stratum, the lure are the best
narrative pixels in the repo. The dive is true; the resurrection isn't
yet.

```yaml
piece: le-mystere-abyssal
iteration: 1
verdict: structural-rethink
claim_check: fail
mesmerizing_passes: 3
mesmerizing_probes:
  eye_landing: weak
  prediction: fail
  squint: pass
  hue_drift: pass
  mystery: pass
interaction_passes: 7
interaction_probes:
  composition: shader-pass
  idle: pass
  readability: shader-pass
  reversibility: shader-pass
  dominance: shader-pass
  convention: shader-pass
  latency: shader-pass
music_passes: 3
music_probes:
  motion_over_luminance: shader-pass
  bass_movement: shader-fail
  rhythm_in_stills: pass
  quiet_reads_quiet: pass
song_level_passes: 3
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: shader-fail
  per_stem_discrimination: shader-fail
  long_arc: pass
  recapitulation: weak
dual_input_passes: 6
dual_input_probes:
  dual_channel_readability: interaction-unclear
  channel_non_overlap: shader-pass
  music_without_cursor: pass
  cursor_without_music: shader-pass
  conflict_resolution: shader-pass
  authority_during_build: shader-pass
  idle_cell: shader-pass
layered_passes: 5
layered_probes:
  spatial_coupling: shader-fail
  polyrhythm_of_clocks: pass
  eye_distribution: weak
  quiet_survives: shader-fail
  order_meaningfulness: shader-fail
  blend_saturation: pass
  coupling_cost: shader-fail
  brightness_strobe: shader-fail
  layer_distinctness: pass
  multi_input_coupling: pass
  visible_phase_lock: pass
scores:
  palette_cohesion: 4
  composition: 3
  motion: 4
  intensity: 4
  depth: 3
  form_ending: 3
top_fix: null
evidence:
  - evidence/le-mystere-abyssal-v1/music-00-t1.0-intro.png
  - evidence/le-mystere-abyssal-v1/music-01-t64.2-verse.png
  - evidence/le-mystere-abyssal-v1/music-02-t173.0-pre-peak.png
  - evidence/le-mystere-abyssal-v1/music-03-t187.8-peak.png
  - evidence/le-mystere-abyssal-v1/music-04-t219.6-quiet.png
  - evidence/le-mystere-abyssal-v1/music-05-t226.4-outro.png
  - evidence/le-mystere-abyssal-v1/music-01-t30.6-t31.png
  - evidence/le-mystere-abyssal-v1/music-00-t50.0-t50.png
  - evidence/le-mystere-abyssal-v1/music-00-t71.0-t71.png
  - evidence/le-mystere-abyssal-v1/music-00-t83.0-t83.png
  - evidence/le-mystere-abyssal-v1/music-01-t95.0-t95.png
  - evidence/le-mystere-abyssal-v1/music-01-t97.0-t97.png
  - evidence/le-mystere-abyssal-v1/music-01-t100.0-t100.png
  - evidence/le-mystere-abyssal-v1/music-02-t107.0-t107.png
  - evidence/le-mystere-abyssal-v1/music-01-t130.0-t130.png
  - evidence/le-mystere-abyssal-v1/music-05-t135.6-t136.png
  - evidence/le-mystere-abyssal-v1/music-03-t146.0-t146.png
  - evidence/le-mystere-abyssal-v1/music-02-t150.0-t150.png
  - evidence/le-mystere-abyssal-v1/music-07-t160.6-t161.png
  - evidence/le-mystere-abyssal-v1/music-06-t190.0-t190.png
  - evidence/le-mystere-abyssal-v1/music-09-t205.6-t206.png
  - evidence/le-mystere-abyssal-v1/music-07-t210.0-t210.png
  - evidence/le-mystere-abyssal-v1/music-08-t222.0-t222.png
  - evidence/le-mystere-abyssal-v1/clip-w0-f01.png
  - evidence/le-mystere-abyssal-v1/clip-w0-f02.png
  - evidence/le-mystere-abyssal-v1/clip-w0-f03.png
  - evidence/le-mystere-abyssal-v1/clip-w0-f04.png
  - evidence/le-mystere-abyssal-v1/clip-w0-f05.png
  - evidence/le-mystere-abyssal-v1/clip-w1-f01.png
  - evidence/le-mystere-abyssal-v1/clip-w1-f02.png
  - evidence/le-mystere-abyssal-v1/clip-w1-f03.png
  - evidence/le-mystere-abyssal-v1/clip-w1-f04.png
  - evidence/le-mystere-abyssal-v1/clip-w1-f05.png
  - evidence/le-mystere-abyssal-v1/clip-w2-f01.png
  - evidence/le-mystere-abyssal-v1/clip-w2-f02.png
  - evidence/le-mystere-abyssal-v1/clip-w2-f03.png
  - evidence/le-mystere-abyssal-v1/clip-w2-f04.png
  - evidence/le-mystere-abyssal-v1/clip-w2-f05.png
  - evidence/le-mystere-abyssal-v1/clip-w3-f01.png
  - evidence/le-mystere-abyssal-v1/clip-w3-f02.png
  - evidence/le-mystere-abyssal-v1/clip-w3-f03.png
  - evidence/le-mystere-abyssal-v1/clip-w3-f04.png
  - evidence/le-mystere-abyssal-v1/clip-w3-f05.png
  - evidence/le-mystere-abyssal-v1/clip-w4-f01.png
  - evidence/le-mystere-abyssal-v1/clip-w4-f02.png
  - evidence/le-mystere-abyssal-v1/clip-w4-f03.png
  - evidence/le-mystere-abyssal-v1/clip-w4-f04.png
  - evidence/le-mystere-abyssal-v1/clip-w4-f05.png
```
