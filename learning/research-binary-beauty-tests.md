# Deep-research report: binary beauty tests for V-Jaygent (2026-06-12)

Provenance: deep-research run commissioned by Louis from the brief at
`learning/critic-rework-research-brief.md`. Archived verbatim below
(external citation links stripped where they were inline artifacts).
Companion: `learning/calibration-stage1.md` (Stage-1 metrics calibrated
against the graded corpus, per this report's own recommendation).

---

# An Evidence-Based Catalog of Binary Beauty Tests for Real-Time Generative, Audio-Reactive Abstract Visual Art

## TL;DR
- **A binary rubric for V-Jaygent is achievable, but only ~15 of 40+ candidate markers have evidence strong enough to anchor v1 — and the house's single most load-bearing doctrine ("two-timescale unpredictability") is best operationalized not from psychology (which barely studies it) but from computer-vision video metrics: optical-flow warping error for ~1 s trackability and feature-space / compression distance between 20 s windows for long-timescale divergence.**
- **Most empirical aesthetics evidence is from STATIC images and rests on contested or non-replicated effects (Berlyne's inverted-U, Kaplan's "mystery", color-harmony angle rules); the rubric should treat these as weak priors decomposed into observable sub-tests, and must blacklist golden-ratio preference, "fractal D 1.3–1.5 = beauty", and universal hue-harmony angles as pseudo-laws.**
- **The strongest, most automatable markers are luminance-structure tests (squint/macro-contrast), 1/f-type spatial-frequency falloff, motion-smoothness via optical flow, window-divergence via compression distance, and warm-palette/contrast-by-luminance checks — all computable image/video statistics that remove grader subjectivity.**

## Key Findings

1. **The literature is overwhelmingly about static images.** Nearly every classic result (Berlyne complexity, fractal-dimension preference, 1/f spectra, color preference, symmetry, mystery) was measured on still images or photographs. Extrapolating any of them to 1–10 minute audio-reactive motion is an inference the rubric should make explicitly and cautiously. The few studies on dynamic/temporal aesthetics (continuous movie ratings, dynamic generative-art feature models, audiovisual complexity) confirm that dynamic experience is not well captured by static summaries — which validates V-Jaygent's insistence on clip evidence.

2. **Berlyne's inverted-U (complexity↔preference) is real but weak, multifaceted, and not universally replicated.** Chmiel & Schubert (2017, *Psychology of Music*) reviewed 57 studies spanning 115 years: "Fifty of the 57 studies (87.7%) were categorized as compatible with an overarching (segmented) inverted-U model... Two studies (3.5%) were categorized as completely incompatible with the model." Yet a large product-design program (1,800+ participants, Althuizen 2021) found "scant evidence" for it, and Martindale found monotonic relationships. The practical upshot: complexity should be tested as "neither trivially compressible nor random," not as a tuned optimum.

3. **Processing fluency raises liking, but disfluency/expectation-violation accounts (predictive processing) are needed to explain why great art violates fluency.** Reber/Schwarz/Winkielman (2004) show fluent stimuli are preferred; Van de Cruys & Wagemans (2011) show artists "destroy predictions they first build up," and pleasure comes from the resolved transition from uncertainty to mastery. This is the strongest theoretical grounding for V-Jaygent's two-timescale doctrine: trackable (fluent) at 1 s, divergent (prediction-violating) across 20 s.

4. **Kaplan's "mystery" is the most-cited predictor of preference but the meta-analysis is sobering.** Stamps (2004, *Journal of Environmental Psychology*) found mystery most consistent of the four informational variables (coherence, complexity, legibility, mystery) — but also "a considerable degree of heterogeneity... indicating that results have not been reproducible," with expert-panel ratings producing smaller effects. The complexity–preference correlation across studies "ranged from −0.11 to 0.97, precluding a singular interpretation of their association." Mystery should be decomposed into observable proxies (occlusion, partial legibility, depth ambiguity), not graded as a gestalt.

5. **1/f spatial-frequency statistics are the best-supported computable image regularity in aesthetics.** A large body (Graham & Field 2007; Redies et al. 2007; Koch, Denzler & Redies 2010) shows art images and natural scenes share radially-averaged power spectra falling as ~1/f (amplitude slope near −1.2 to −1.4; power slope near −2). But this is a property of "perceptible/produced" images, not a guarantee of beauty — images with 1/f² can be non-aesthetic (Koch et al. explicitly note such images can be produced artificially). Use as a necessary-not-sufficient filter.

6. **The golden ratio is the clearest pseudo-law to blacklist.** Across 150 years, replications split roughly evenly; careful reviews (Green 1995; the "golden ratio myth" literature) conclude any preference is an artifact. Likewise, "fractal D 1.3–1.5 = beauty" is real on average but culture/gender-moderated and not a per-image quality gate.

7. **Motion-perception science gives hard numbers for "trackability."** Smooth pursuit holds gain ~0.9 up to ~100 deg/s in good trackers (Meyer, Lasker & Robinson 1985: "eye velocity was approximately 90% of target velocity up to a target velocity of 100 deg/sec") but clinically clean tracking degrades above ~20–30 deg/s; global-motion direction is readable from only ~5–7% coherent dots in adults (random-dot paradigm of Newsome & Paré 1988). These anchor a "short-timescale continuity" test and its optical-flow proxy.

## Details

### Part 1 + 2 — Catalog of candidate markers

Markers are grouped. Tags: **[A]** fully automatable as image/video metric · **[A/J]** automatable proxy + grader confirmation · **[J]** grader judgment · **[SPEC]** speculative/weak evidence.

#### A. Spatial structure & composition
1. **Macro luminance composition (squint test).** Basis: figure–ground organization; Ikeda-style dual-scale practice; gist/survey gaze phases in abstract-art eye-tracking. Binary: "When the still is downsampled to 32×32 and contrast-normalized, is there at least one connected light region covering 5–30% of the frame against a darker ground (RMS luminance contrast > 0.15)?" Evidence: still + computed metric. Confounds: full-frame textures fail correctly; vignetting can fake it. **[A]**
2. **Fine texture rewards close viewing.** Basis: dual-resolution; perceptibility hypothesis (Graham & Field). Binary: "Does a center 256×256 crop at native resolution contain high-spatial-frequency detail (energy above 0.25 cycles/px > threshold) absent from the downsampled view?" Evidence: still + metric. **[A]**
3. **2–4 attention regions (eye-landing count).** Basis: house doctrine; saliency-map literature; 1 region = monotony, 8+ = chaos. Binary: "Does a saliency map of the still yield 2–4 connected peaks above 50% max salience?" Evidence: still + saliency model. Confounds: saliency models trained on photos may mis-rank abstract fields. **[A/J]**
4. **Attention regions shift across sections.** Binary: "Do the saliency-peak centroids move by >10% of frame width between intro and peak stills?" Evidence: multiple stills + metric. **[A]**
5. **1/f spatial-frequency falloff.** Basis: Graham & Field 2007; Redies 2007. Binary: "Is the radially-averaged log-log power-spectrum slope between −1.6 and −2.6?" Evidence: still + FFT. Confound: necessary-not-sufficient; flag as filter. **[A]**
6. **Intermediate spatial complexity.** Basis: Berlyne inverted-U (weak); effective complexity (Galanter/Gell-Mann). Binary: "Is JPEG/PNG compression ratio of the still between defined bounds (neither near-flat nor near-random)?" Evidence: still + compressor. Confound: compressibility ≠ perceived complexity. **[A]**
7. **Intrinsic empty zones (negative space).** Basis: composition dimension; coherence. Binary: "Is at least 10% of the frame below 10% peak luminance (a genuine dark rest area)?" Evidence: still + histogram. **[A]**
8. **Composition is not frame-invariant.** Basis: composition anchor (wanders at 15–60 s). Binary: "Do macro-structure layouts (downsampled SSIM) differ by >0.3 between at least two section stills?" Evidence: stills + SSIM. **[A]**
9. **Curvature/organic contour presence.** Basis: preference for curved over angular contours (Bar & Neta; replicated). Binary: "Are curved/non-rectilinear edges present (Hough-line fraction below threshold)?" Evidence: still + edge stats. Confound: angular can be intentional. **[A/J] [SPEC for hard gating]**

#### B. Color & light
10. **Warm-family hue confinement.** Basis: house palette law; ecological valence theory (Palmer & Schloss 2010 — preference tracks object associations, not hue angle per se). Binary: "Do ≥90% of above-threshold-saturation pixels fall within the sanctioned warm hue arc across all six stills (or within the sanctioned per-piece palette)?" Evidence: stills + hue histogram. **[A]**
11. **Contrast carried by luminance not hue.** Basis: house law; luminance-contrast drives spatial vision. Binary: "Is the frame's luminance range > 0.5 while its hue-angle spread stays < 60°?" Evidence: still + metric. **[A]**
12. **No warm-on-warm collapse.** Basis: house finding (L-contrast < 0.15 = soup). Binary: "Is RMS luminance contrast ≥ 0.15 in every still?" Evidence: still + metric. **[A]**
13. **Slow hue drift, not static, not blinking.** Binary: "Does mean hue change smoothly across ordered stills by 5–30°, with no single adjacent-still jump > 40° (wrap artifact)?" Evidence: stills + hue means. **[A]**
14. **No blend saturation / blowout.** Basis: existing exemplar probe. Binary: "Is it false that mean L > 0.7 AND channel range < 0.1?" Evidence: still + metric. **[A]**
15. **Saturation not garish (disco/rainbow guard).** Basis: palette cohesion anchor. Binary: "Is the count of distinct dominant hues (k-means on hue, >5% mass each) ≤ 3?" Evidence: still + clustering. **[A]**

#### C. Motion & dynamics (REQUIRE CLIP EVIDENCE)
16. **Short-timescale trackability (1 s continuity).** Basis: smooth-pursuit limits (Meyer/Lasker/Robinson 1985, gain ~0.9 to ~100 deg/s, clean tracking <~20–30 deg/s); motion coherence (Newsome & Paré 1988, adult thresholds ~5–7%). Binary: "Over any 1 s clip window, is the optical-flow warping error below threshold AND median flow speed below the screen-equivalent of ~30 deg/s, so a dominant coherent flow exists?" Evidence: clip + optical flow. Confound: warping error nonzero even on good video; use normalized form. **[A]**
17. **Motion smoothness (low jerk).** Basis: minimum-jerk naturalness (Flash & Hogan 1985). Binary: "Is the second-order (acceleration/jerk) deviation of the optical-flow field along trajectories below threshold (no per-frame teleport/stutter)?" Evidence: clip + flow (trajectorial-smoothness term, Volz et al. 2011). **[A]**
18. **Multi-scale desynchronized motion.** Basis: house liveness doctrine. Binary: "Do at least two spatial frequency bands of the flow field show different temporal periods (cross-correlation < 0.5)?" Evidence: clip + band-decomposed flow. **[A/J]**
19. **Never all frozen.** Basis: "static = death." Binary: "Is mean flow magnitude above a small floor in every sampled clip (including quiet sections)?" Evidence: clips + flow. **[A]**
20. **Felt direction in quiet.** Binary: "In the quiet-section clip, is there a net coherent flow vector (resultant/total flow ratio > threshold) despite low magnitude?" Evidence: clip + flow. **[A]**
21. **Motion advantage / not a frozen still.** Basis: the "Frozen Effect" — objects in motion rated more appealing than frozen; >2 Hz motion reads as frozen in stills. Binary: "Do clips reveal temporal change (inter-frame difference energy) not present in the section stills?" Evidence: clips vs stills. **[A]**

#### D. Unpredictability (two-timescale — see Part 4)
22. **Long-timescale event-vocabulary divergence.** Binary (computable proxy): "Across three 20 s windows, is the pairwise normalized compression distance (or deep-feature distance) of stacked frames above threshold — i.e., windows don't compress well against each other?" Evidence: multi-window clips + NCD/feature distance. **[A/J]**
23. **Not a re-shaded single rule.** Binary: "After per-frame luminance normalization, do 20 s windows still differ (so difference isn't only brightness)?" Evidence: clips + normalized distance. **[A]**
24. **Local predictability preserved (not chaotic).** Binary: "Within each 1 s window, is short-horizon optical-flow prediction error low (next frame predictable from flow)?" Evidence: clip + flow. **[A]**

#### E. Music coupling
25. **Audio drives geometry not just brightness.** Basis: house law; loudness→brightness is "natural" cross-modally but is exactly the decorative failure mode. Binary: "Between low-audio and high-audio frames, does the geometry change (optical-flow/edge-map delta) exceed the pure-luminance delta?" Evidence: paired frames at audio extremes + metric. **[A]**
26. **Beat/downbeat geometric phase-lock.** Binary: "Do ≥2 structural events (ring expansion, rotation snap) align within 100 ms of detected downbeats?" Evidence: clip + audio onset track. **[A/J]**
27. **Sections announce with new vocabulary.** Binary: "Can section stills be matched to ≥3/5 labeled sections by distinct visual character?" Evidence: stills + grader. **[J]**
28. **Quiet reads quiet structurally (flow speed).** Binary: "Is median flow speed in quiet clips < 50% of peak-section flow speed?" Evidence: clips + flow. **[A]**
29. **Quiet reads quiet (scale tightens).** Binary: "Does dominant spatial-feature scale shrink (or detail density rise) in quiet vs peak?" Evidence: clips + spectral metric. **[A]**
30. **Pre-tension before drop.** Binary: "In the pre-peak window, is there a visible squeeze/desaturation (rising luminance compression or falling saturation) relative to surrounding windows?" Evidence: clips + metric. **[A/J]**

#### F. Interaction (cursor / keyboard — need new captures)
31. **Cursor changes composition (≥2 axes).** Binary: "Do 3 cursor-position captures yield measurably different structural layouts (downsampled SSIM < 0.7 pairwise)?" Evidence: NEW cursor-position captures. **[A]**
32. **Cursor reversibility (a→b→a).** Binary: "After returning cursor to start, does the frame match the original within tolerance (SSIM > 0.9)?" Evidence: NEW cursor-path capture. **[A]**
33. **Cursor bounded (≤~30% of structural energy).** Binary: "Is the with-cursor vs without-cursor structural-energy difference ≤ 30%?" Evidence: NEW with/without-cursor pair. **[A]**
34. **Cursor latency acceptable.** Binary: "After a fast cursor move, does the response settle within N frames?" Evidence: NEW fast-move capture, count lag frames. **[A]**
35. **Readability of mapping (cold viewer, 3 s).** Binary: "From a short cursor-motion clip, can the grader state the cursor→effect mapping in one sentence?" Evidence: cursor clip + grader. **[J]**
36. **Idle is alive (no cursor).** Binary: "Does the idle render still show motion above the floor?" Evidence: idle clip. **[A]**
37. **Multiple layers each react.** Binary: "In the cursor+audio matrix (both/music-only/cursor-only/neither), do ≥2 layers each show a distinct delta attributable to cursor and to audio?" Evidence: NEW idle-matrix captures + per-layer solos. **[A/J]**

#### G. Form & duration
38. **Has an arc (peak + real quiet).** Binary: "Across ordered section stills/clips, is there both a global maximum (energy/luminance) and a genuine minimum (quiet section measurably lower)?" Evidence: clips + global metric. **[A]**
39. **Earned ending (not a loop).** Binary: "Is the outro frame distinguishable from the intro frame (not a seamless loop) yet recognizably related (one visible delta)?" Evidence: intro vs outro stills. **[A/J]**
40. **Composed for duration (recapitulation).** Binary: "Do intro and outro share a macro structure (downsampled SSIM > 0.5) while differing in exactly one salient attribute?" Evidence: stills + metric + grader. **[A/J]**

#### H. Depth & layering
41. **Structure at multiple scales (depth).** Basis: depth-engagement eye-tracking; dual-resolution. Binary: "Does the image contain energy across ≥3 octaves of spatial frequency above noise?" Evidence: still + multiscale decomposition. **[A]**
42. **Reads different up close vs afar.** Binary: "Is downsampled-view structure (SSIM) substantially different from native-crop structure?" Evidence: still + metric. **[A]**
43. **Layers consume each other (not mere stacking).** Binary: "In per-layer solo renders, does the composite differ from additive sum of solos (non-linear interaction present)?" Evidence: NEW per-layer solo renders + composite. **[A]**
44. **Layer distinctness (ablation).** Binary: "When each layer is solo-rendered, is each visually distinct (pairwise SSIM < 0.8)?" Evidence: NEW per-layer solos. **[A]**
45. **Quiet survives layer ablation.** Binary: "With the lead layer zeroed, does residual structure remain (not collapse to flat)?" Evidence: NEW ablation render. **[A]**

#### I. Speculative / weak-evidence markers (flagged, NOT for hard gates)
46. **[SPEC] Effective-complexity sweet spot.** Galanter/Gell-Mann; no validated per-image threshold. Soft flag only.
47. **[SPEC] Mystery as withheld structure.** Stamps 2004 heterogeneity; decompose to occlusion/partial-legibility proxies; never a single gestalt gate.
48. **[SPEC] Cross-modal pitch→elevation / loudness→brightness correspondence.** Robust in psychophysics but loudness→brightness is exactly the "decoration" the house warns against; use as a NEGATIVE check.
49. **[SPEC] Naturalistic (1/f) temporal dynamics of motion.** By analogy to spatial 1/f; little direct evidence for video aesthetics. Soft flag only.
50. **[SPEC] Symmetry presence.** Best predictor for static abstract patterns (Jacobsen & Höfel) but symmetry can be disliked as "artificial" on organic content; not a positive gate for generative fields.

### Part 3 — Decomposition of the six scalar dimensions

- **Palette cohesion →** (a) warm-arc confinement [#10]; (b) contrast-by-luminance-not-hue [#11]; (c) ≤3 dominant hues [#15]; (d) no warm-on-warm collapse [#12]; (e) smooth hue drift, no wrap-blink [#13].
- **Composition →** (a) macro light/dark survives squint [#1]; (b) 2–4 attention regions [#3]; (c) genuine empty zones [#7]; (d) layout not frame-invariant [#8]; (e) attention regions shift across sections [#4].
- **Motion →** (a) 1 s trackability [#16]; (b) low jerk/smoothness [#17]; (c) multi-scale desync [#18]; (d) never all frozen [#19]; (e) felt direction in quiet [#20].
- **Intensity / dynamic range →** (a) has a global peak [#38]; (b) has a genuine quiet minimum [#38]; (c) quiet reads quiet by flow speed [#28]; (d) quiet reads quiet by scale [#29]; (e) no blend-saturation blowout [#14].
- **Depth →** (a) ≥3 octaves of spatial structure [#41]; (b) different up close vs afar [#42]; (c) fine texture rewards close viewing [#2]; (d) layers interact non-linearly [#43].
- **Form & ending →** (a) arc with peak + quiet [#38]; (b) outro ≠ intro but related [#39]; (c) recapitulation with one delta [#40]; (d) not a seamless loop [#39].

### Part 4 — Operationalizing "two-timescale unpredictability"

**Short timescale (~1 s trackability):** Compute dense optical flow over each 1 s clip window (RAFT/Farnebäck). PASS if (i) normalized flow-warping error is below threshold (frame t+1 warped to t leaves low residual — motion is continuous, not teleporting), AND (ii) a dominant coherent flow component exists (resultant-to-total flow ratio above threshold), AND (iii) median flow speed is below the screen-equivalent of ~30 deg/s so smooth pursuit can lock on. Grounded in Meyer/Lasker/Robinson (1985) pursuit ceiling and Newsome & Paré (1988) coherence floor. Flow-warping error (Lai et al. 2018, ECCV) and trajectorial smoothness (Volz et al. 2011, ICCV) are validated computable temporal-coherence measures; VBench (CVPR 2024) reports flow-based smoothness scores correlate ~99% with human temporal-flicker judgments. Grader phrasing: "In this 1 s clip, can the eye lock onto and follow a continuous motion (no stutter/teleport, not a blur of unrelated change)?"

**Long timescale (~20 s divergence):** Take three non-overlapping 20 s windows. Build a compact descriptor per window (sampled frame stack, deep-feature embedding, or flow-statistics histogram). Compute pairwise distance via normalized compression distance (NCD) and/or feature-space L2. PASS if all pairwise distances exceed threshold AFTER per-frame luminance normalization (so divergence isn't just brightness). NCD is a validated parameter-free similarity proxy (Li et al.; Cilibrasi & Vitányi). Grader phrasing: "Do these three 20 s windows show different EVENT VOCABULARIES (different kinds of things happening), not the same rule at different brightness?"

**Combined gate:** PASS two-timescale only if short-timescale continuity AND long-timescale divergence both hold — directly encoding the house's "narrow band between too-predictable and too-chaotic," consistent with the predictive-processing account (Van de Cruys & Wagemans 2011) that pleasure lives in resolvable, not trivial and not insurmountable, prediction error.

### Part 5 — Pseudo-science blacklist (must NOT be absorbed)

1. **Golden-ratio / golden-rectangle preference.** Fechner's result is an artifact; replications split ~50/50; careful reviews (Green 1995; Markowsky) reject a universal preference. Do not reward 1.618 framing, spiral overlays, or phi-based composition.
2. **"Fractal dimension 1.3–1.5 = beautiful" as a quality gate.** Average preference is real (Spehar et al. 2003; Taylor) but culture- and gender-moderated (Street et al. 2016), static-image-based, and not a per-image pass/fail criterion. Soft descriptor only.
3. **Universal hue-harmony angle rules (Moon & Spencer; "complementary/triadic = harmonious").** The hue-independence assumption fails empirically; modern data reject fixed-angle templates. Don't grade palettes by color-wheel geometry.
4. **Birkhoff M = O/C as a literal beauty score.** Historically influential but empirically unsupported (polygon studies failed to confirm). Use entropy/compressibility as descriptive features only.
5. **"More symmetry = more beauty" as a universal law.** Context-dependent; symmetry on organic content reads artificial. Not a positive gate for generative fields.
6. **Loudness→brightness as the goal of music coupling.** Cross-modally "natural" but is precisely the decorative strobe failure mode; treat as a negative marker, not a target.
7. **Pop "neuroaesthetics" universals** (single-number beauty predictors, dopamine-as-beauty claims). Treat predictive-processing as a framing, not a measurement.

### Part 6 — Prioritized v1 shortlist (best evidence-to-implementability)

1. **Macro luminance composition (squint)** — downsample to 32×32, normalize, one connected light region 5–30% of frame, RMS contrast > 0.15. [#1]
2. **No warm-on-warm collapse** — RMS luminance contrast ≥ 0.15 per still. [#12]
3. **Warm-arc hue confinement** — ≥90% saturated pixels within sanctioned hue arc. [#10]
4. **Contrast by luminance not hue** — luminance range > 0.5 AND hue spread < 60°. [#11]
5. **No blend-saturation blowout** — NOT(mean L > 0.7 AND channel range < 0.1). [#14]
6. **1/f spatial slope** — radial log-log power slope in [−1.6, −2.6]. [#5]
7. **Short-timescale trackability** — flow warping error low + median flow < ~30 deg/s equiv. [#16]
8. **Never all frozen** — mean flow magnitude above floor in every clip. [#19]
9. **Long-timescale divergence** — pairwise NCD/feature distance of 3×20 s windows above threshold after luminance normalization. [#22/#23]
10. **Audio drives geometry not brightness** — geometry delta > luminance delta between audio extremes. [#25]
11. **Quiet reads quiet (flow speed)** — quiet median flow < 50% of peak. [#28]
12. **Has an arc** — global energy maximum AND genuine quiet minimum across sections. [#38]
13. **Earned ending** — outro ≠ intro (not a loop) yet related (one delta). [#39/#40]
14. **Depth / multiscale** — energy across ≥3 spatial-frequency octaves. [#41]
15. **2–4 attention regions** — saliency map yields 2–4 peaks above 50% max. [#3]

## Recommendations

**Stage 1 (ship now — pure computed metrics, no new captures):** Implement shortlist items 1–6, 8, 11, 12, 14 from existing six stills. Deterministic image statistics; they remove grader subjectivity and directly encode the house palette/composition/depth doctrine. Calibrate every threshold on the existing graded corpus (kinetic-energy v1 = needs-tweak, v2 = chef-doeuvre) so the binary boundaries reproduce known verdicts.

**Stage 2 (build clip metrics):** Add an optical-flow pipeline (RAFT or Farnebäck) to compute trackability, window divergence via NCD, geometry-vs-brightness, arc/ending. This is where the harness's "graded-from-code" probes (motion_over_luminance, bass_movement, prediction_*) become observable — replacing the abolished shader-pass/fail.

**Stage 3 (new capture types):** Build the cursor-position triptych, with/without-cursor pair, fast-move latency capture, idle-matrix, and per-layer solo/ablation renders. These unlock the interaction (#31–37) and layering (#43–45) families that are currently code-read.

**Calibration discipline:** For every threshold, set it from the corpus, not from theory. The literature gives directions of effect, not cutoffs. Re-tune whenever a verdict disagrees with human judgment by more than one tier.

**Thresholds that would change the plan:** If flow-based metrics fail to separate known good/bad pieces on the corpus, demote them to soft flags and lean harder on still-based structure tests. If saliency models prove unreliable on abstract fields (likely — trained on photographs), keep #3/#15 as grader-assisted rather than fully automated.

## Caveats

- **Static-to-motion extrapolation is the central risk.** All of §B (color), §A (composition), the 1/f and fractal findings, symmetry, and mystery were measured on still images. Their transfer to 1–10 min audio-reactive motion is unproven; treat motion-specific markers (§C, §D) as primary and static markers as supporting.
- **"Beauty" markers are mostly "preference" or "interest" markers, often with small/contested effect sizes.** Berlyne's inverted-U, Kaplan's mystery, and color-harmony rules are weak or non-replicated; none should be a hard gate. The only hard gates with defensible grounding are the two-timescale motion tests (predictive-processing-backed) and the deterministic palette/luminance checks (house-validated).
- **Computable proxies approximate perception imperfectly.** NCD depends on the compressor; optical-flow warping error is nonzero even on good video; saliency models are trained on photographs, not abstract shaders. Use normalized/relative forms and corpus calibration.
- **Cross-cultural and individual variation is large** for color and fractal preference (Palmer & Schloss 2010 WAVE model: 80% variance in US adults, 44% shared with Japanese participants; Taylor & Franklin 2012: 61% for British observers). The warm-palette law is a house aesthetic choice, correctly treated as doctrine rather than a universal.
- **The grader-judgment items that remain (#27, #35) cannot be fully automated** and should be phrased as strict single questions with "can't tell = fail," per the mandate.
