# Critic rework — research brief

Prepared 2026-06-11 for Louis. Purpose: seed a deep-research run that
catalogs **markers of beauty / sustained visual engagement** usable as
**simple, unambiguous, binary** tests by the V-Jaygent critic.
Shareable; self-contained. Live copy:
https://vjaygent.develle.fr/learning/critic-rework-research-brief.md

---

## 1 · The system, in one page

V-Jaygent is an autonomous generative-art practice: Claude writes
WebGL2 fragment-shader pieces (audio-reactive, cursor-interactive,
optional keyboard synth) that ship at https://vjaygent.develle.fr.
Quality is enforced by an **artist/critic loop**:

- The **artist** (main agent session) builds the piece against a
  written thesis ("the claim", stated in `meta.yaml` before coding).
- A headless harness captures **evidence**: 6 PNG stills anchored at
  song sections (intro/verse/pre-peak/peak/quiet/outro) + 4–5
  five-second MP4 clips at distributed timestamps, rendered at
  1280×720 in headless Chromium.
- The **critic** (separate read-only agent, vision-capable LLM) grades
  the evidence against a written rubric (`taste.md`), producing a
  critique document with a machine-parsed YAML tail: per-probe grades,
  six 1–5 dimension scores, and one of five verdicts
  (chef-doeuvre / ship-it / needs-tweak / structural-rethink /
  premise-wrong). `needs-tweak` ships with a `top_fix` (one concrete
  shader edit) that the loop auto-applies, re-renders, re-grades
  (≤ 8 laps). Verdicts and grades render in a public grades view.

The critic currently evaluates: 1 binary claim check, ~42 probes in
6 families, and 6 scalar dimensions. Probe counts per family vary
because **each family is a sum of individual binary-ish tests**
(mesmerizing 5, interaction 7, music 4, song-level 6, dual-input 7,
layered 8–11) with per-family pass thresholds.

### The change mandate (Louis, 2026-06-11)

1. **Every criterion must be a simple, unambiguous, binary question.**
   If a criterion is not simple, decompose it into several criteria.
2. **`weak` / `weak-pass` are abolished** — anything not clearly a
   pass is a fail.
3. **`shader-pass` / `shader-fail` / `shader-unclear` are abolished**
   — grading from code-reading means the harness is missing a capture
   capability. Improve the harness so the critic tests what it grades.
4. **`frame-unclear` / `interaction-unclear` are abolished** — "can't
   tell" is a fail (of the piece or of the harness; either way not a
   shrug).
5. **`n/a` stays** — some criteria legitimately don't apply
   (music probes on silent pieces, etc.).
6. **The six scalar dimensions get the same treatment** — decompose
   each into binary criteria.

---

## 2 · Current criteria catalog, with a binary-ambiguity audit

Verbatim short forms (full text: `taste.md` in the repo;
machine-readable: https://vjaygent.develle.fr/api/probe-info).
Audit flags: **[OK]** already a clean binary question · **[BUNDLED]**
multiple questions in one probe — split · **[VAGUE]** judgment words
without operational definition · **[HARNESS]** currently untestable
from captures (graded by reading shader code) · **[METRIC]** could be
a computed image/video statistic.

### Claim check (binary gate) — [OK]
"Restate the piece's stated thesis. Do the frames deliver it?" Honest
binary; failure = automatic top fix.

### Mesmerizing (5 probes, always apply)
- `eye_landing` — [BUNDLED] asks at once: does the eye land
  somewhere? are there 2–4 candidate regions? do they shift across
  frames? → 3 criteria.
- `prediction` (HARD GATE, two sub-tests):
  - `prediction_continuity` — [VAGUE] "can the eye track motion
    smoothly?" — needs an operational definition (e.g. optical-flow
    coherence over a 1 s slice). [METRIC] candidate.
  - `prediction_divergence` — [VAGUE] "visibly different flow
    configurations and event vocabularies" between 20 s windows —
    the single most load-bearing judgment in the rubric, and the
    least operationalized.
- `squint` — [BUNDLED] (a) does macro light/dark structure emerge
  when blurred? [METRIC: downsample + contrast] (b) does fine texture
  reward close viewing? → 2 criteria.
- `hue_drift` — [VAGUE]+[METRIC] "slow drift within a warm family" —
  hue histograms across frames could make this fully computable.
- `mystery` — [VAGUE] "what does the piece refuse to tell you?"
  (Kaplan). The most subjective probe; the research run should find
  decomposable proxies (occlusion, partial legibility, depth
  ambiguity, promised-but-withheld structure).

### Interaction (7 probes, cursor pieces)
- `composition` — [OK] but [HARNESS]: needs 3 cursor-position
  captures the harness doesn't take.
- `idle` — [OK]; testable today (idle render).
- `readability` — [VAGUE] "could a cold viewer grasp the mapping in
  3 s?" — proxy needed.
- `reversibility` — [OK] but [HARNESS] (a→b→a cursor path capture).
- `dominance` — [METRIC]-ish ("cursor ≤ ~30% of structural energy")
  but undefined how to measure; [HARNESS] (with/without-cursor pairs).
- `convention` — [OK]-ish (list of prior-violating mappings).
- `latency` — [OK]+[METRIC] but [HARNESS] (fast-move capture, count
  lag frames).

### Music per-frame (4 probes, audio pieces)
- `motion_over_luminance` — [HARNESS]: currently answered by reading
  GLSL ("do audio uniforms feed geometry or only brightness?"). The
  visual version exists: compare frames at low/high audio for
  geometric vs brightness deltas. [METRIC] candidate.
- `bass_movement` — [HARNESS] same shape (code-read today).
- `rhythm_in_stills` — [OK] ("frames show mid-phase geometry, not
  same-scene-brighter").
- `quiet_reads_quiet` — [VAGUE] "de-energize structurally" →
  decompose: flow speed drops? scale tightens? luminance drops?
  [METRIC] candidates each.

### Song-level (6 probes) — the best-operationalized family; use as
the model. All mostly [OK]: render at defined progress points, ask
countable questions ("can a viewer match 3/5 frames to sections?",
"≥ 2 structural events keyed to composition uniforms?"). Two still
lean on code-reading ([HARNESS]): `downbeat_anchored`,
`per_stem_discrimination`.

### Dual-input (7 probes) — mostly [OK] phrasing, but 5 of 7 are
[HARNESS] (need cursor+audio matrix captures: both / music-only /
cursor-only / neither — the "idle matrix").

### Layered (8–11 probes, layer-stack pieces)
- `spatial_coupling`, `multi_input_coupling`, `visible_phase_lock`,
  `brightness_strobe`, `polyrhythm_of_clocks`, `coupling_cost` —
  [HARNESS]: all answered from code today. Visual equivalents or
  per-layer solo captures (render each layer alone — the engine
  could do this) would make them observable.
- `eye_distribution` — [VAGUE]+[METRIC] ("dominance map, 2–4 regions").
- `quiet_survives`, `order_meaningfulness`, `layer_distinctness` —
  [VAGUE] "mentally zero out / swap / solo a layer" — the harness
  could ACTUALLY render those ablations instead of imagining them.
- `blend_saturation` — [OK]+[METRIC] — already numeric (mean L > 0.7
  AND channel range < 0.1 fails). The exemplar of what every
  criterion should look like.

### Dimensions (6 × scalar 1–5 — ALL to decompose)
Anchors exist for 1/3/5 only; 2/4 are "between"; ambiguity rounds
down. Verbatim 1↔5 anchors:
- `palette_cohesion`: disco/rainbow ↔ single warm family, contrast by
  luminance only, light-through-one-glass.
- `composition`: same macro shape every frame ↔ composition wanders at
  ~15–60 s periods, intrinsic empty zones, eye lands and moves.
- `motion`: one-scale audio-locked pulse ↔ multiple desynchronized
  scales, never all frozen, felt direction even in quiet.
- `intensity`: always loud or always quiet ↔ genuinely quiet quiets,
  asymptotic peaks, dynamic range both ways, silence as form.
- `depth`: one resolution of noise ↔ structure at every scale, reads
  different up close vs afar.
- `form_ending`: loop, no arc ↔ has an arc AND knows when to stop,
  earned ending, composed for its duration.

### Verdict bars (kept; consume the binary results)
chef-doeuvre = all probes pass + claim + dims bar · ship-it ·
needs-tweak (+ mandatory one-edit `top_fix`) · structural-rethink
(hard gate: prediction fail, or ≤ 3/5 mesmerizing) · premise-wrong.

---

## 3 · Aesthetic doctrine — Louis's accumulated feedback

Everything below is distilled from `VISION.md`, `taste.md` provenance,
`tasks/lessons.md`, and the project memory (feedback files). These are
the house's empirical findings; the research should connect them to
literature and extend them — not contradict them without evidence.

**Palette & light**
- Warm-only palette law: near-black → wine → ember → amber → gold →
  cream; contrast by LUMINANCE, never by hue opposition. "Light
  through a single piece of glass." (Per-piece sanctioned exceptions
  exist, e.g. one cold-palette piece, recorded in VISION.md.)
- Warm-on-warm collapse: stacks with all layers in the same warm band
  compress into low-contrast soup (L-contrast < 0.15) — cream needs
  near-black behind it.
- Cyclic palettes for index-rotation pieces: linear ramps blink at the
  wrap point; N-waypoint cyclic sampling makes the wrap invisible.

**Unpredictability (the core doctrine — two timescales)**
- "Mesmerization lives in a narrow band defined by two opposing
  failures at two different timescales: too predictable (the viewer
  who's watched a divergence-window can imagine the next) and too
  chaotic (no continuity for the eye to bind to)." Both must hold
  SIMULTANEOUSLY: smooth trackable flow at ~1 s; divergent event
  vocabulary across ~20 s windows.
- The 20-second-window test: three different windows must show
  different EVENT VOCABULARIES — not different brightnesses of the
  same rule. Pattern-grid pieces need a chaos-transformation layer.
- Prediction failure is a hard gate: no amount of polish saves a
  predictable piece (structural-rethink, not parameter tuning).

**Liveness & motion**
- Default toward alive / chaotic / fast; static = death. Three
  timescales of liveness must coexist: section-boundary chaos events
  + mid-section per-beat motion + always-on sub-beat jitter. Any one
  alone leaves the other phases of the song dead.
- Motion at multiple desynchronized scales (macro flow + fine churn);
  "never all frozen simultaneously"; direction felt even in quiet.
- Pixel-to-state-map pieces (basins, Lyapunov, escape-time) freeze
  without a slow global-parameter drift or pan/zoom — "animate the
  landscape".

**Music coupling**
- Audio must drive GEOMETRY (where pixels are), not brightness (how
  bright) — amplitude→luminance reads as decoration, breeds strobe.
- Bar/beat/downbeat should drive geometric phase-lock (rotation snap,
  expanding ring on downbeat); sections must ANNOUNCE themselves with
  different visual vocabulary, not re-shaded parameters.
- Quiet must read quiet STRUCTURALLY (slower flow, tighter scale,
  calmer geometry) — not merely dimmer. Silence is part of the piece.
- Pre-tension: the build before a drop should visibly squeeze /
  desaturate / withhold.

**Composition & attention**
- Eye-landing: 2–4 candidate regions that shift across frames, so the
  gaze can wander and return. 1 region = monotony; 8+ = chaos.
- Squint test: a macro light/dark composition must survive blurring;
  full-frame textures (Voronoi/RD/fbm) need 1–2 wandering hot-zones —
  a drifting macro brightness envelope.
- Dual resolution (Ikeda): macro structure on squint AND fine texture
  rewarding close viewing.
- Mystery (Kaplan): the strongest predictor of sustained preference —
  an edge that won't resolve, figure/ground flips, promised-but-
  withheld structure.

**Layers & interaction**
- Layers must interact (consume each other geometrically), not stack;
  a lead layer needs an always-on band (`max(silhouette*0.30, accent)`)
  — accent-only leads leave structure invisible.
- 2–4 layers must EACH visibly react to cursor and keyboard — one
  ripple-only input layer is decoration.
- Cursor as instrument (≥ 2 axes of effect); cursor contribution
  bounded (~≤ 30% of structural energy) so it plays the piece, not
  paints over it.
- State-bearing fields: injection must not exceed decay (washes to
  flat-bright in seconds) — tune ratios on paper.

**Form**
- A piece is composed for its duration: arc with a peak and a real
  quiet moment; intro and outro recognisably related with one visible
  delta (recapitulation); endings are earned.

**Process truths (for calibrating any new criteria)**
- Stills under-grade high-frequency motion (> 2 Hz shimmer reads as
  frozen in a still) — motion criteria need clip evidence.
- The critic must not round up: if its own notes say "legible /
  learnable / predictable", that is a fail.
- Builder self-grading runs 5–7 points generous — criteria must be
  evaluable by an independent agent from evidence alone.

---

## 4 · The deep-research prompt (ready to paste)

> **Research task: an evidence-based catalog of binary beauty tests
> for real-time generative, audio-reactive abstract visual art.**
>
> **Context.** I run an autonomous generative-art system: an AI artist
> writes WebGL fragment-shader pieces (abstract, audio-reactive,
> cursor-interactive, 1–10 min, warm-luminance palette), and an
> independent AI critic with vision capabilities grades each piece
> from captured evidence: six 1280×720 stills anchored at song
> sections, plus four-to-five 5-second clips at distributed
> timestamps (more capture types can be added if a test requires
> them, e.g. per-layer solo renders, cursor-path captures, computed
> image statistics). Full system brief, current criteria catalog,
> and house aesthetic doctrine:
> https://vjaygent.develle.fr/learning/critic-rework-research-brief.md
>
> I am rebuilding the critic's rubric under one rule: **every
> criterion must be a simple, unambiguous, binary pass/fail question**
> — no "weak", no 1–5 scales, no "can't tell". Compound qualities must
> be decomposed into several binary criteria.
>
> **Deliverables:**
> 1. **A catalog of candidate markers of visual beauty / sustained
>    aesthetic engagement**, drawn from: empirical aesthetics (Fechner
>    through Berlyne's arousal/complexity inverted-U; Kaplan &
>    Kaplan's coherence/complexity/legibility/mystery), processing-
>    fluency theory and its disfluency refinements, predictive-
>    processing / expectation-violation accounts of aesthetic
>    pleasure, computational aesthetics (Birkhoff's M = O/C, entropy
>    and compressibility measures, fractal-dimension preference
>    studies ~D 1.3–1.5, 1/f spatial and temporal spectra in art),
>    color science (harmony models, ecological valence theory,
>    luminance-contrast vs hue-contrast findings), motion perception
>    (optical-flow coherence, smooth-pursuit limits, preference for
>    naturalistic dynamics, jerk/smoothness metrics), cross-modal
>    music-visual correspondence research, gaze/eye-tracking studies
>    of engagement with abstract art, and practitioner knowledge (VJ
>    culture, demoscene, Shadertoy, generative-art criticism — e.g.
>    Tyler Hobbs' essays, Galanter's complexism).
> 2. **For each marker:** name; research basis with citations and an
>    honesty note on evidence strength (replicated? effect sizes?
>    contested?); ONE proposed binary test phrased as a single
>    unambiguous question a vision-capable grader can answer from the
>    evidence types above; what evidence it needs (still / clip /
>    computed metric / a new capture type to build); known confounds
>    and failure modes; and whether it could be fully automated as an
>    image/video metric rather than judged.
> 3. **A decomposition proposal** for my six scalar dimensions —
>    palette cohesion, composition, motion, intensity/dynamic range,
>    depth, form & ending (anchor definitions in the brief) — into
>    3–6 binary criteria each, grounded in the catalog.
> 4. **An operationalization of "two-timescale unpredictability"** (my
>    core doctrine, see brief §3): concrete binary tests for
>    short-timescale continuity (~1 s trackability) and long-timescale
>    divergence (do 20 s windows differ in event vocabulary?), ideally
>    with computable proxies (optical-flow statistics, feature-space
>    distances between windows, compression-distance measures).
> 5. **A pseudo-science blacklist**: widely-cited aesthetic "laws"
>    with weak or debunked evidence (golden-ratio preference claims
>    etc.) that the rubric must not absorb.
> 6. **A prioritized shortlist**: the ~15 tests with the best
>    evidence-to-implementability ratio for a v1 binary rubric,
>    with a one-line implementation sketch each.
>
> Favor primary literature and meta-analyses over pop-science
> summaries. Where the literature studies static images only, say so
> explicitly and flag the extrapolation risk to motion.

---

## 5 · Pointers (for the researcher or future sessions)

- Rubric source of truth: `taste.md` · critic operating manual:
  `skills/vjay-iterate/SKILL.md` · machine-readable criteria:
  https://vjaygent.develle.fr/api/probe-info
- Real graded examples: https://vjaygent.develle.fr/api/critiques/kinetic-energy-v1.md
  (needs-tweak with measured top_fix) → kinetic-energy-v2.md
  (chef-doeuvre after fix, cautions verified by measurement).
- Lessons: https://vjaygent.develle.fr/learning
