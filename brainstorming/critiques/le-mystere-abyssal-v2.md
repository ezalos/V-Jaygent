# le-mystere-abyssal — iteration 2 critique

Independent critic, second critique. Birthday-gift piece (Pour Alexandre)
set to MPL "Le mystère abyssal" (L'Étoile, 2020), 228.5 s, 95.7 BPM,
G minor. v1 verdict was **structural-rethink** (Prediction hard-gate fail
on the final act + claim-check fail on the white sun). The piece was
substantially rebuilt: the stack is now **8 layers** (new `narcosis`
layer for the chorus-2 dream), `bubbles` is a **normal-blend glass layer
reading `u_below`** (true refraction), a shared `sunPresence()` carves
darkness under the gold, the sonar became a warping pressure pulse
inside water-column + caustics, part 1 accretes element by element, the
diver is a proper scaphandrier SDF, and `aerialAmount()` now RETURNS in
stage 10 — the piece resurfaces to the horizon bookend with an ember in
the hole. This critique verifies each v1 failure against fresh captures
before grading.

**Evidence basis.** Six canonical stills (20:09 render) + EIGHT 5 s/60
fps story-window clips (w0 t5 / w1 t48 / w2 t92 / w3 t130 / w4 t148 /
w5 t160 / w6 t203 / w7 t221, rendered 20:09–20:12, i.e. after the last
shader edit at 20:06), frames extracted at fps=2 (80 frames), plus
corroborating stills. All snapshotted in
`evidence/le-mystere-abyssal-v2/`. Pixel measurements (luminance,
warm-pixel counts and R/B ratios, inter-frame deltas, cross-window
deltas) via numpy. Caveats established before grading:

1. **Capture offset:** stills land ~0.9 s after the named timestamp
   (t86.6 still shows t≈87.5). Clip windows start at the named t.
2. **clip-peak.mp4 is byte-identical to clip-w6** (md5 `3cc04092…`
   both). Unlike v1 — where "peak" duplicated a C2 window and the
   climax had zero coverage — w6 IS the narrative climax (C3
   sun-bloom). Every act now has clip coverage except C2 remembrance
   (174.5–195.2, stills only) and the chorus-1 star (67–71 s, no fresh
   capture at all).
3. **Stale-still trap:** the 20:00-batch outro stills predate the
   final water-column edit (20:01) — music-09-t220.0 measures meanL
   0.298 where clip-w7 measures 0.719 at the same second, because the
   resurfacing breakthrough was added in that edit. The 20:06 narcosis
   stills are concurrent with the 20:06 narcosis edit. Where stills and
   clips disagree, the clips (20:09+) are cited.
4. **Cursor sentinel:** `bin/inspect.mjs` parks `u_mouse` near canvas
   centre, so every layer's `mouseIdle` test is FALSE in all captures —
   pressure pocket, agitation, ray-bend, deflection and sparkle are
   live at frame centre throughout.
5. No `u_history` anywhere; stills and clips agree where both exist.

## v1 → v2 — did the fixes land?

| # | v1 failure | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Final act one vocabulary for ~73 s (Prediction (b) fail — the hard gate) | **FIXED** | The final 74 s now read as four vocabularies: C1 = near-black with vertically *streaked* snow + dawn growing from above (w5: meanL 0.034→0.098 monotone across 5 s, top-third 3–4× bottom-third; corroborated by the t160.9 still); C2 = window + bubble trains (stills t173.9/t188.7); C3 = gold sun low-centre with UPWARD rays, window dimmed to a ghost, bubbles+snow wheeling (w6); D = white breakthrough → horizon bookend → ember (w7: meanL 0.719→0.898→0.637). Cross-window deltas w5↔w6 0.109, w6↔w7 0.637, w5↔w7 0.744 — versus v1's 0.055–0.140 across its interchangeable trio. Within w6 alone, f00 vs f09 (4.5 s) delta is 0.045: the climax window reconfigures more in 5 s than v1's final act did in 50. |
| 2 | The sun white where the claim needs gold (claim-check fail; core R/B 0.90, 43 warm px at t206) | **FIXED, quantified** | w6 warm pixels 26 084–45 296 per frame (2.8–4.9 % of frame; t210.9 still: 48 847); brightest-warm-region R/B 1.16–1.29, all-warm-pixel mean R/B 1.32–1.35 (RGB ≈ 0.60/0.56/0.45 gold body). The fix is structural as demanded: `sunPresence()` darkens the water (water-column:260–264, ×(1−0.60·presence)), dims the Snell window ×(1−0.65·presence) and the god rays ×(1−0.55·presence) (light-shaft:115–116,149) — in w6 frames the window is a barely-visible ghost and the light direction INVERTS (rays fan up from the sun). The v1 "orbital drift" ask is implemented: bubbles and snow rotate around the sun at 0.045 rad/s (bubbles:123–126, deep-life:101–104), visible as a rotated constellation between w6-f00 and f09. Only the tiny heart reads white (by design, sun-bloom:116). |
| 3 | Layer stack doesn't interact (0 coupling edges) | **PARTIAL** | `bubbles` now declares `reads: [u_below]` and uses it geometrically — each bubble lens-bends the composite beneath it (`lensUV = uv − d·bend; texture(u_below, lensUV)`, bubbles:203–205): zero it and pixels under every bubble move. Spatial-coupling and order-meaningfulness now pass. But the DAG is still 1 edge / 8 layers = 0.125 (coupling-cost fail), and the `sunPresence()`/warp-pulse machinery is the same function pasted into every layer — shared state by construction, synchronisation rather than runtime coupling. Quiet-survives is weak, not fixed: light-shaft still owns window+rays+diver+thread, the whole B-act story spine. |
| 4 | Bass never moves geometry; one stem; no pre-tension | **PARTIAL** | Second stem added: `u_audio_other_stem` drives the narcosis crest gain (narcosis:58,87) while `u_audio_vocals_stem` decides which bubble columns EXIST (bubbles:84–89,150) — two stems, structurally different roles → per-stem probe now passes. Bass geometry: the only geometric bass term is narcosis `k = 8.0·(1+0.02·bassDrive)` — a ±2 % wavenumber active for one 18 s window; everywhere else bass is still a brightness envelope (water-column:232, sun-bloom:117) → bass→movement still fails. `u_to_section_change` still appears nowhere → pre-tension still fails (the stratum's upward glow-bleed, water-column:241, is a hand-authored pre-announcement, but the probe is explicit). |
| 5 | The ending doesn't resolve (aerialAmount hard-zero past B1; no bookend) | **FIXED** | `aerialAmount` returns `smoothstep(0.30,0.85,sp)` at stage 10 (water-column:52) and the captures walk it: w7 crosses a pale breakthrough bloom (4·aer·(1−aer) crossfade-hider, water-column:302–305; meanL peaks 0.898 at ≈222.5) and lands on the horizon bookend — w7-f09 and the t227.3 still show sky band, seam, glittering lagoon, and the dark coin with a clearly amber ember inside (warm px 1 174–1 492, ember mean R/B **2.13**). The final frame is a value-inverted echo of frame 0 with one delta: the hole now carries warmth. She kept the sun. |
| 6 | Evidence pipeline gaps (no clip 83.6–173, peak aliases C2) | **FIXED (mostly)** | Eight windows cover every act; B2/B3/B4/C1 all have motion coverage now. Remaining: C2 is stills-only; the chorus-1 star (67–71) has no fresh capture in either iteration — its gold is asserted by shader constants only (sun-bloom:42–44,54–57). |

## The claim

This piece claims that depth is loss and light is memory: one unbroken
fall through a water column where the channel-ordered death of colour
tells the story of the diver who never resurfaced — while the warm sun
under the water, **the only warmth in the piece**, bypasses extinction
and blooms exactly on the choruses, when the friends choose myth over
grief.

## Frame-by-frame

| Frame | t (s) | Stage | What's there |
|-------|-------|-------|--------------|
| still t1.0 (lands 1.9) | A1 | Calm Sugimoto bisection: pale sky band over an empty turquoise lagoon, meanL 0.575. Nothing else yet — the accretion contract's opening statement. |
| clip-w0 | 5–10 | A1 | Waves texture the water (4.5 s gate), glitter wakes (~6.5 s); deltas 0.002–0.010, calm shimmer. No hole. |
| stills t11.9 / t15.9 | A1 | Sky reflections lying on the water as pale vertical streaks (8 s), watercolor wash in the sky (10.5 s), then **the hole arrives** (12.8 s): dark disc, pale teal rim, upper-centre. The first minute assembles itself exactly as the brief schedules. |
| still t30.9 | A2 legend | Disc breathing, rim flaring as the gentle 8 s pressure pulse crosses it; glitter + reflection columns. |
| clip-w1 | 48–53 | A3 expedition | Disc visibly grown; bar-locked warp pulse rolls through the glitter (within-clip deltas 0.0155–0.0184 vs w0's 0.005 — the aerial scene is measurably livelier); rim flares as fronts cross. The sonar is now felt as water, not drawn as an overlay. |
| still t64.2 (lands 65.1) | B1 | The disc mid-swallow, filling the frame — the tip-under fall under way. |
| still t86.6 (lands 87.5) | B2 | **The dice**: two pale hexagons frozen mid-expansion, fired on the words (~87.4, moved from v1's 83.61); the diver fading in top-centre. |
| clip-w2 | 92–97 | B2 | The piece's story heart: the **scaphandrier** (helmet, boxy torso, arms, weighted boots — reads as a hard-hat diver, not v1's pill) hangs against the huge Snell window; her breath-bubbles above the helmet; the radio thread appears (f05, 93.6) as one bright line to the surface; by f09 it wobbles and frays, radio-static bands flickering below (96–98.4). |
| stills t100.9 / t112.9 | B2 | Bubble trains arrive from 98.9 (vocal stem); the diver deeper each capture (t112.9 meanL 0.105 — the water dying around her); question lights fire between captures (103.85–118.69). |
| clip-w3 | 130–135 | B3 narcosis | Midnight field; bubbles become large, slow, **gold-rimmed** glass orbs (dream mode: ×0.32 speed, ×1.6 size); warm under-glow bottom-centre; pale dream-crest patches breathe through the dark (3 431–10 018 warm px — the myth leaking in). The five-fold interference structure itself only resolves under a contrast boost (see imperfections). |
| clip-w4 | 148–153 | B4 abyss | The milky H₂S stratum slides off the top of frame (delta 0.060→0.002 across the clip — a smooth wipe, then stillness), biolum dissolution motes where she was, the lure-light hanging left-of-centre, micro-bubbles. The last 2.5 s are near-frozen (deltas 0.002) — silence as form. |
| clip-w5 | 160–165 | C1 reversal | **Legible now**: the snow streaks vertically (y-compressed motes, ×1.6 brightness, density 0.26) — the eye feels the upward rush — while dawn grows from above (meanL 0.034→0.098, top-third 0.064→0.165). v1's t161 had meanL 0.027 and nothing visible. |
| stills t173.9 / t188.7 | C1→C2 | The window returns top-centre, dapple inside it, god rays, bubble trains arriving (189.2). The one vocabulary repeat in the evidence set (pair delta 0.036 across 14.8 s). |
| still t200.9 / clip-w6 / stills t207.9, t210.9 | C3 sun bloom | The gold sun rises bottom-centre (warm px 4 815 → 26 084 → 45 296 → 48 847), gold rays fan UPWARD, the window dims to a ghost, the water steps back, bubbles + snow wheel around the sun (constellation visibly rotated f00→f09). Bright-warm R/B 1.16–1.29; warm-pixel mean R/B 1.32–1.35. **The myth blooms gold.** |
| clip-w7 / stills t219.6, t226.4 | D outro | Breakthrough: a pale bloom whites the crossing (meanL 0.719→0.898→0.637, p95 0.983 at peak), then the horizon bookend: sky band, seam, glitter lagoon, the dark coin with the amber ember (R/B 2.13). Bookend verified in pixels, not just code. |

## Mesmerizing probes

Declared timescales for Prediction: **continuity 1 s** (95.7 BPM
chanson, slow end of the range), **divergence 20 s** (228 s narrative
long-form, 11-stage score) — same scales as v1, for comparability.

| Probe | Verdict | Why |
|-------|---------|-----|
| Eye-landing | pass | The landing region migrates across the graded set: horizon seam (t1.9) → disc (15.9–65.1) → diver/thread/window (87–113) → gold orbs + under-glow (130) → stratum→lure (148) → dawn-top + streaks (160) → window (174–189) → sun (200–210) → ember-disc (227). Most frames offer 2–3 candidates (disc+horizon+rim-flare; window+diver+thread; sun+wheeling constellation). v1's two parking complaints are addressed: the final act re-anchors four times, and the first 23 s are an element-by-element accretion the eye follows. Honest residual: A2–A3 still keeps the disc as the dominant anchor for ~41 s, mitigated by growth, breathing and pulse fronts rather than removed. |
| Prediction | **pass** | (a) Continuity at 1 s: **pass** — every clip is smooth, trackable flow (consecutive 0.5 s deltas 0.002–0.018 in steady state; the three larger excursions — w4's 0.060 stratum exit, w7's 0.086 breakthrough — are coherent global washes/wipes the eye rides, not tears; no chromatic separation, no pixel noise; the 2.4 s radio static is band-confined, faint, and reads as story). (b) Divergence at 20 s: **pass** — the eight windows are eight vocabularies: assembling lagoon / pulsing aerial disc / diver+thread story scene / gold-orb dream / stratum-into-black / streak-rush dawn / gold bloom with wheeling orbit / white breakthrough into horizon-bookend. Every captured pair ≥ 20 s apart is categorically different (cross-window deltas 0.04–0.76, and the close pairs — w3/w5 at 0.039 — are categorically different *vocabularies* that happen to both be dark: gold orbs vs streak-rush). The v1 failure — three interchangeable windows over 73 s — is gone. Honest residual, stated for the record: the C1-tail→C2 stretch (~169–195) holds one window+bubbles vocabulary for ~26 s (t173.9 vs t188.7 delta 0.036), marginally over one divergence window; it is the softest stretch in the piece, bracketed by the dawn rush before and the gold bloom after, and no *captured* ≥20 s pair is interchangeable. |
| Squint | pass | Every act blurs to a distinct macro composition: bright-field-over-band (A), bright-window-over-dark (B2), dark-with-gold-radial (C3), white-field-with-dark-coin (D); fine texture (glitter, caustic filaments, glass rims and glints, streaked snow) rewards stepping close — and the glass bubbles are genuinely dual-resolution: each one is a miniature of the scene behind it. Exceptions as in v1: w4's last seconds blur to uniform dark — graded silence-as-form, ~8 s. |
| Hue drift | pass | One cold family drifting with depth (turquoise → cobalt → midnight → black → dawn blue → pale cyan → turquoise), luminance doing the contrast work; the gold enters gradually (0.5 % warm px at t200.9 → 4.8 % at t207.9, over ~7 s) and only where the myth lives. The breakthrough is a luminance event, not a hue jump. No frame-to-frame hue jumps anywhere in 86 graded frames. |
| Mystery | pass | The piece withholds and then answers tenderly: what's in the disc; whether the star below is real; the thread that frays and is gone; a figure dissolving into snow; a lure blinking in nothing; and the final figure-ground inversion — the dark coin in the bright sea now carrying an ember. The strongest beat is structural: the light source inverts at C3 (light from below replaces light from above), which retroactively re-reads the whole dive. |

**Mesmerizing result: 5/5. The hard gate passes — the final act now
diverges on camera, with measurements.**

## Interaction probes

Piece declares `cursor: true`; `u_mouse` reaches 6 of 8 layers
(water-column pocket, caustics agitation, light-shaft ray-bend,
narcosis wavefield warp, bubbles deflection, deep-life sparkle).

| Probe | Verdict | Why |
|-------|---------|-----|
| Composition | shader-pass | The god-ray fan re-orients toward the cursor (light-shaft:137–140, ±0.6 rad on the whole fan) — macro, not local. New since v1: the narcosis dream-field warps around the hand (narcosis:63–66). |
| Idle | pass | The narrative machine + synthetic drivers self-play all 228 s; all captures are near-idle-cursor and compose throughout (caveat 4). |
| Readability | shader-pass | Water parts, filaments sparkle, bubbles bow away, the dream bends, sparkles ignite — "my hand stirs the water", no instructions needed. |
| Reversibility | shader-pass | Every cursor term is a memoryless function of current position. |
| Dominance | shader-pass | All cursor terms are local Gaussians (exp(−d²·5…9)) except the bounded ray-bend; well under the 30 % ceiling. |
| Convention | shader-pass | Physical priors throughout; nothing inverted. |
| Latency | shader-pass | No smoothing in any u_mouse path. |

**Interaction result: 7/7** (shader-verdicts; still no live-cursor capture).

## Music reactivity probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Motion-over-luminance | shader-pass | `u_audio_vocals_stem` decides which bubble columns EXIST (bubbles:84–89 emissionBase → :150 `alive = step(…)`) — structure, not gain. Everything else remains brightness-family (bass→swell water-column:232, mid→caustic gain :155/:172, high→rayGain light-shaft:147, vocals→thread pulse :216, level+bass→sun breath sun-bloom:117). One honest geometric binding clears the bar, same shape as v1. |
| Bass→movement | shader-fail | The only geometric bass term is narcosis `k = 8.0·(1+0.02·bassDrive)` (narcosis:70) — a ±2 % wavenumber, active 18 s of 228. Magnitude is within the canonical PASS family, but for 92 % of the piece the kick still only modulates how brightly independent motion reads. Ambiguous rounds down. |
| Rhythm-in-stills | pass | t87.5 freezes both dice hexes mid-expansion; w2-f09 freezes the thread mid-fray with static mid-burst; t112.9 shows bubble trains in flight; w1's glitter carries the warp front. Frozen time shows propagation. |
| Quiet-reads-quiet | pass | The instrumental break lands on the abyss: w4's last seconds are dark AND becalmed (deltas 0.002, no rays, no caustics, near-zero emission) — quiet in form, not just dimness. |

**Music result: 3/4.**

## Song-level composition probes

`audio.analysis.json` present; layers reference `u_bar_phase`,
`u_bar_index`, `u_audio_vocals_stem`, `u_audio_other_stem`. No layer
references `u_section_*`, `u_downbeat`, `u_to_section_change`, or
`u_song_progress` (verified by grep — deliberate per the brief; the
story is gated on `u_time` against lyric timestamps).

| Probe | Verdict | Why |
|-------|---------|-----|
| Section-readability | pass | progress {0.05,0.25,0.45,0.65,0.85} ≈ t11/57/103/148/194: assembling lagoon / grown disc + sonar pulse / diver + trains + window / stratum-abyss / window + bubble trains. Five of five distinct. |
| Downbeat-anchored | shader-pass | Structural events are composed: caustic axis advances with the bar grid (caustics:120), the expedition pressure pulse is bar-locked (water-column:114), and every one-shot (dice 87.4, sever 97.0, chorus rings 64.04/124.66/195.25, milky wipe 142.88) is a hand-placed lyric timestamp. Zero amplitude-triggered structural changes. |
| Pre-tension | shader-fail | `u_to_section_change` / `u_section_progress` unreferenced. (The stratum's glow bleeding upward before it arrives is hand-authored pre-announcement, but the probe's letter is explicit.) |
| Per-stem-discrimination | shader-pass | **New**: two stems in visually different roles — vocals = bubble-column existence (structural), other = narcosis crest gain. |
| Long-arc | pass | Measured: 0.575 surface → 0.105 descent → 0.044 dream → 0.034 reversal trough → 0.184 carved bloom → 0.898 breakthrough → 0.619 bookend. Clear trough, clear maximum, and the maximum is now the *narrative* climax chain. |
| Recapitulation | pass | **Fixed**: intro = empty bright horizon; outro = the same horizon with the dark coin + amber ember (w7-f09, t227.3). Related, one legible delta, and the delta IS the story. |

**Song-level result: 5/6** (v1: 3/6).

## Dual-input probes

| Probe | Verdict | Why |
|-------|---------|-----|
| Dual-channel readability | interaction-unclear | Still needs a live cursor+music capture. |
| Channel-non-overlap | shader-pass | Audio owns emission/existence/gain; cursor owns spatial perturbation. Shared terms are floor-and-ceiling multiplicative (caustics:155,172). |
| Music-without-cursor | pass | The captures are effectively this cell; music probes pass in them. |
| Cursor-without-music | shader-pass | Synthetic drivers in every audio-consuming layer; u_time story runs regardless; cursor paths ungated. |
| Conflict-resolution | shader-pass | No additive arms race on any scalar. |
| Authority-during-build | shader-pass | No cursor term gated by energy/section/stage; abyss sparkle gains ×1.6 when deepest. |
| Idle-cell | shader-pass | The neither-cell self-plays: the piece is a film before it is an instrument. |

**Dual-input result: 6/7.**

## Layered composition probes

`layers:` stack, now 8 layers — all 11 probes apply.

| Probe | Verdict | Why |
|-------|---------|-----|
| Spatial-coupling | shader-pass | **Fixed**: bubbles reads `u_below` and uses it in a bent UV (`texture(u_below, lensUV)`, bubbles:203–205) — the scene beneath every bubble is geometrically displaced (and the captures show it: w3's orbs carry miniature window-light). |
| Polyrhythm-of-clocks | pass | u_time (many rates), u_bar_phase/index, bass, mid, high, vocals stem, other stem, u_mouse, u_keys — far over 3 distinct clocks. |
| Eye-distribution | pass | 2–3 dominance regions in most frames, migrating with the acts (disc+horizon → window+diver → orbs+glow → sun+constellation → coin+seam). Exception: late-abyss frames collapse to the lure alone (~8 s, authored silence). |
| Quiet-survives | shader-weak | Improved but not fixed: zero light-shaft in B2 and the glass bubbles, dapple, question lights and snow still give the eye something — but the window/diver/thread story spine vanishes and eye-landing thins badly. The lead layer is still load-bearing mid-piece. |
| Order-meaningfulness | shader-pass | **Fixed by architecture**: bubbles is a mid-stack normal-blend layer consuming `u_below` — swapping it with any non-adjacent layer changes both what the glass refracts and what it occludes. |
| Blend-saturation | pass | Energy-peak frame t188.7: p2–p98 luminance 0.142–0.539 (contrast 0.40); C3 frames meanL 0.18–0.20 with full-range 0.04–0.98. No cream soup — the carve guarantees it. |
| Coupling-cost | shader-fail | 1 edge / 8 layers = 0.125 — still far under the 1.0 floor. The narrative block is shared state by construction, not runtime coupling; it synchronises, it does not couple. |
| Brightness-strobe | shader-fail | Five of eight layers carry brightness-shaped audio bindings (water-column:232, caustics:155/172, light-shaft:147/216, sun-bloom:117, narcosis:87) — letter fail as in v1; the clips show no visible per-beat blink (gains are gentle and multiplicative). |
| Layer-distinctness | pass | All eight contributions nameable on camera: water/disc/stratum/carve; glitter+dapple; window/rays/diver/thread; the gold; the dream patches; the glass orbs; snow/streaks/lure/dissolution/sparkle; dice/rings/static/questions. (Narcosis is the faintest — see imperfections.) |
| Multi-input coupling | pass | Cursor → 6 layers, keyboard → 3 (per-key column vents w/ white-aqua vs black-violet rims, jelly rings, sun gain), audio → 6. Per-key distinctness holds. |
| Visible phase-lock | pass | Geometric receipts: expedition pressure-warp on the bar grid (water-column:114, caustics:131–141), caustic axis = bar index + phase (caustics:120), bubble existence = vocal stem (bubbles:150), lyric-timestamp one-shots captured mid-flight (dice t87.5). |

**Layered result: 8/11** (original eight: 5/8 — the stack now interacts
at one real edge and order matters, but it remains mostly a
synchronized parallel composite).

## Claim check

**Pass.** Both halves now survive the camera. The extinction half was
already true in v1 and still is: turquoise dies into cobalt, midnight
and near-black exactly on the dive (w2 t92 meanL 0.21 → w3 0.044 → w5
trough 0.034), and colour returns changed on the rise. The myth half —
the failing half — is now measured fact: the chorus-3 sun blooms GOLD
(26 084–48 847 warm pixels per frame where v1 had 43; bright-warm R/B
1.16–1.29 where v1 measured 0.90; warm-pixel mean R/B 1.32–1.35),
because the stack now carves darkness for it (window ghosted, rays
stepped back, water darkened ×0.40–0.55 under `sunPresence`) instead of
adding gold onto bright blue. And the warmth ledger closes exactly on
the thesis: across all 86 graded frames, warm pixels appear ONLY at
chorus 2 (the dream's gold rims and crest seams, 3.4–10 k), chorus 3
(the sun), and the kept ember in the final disc (1 174–1 492 px, R/B
2.13) — zero warm pixels in w0, w1, w2, w4, w5 and every non-chorus
still. The only warmth in the piece is the myth. One unverified corner:
the chorus-1 star (67–71 s) has no fresh capture; its gold is asserted
by shader constants only.

## Scores

| Dimension | Score | Note |
|-----------|-------|------|
| Palette cohesion | 5 | One disciplined cold-blue family across 228 s (the sanctioned exception), luminance-led, and the single warm accent now reads warm, appears only where the myth lives, and enters gradually. v1's only stated reason for not-5 (white climax) is fixed and measured. |
| Composition | 4 | The macro composition wanders act to act with intrinsic empty zones, the window slides and shrinks with depth, the final act re-anchors four times, and macro light pockets keep the squint structured. Not 5: the disc still anchors dead-centre for ~41 s of A2–A3 and the late abyss is a flat field for ~8 s. |
| Motion | 4 | Multiple desynchronised scales (caustic churn, bubble rise+wobble, snow with a direction flip, glitter, narrative zoom) plus — new — beat-scale geometry (bar-locked pressure warp, bar-advancing caustic axis). Not 5: the late abyss is near-frozen (deltas 0.002/0.5 s) save the 14 s-period lure blink. |
| Intensity & dynamic range | 4 | Measured range 0.034–0.898 with the trough on the instrumental break and quiet that is structural, not dim. Not 5: the breakthrough spends ~2–3 s near-clip (p95 0.983) rather than compressing asymptotically, and within-section response remains gentle. |
| Depth | 4 | The glass bubbles genuinely rewrite the coarse scale locally (each orb a refracted miniature of the scene), over window/gradient/two-sheet parallax/fine dapple. Not 5: the abyss collapses to one resolution and mid-water can still read base+texture. |
| Form & ending | 5 | A true through-composed 11-stage arc whose ending now lands on camera: the breakthrough flash, the horizon bookend, the ember in the coin — the final frame answers the first with the story's conclusion. Composed for its duration, resolved rather than cut. |

## What's working

- **The final act is now four acts.** Streak-rush dawn (w5) → window
  remembrance → gold bloom with the world wheeling around it (w6) →
  white breakthrough into the horizon bookend (w7). v1's single
  73-second vocabulary is measurably gone (cross-window deltas
  0.109–0.744; within-w6 5 s delta 0.045).
- **The gold is real and the carve is structural.** The light
  *direction* inverts at C3 — the window ghosts out, rays fan up from
  the sun, the water steps back. Not a gain tweak: a recomposition,
  which is what the v1 handback demanded.
- **The warmth ledger equals the thesis exactly.** Warm pixels exist
  only at chorus 2, chorus 3, and the kept ember — quantified across
  every graded frame. Few pieces in the repo can prove their claim
  with a pixel count.
- **The story pixels are still the best in the repo, and sharper.**
  The scaphandrier reads as a person now; the dice fire on the words;
  the thread appears, frays, sevs on schedule with static bands; the
  breath-bubbles ride above her helmet (w2 is a complete short film).
- **The ending is earned.** Breakthrough as passage-through-light
  (mirroring the tip-under's passage-through-dark), then the bookend
  with the ember — the figure-ground inversion the piece opened with,
  now answered. w7's meanL arc (0.72→0.90→0.64) is composed, not cut.
- **The glass-bubble layer makes the stack honest.** One real coupling
  edge used geometrically; order now matters; bubbles in the dream
  become slow gold-rimmed orbs that carry the scene inside them.
- **The first minute assembles itself** — calm bisection, then waves,
  glitter, reflections, watercolor, and the hole arriving with the
  chords. The accretion gives the A-act the event vocabulary it lacked.

## What's imperfect

1. **C1-tail→C2 holds one vocabulary for ~26 s** (t173.9 vs t188.7
   delta 0.036): bright window top-centre, blue gradient, specks. It is
   the piece's only stretch where the next 20 s are guessable, and it
   sits where C2's quiet remembrance verse arguably wants stability —
   but a friend-light slipping below the waterline (the brief's own C2
   image, never implemented) would break it without breaking the quiet.
2. **The stack is synchronized, not coupled** — 1 edge / 8 layers;
   `sunPresence`/the warp pulse are the same function pasted eight
   times, and quiet-survives is still weak because light-shaft owns the
   entire B-act story spine. The pixels could mostly ship from one
   shader; the glass bubbles are the only counterexample.
3. **Bass still doesn't move geometry** (only a ±2 % wavenumber for
   18 s), `u_to_section_change` is still unreferenced, and five of
   eight layers keep brightness-shaped audio bindings. The per-frame
   beat floor remains caustic flicker.
4. **The narcosis field is illegible at normal exposure.** The
   five-fold interference reads as two faint pale patches (p95
   luminance 0.129); the structure only appears under a contrast
   boost. The dream's *bubbles* carry the stage; the layer that names
   it barely registers. Either brighten the crest seams or accept that
   the layer is mood, not structure.
5. **The breakthrough flirts with bleach** — p95 0.983, meanL 0.898
   for ~2–3 s at ≈222.5. It is an authored white passage and it reads
   as one, but a touch more compression would keep highlight texture.
6. **Cosmetic:** events declares `u_bar_phase`/`u_audio_playing` and
   deep-life declares `u_audio_playing` without using them (dead since
   the sonar moved); the chorus-1 star remains uncaptured in two
   evidence rounds.

## Verdict

**chef-doeuvre.** All three criteria are met by measurement, not
goodwill: mesmerizing 5/5 with the hard gate passing on fresh
multi-window evidence (eight windows, eight vocabularies, the v1
failure mode demonstrably gone); claim check pass with the thesis
proven by a warm-pixel ledger that matches the myth exactly (R/B 0.90 →
1.16–1.35, 43 → 48 847 warm pixels, warmth appearing only at the
choruses and the kept ember); all six dimensions ≥ 4 (palette 5, form &
ending 5). Both v1 handbacks — re-compose the final act, rebuild the
sun/water compositing relationship — were combined and both landed, and
the fixes are structural (light-direction inversion, darkness carving,
orbital wheel, resurfacing bookend), not parameter tunes. The remaining
imperfections (C2's 26 s stability, the thin coupling DAG, bass-as-
brightness, the shy narcosis field) are real and listed, but they are
nuance below the verdict thresholds, and per the rubric's own
anti-patterns I am not inventing a top_fix for a piece whose probes
pass: polishing risks the passing probes. The dive was already true in
v1; the resurrection now is too. Stop. Give it to Alexandre.

```yaml
piece: le-mystere-abyssal
iteration: 2
verdict: chef-doeuvre
claim_check: pass
mesmerizing_passes: 5
mesmerizing_probes:
  eye_landing: pass
  prediction: pass
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
song_level_passes: 5
song_level_probes:
  section_readability: pass
  downbeat_anchored: shader-pass
  pre_tension: shader-fail
  per_stem_discrimination: shader-pass
  long_arc: pass
  recapitulation: pass
dual_input_passes: 6
dual_input_probes:
  dual_channel_readability: interaction-unclear
  channel_non_overlap: shader-pass
  music_without_cursor: pass
  cursor_without_music: shader-pass
  conflict_resolution: shader-pass
  authority_during_build: shader-pass
  idle_cell: shader-pass
layered_passes: 8
layered_probes:
  spatial_coupling: shader-pass
  polyrhythm_of_clocks: pass
  eye_distribution: pass
  quiet_survives: weak
  order_meaningfulness: shader-pass
  blend_saturation: pass
  coupling_cost: shader-fail
  brightness_strobe: shader-fail
  layer_distinctness: pass
  multi_input_coupling: pass
  visible_phase_lock: pass
scores:
  palette_cohesion: 5
  composition: 4
  motion: 4
  intensity: 4
  depth: 4
  form_ending: 5
top_fix: null
evidence:
  - evidence/le-mystere-abyssal-v2/music-00-t1.0-intro.png
  - evidence/le-mystere-abyssal-v2/music-01-t64.2-verse.png
  - evidence/le-mystere-abyssal-v2/music-02-t173.0-pre-peak.png
  - evidence/le-mystere-abyssal-v2/music-03-t187.8-peak.png
  - evidence/le-mystere-abyssal-v2/music-04-t219.6-quiet.png
  - evidence/le-mystere-abyssal-v2/music-05-t226.4-outro.png
  - evidence/le-mystere-abyssal-v2/music-00-t2.0-t2.png
  - evidence/le-mystere-abyssal-v2/music-01-t6.5-t7.png
  - evidence/le-mystere-abyssal-v2/music-02-t11.0-t11.png
  - evidence/le-mystere-abyssal-v2/music-03-t15.0-t15.png
  - evidence/le-mystere-abyssal-v2/music-04-t30.0-t30.png
  - evidence/le-mystere-abyssal-v2/music-05-t50.0-t50.png
  - evidence/le-mystere-abyssal-v2/music-06-t86.6-t87.png
  - evidence/le-mystere-abyssal-v2/music-00-t91.0-t91.png
  - evidence/le-mystere-abyssal-v2/music-01-t100.0-t100.png
  - evidence/le-mystere-abyssal-v2/music-02-t112.0-t112.png
  - evidence/le-mystere-abyssal-v2/music-03-t132.0-t132.png
  - evidence/le-mystere-abyssal-v2/music-04-t138.0-t138.png
  - evidence/le-mystere-abyssal-v2/music-05-t160.0-t160.png
  - evidence/le-mystere-abyssal-v2/music-06-t200.0-t200.png
  - evidence/le-mystere-abyssal-v2/music-07-t207.0-t207.png
  - evidence/le-mystere-abyssal-v2/music-08-t210.0-t210.png
  - evidence/le-mystere-abyssal-v2/music-00-t219.0-t219.png
  - evidence/le-mystere-abyssal-v2/music-09-t220.0-t220.png
  - evidence/le-mystere-abyssal-v2/music-01-t221.5-t222.png
  - evidence/le-mystere-abyssal-v2/music-10-t226.0-t226.png
  - evidence/le-mystere-abyssal-v2/w3-f02-boosted.png
  - evidence/le-mystere-abyssal-v2/clip-w0-f00.png
  - evidence/le-mystere-abyssal-v2/clip-w0-f05.png
  - evidence/le-mystere-abyssal-v2/clip-w0-f09.png
  - evidence/le-mystere-abyssal-v2/clip-w1-f02.png
  - evidence/le-mystere-abyssal-v2/clip-w1-f07.png
  - evidence/le-mystere-abyssal-v2/clip-w2-f01.png
  - evidence/le-mystere-abyssal-v2/clip-w2-f05.png
  - evidence/le-mystere-abyssal-v2/clip-w2-f09.png
  - evidence/le-mystere-abyssal-v2/clip-w3-f02.png
  - evidence/le-mystere-abyssal-v2/clip-w3-f08.png
  - evidence/le-mystere-abyssal-v2/clip-w4-f01.png
  - evidence/le-mystere-abyssal-v2/clip-w4-f08.png
  - evidence/le-mystere-abyssal-v2/clip-w5-f01.png
  - evidence/le-mystere-abyssal-v2/clip-w5-f08.png
  - evidence/le-mystere-abyssal-v2/clip-w6-f00.png
  - evidence/le-mystere-abyssal-v2/clip-w6-f05.png
  - evidence/le-mystere-abyssal-v2/clip-w6-f09.png
  - evidence/le-mystere-abyssal-v2/clip-w7-f00.png
  - evidence/le-mystere-abyssal-v2/clip-w7-f03.png
  - evidence/le-mystere-abyssal-v2/clip-w7-f06.png
  - evidence/le-mystere-abyssal-v2/clip-w7-f09.png
```
