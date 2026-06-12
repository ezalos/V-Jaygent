---
user-invocable: true
allowed-tools: Read, Edit, Bash, Agent, TaskCreate, TaskUpdate, TaskList
description: Refine an existing V-Jaygent piece via a critic-agent-in-loop. Critic judges whether the piece is mesmerizing + delivers its claim, grades against taste.md's binary rubric (pass|fail|n/a, schema-2 YAML tail), returns one of five verdicts. Loop applies needs-tweak fixes; stops on chef-d'oeuvre, ship-it, structural-rethink, or premise-wrong.
---

# /vjay-iterate — critic-in-the-loop piece refinement

## Trigger

`/vjay-iterate <slug>` — refine the V-Jaygent piece at `pieces/<slug>/`
by running a critic agent that judges whether the piece mesmerizes
(9 binary criteria) and delivers its claim, grades it against
`taste.md` (pass|fail|n/a only — no scores, no soft grades), and
returns one of five verdicts. The loop applies `needs-tweak` fixes
and stops when the critic says `chef-doeuvre` (perfect), `ship-it`
(good enough), `structural-rethink` / `premise-wrong` (hand back),
or iteration cap hits 8.

If `<slug>` is omitted, read `pieces/current.txt` and use that.

## Flow

```
                   /vjay-iterate <slug>
                          │
                          ▼
             ┌──────── setup ────────┐
             │ piece + taste exist?  │
             │ studio server up?     │
             │ find latest vN        │
             └──────────┬────────────┘
                        │
             ┌───── LOOP ≤ 8 ─────────────────────┐
             ▼                                    │
      capture (inspect-music + inspect-          │
      interaction) + metrics (aesthetic-          │
      metrics.py piece/interaction/gate)          │
                        │                         │
                        ▼                         │
      ┌──── CRITIC agent (Explore, read-only) ───┐│
      │ reads meta, taste, VISION, shader, lib/, ││
      │   stills + clips + interaction captures, ││
      │   pasted metrics JSON, prior crits       ││
      │ outputs Markdown + YAML tail (schema 2): ││
      │   verdict, binary criteria families,     ││
      │   claim_check, dimensions, metrics,      ││
      │   harness_gaps, top_fix                  ││
      └───────────────┬──────────────────────────┘│
                      ▼                           │
        save critique → brainstorming/critiques/  │
                        │                         │
                        ▼                         │
       ┌──── exit conditions (check order) ───┐   │
       │ verdict: chef-doeuvre?      │── DONE │   │
       │ verdict: ship-it?           │── DONE │   │
       │ verdict: premise-wrong?     │── hand │   │
       │ verdict: structural-rethink?│── hand │   │
       │ same top_fix as prior?      │── hand │   │
       │ iter == 8?                  │── hand │   │
       └────────┬─────────────────────┘          │
                │ verdict: needs-tweak           │
                ▼                                │
      caution? (would flip a passing             │
      criterion to fail?) → YES → ask for alt    │
                │ NO                             │
                ▼                                │
       apply top_fix via Edit on shader.frag     │
                │                                │
                ▼                                │
      sanity render (publish.mjs 2s)             │
       compile error? → revert, continue         │
                │ OK                             │
                └───────── back to capture ──────┘
                   │
                   ▼
          summarise deltas → one bundled commit
```

Invariants: critic has no Edit tool (separation of eyes); one top_fix
per iteration (no multi-change stacking); history cumulative (prior
critiques read each loop, prevents oscillation); caution field blocks
fixes that would flip a currently-passing criterion to fail — the
mesmerizing criteria outrank everything; one commit at end.

## Prerequisites

- Repo root is `~/42/V-Jaygent`.
- Studio server is running (`npm run studio` or equivalent). The skill
  will check and surface a clear error if not.
- The piece exists at `pieces/<slug>/` with at least `shader.frag` and
  `meta.yaml`.
- `taste.md` exists at the repo root. Read it at the start of the run.

## Observability

Every invocation writes an event stream to `.runs/<run_id>.jsonl`
(gitignored) and refreshes `brainstorming/runs/<slug>.md` (committed).
Use `bin/runs.mjs` at step boundaries — the calls below are part of the
workflow, not optional. At the end of the run, `rollup` regenerates the
human-readable table so future sessions can see what changed.

## Workflow

### 1. Setup

- `cd ~/42/V-Jaygent`.
- Confirm `pieces/<slug>/shader.frag` and `taste.md` exist. If not,
  stop and tell the user which is missing.
- `curl -sS -m 3 http://127.0.0.1:7777/api/catalog > /dev/null` to
  verify the studio server is up. If not, tell the user to start it.
- Create a TaskCreate entry per iteration slot (up to 8).
- Determine the starting version number by reading
  `brainstorming/critiques/` — if the latest critique is `<slug>-vN.md`,
  the next will be `v(N+1)`.
- **Open a run:** `RUN_ID=$(node bin/runs.mjs start --slug <slug> --skill vjay-iterate)`.
  Keep `$RUN_ID` in context for logging throughout the loop.

### 2. Loop (for iteration in 1..8)

For each iteration:

#### 2a. Capture fresh evidence + run machine checks

```
node bin/inspect-music.mjs <slug>             # section-anchored stills + multi-window clips + clip-peak
node bin/inspect-interaction.mjs <slug>       # frozen-clock cursor triptych + a2 drift baseline, with/without
                                              #   pair, a→b→a pair, annotated latency burst, 30s idle-matrix
                                              #   cells, build-cursor.mp4, per-layer solos, manifest.json
node bin/lint-palette.mjs <slug>              # warm-cycle check
node bin/lint-idle.mjs <slug>                 # idle-survival check
node bin/lint-composition.mjs <slug>          # quadrant / axis balance
node bin/audit-piece.mjs <slug>               # static anti-pattern audit
python3 bin/aesthetic-metrics.py piece <slug>        # stills + clips metrics panel (JSON)
python3 bin/aesthetic-metrics.py interaction <slug>  # interaction metrics from inspect-interaction/ (JSON)
python3 bin/aesthetic-metrics.py gate <slug>         # hard gates: no_blowout + dominant_hues (exit code)
node bin/runs.mjs log $RUN_ID --event inspect --iteration <N> --status ok --data '{"frames":5}'
```

`inspect-music` writes `pieces/<slug>/inspect-music/music-*.png` plus
`clip-w*-t*.mp4` and `clip-peak.mp4` (section-anchored when the piece
has audio.analysis.json; audio-time-spread or wall-clock otherwise).
`inspect-interaction` writes `pieces/<slug>/inspect-interaction/` —
run it for every piece with cursor or keyboard input; for a
cursor-reactive piece a missing run means the critic must fail the
interaction criteria as harness gaps. Read the stills yourself — you
want to know what the critic is seeing, and captures change each
iteration as the shader changes.

**Capture the metrics JSON.** Save the `piece` and `interaction`
output (and the gate result) — step 2b pastes them verbatim into the
critic prompt, and the full JSON goes into the evidence snapshot as
`metrics.json`. The critic embeds the summary under the YAML tail's
`metrics:` key and treats measured values as authoritative unless it
documents why a metric misfired.

**Lint failures and hard-gate fails are first-priority fixes.** If
any of the four lints FAILs, or `aesthetic-metrics.py gate` exits
non-zero (no_blowout / dominant_hues on core stills), the critic's
top_fix must target that before any rubric criterion. Don't grade
rubric criteria when machine checks are red — the piece fails at a
coarser level than any criterion captures.

#### 2b. Spawn the critic agent

Use the Agent tool with `subagent_type: "Explore"`. The Explore agent
has Read, Grep, Glob, WebFetch but **critically also multimodal image
input via Read**, which is the whole point.

Critic agent prompt template (fill in placeholders):

````
You are the V-Jaygent critic. Your single job is to judge whether
piece `<slug>` is *mesmerizing* — does it hold the eye without
exhausting it? — and whether it delivers on its own claim. Grading
against the taste.md rubric supports that judgment; it does not
replace it.

A piece that passes every dimension panel but isn't mesmerizing is a
failed piece. The mesmerizing criteria outrank everything. Your
allegiance is to the eye, not the checklist.

**GRADE VOCABULARY (taste.md v2, binary).** Every criterion is one
binary question. The only grades are **pass**, **fail**, and **n/a**.
Not clearly pass = fail. There is no weak grade, no shader-graded
verdict, no unclear grade. A criterion is answered from *captures and
metrics* — things you can see or compute — never from reading code
alone; read the GLSL as corroboration only. If a criterion can't be
answered because the capture or metric it needs doesn't exist, grade
it **fail** AND record it under `harness_gaps` in the YAML tail with
the missing capture named — the fix for a harness-gap fail is
building the capture, not editing the shader. `n/a` is reserved for
genuinely inapplicable criteria or families (no audio → no music
family; accumulation thesis → no cursor reversibility); "I didn't
capture it" is never n/a.

**CALIBRATION VIA REFERENCE COMPARISON (v2 binary form; lineage: the
2026-05-11 aurora stress-test).** For criteria taste.md tags
*measured*, the machine metrics panel decides — don't re-litigate it
by eye unless you document a misfire. For judgment-graded criteria,
resolve borderline calls by side-by-side comparison:

> Open the reference frames for the relevant panel (paths below) and
> put the candidate next to them. Clearly worse than the reference on
> that criterion's question (visibly less detail, less drift, less
> variation) → **fail**. Comparable (different look, same level of
> craft) or clearly better → **pass**. References are anchors, not
> ceilings.

Two guard rails, learned the hard way: not-clearly-pass rounds DOWN
to fail (over-polishing a real flaw is recoverable, ignoring one is
not), but apply the side-by-side only to criteria that are genuinely
borderline — don't blanket-fail unrelated criteria out of global
pessimism. The murmuration over-grade and the aurora over-correct
were equal-magnitude errors in opposite directions; anchored
comparison stays calibrated on both.

**Reference frames** for the side-by-side. Read 1-2 frames from each:
- /home/ezalos/42/V-Jaygent/pieces/apollonian-foam/inspect-music/*.png
  (depth + palette_cohesion panel reference)
- /home/ezalos/42/V-Jaygent/pieces/braid/inspect-music/*.png
  (composition panel + mesmerizing-family reference)
- /home/ezalos/42/V-Jaygent/pieces/cirrus/inspect-music/*.png
  (motion panel reference — polyrhythm visible across section anchors)
- /home/ezalos/42/V-Jaygent/pieces/eclipse/inspect-music/*.png
  (depth + intensity panel reference, fractal-interior void)
- /home/ezalos/42/V-Jaygent/pieces/ferment/inspect-music/*.png
  (depth reference for ping-pong feedback pieces specifically — its
  Gray-Scott marbling is the C-architecture chef-d'oeuvre anchor for
  fractal interior detail)

# Read, in this order

1. /home/ezalos/42/V-Jaygent/pieces/<slug>/meta.yaml
   READ THIS FIRST. Pull the thesis: what does this piece claim?
   Summary, description, or top-of-file comments — whichever states
   the piece's intent most clearly.

2. /home/ezalos/42/V-Jaygent/taste.md
   The rubric (v2, binary). The nine Mesmerizing criteria with the
   two-timescale prediction hard gate, the claim-check gate, the
   family criteria (interaction, music, song-level, dual-input,
   layered, integration), the six dimension panels, the verdict
   bars, the machine metrics panel, the harness-gap doctrine, the
   schema-2 YAML tail spec with its worked example, and the VJ
   lenses. This is your grading constitution — every criterion's
   full definition lives there, not in this prompt.

3. /home/ezalos/42/V-Jaygent/VISION.md
   The aesthetic manifesto. Warm palette, fractal depth, math as
   the reason the eye lingers. Use this to catch violations.

4. /home/ezalos/42/V-Jaygent/brainstorming/critiques/plume-v2.md
   READ THIS ONCE as a style reference. Concrete per-frame
   observations, honest tables, named wins and losses, a decision.
   Match this register. Not rubric-speak.

5. /home/ezalos/42/V-Jaygent/pieces/<slug>/shader.frag
   The code. When proposing a fix, refer to specific constants,
   functions, or sections by name so the fix is Edit-applicable.
   Also check whether `iTime` drives multiple terms with different
   scalings or a single clock — feeds the desynchronised-clocks lens.

6. /home/ezalos/42/V-Jaygent/lib/
   List contents. Know what shared GLSL already exists — fbm,
   hash21, vnoise, reinhard, rot2d, sdCircle, laplacian4 and
   friends. Prefer "use lib/noise.glsl's fbm" over "re-implement
   fbm" in your top_fix.

7. /home/ezalos/42/V-Jaygent/brainstorming/techniques/interactivity.md
   READ THIS if the piece declares cursor reactivity (shader
   references `u_mouse`, meta.yaml describes mouse behaviour, or a
   prior critique called out interaction). The seven interaction
   criteria themselves live in taste.md §"Interaction criteria";
   this doc holds the artist references, the pattern taxonomy
   (field modulation, parameter pilot, camera control,
   velocity-driven, dwell, hybrid), and the mouse-Y-as-zoom case
   study. Skip it for pieces with no cursor reactivity.

8. /home/ezalos/42/V-Jaygent/brainstorming/techniques/music-to-shader.md
   READ THIS if the piece declares audio reactivity (shader
   references `u_audio_*`, `meta.time_source: audio`, or meta.yaml
   describes music behaviour). It holds the band→parameter rules
   ("don't bind visuals to u_audio_* naively"), the section-state
   and beat-snap patterns, the beat-grid uniform rules (clocks vs
   amplitudes), the flash-budget philosophy, and per-stem binding
   etiquette. Grounds the four per-frame Music criteria (see
   taste.md §"Music criteria"). Skip for silent pieces.

9. /home/ezalos/42/V-Jaygent/brainstorming/techniques/music-composition.md
   READ THIS if the piece dir contains `audio.analysis.json` AND
   the shader references any song-level uniform (`u_section_*`,
   `u_downbeat`, `u_to_section_change`, `u_song_progress`,
   `u_audio_*_stem`, `u_key_*`). It holds the song-level rules:
   downbeat anchoring, section-state machines, pre-tension and
   knowing-the-future, per-stem voice assignment, key/chord
   palette modulation, and recapitulation. Grounds the six
   Song-level criteria (see taste.md §"Song-level criteria"). Skip
   for pieces without analysis JSON or without song-level uniform
   references.

10. /home/ezalos/42/V-Jaygent/brainstorming/techniques/layered-composition.md
    READ THIS if the piece declares a layer stack (`meta.yaml` has a
    `layers:` array). It holds the coupling recipes (refraction,
    advection, force-field, mask-reveal, feedback, SDF intersection),
    the blend-mode analysis for warm palettes, polyrhythmic clocks
    across layers, and the nine anti-patterns. Grounds the eleven
    Layered criteria (see taste.md §"Layered criteria"). Skip for
    monolithic single-shader pieces.

11. /home/ezalos/42/V-Jaygent/brainstorming/techniques/audio-cursor-together.md
    READ THIS if the piece declares BOTH cursor reactivity AND
    audio reactivity (shader references `u_mouse` AND any
    `u_audio_*`). It holds the role-assignment default (music
    structures, cursor modulates), the conflict-resolution patterns
    (floor-and-ceiling vs disjoint), the 5 coupling recipes, the
    idle-behaviour matrix, and the anti-patterns. Grounds the seven
    Dual-input criteria (see taste.md §"Dual-input criteria"). Skip
    for single-channel pieces.

12. /home/ezalos/42/V-Jaygent/brainstorming/techniques/basins-of-attraction.md
    READ THIS if the piece declares a basin-of-attraction / chaotic
    field — a layer that colors pixels by the outcome of an iterated
    map or ODE integration (gravity basins, Newton / escape-time
    fractals, Lyapunov chaos maps), or meta.yaml describes such a
    field. It holds the single-pass GLSL recipes and the honest
    signature — smooth interior lakes shredding into fractal filigree
    at the boundaries. Grounds the basin clause of the Structure-
    honesty lens (taste.md §"VJ lenses / Structure honesty"). Skip
    for pieces with no basin / chaos field.

13. Each of the section-anchored stills at
    /home/ezalos/42/V-Jaygent/pieces/<slug>/inspect-music/music-*.png
    Actually look. The filename includes the section label
    (intro/verse/peak/quiet/outro) when audio analysis exists — use it
    to verify the piece reads differently across the song's structure.
    Your observations must cite specific frame numbers. Then the
    multi-window clips `clip-w*-t*.mp4` and `clip-peak.mp4` in the
    same directory — the two prediction criteria REQUIRE clips and
    cannot be graded from stills (extract frames with ffmpeg via Bash
    if you can't view video directly: a frame every ~0.25 s per clip
    is enough to judge continuity and divergence). Missing clips =
    both prediction criteria fail as harness gaps.

14. The interaction captures at
    /home/ezalos/42/V-Jaygent/pieces/<slug>/inspect-interaction/
    (from `bin/inspect-interaction.mjs`): frozen-clock cursor
    triptych `cursor-{a,b,c}.png` + drift baseline `cursor-a2.png`
    (position a recaptured at the end of the stills block — the a↔a2
    delta is pure no-cursor sim drift; cursor effects must exceed
    it), with/without pair `cursor-{active,idle}.png`, reversibility
    pair `cursor-aba-{0,1}.png`, annotated latency burst
    `latency.mp4` + `latency-fNN.png` (manifest gives the jump
    frame), 30 s idle-matrix clips
    `matrix-{both,music,cursor,neither}.mp4`, build-spanning
    `build-cursor.mp4` (12 s cursor orbit into the peak — answers
    authority_during_build), per-layer solos `solo-<layer>.png`, and
    `manifest.json`. Read manifest.json first — stills are captured
    with the clock FROZEN (`clock_frozen: true`) so deltas are
    cursor-attributable on wall-clock pieces too; multi-pass sims
    still step per frame (class `frozen-clock-state-advances`,
    correct against the a↔a2 baseline; say so when it matters). If this
    directory is missing for a cursor-reactive piece, every criterion
    that needs it FAILS as a harness gap naming
    bin/inspect-interaction.mjs.

15. The machine metrics panel pasted into this prompt (from
    `bin/aesthetic-metrics.py piece/interaction/gate`). For every
    criterion taste.md tags *measured*, the panel value is
    authoritative unless you document why the metric misfired — the
    misfire note goes next to the overridden grade. Per-still tests
    apply to the core stills (all section stills except the first
    and last).

16. Lint reports from the most recent run (palette / idle / composition
    / audit) and the hard-gate result (`aesthetic-metrics.py gate`:
    no_blowout + dominant_hues). If any FAIL is present, the top_fix
    MUST address it before any rubric criterion. Machine reds beat
    rubric polish.

17. The reference frames listed in the calibration guard above. Read
    1-2 from each chef-d'oeuvre piece. Compare the candidate to that
    bar.

18. Any previous critique at
    /home/ezalos/42/V-Jaygent/brainstorming/critiques/<slug>-v*.md
    So you know what has already been tried and don't re-propose it.

# Machine metrics panel (pasted by the loop)

The loop ran these before spawning you; the JSON is pasted here:

- `python3 bin/aesthetic-metrics.py piece <slug>` → <PASTE stills+clips JSON>
- `python3 bin/aesthetic-metrics.py interaction <slug>` → <PASTE interaction JSON or "not captured">
- `python3 bin/aesthetic-metrics.py gate <slug>` → <pass|fail>

Embed the summary under the YAML tail's `metrics:` key and cite panel
values in the relevant criterion rows. Measured values are
authoritative unless you document the misfire.

# Write the critique as Markdown, then a YAML tail

All sections required, in this order (taste.md §"How to use this
during iteration"): The claim · Frame-by-frame · Mesmerizing
criteria · Claim check · Family criteria · Dimension panels ·
Metrics panel · What's working · What's imperfect · Harness gaps ·
Verdict — then the schema-2 YAML tail. Grade vocabulary everywhere:
pass | fail | n/a.

## The claim

One sentence. "This piece claims [X]." Pulled from meta.yaml, in
your own words. If meta.yaml's thesis is unclear or contradictory,
say so here. Then declare the two prediction timescales for THIS
piece (taste.md §Prediction): continuity scale (100 ms–2 s; short
for fast/kinetic, long for ambient) and divergence scale (5–30 s;
short for short or rapidly-reconfiguring pieces, long for long-form
ambient), with one line of reasoning — e.g. "continuity 0.3 s,
divergence 15 s (165 s arc, 136 BPM — fast continuity, medium
divergence)". Declared scales make the grade reproducible.

## Frame-by-frame

One row per captured still (typically 4-6) of concrete observations.
What you SEE, not what you infer.

| Frame | t     | What's there                                          |
|-------|-------|-------------------------------------------------------|
| 0     | 1.5s  | where the eye lands, dominant hue, luminance floor,   |
|       |       | presence of motion blur / fractal edges / empty zones |
| 1     | 9.5s  | ...                                                   |
| 2     | 17.5s | ...                                                   |
| 3     | 25.5s | ...                                                   |

Adjust timestamps to whatever inspect actually captured. Each frame
is a distinct moment — don't write "same as frame 0 but brighter."

## Mesmerizing criteria

Grade all nine binary criteria from taste.md §"Mesmerizing — the
first question". Each is one observable question; each verdict gets a
one-sentence justification tied to the frame-by-frame table and to
named clips.

| Criterion              | Question (one line)                                                          | Capture that answers it                                      |
|------------------------|------------------------------------------------------------------------------|--------------------------------------------------------------|
| eye_lands              | does the eye find at least one place to land in frame 0 and every core still? | section stills                                               |
| landing_regions_2_4    | 2–4 candidate landing regions per still — not 1, not 8+?                      | section stills (judgment)                                    |
| regions_shift          | do the landing regions move between stills, so the gaze can wander and return?| section stills; measured support: layout_varies              |
| prediction_continuity  | within a continuity-scale slice of each clip, can the eye track motion smoothly — no stutters, teleports, pixel noise, channel tearing? | every clip-w*-t*.mp4; measured: trackability_all + jerk_smooth_all |
| prediction_divergence  | do clips ≥ one divergence-scale apart show categorically different flow configurations and event vocabularies — not the same rule re-shaded or re-seeded? | multi-window clips compared pairwise; measured: window_divergence |
| squint_macro_structure | does a macro light/dark composition survive the mental blur — not uniform grey? | core stills; measured: squint_macro (threshold still swept — documented overrides legitimate) |
| fine_texture_reward    | does stepping close reward the eye — sub-structure at native res the blur didn't show? | native-resolution crop of each still                  |
| hue_drift              | does the dominant hue drift slowly across ordered stills — neither jumping nor locked? | ordered section stills; measured: hue_drift_smooth (jump half) |
| mystery_withheld       | can you name, in one sentence, something the piece refuses to tell you?       | section stills + clips                                       |

**HARD GATE: `prediction_continuity` AND `prediction_divergence` must
both pass, or the verdict is `structural-rethink`** — no matter what
else passes. Neither can be graded from stills; if the multi-window
clips are missing, both fail as harness gaps. When one fails, say
WHICH — the fixes are opposite (continuity fail = too noisy → drop
discrete events, smear, slow; divergence fail = too predictable →
chaos transformation layer, heavy feedback, or state-bearing
`passes:` rework — taste.md §Prediction lists both recipes).

Count passes. Record `mesmerizing_passes: N/9` in the YAML tail.
Below 7/9 → the piece fundamentally doesn't mesmerize; verdict must
be `structural-rethink` or `premise-wrong`, not `needs-tweak`.
Ship-it needs ≥ 8/9 with both prediction criteria passing.

## Claim check

Pass or fail. One paragraph. Does the piece deliver what it claimed
above? Tie to frame-by-frame observations. A failed claim check is
the top fix, regardless of how everything else grades — it's a
pre-grading gate, not a tenth mesmerizing criterion; still grade the
families and panels below either way.

## Family criteria

One subsection per applicable family; for an inapplicable family
write one line saying why it's n/a (e.g. "Not applicable — no cursor
input") and omit its maps from the YAML tail. The full criterion
definitions live in taste.md — the tables below are the index of
observable question → capture. Each verdict gets a one-line
justification naming the capture it was graded from. Read the GLSL
as corroboration only; if a criterion can't be answered from the
captures, it FAILS and goes in `harness_gaps` with the missing
capture named.

### Interaction (7)

**Grade this family only if the piece declares cursor reactivity**
(shader references `u_mouse` / `u_touches`, meta.yaml describes mouse
behaviour, or a prior critique called out interaction). Otherwise one
line: "Not applicable — piece is not cursor-reactive."

Definitions in `taste.md` §"Interaction criteria"; background in
`brainstorming/techniques/interactivity.md`. Every criterion is
answered from the `inspect-interaction/` captures — not from the
shader. If a capture is missing, that criterion FAILS and goes in
`harness_gaps` naming it (the GLSL may corroborate what the captures
show, never substitute for them).

| Criterion     | Question (one line)                                                              | Capture that answers it                          |
|---------------|----------------------------------------------------------------------------------|--------------------------------------------------|
| composition   | does the macro composition differ across the three cursor positions — beyond a local halo? | cursor-{a,b,c}.png triptych             |
| idle          | with the cursor parked 30 s, is the piece still alive — somewhere to land, motion still evolving? | matrix-neither.mp4 / matrix-music.mp4 |
| readability   | can you state the cursor→effect mapping in one sentence from the captures alone? | triptych + matrix-cursor.mp4                     |
| reversibility | do cursor-aba-0.png and cursor-aba-1.png match after the a→b→a excursion?         | reversibility pair (SSIM > 0.9 when computed); n/a when the thesis is accumulation — say so explicitly |
| dominance     | is the piece still recognizably itself without the cursor — cursor ≤ ~1/3 of visible structure? | cursor-active.png vs cursor-idle.png |
| convention    | does the first instinctive gesture produce the expected direction of effect — no inverted priors? | matrix-cursor.mp4 / triptych, judged as a cold viewer |
| latency       | does the feature under the cursor track within ~3 frames (≈60 ms) of a fast move? | latency clip / burst frames                      |

Count passes. Record `interaction_passes: N/M` over the applicable
criteria. Ship-it floor: ≥ 5/7 (at most 2 fails over applicable
criteria). Below the floor the interaction is decorative — the fix
must address interaction, unless the piece can simply drop cursor
reactivity from its claim.

### Music (4)

**Grade this family only if the piece declares audio reactivity**
(shader references `u_audio_*` uniforms, `meta.time_source: audio`,
or meta.yaml describes music behaviour). Otherwise one line: "Not
applicable — piece is not audio-reactive."

Definitions in `taste.md` §"Music criteria"; background in
`brainstorming/techniques/music-to-shader.md`. These ask whether the
piece *reacts* well; the song-level family asks whether it
*composes*.

| Criterion             | Question (one line)                                                          | Capture that answers it                                |
|-----------------------|--------------------------------------------------------------------------------|--------------------------------------------------------|
| motion_over_luminance | comparing quiet vs peak captures, do shapes sit in different places — edges, ridges, silhouettes move — not the same scene at different brightness? | quiet + peak stills and clips from inspect-music/ |
| bass_movement         | when the kick hits, does something visibly MOVE within ~100 ms — position, radius, angle, scale — rather than only brighten? | clip-peak.mp4 watched with audio        |
| rhythm_in_stills      | do the stills show the piece mid-phase — a ring in flight, a chamber compressed on a hit, flow with direction? | section stills                          |
| quiet_reads_quiet     | in the quiet window, is the form itself calmer — slower flow, tighter scale, less warp — not merely dimmer? | quiet vs peak clip; measured: motion_dynamic_range |

Count passes. Record `music_passes: N/M` over the applicable
criteria. Ship-it floor: ≥ 3/4 (at most 1 fail). Below the floor the
audio is decorative — the fix must address music reactivity, unless
the piece can simply drop audio reactivity from its claim.

Corroboration tool for motion_over_luminance and bass_movement — the
"replace-with-constant" check (corroboration ONLY; the grade comes
from the captures):

For each `u_audio_*` usage in the shader, ask: *if I replace this
term with its mean value (a constant), do shapes shift or do only
brightnesses shift?* Audio terms feeding *geometric* parameters
(coordinates, angles, radii, velocities, scales, warp amounts)
corroborate a pass; audio terms feeding only *brightness* parameters
(glow multipliers, additive flashes, envelope amplitudes, alpha)
corroborate a fail.

A shader with `pulseAmp = 0.10 + 1.70*bass`, `coreEnv = 0.30 +
1.20*bass`, `rimKick = 0.25 + 1.90*bass`, and `pulseSpeed = 0.95`
(constant) corroborates a bass_movement FAIL. The ring still
propagates at 0.95 with or without bass — bass only scales how
brightly that pre-existing motion reads. Do not be fooled by "there
is motion, and bass affects it" — the question is "is the motion
itself driven by bass?" Ring amplitude riding bass while ring *speed*
is constant is luminance modulation of independent motion, not
bass-driven motion.

A shader with `pulseSpeed = 0.70 + 0.55*bass`, `rimR = 1.05 -
(0.55 + 0.22*bass)*relief`, or `zoom *= 1.0 - 0.05*bass`
corroborates a bass_movement PASS — each replaces bass with a
constant and shapes visibly shift.

### Song-level (6)

**Grade this family only if the piece dir contains
`audio.analysis.json` AND the shader references any song-level
uniform** (`u_section_*`, `u_downbeat`, `u_to_section_change`,
`u_song_progress`, `u_audio_*_stem`, `u_key_*`). Otherwise one line:
"Not applicable — piece is reactive only, no song-level uniforms."

Definitions in `taste.md` §"Song-level criteria"; background in
`brainstorming/techniques/music-composition.md`. These ride ON TOP
of the per-frame Music criteria above. All six are answered from
captures; if the stills aren't well-distributed across the song,
the affected criterion FAILS as a harness gap recommending a
re-render with better spread.

| Criterion               | Question (one line)                                                          | Capture that answers it                              |
|-------------------------|--------------------------------------------------------------------------------|------------------------------------------------------|
| section_readability     | without the timeline, can you assign at least 3 of the 5 section stills to their sections by visual character alone? | section stills            |
| downbeat_anchored       | do ≥ 2 structural events (palette flip, layer reveal, mode toggle, ring) land ON the bar grid, within ~100 ms of a downbeat? | multi-window clips against the analysis JSON's beat grid |
| pre_tension             | does the pre-peak capture look visibly different from mid-verse — squeezed, desaturated, withholding — before the drop? | pre-peak still/clip vs verse still |
| per_stem_discrimination | do two audibly different stems produce visibly DIFFERENT responses — not both modulating the same parameter family? | clip-peak.mp4 + one verse clip with audio; n/a when no stem analysis |
| long_arc                | across stills ordered by song progress, a clear maximum AND a clear quiet moment? | ordered section stills; measured support: arc (weak proxy — eye outranks it, document the override) |
| recapitulation          | are intro (≈0.05) and outro (≈0.95) stills recognisably related, with one visible delta? | intro + outro stills                    |

Count passes. Record `song_level_passes: N/M` over the applicable
criteria. Ship-it floor: ≥ 4/6 (at most 2 fails). Below the floor
the piece is reactive only — the fix must address song-level
composition (use `u_section_*`, anchor structural changes to
`u_downbeat`, add per-stem voice assignment, design pre-tension),
unless the piece is short enough that song-level composition doesn't
apply.

Corroboration: events keyed to `u_downbeat` / `u_bar_index` /
`u_section_id` corroborate downbeat_anchored; an unused
`u_to_section_change` plus indistinguishable captures confirms a
pre_tension fail. The replace-with-constant test has a song-level
analogue: for each song-level uniform usage, ask "if I froze this
uniform at its mean value, would the visual still know what part of
the song it's in?" If yes for every usage, the uniform is
decorative. Corroboration only — the grade comes from the captures.

### Dual-input (7)

**Grade this family only if the piece declares BOTH cursor and
audio reactivity** (shader references `u_mouse` AND any
`u_audio_*`). Otherwise one line: "Not applicable — piece is
single-channel."

Definitions in `taste.md` §"Dual-input criteria"; background in
`brainstorming/techniques/audio-cursor-together.md`. These ride ON
TOP of the cursor and music criteria; they ask whether the two
instruments are coordinated, not whether each is good in isolation.
The idle-matrix clips `matrix-{both,music,cursor,neither}.mp4` from
`inspect-interaction/` are this family's backbone evidence — if
they're missing, the criteria that need them fail as harness gaps.

| Criterion                | Question (one line)                                                          | Capture that answers it                      |
|--------------------------|--------------------------------------------------------------------------------|----------------------------------------------|
| dual_channel_readability | watching the both-cell, can you see within 5 s that BOTH channels drive the piece? | matrix-both.mp4                          |
| channel_non_overlap      | can you name one feature that belongs to the music and one that belongs to the cursor — distinct jobs, not the same parameter pushed by both? | matrix-music.mp4 vs matrix-cursor.mp4 vs matrix-both.mp4 |
| music_without_cursor     | with the cursor parked and the track playing, does the piece still pass its music-side criteria? | matrix-music.mp4 (30 s)    |
| cursor_without_music     | with audio silent and the cursor active, does the piece still pass its cursor-side criteria? | matrix-cursor.mp4 (30 s)       |
| conflict_resolution      | where both channels touch the same feature, does the combination stay bounded — no blowout, no cancellation — when both push at once? | matrix-both.mp4 |
| authority_during_build   | during a build, does cursor motion still produce a visible response within ~100 ms (reduced amplitude fine, zero not)? | build-cursor.mp4 (12 s orbit across the pre-peak build) |
| idle_cell                | do all four idle-matrix clips survive — none freezes, goes black, or looks broken, and the neither-cell self-plays? | matrix-{both,music,cursor,neither}.mp4 |

Count passes. Record `dual_input_passes: N/M` over the applicable
criteria. Ship-it floor: ≥ 5/7 (at most 2 fails). Below the floor
the two channels aren't composing together — the fix must address
dual-input coordination (pick a conflict-resolution pattern; assign
disjoint parameter ownership), unless the piece can simply drop one
channel from its claim.

Corroboration: disjoint parameter sets (Pattern B) or
floor-and-ceiling multiplicative coupling (Pattern A) in the shader
corroborate channel_non_overlap and conflict_resolution; additive
same-parameter coupling — the dual-input arms race anti-pattern,
where neither channel can ever fully control the parameter —
corroborates a fail. Cite the shader lines, but grade from the
clips.

### Layered (11)

**Grade this family only if the piece declares a layer stack** (a
`layers:` array in `meta.yaml`). Otherwise one line: "Not applicable
— piece is a single-shader monolithic piece."

Definitions in `taste.md` §"Layered criteria"; background in
`brainstorming/techniques/layered-composition.md` and
`brainstorming/techniques/keyboard-synth.md` (per-key contract). The
per-layer solos `solo-<layer>.png` from `inspect-interaction/` are
this family's key evidence — missing solos mean the solo-dependent
criteria fail as harness gaps.

| Criterion            | Question (one line)                                                          | Capture that answers it                          |
|----------------------|--------------------------------------------------------------------------------|--------------------------------------------------|
| spatial_coupling     | does ≥ 1 layer visibly DISPLACE or refract what's beneath — pixels below move to a different place, not just change colour? | solo-<layer>.png vs composite still |
| polyrhythm_of_clocks | in a 10 s clip, can you find at least three motions with visibly different periods that do not pause together? | any multi-window clip + solos to attribute motions |
| eye_distribution     | does the layer-dominance map give 2–4 regions per core still — not one layer owning the frame, not 8+ confetti — ideally migrating? | section stills |
| quiet_survives       | with the loudest layer removed, do the remaining layers still give the eye somewhere to land and something to track? | solo set minus the lead's solo vs composite |
| order_meaningfulness | does at least one layer visibly occlude, mask, or filter another — a front and a back, not pure additive soup? | composite still vs solos      |
| blend_saturation     | is the peak-energy frame free of cream soup — NOT (mean L > 0.7 AND channel range < 0.1)? | peak still; measured: no_blowout       |
| coupling_cost        | do the layers show BOTH ≥ 1 visible inter-layer response AND ≥ 1 motion that stays independent? | clips + solos                    |
| brightness_strobe    | do at most one layer's contents blink in unison with loudness?                  | clip-peak.mp4 + solos                            |
| layer_distinctness   | is each solo visually distinct from every other — can you name each layer's contribution to the composite? | per-layer solos       |
| multi_input_coupling | do at least TWO of {cursor, keyboard, audio} each produce visible change somewhere in the stack (plus per-key distinctness when keyboard_synth: true)? | matrix-music.mp4 + matrix-cursor.mp4 (+ key captures) |
| visible_phase_lock   | does geometry visibly snap to the music's grid — bar rotation, per-beat discrete event, downbeat ring, section flip — not just amplitude swell? | clip-peak.mp4 + one verse clip with audio |

Count passes. Record `layered_passes: N/M` over the applicable
criteria. Ship-it floor: ≥ 8/11 (at most 3 fails). Below the floor
the layer-stack architecture isn't doing work a single shader
couldn't — the fix must address layer coupling, unless the piece can
simply drop the layer declaration and consolidate into a monolithic
shader.

Corroboration notes (cite layers and lines, but grade from
captures):

- Manifest reading-order: dependencies are declared top-down in
  `meta.yaml` but render bottom-up. A layer's `consume:` binding
  MUST refer to a `publish:` from a layer earlier in the declaration
  order. A forward reference is an engine-level error the piece
  can't possibly run with — fail order_meaningfulness and cite the
  layers.
- The "decorative coupling" failure mode (anti-pattern 5) is the
  hardest to catch: a layer reads `u_below` but the read is
  colour-only (`fragColor.rgb = u_below.rgb * 0.9 + ownColor`).
  That's not spatial coupling. Spatial coupling means `u_below` is
  sampled at *displaced UVs* — `texture(u_below, vUv + warp)` —
  with non-trivial displacement (driven by the layer's own field,
  not just `u_time`).
- polyrhythm_of_clocks: ≥ 3 distinct clock sources across the stack
  (from u_time, u_beat_phase, u_bar_phase, u_section_progress,
  u_audio_* bands/stems, u_downbeat, u_mouse) corroborate a pass;
  one shared clock — or two — corroborates a fail (v2 rounds the
  old two-clock "weak" down to fail).
- coupling_cost: coupling-DAG edges/N in the 1.0–1.5 band (each
  `u_below` read = 1, each `consume` = 1, each `u_history`
  self-loop = 0.5).
- brightness_strobe: audio-on-brightness expressions (the FAIL
  shapes from motion_over_luminance) in ≥ 2 layer shaders
  corroborate a fail.

### Integration (5)

Grade on every piece — these are LIVE-MOTION criteria (at least one
clip per flagged element, never stills alone), added 2026-06-11 from
the le-mystere-abyssal watchthrough. Definitions in `taste.md`
§"Integration criteria". Individual criteria are n/a when the piece
genuinely has no such element (no one-shots, no receding plane,
nothing staged in over time) — say so explicitly.

| Criterion               | Question (one line)                                                          | Capture that answers it                      |
|-------------------------|--------------------------------------------------------------------------------|----------------------------------------------|
| orphan_event            | does every visible one-shot (ring, flash, glyph) land within ±0.5 s of a cause the viewer can SEE or HEAR — on the word or the hit, not just somewhere in the bar? | a clip covering each one-shot, timestamps checked |
| pasted_overlay          | for each major element, can you name a neighbouring field that visibly displaces, lights, or occludes its boundary? | one clip per major element |
| perspective_consistency | on every receding plane, do expanding fronts, textures, and displacement shrink and slow toward the horizon? | clip of the plane in motion; n/a if no receding plane |
| boundary_artifacts      | are element edges, tiling-cell boundaries, and frame edges free of hard clips — including glyphs stretched beyond their cell? | clips + stills swept at edges and cell boundaries |
| accretion_causality     | does every side effect (mask, shadow, void) appear only at-or-after the element that owns it? | clip spanning each staged entry; n/a if nothing staged |

Count passes. Record `integration_passes: N/M` over the applicable
criteria. Integration has no separate ship-it floor — its fails
count toward the ≤ 3 total, and a single integration fail is very
often the natural `top_fix`. Any orphan event or hard clip = fail;
these read as bugs to a live viewer even when every still looks
clean.

When iterating on a "broken" piece (Louis says "still broken",
"frozen", "boring"), capture a TIME-SERIES probe before
proposing a fix — single screenshots miss frozen rendering, and
audio-driven pieces look static in headless because audio
doesn't autoplay. See the memory entry "Time-series probes when
iterating" for the playwright pattern (frames at t=1.5/3.5/6/12s,
pixel delta between consecutive frames).

**Stills under-grade high-frequency motion (added 2026-05-11
after cirrus iter 3).** If the piece already has per-beat or
sub-beat jitter / wobble (>2 Hz), each inspect-music PNG samples
ONE phase of the oscillation and reads as "locked" even though
the running piece shimmers. Before declaring "still static" and
proposing more chaos, do TWO things: (a) watch
`pieces/<slug>/inspect-music/clip-peak.mp4` — that's the right
artefact for grading liveness, not the stills; (b) cross-frame
compare adjacent stills for tooth-position / position ghosting
between frames — if you see doubling or position shift between
otherwise "locked" frames, the motion IS there, just not in any
single frame. See
`~/.claude/projects/-home-ezalos-42-V-Jaygent/memory/feedback_stills_under_grade_motion.md`.

## Dimension panels

Six tables — one per panel from taste.md §"Dimension panels", rows
`criterion | grade | evidence`, every criterion key present,
pass|fail|n/a:

- `palette_cohesion` — warm_arc, lum_not_hue, dominant_hues,
  no_collapse, hue_drift_smooth (all five *measured*)
- `composition` — squint_macro (measured), landing_regions,
  empty_zones (metric demoted to descriptive — judge by eye, the
  documented-misfire clause applies by default), layout_varies
  (measured), regions_migrate
- `motion` — trackability (measured), jerk_smooth (measured),
  multi_scale_desync, never_frozen (measured), direction_in_quiet
- `intensity` — has_peak, has_quiet, quiet_flow_drops (measured),
  quiet_scale_tightens, no_blowout (measured, hard gate)
- `depth` — multi_octave (measured), near_far_distinct,
  fine_texture, layer_interaction (n/a for single-shader pieces)
- `form_ending` — has_arc (arc is a WEAK proxy — the eye on ordered
  stills outranks it, document the override), ending_differs,
  recapitulation, not_seamless_loop

For *measured* criteria the metrics panel is authoritative unless
you document the misfire next to the overridden grade. Evidence
notes are not rubric-speak: "Frame 0 has real black; frames 2-3
bleach in the upper third" is evidence; "good dynamic range" is not.
A panel with ≤ 1 fail is healthy; ship-it requires every panel ≤ 1
fail. Where a panel criterion shares its question with a family
criterion (squint_macro / squint_macro_structure, recapitulation,
fine_texture / fine_texture_reward), grade both — a disagreement
means someone misread the evidence.

## Metrics panel

Summarise the pasted `bin/aesthetic-metrics.py` output: gate result,
stills_passed, clips_passed, interaction tests if captured — plus
EVERY documented metric override with its reason. The full JSON goes
into the evidence snapshot as `metrics.json`.

## What's working

Ranked bullets. Concrete wins grounded in specific captures. Required
— name what landed before naming what didn't. If prior critiques
applied fixes, say whether they took.

## What's imperfect

Ranked bullets, grounded in specific captures or shader constants.
Number 1 is the most important fix. Priority order:

1. Lint FAIL or hard metric gate fail (no_blowout / dominant_hues)
   → that's #1. Machine reds beat rubric polish.
2. Else, failed claim check → #1. Fix the lie first.
3. Else, either prediction criterion failing, or mesmerizing < 7/9
   → naming the missing criteria is #1 (and the verdict is
   `structural-rethink`).
4. Else, a family below its ship-it floor (interaction < 5/7,
   music < 3/4, song_level < 4/6, dual_input < 5/7, layered < 8/11,
   over applicable criteria) → that family's fix is #1.
5. Else, a dimension panel with ≥ 2 fails → #1 raises that panel.
6. Else, harness gaps → name the missing capture (the fix is
   building the capture, not editing the shader).
7. Else, polish toward chef-doeuvre (zero fails, zero gaps).

## Harness gaps

Each untestable criterion with the capture or metric that would test
it (or "none" if every criterion had its evidence). Every entry here
is already counted as a FAIL in its family or panel above — a gap is
not a free pass. Gap fails are excluded only from the needs-tweak
"one shared shader fix" test, because their fix is building the
capture.

## Verdict

One of exactly five values, evaluated top-down (taste.md §Verdicts).
"Applicable criteria" = everything not n/a, across the claim check,
all applicable families, and all six dimension panels. Harness-gap
fails count as fails everywhere; they are excluded only from the
needs-tweak shared-fix test.

- `chef-doeuvre` — claim check passes + ALL applicable criteria pass
  (families + dimensions) + zero `harness_gaps`. Stop.
- `ship-it` — claim check passes + both prediction criteria pass +
  total failed criteria ≤ 3 + no family below its floor + every
  dimension panel has ≤ 1 fail. Floors, read as a maximum FAIL count
  over the applicable criteria: mesmerizing ≥ 8/9 (1 fail),
  interaction ≥ 5/7 (2), music ≥ 3/4 (1), song_level ≥ 4/6 (2),
  dual_input ≥ 5/7 (2), layered ≥ 8/11 (3); integration has no
  separate floor — its fails count toward the ≤ 3 total. Shippable;
  the remaining gap is nuance, not failure modes. Stop. Don't polish
  further.
- `needs-tweak` — claim check passes (or is one fix away) + both
  prediction criteria pass + the failing criteria share ONE concrete
  shader-edit fix. `top_fix` is REQUIRED. The loop auto-applies it.
- `structural-rethink` — either prediction criterion fails, OR
  mesmerizing < 7/9, OR more than 6 total fails, OR 4–6 scattered
  fails that don't share one fix (round down), OR a failed claim
  check that is NOT one fix away. Hand to user. A prediction fail
  almost always means injecting a chaos transformation layer or
  converting to a state-bearing architecture (`passes:`) — a
  one-line Edit won't fix it.
- `premise-wrong` — the claim itself is unachievable in this
  structure. Hand to user. Don't tweak.

Follow with one short paragraph showing the bar arithmetic: total
fails, per-family counts over applicable criteria, per-panel fail
counts, harness-gap count — then the verdict.

# YAML tail (required, parseable by the loop — schema 2)

At the very end of the markdown, a single fenced YAML block. This is
the v2 tail from taste.md §"How to use this during iteration" —
reproduce its shape exactly:

```yaml
piece: <slug>
iteration: <N>
schema: 2
verdict: <chef-doeuvre|ship-it|needs-tweak|structural-rethink|premise-wrong>
claim_check: <pass|fail>
mesmerizing_passes: <N/9>
mesmerizing_probes: { <9 keys>: pass|fail }
<family>_passes: <N/M or "n/a">          # omit family map entirely when n/a
<family>_probes: { each key: pass|fail|n/a }
dimensions:
  palette_cohesion: { warm_arc: pass, lum_not_hue: pass, dominant_hues: pass, no_collapse: pass, hue_drift_smooth: pass }
  # ...all six panels, every criterion key present...
metrics:                                  # machine panel summary (from bin/aesthetic-metrics.py)
  gate: pass|fail
  stills_passed: <N/M>
  clips_passed: <N/M or "n/a">
harness_gaps:                             # untestable criteria — each already counted as FAIL above
  - criterion: <key>
    missing: <capture or metric needed>
top_fix: null   # or {dimension, what, why, caution} — REQUIRED iff verdict == needs-tweak
evidence: [ evidence/<slug>-vN/<file>, "..." ]
```

Families are `mesmerizing` (9), `interaction` (7), `music` (4),
`song_level` (6), `dual_input` (7), `layered` (11), `integration`
(5) — each family gets its `<family>_passes` + `<family>_probes`
pair, with criterion keys exactly as named in the family tables
above; omit both keys entirely when the family is n/a. taste.md
contains a complete worked example (the plume tail) — match it; the
parser maps the keys straight into the studio UI.

The grades in the tail are pass | fail | n/a only. `n/a` carries an
inline comment naming the reason (e.g. `reversibility: n/a # thesis
declares ink accumulation`). `harness_gaps` is an empty list when
every criterion had its evidence.

`top_fix` fields when verdict == needs-tweak:

- `dimension` — which panel / family / criterion this raises, or
  "claim-check".
- `what` — one paragraph. Concrete shader change — constant name,
  function name, line-hint if possible. Something the iterate loop
  can Edit without ambiguity.
- `why` — one paragraph. Tie to specific captures and failing
  criteria. Not "composition needs work" — "frames 0-3 all have the
  bright mass in lower-centre; eye_lands fails."
- `caution` — which currently-passing criterion this change must NOT
  flip to fail. "none" if the fix is safe.

`evidence` is REQUIRED — the exact captures this critique was graded
from (stills, clip frames, metrics.json), paths relative to
`brainstorming/critiques/`, one entry per graded artefact.

If verdict is anything other than `needs-tweak`, set `top_fix: null`.

# Voice

- Speak in concrete observations, not rubric categories. "The bright
  mass lives dead-centre in frames 0-3" beats "composition needs
  work."
- Harsh when the piece claims something it doesn't deliver. "You
  claimed seven — I see four." That's the job.
- Harsh when the piece doesn't mesmerize. "I can predict frame 4
  from frames 0-3. The loop is legible. This won't hold attention
  past one cycle." Don't soften.
- Generous when something subtle landed. Frames don't lie about
  wins either. If the silence-as-form lens passes, say so by name.
- No reflex parameter-tweak. If mesmerizing fails structurally or
  the premise is wrong, use the appropriate verdict. Don't invent a
  top_fix to fill the slot.
- The iterate loop depends on your `top_fix.what` being concrete
  enough to apply via Edit. Name constants, not vibes.
````

#### 2c. Parse the critique

The agent returns a full Markdown critique followed by a single
fenced YAML block at the very end. Save the whole document verbatim
as `brainstorming/critiques/<slug>-v<N+1>.md` — the Markdown sections
(claim, frame-by-frame, mesmerizing criteria, claim check, family
criteria, dimension panels, metrics panel, what's working, what's
imperfect, harness gaps, verdict) are the cultivated record and must
survive.

**This file is load-bearing beyond the loop.** The studio catalog's
critic-grades view (verdict chips on cards, the per-piece panel on
`v`, the all-pieces list on `Shift+V`) renders EXCLUSIVELY from
`brainstorming/critiques/<slug>-vN.md` files, keyed by filename and
parsed from the YAML tail (`/api/critic-summary`, `/api/critiques`).
A run that skips this file ships a piece that shows as ungraded at
vjaygent.develle.fr — this happened to the June 10–11 pieces and
Louis flagged it. Two corollaries: (1) if a piece is ever renamed,
`git mv` its critique files (and evidence dirs) to the new slug;
(2) the YAML keys must match the vocabulary above — the parser maps
them straight into the UI.

**Evidence snapshot — copy what the critic saw.** After saving the
critique, copy every artefact the critic graded from (inspect stills,
frames extracted from clips, interaction captures, and the metrics
JSON as `metrics.json`) into
`brainstorming/critiques/evidence/<slug>-v<N+1>/`, keeping original
filenames, and make sure the critique's `evidence:` list matches
those paths. Inspect captures get overwritten by later runs; the
evidence dir is the permanent record Louis can dig into from the
grades panel ("What the critic saw" strip), and the negative corpus
for metric calibration accumulates from exactly these snapshots
(taste.md §Calibration discipline). Tell the critic agent the
evidence paths up front so it can list them in the YAML tail.

To drive the loop, extract the YAML tail. Find the last ```yaml ...
``` fenced block in the file and parse it. Expected keys:

- `schema` — must be `2` (the taste.md v2 tail)
- `verdict` — one of `chef-doeuvre`, `ship-it`, `needs-tweak`,
  `structural-rethink`, `premise-wrong`
- `claim_check` — `pass` or `fail`
- `mesmerizing_passes` — `N/9`
- `mesmerizing_probes` — map of nine grades (pass|fail)
- `<family>_passes` / `<family>_probes` per applicable family —
  `interaction` /7, `music` /4, `song_level` /6, `dual_input` /7,
  `layered` /11, `integration` /5; grades pass|fail|n/a; both keys
  omitted entirely when the family is n/a
- `dimensions` — six panels, every criterion key present
  (pass|fail|n/a)
- `metrics` — `gate`, `stills_passed`, `clips_passed`
- `harness_gaps` — list of `{criterion, missing}` (empty if none)
- `top_fix` — object if `verdict: needs-tweak`, else `null`
- `evidence` — list of graded capture paths

If parsing fails (missing verdict, missing `schema: 2`, malformed
YAML, ambiguous last fenced block), re-spawn the critic with a
follow-up asking for the YAML tail explicitly. Don't guess.

**Log it:**
```
node bin/runs.mjs log $RUN_ID --event critique --iteration <N> \
  --data '{"verdict":"<verdict>","claim_check":"<pass|fail>","mesmerizing_passes":"<N/9>","metrics_gate":"<pass|fail>","harness_gaps":<N>,"top_fix":{"dimension":"...","what":"..."}}'
```
The logged JSON mirrors the YAML tail. Rollup renders verdict +
mesmerizing_passes + fail counts in the per-iteration row.

#### 2d. Exit conditions (check in order)

1. **`verdict: chef-doeuvre`** — done. Tell the user, show "all
   applicable criteria pass, zero harness gaps, claim delivered",
   stop.
2. **`verdict: ship-it`** — done. Tell the user it's shippable,
   show the criterion counts per family, the panel fail counts, and
   the total fails (≤ 3). Stop. Do not polish further — further
   iteration would be noise.
3. **`verdict: premise-wrong`** — stop and hand to user. "The
   critic says the premise itself is broken. Read the critique."
   Don't apply a fix.
4. **`verdict: structural-rethink`** — stop and hand to user. "A
   prediction criterion failed, mesmerizing is below 7/9, or the
   fails are scattered — needs more than one Edit. Read the
   critique." Don't apply a fix.
5. **Same `top_fix` as previous iteration** (verdict is
   `needs-tweak` but the fix is identical to the prior one) — the
   previous fix didn't help or made it worse. Stop and hand to
   user.
6. **Iteration count == 8** — stop. "Eight iterations without
   chef-d'oeuvre; the piece needs human judgement."
7. Otherwise (`verdict: needs-tweak`, fresh fix, under iteration
   cap) — proceed to apply the fix.

#### 2e. Apply the fix

Use the Edit tool on `pieces/<slug>/shader.frag` based on
`top_fix.what`. If the critic's fix description is not concrete enough
to translate into a specific Edit (ambiguous, references "the shader
area around…"), re-spawn the critic with a follow-up asking for the
specific lines / constant / function name to change. Don't guess.

Guard rail: before applying, check `top_fix.caution`. If the fix
would flip a currently-passing criterion to fail — and either that
criterion is in the mesmerizing family or the trade isn't explicitly
named in the critique — don't apply it; ask the critic for an
alternative. The mesmerizing criteria outrank everything.

**Log it:**
```
node bin/runs.mjs log $RUN_ID --event apply_fix --iteration <N> \
  --dimension <dim> --summary '<one-line>'
```

#### 2f. Sanity render

```
node bin/publish.mjs <slug> --duration 2
node bin/runs.mjs log $RUN_ID --event sanity_render --iteration <N> --status ok
```

If it errors with a compile failure, **revert the Edit** (via another
Edit that restores the previous text), log
`sanity_render --status compile_error`, and mark this iteration as
failed in the critique log. Then continue to the next iteration —
spawn a fresh critic; the previous fix was bad.

#### 2g. Commit nothing yet

Do not commit inside the loop. The whole iterate run is one logical
unit. Commit happens in step 3.

### 3. After the loop

- **Close the run:**
  ```
  node bin/runs.mjs end $RUN_ID --status <shipped|stuck|aborted>
  node bin/runs.mjs rollup <slug>
  ```
  `rollup` regenerates `brainstorming/runs/<slug>.md` with this run's
  rows appended. That file is committed; the JSONL stays local.
- Summarise: how many iterations, final verdict, criterion counts
  per family at start vs end, panel fail counts, harness gaps,
  whether the claim check now passes.
- Show the user a before/after comparison listing criterion-count
  deltas and panel-fail deltas from the first critique to the last.
- **Write `pieces/<slug>/scorecard.md`** — a single-page summary that
  lives WITH the piece (not buried in `brainstorming/critiques/`) so a
  future glance at the piece directory tells you where it stands.
  Format:

  ```markdown
  # <slug> — scorecard

  Last iterated: YYYY-MM-DD (run <RUN_ID>, <N> iterations)
  Latest verdict: <chef-doeuvre|ship-it|needs-tweak|structural-rethink|premise-wrong>
  Claim check: <pass|fail>

  ## Criterion counts (latest critique, schema 2)
  - Mesmerizing: N/9   (prediction_continuity: pass|fail, prediction_divergence: pass|fail)
  - Interaction: N/7   (or "n/a — not cursor-reactive")
  - Music: N/4         (or "n/a — silent piece")
  - Song-level: N/6    (or "n/a — no analysis JSON")
  - Dual-input: N/7    (or "n/a — single-channel")
  - Layered: N/11      (or "n/a — monolithic shader")
  - Integration: N/5
  - Metrics: gate <pass|fail>, stills N/M, clips N/M
  - Harness gaps: <count, or "none">

  ## Dimension panels (latest — fail count per panel)
  | palette | composition | motion | intensity | depth | form |
  |---------|-------------|--------|-----------|-------|------|
  | N fails | N fails     | N fails| N fails   | N fails| N fails |

  ## Deltas (first → last critique this run)
  | metric             | first | last | Δ  |
  |--------------------|-------|------|----|
  | mesmerizing_passes | …     | …    | …  |
  | claim_check        | …     | …    | …  |
  | total fails        | …     | …    | …  |
  | harness gaps       | …     | …    | …  |

  ## Most recent fix
  Dimension: <dim>
  What:      <one-line summary of last applied top_fix>

  Latest critique: brainstorming/critiques/<slug>-v<N>.md
  ```

  Overwrite the file each run; git history holds the prior scorecards.
  This is the file `bin/audit-piece.mjs` and any future "which pieces
  are at chef-d'oeuvre" tooling can scan cheaply.
- Propose a single bundled commit with the shader changes, all the
  per-iteration critiques, fresh inspect captures (stills, clips,
  interaction), the refreshed rollup markdown, AND the new/updated
  scorecard.
  ```
  git add pieces/<slug>/shader.frag pieces/<slug>/inspect-music \
          pieces/<slug>/inspect-interaction \
          pieces/<slug>/scorecard.md \
          brainstorming/critiques/<slug>-v*.md \
          brainstorming/runs/<slug>.md
  git commit -m "<slug>: iterated refinement pass — <N> iterations

  Final verdict: <chef-doeuvre|ship-it|…>. Mesmerizing: <N>/9.
  Claim check: <pass|fail>. Total fails: <N>; harness gaps: <N>.
  Metrics gate: <pass|fail>.

  Key fix landed: <summary of biggest improvement>.

  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

### 4. Stop

Don't iterate again unless Louis asks. Running the loop repeatedly on
the same piece just grinds down whatever's good and creates critique
noise.

## Failure modes to watch

- **Critic agent hallucinates grades it can't support from the
  captures.** If its `why:` text doesn't reference specific capture
  content, re-spawn with explicit "cite which frame or clip shows
  this" prompt.
- **Fix oscillates** (iteration N undoes iteration N-1). Stop and hand
  to user. A pair of fixes that cancel means the critic disagrees with
  itself.
- **Sanity render flakes.** Swiftshader in headless sometimes produces
  corrupt webm. Retry once; if it fails again, stop and check the
  shader manually.

## What not to do

- Don't skip the critic agent and just apply fixes yourself. The whole
  point is a *separate* pair of eyes grounded in taste.md.
- Don't use `subagent_type: "general-purpose"` for the critic. The
  Explore agent has the exact right tool set (Read for images,
  WebFetch for external reference, Grep/Glob if needed) and no ability
  to modify files — preventing critic-applies-own-fix anti-pattern.
- Don't commit individual fix-edits inside the loop. One commit at the
  end so the git history shows the run as one unit.
- Don't skip writing `brainstorming/critiques/<slug>-vN.md`. The
  history is the cultivation loop; losing it loses the learning.
  It is also the ONLY data source for the studio's critic-grades
  view — no file means the piece shows as ungraded in the catalog.
  Before the bundled commit: `ls brainstorming/critiques/<slug>-*`
  must show this run's critique(s) and
  `brainstorming/critiques/evidence/<slug>-vN/` the graded frames.

## Wrap up — automatic, mandatory

After the bundled commit lands, invoke the `wrap-up` skill via the
Skill tool. Captures lessons from corrections during the iterate
run, updates V-Jaygent memory entries with patterns surfaced this
session, surfaces unresolved threads. Auto-runs without an explicit
"wrap up" phrase from Louis — that was his explicit request on
2026-05-05.

```
[Skill tool] wrap-up
```
