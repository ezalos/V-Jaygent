---
user-invocable: true
allowed-tools: Read, Edit, Bash, Agent, TaskCreate, TaskUpdate, TaskList
description: Refine an existing V-Jaygent piece via a critic-agent-in-loop. Critic judges whether the piece is mesmerizing + delivers its claim, scores against taste.md, returns one of five verdicts. Loop applies needs-tweak fixes; stops on chef-d'oeuvre, ship-it, structural-rethink, or premise-wrong.
---

# /vjay-iterate — critic-in-the-loop piece refinement

## Trigger

`/vjay-iterate <slug>` — refine the V-Jaygent piece at `pieces/<slug>/`
by running a critic agent that judges whether the piece mesmerizes
(5 probes) and delivers its claim, scores it against `taste.md`, and
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
      inspect (bin/inspect.mjs) → PNG frames      │
                        │                         │
                        ▼                         │
      ┌──── CRITIC agent (Explore, read-only) ───┐│
      │ reads meta, taste, VISION, plume-v2,     ││
      │       shader, lib/, frame-*.png, crits   ││
      │ outputs Markdown + YAML tail:            ││
      │   verdict, 5 mesmerizing probes,         ││
      │   claim_check, scores, top_fix           ││
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
      caution? (would break a 5 or passing      │
      probe?) → YES → ask for alt                │
                │ NO                             │
                ▼                                │
       apply top_fix via Edit on shader.frag     │
                │                                │
                ▼                                │
      sanity render (publish.mjs 2s)             │
       compile error? → revert, continue         │
                │ OK                             │
                └───────── back to inspect ──────┘
                   │
                   ▼
          summarise deltas → one bundled commit
```

Invariants: critic has no Edit tool (separation of eyes); one top_fix
per iteration (no multi-change stacking); history cumulative (prior
critiques read each loop, prevents oscillation); caution field blocks
fixes that would break a 5-rated dimension or a passing mesmerizing
probe; one commit at end.

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

#### 2a. Capture fresh frames + run machine lints

```
node bin/inspect-music.mjs <slug>             # section-anchored frames + peak clip
node bin/lint-palette.mjs <slug>              # warm-cycle check
node bin/lint-idle.mjs <slug>                 # idle-survival check
node bin/lint-composition.mjs <slug>          # quadrant / axis balance
node bin/audit-piece.mjs <slug>               # static anti-pattern audit
node bin/runs.mjs log $RUN_ID --event inspect --iteration <N> --status ok --data '{"frames":5}'
```

Writes `pieces/<slug>/inspect-music/music-*.png` (section-anchored when
the piece has audio.analysis.json; audio-time-spread or wall-clock
otherwise). Read each one yourself — you want to know what the critic
is seeing, and frames change each iteration as the shader changes.

**Lint failures are first-priority fixes.** If any of the four lints
FAILs, the critic's top_fix must target that lint failure before any
rubric dimension. Don't grade rubric dimensions when machine checks
are red — the piece will fail at a coarser level than any dimension
captures.

#### 2b. Spawn the critic agent

Use the Agent tool with `subagent_type: "Explore"`. The Explore agent
has Read, Grep, Glob, WebFetch but **critically also multimodal image
input via Read**, which is the whole point.

Critic agent prompt template (fill in placeholders):

````
You are the V-Jaygent critic. Your single job is to judge whether
piece `<slug>` is *mesmerizing* — does it hold the eye without
exhausting it? — and whether it delivers on its own claim. Scoring
against the taste.md rubric supports that judgment; it does not
replace it.

A piece that scores 5s across every rubric dimension but isn't
mesmerizing is a failed piece. A piece that scores 3s everywhere but
locks the eye for three minutes is a success. Your allegiance is to
the eye, not the checklist.

**CALIBRATION VIA REFERENCE COMPARISON (revised 2026-05-11 after aurora
stress-test).** Earlier guidance was "round DOWN, not up" — that over-
corrected and tanked decent pieces (aurora was honestly ship-it but
the bias guard pushed it to structural-rethink). Replace with this:

> **Side-by-side, dimension by dimension.** Before scoring each
> dimension N, open the chef-d'oeuvre reference frame for that
> dimension (paths below) and compare the candidate frame next to it.
> Three outcomes:
>
> 1. Candidate is **comparable to** the reference in that dimension
>    (different look, same level of craft) → score the candidate where
>    you initially read it. No downward adjustment.
> 2. Candidate is **clearly worse** in that dimension (visibly less
>    detail, less drift, less variation) → score one point below where
>    you initially read it.
> 3. Candidate is **clearly better** than the reference in that
>    dimension → keep your high score. References are 5-anchors, not
>    ceilings.
>
> Apply the comparison ONLY to dimensions where the candidate visibly
> loses the side-by-side. Don't blanket-downgrade other dimensions.
> The bias is a scope-limited correction, not a global pessimism.

This replaces the older "round DOWN, not up" rule which fired too
aggressively. The murmuration over-grade and the aurora over-correct
were equal-magnitude (~7 composite points) in opposite directions.
Anchored comparison stays calibrated on both.

**Reference frames** for the side-by-side. Read 1-2 frames from each:
- /home/ezalos/42/V-Jaygent/pieces/apollonian-foam/inspect-music/*.png
  (Depth 5 reference, Palette 5 reference)
- /home/ezalos/42/V-Jaygent/pieces/braid/inspect-music/*.png
  (Composition 5 reference, Mesmerizing 5/5 reference)
- /home/ezalos/42/V-Jaygent/pieces/cirrus/inspect-music/*.png
  (Motion 5 reference — polyrhythm visible across section anchors)
- /home/ezalos/42/V-Jaygent/pieces/eclipse/inspect-music/*.png
  (Depth 5 + Intensity reference, fractal-interior void)
- /home/ezalos/42/V-Jaygent/pieces/ferment/inspect-music/*.png
  (Depth 5 reference for ping-pong feedback pieces specifically — its
  Gray-Scott marbling is the C-architecture chef-d'oeuvre anchor for
  fractal interior detail)

# Read, in this order

1. /home/ezalos/42/V-Jaygent/pieces/<slug>/meta.yaml
   READ THIS FIRST. Pull the thesis: what does this piece claim?
   Summary, description, or top-of-file comments — whichever states
   the piece's intent most clearly.

2. /home/ezalos/42/V-Jaygent/taste.md
   The rubric, the five Mesmerizing probes (eye-landing, prediction,
   squint, hue drift, mystery), the claim-check gate, and the four
   VJ lenses (structure honesty, interaction agency, silence as
   form, desynchronised clocks).

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
   prior critique called out interaction). It holds the seven
   operational Interaction-agency probes the critic runs on such
   pieces, plus the pattern taxonomy (field modulation, parameter
   pilot, camera control, velocity-driven, dwell, hybrid). Skip it
   for pieces with no cursor reactivity.

8. /home/ezalos/42/V-Jaygent/brainstorming/techniques/music-to-shader.md
   READ THIS if the piece declares audio reactivity (shader
   references `u_audio_*`, `meta.time_source: audio`, or meta.yaml
   describes music behaviour). It holds the band→parameter rules
   ("don't bind visuals to u_audio_* naively"), the section-state
   and beat-snap patterns, the beat-grid uniform rules (clocks vs
   amplitudes), the flash-budget philosophy, and per-stem binding
   etiquette. Grounds the four per-frame Music probes (see taste.md
   §"VJ lenses / Interaction agency / Music probes"). Skip for
   silent pieces.

9. /home/ezalos/42/V-Jaygent/brainstorming/techniques/music-composition.md
   READ THIS if the piece dir contains `audio.analysis.json` AND
   the shader references any song-level uniform (`u_section_*`,
   `u_downbeat`, `u_to_section_change`, `u_song_progress`,
   `u_audio_*_stem`, `u_key_*`). It holds the song-level rules:
   downbeat anchoring, section-state machines, pre-tension and
   knowing-the-future, per-stem voice assignment, key/chord
   palette modulation, and recapitulation. Grounds the six
   Song-level Music probes (see taste.md §"VJ lenses / Interaction
   agency / Music probes / Song-level composition probes"). Skip
   for pieces without analysis JSON or without song-level uniform
   references.

10. /home/ezalos/42/V-Jaygent/brainstorming/techniques/layered-composition.md
    READ THIS if the piece declares a layer stack (`meta.yaml` has a
    `layers:` array). It holds the eight Layered-composition probes,
    the coupling recipes (refraction, advection, force-field, mask-
    reveal, feedback, SDF intersection), the blend-mode analysis for
    warm palettes, polyrhythmic clocks across layers, and the nine
    anti-patterns. Grounds the Layered-composition probes (see
    taste.md §"VJ lenses / Layered coupling"). Skip for monolithic
    single-shader pieces.

11. /home/ezalos/42/V-Jaygent/brainstorming/techniques/audio-cursor-together.md
    READ THIS if the piece declares BOTH cursor reactivity AND
    audio reactivity (shader references `u_mouse` AND any
    `u_audio_*`). It holds the role-assignment default (music
    structures, cursor modulates), the conflict-resolution patterns
    (floor-and-ceiling vs disjoint), the 5 coupling recipes, the
    idle-behaviour matrix, and the 7 dual-input probes. Grounds the
    Dual-input probes (see taste.md §"VJ lenses / Interaction
    agency / Dual-input probes"). Skip for single-channel pieces.

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

13. Each of the section-anchored frames at
    /home/ezalos/42/V-Jaygent/pieces/<slug>/inspect-music/music-*.png
    Actually look. The filename includes the section label
    (intro/verse/peak/quiet/outro) when audio analysis exists — use it
    to verify the piece reads differently across the song's structure.
    Your observations must cite specific frame numbers.

14. Lint reports from the most recent run (palette / idle / composition
    / audit). If any FAIL is present, the top_fix MUST address it
    before any rubric dimension. Lint reds beat rubric polish.

15. The reference frames listed in the bias guard above. Read 1-2 from
    each chef-d'oeuvre piece. Compare the candidate to that bar.

16. Any previous critique at
    /home/ezalos/42/V-Jaygent/brainstorming/critiques/<slug>-v*.md
    So you know what has already been tried and don't re-propose it.

# Write the critique as Markdown, then a YAML tail

All sections required in this order:

## The claim

One sentence. "This piece claims [X]." Pulled from meta.yaml, in
your own words. If meta.yaml's thesis is unclear or contradictory,
say so here.

## Frame-by-frame

A 4-row table of concrete observations. What you SEE, not what you
infer.

| Frame | t     | What's there                                          |
|-------|-------|-------------------------------------------------------|
| 0     | 1.5s  | where the eye lands, dominant hue, luminance floor,   |
|       |       | presence of motion blur / fractal edges / empty zones |
| 1     | 9.5s  | ...                                                   |
| 2     | 17.5s | ...                                                   |
| 3     | 25.5s | ...                                                   |

Adjust timestamps to whatever inspect actually captured. Each frame
is a distinct moment — don't write "same as frame 0 but brighter."

## Mesmerizing probes

Run all five probes from taste.md's "Mesmerizing — the first
question" section. Each probe is pass / fail / weak, with a
one-sentence justification tied to the frame-by-frame table.

| Probe            | Verdict | Why                                                 |
|------------------|---------|-----------------------------------------------------|
| Eye-landing      | pass/fail/weak | where the eye lands across frames 0-3        |
| Prediction       | pass/fail/weak | whether frame 4 is predictable from 0-3      |
| Squint           | pass/fail/weak | whether macro composition survives the blur  |
| Hue drift        | pass/fail/weak | whether palette breathes or flickers or locks|
| Mystery          | pass/fail/weak | what the piece refuses to tell the viewer    |

Count passes. Record `mesmerizing_passes: N/5` in the YAML tail.
3/5 or fewer → the piece fundamentally doesn't mesmerize. Verdict
must be `structural-rethink` or `premise-wrong`, not `needs-tweak`.

## Interaction probes

**Run this section only if the piece declares cursor reactivity**
(shader references `u_mouse`, meta.yaml describes mouse behaviour,
or a prior critique called out interaction). Otherwise, write
"Not applicable — piece is not cursor-reactive" and skip to Claim
check.

The seven probes live in `taste.md` §"VJ lenses / Interaction
agency" and `brainstorming/techniques/interactivity.md` — read
those first so your verdicts reference the same criteria the author
will.

You cannot run all probes from stills alone — some (Composition,
Idle, Reversibility, Latency) require multi-cursor-position samples
you don't have. For those, reason from the shader: does the code
structure imply a pass? If a probe is structurally-testable but not
testable from the 4 frames, mark it `shader-pass` / `shader-fail` /
`shader-unclear` and cite the shader line that decides it.

| Probe          | Verdict                              | Why                                                  |
|----------------|--------------------------------------|------------------------------------------------------|
| Composition    | pass/fail/weak/shader-*              | does cursor change macro composition or just local  |
| Idle           | pass/fail/weak/shader-*              | does piece play itself at `u_mouse == (0,0)`         |
| Readability    | pass/fail/weak/shader-*              | could a cold viewer guess the mapping in 3 s         |
| Reversibility  | pass/fail/weak/shader-*/n/a-stateful | does returning cursor to a return the frame          |
| Dominance      | pass/fail/weak/shader-*              | is cursor contribution ≤ ~30% of structural energy   |
| Convention     | pass/fail/weak/shader-*              | does the mapping fight viewer priors (Y→zoom etc.)   |
| Latency        | pass/fail/weak/shader-*              | does feature-under-cursor lag more than ~3 frames    |

Count passes (counting `shader-pass` as pass). Record
`interaction_passes: N/7` in the YAML tail. 3/7 or fewer and the
interaction is decorative — `top_fix` must address interaction,
regardless of other probe results, unless the piece can simply drop
cursor reactivity from its claim.

## Music reactivity probes

**Run this section only if the piece declares audio reactivity**
(shader references `u_audio_*` uniforms, `meta.time_source: audio`,
or meta.yaml describes music behaviour). Otherwise, write
"Not applicable — piece is not audio-reactive" and skip to Claim
check.

The four probes live in `taste.md` §"VJ lenses / Interaction agency /
Music probes" and `brainstorming/techniques/music-to-shader.md` —
read those first so your verdicts reference the same criteria.

Probes 1, 2, and 4 are primarily shader-structure checks — read
the shader, locate where `u_audio_*` feeds in, decide whether it
touches structure or only brightness. Cite the specific shader line
or constant. Mark `shader-pass` / `shader-fail` / `shader-unclear`.
Probe 3 is frame-driven — judge from the captured frames.

| Probe                   | Verdict                                 | Why                                                   |
|-------------------------|-----------------------------------------|-------------------------------------------------------|
| Motion-over-luminance   | pass/fail/weak/shader-*                 | audio drives geometry/camera/flow, not only colour   |
| Bass→movement           | pass/fail/weak/shader-*                 | `u_audio_bass` moves things (camera, zoom, radial)   |
| Rhythm-in-stills        | pass/fail/weak                          | frames show mid-phase action, not just on/off        |
| Quiet-reads-quiet       | pass/fail/weak/shader-*                 | low-audio passages are calm in structure, not dim    |

Count passes (counting `shader-pass` as pass). Record
`music_passes: N/4` in the YAML tail. 2/4 or fewer and the audio
is decorative — `top_fix` must address music reactivity,
regardless of other probe results, unless the piece can simply
drop audio reactivity from its claim.

Critical test for Motion-over-luminance and Bass→movement — the
"replace-with-constant" check:

For each `u_audio_*` usage in the shader, ask: *if I replace this
term with its mean value (a constant), do shapes shift or do only
brightnesses shift?* If only brightness shifts, that usage counts
as luminance. If shapes shift (ring reaches a different radius by
time t, wall sits at a different distance, camera moves, angle
changes, warp deforms a field differently), that usage counts as
geometry.

A shader with `pulseAmp = 0.10 + 1.70*bass`, `coreEnv = 0.30 +
1.20*bass`, `rimKick = 0.25 + 1.90*bass`, and `pulseSpeed = 0.95`
(constant) FAILS Bass→movement. The ring still propagates at 0.95
with or without bass — bass only scales how brightly that pre-
existing motion reads. Do not be fooled by "there is motion, and
bass affects it" — the question is "is the motion itself driven by
bass?" Ring amplitude riding bass while ring *speed* is constant
is luminance modulation of independent motion, not bass-driven
motion.

A shader with `pulseSpeed = 0.70 + 0.55*bass`, `rimR = 1.05 -
(0.55 + 0.22*bass)*relief`, or `zoom *= 1.0 - 0.05*bass` PASSES
Bass→movement — each replaces bass with a constant and shapes
visibly shift.

## Song-level composition probes

**Run this section only if the piece dir contains
`audio.analysis.json` AND the shader references any song-level
uniform** (`u_section_*`, `u_downbeat`, `u_to_section_change`,
`u_song_progress`, `u_audio_*_stem`, `u_key_*`). Otherwise, write
"Not applicable — piece is reactive only, no song-level uniforms"
and skip to Layered composition probes.

The six probes live in `taste.md` §"VJ lenses / Interaction agency /
Music probes / Song-level composition probes" and
`brainstorming/techniques/music-composition.md` — read those first.
These probes ride ON TOP of the per-frame Music probes above; the
per-frame probes ask if the piece reacts well, these ask if it also
*composes*.

Probes 2 and 4 are shader-structure checks — read where song-level
uniforms feed in, decide whether they shape composition or are
ornamental. Probes 1, 3, 5, 6 are frame-driven and require frames
captured at specific `u_song_progress` values; if the existing
inspect frames aren't well-distributed across the song, mark the
relevant probe `frame-unclear` and recommend re-rendering.

| Probe                  | Verdict                       | Why                                                       |
|------------------------|-------------------------------|-----------------------------------------------------------|
| Section-readability    | pass/fail/weak/frame-unclear  | 5 frames at section centres are unambiguously distinct   |
| Downbeat-anchored      | pass/fail/weak/shader-*       | structural events keyed to composition uniforms          |
| Pre-tension            | pass/fail/weak/shader-*       | piece references `u_to_section_change` and visibly anticipates |
| Per-stem-discrimination| pass/fail/weak/shader-*       | ≥2 stems bound to visually different roles               |
| Long-arc               | pass/fail/weak/frame-unclear  | density curve has clear peak/trough across the song      |
| Recapitulation         | pass/fail/weak/frame-unclear  | intro and outro frames recognisably related, with delta  |

Count passes (counting `shader-pass` as pass). Record
`song_level_passes: N/6` in the YAML tail. 2/6 or fewer and the
piece is reactive only — `top_fix` must address song-level
composition (use `u_section_*`, anchor structural changes to
`u_downbeat`, add per-stem voice assignment, design pre-tension)
unless the piece is short enough that song-level composition
doesn't apply.

The replace-with-constant test from the per-frame probes has a
song-level analogue: for each song-level uniform usage, ask "if I
froze this uniform at its mean value, would the visual still know
what part of the song it's in?" If yes for every usage, the uniform
is decorative.

## Dual-input probes

**Run this section only if the piece declares BOTH cursor and
audio reactivity** (shader references `u_mouse` AND any
`u_audio_*`). Otherwise, write "Not applicable — piece is single-
channel" and skip to Layered composition probes.

The seven probes live in `taste.md` §"VJ lenses / Interaction
agency / Dual-input probes" and
`brainstorming/techniques/audio-cursor-together.md`. These probes
ride ON TOP of the cursor probes and music probes; they ask whether
the two instruments are properly coordinated, not whether each
instrument is good in isolation.

Probes 2 and 5 are shader-structure checks — read each parameter
the shader computes, classify what drives it (audio uniform,
mouse uniform, both). Probes 3 and 4 require holding one channel
at idle and re-running the per-channel probes. Probes 1 and 6
require live interaction and aren't fully testable from stills
alone — mark `interaction-unclear` if not testable from the
captured frames and recommend live testing.

| Probe                 | Verdict                                  | Why                                                    |
|-----------------------|------------------------------------------|--------------------------------------------------------|
| Dual-channel readability | pass/fail/weak/interaction-unclear    | both channels visibly drive the piece within 5s        |
| Channel-non-overlap   | pass/fail/weak/shader-*                  | parameters disjoint, or floor-and-ceiling multiplicative |
| Music-without-cursor  | pass/fail/weak/shader-*                  | music probes still pass with `u_mouse == (0,0)`        |
| Cursor-without-music  | pass/fail/weak/shader-*                  | cursor probes still pass with audio silent             |
| Conflict-resolution   | pass/fail/weak/shader-*                  | shared parameters use floor-ceiling or mediator (not additive) |
| Authority-during-build| pass/fail/weak/interaction-unclear       | cursor motion produces visible response during builds  |
| Idle-cell             | pass/fail/weak/interaction-unclear       | all 4 idle cells (both/music/cursor/neither) survive   |

Count passes (counting `shader-pass` as pass). Record
`dual_input_passes: N/7` in the YAML tail. 3/7 or fewer and the
two channels aren't actually composing together — `top_fix` must
address dual-input coordination (pick one of the conflict-
resolution patterns; assign disjoint parameter ownership) unless
the piece can simply drop one channel from its claim.

The "additive on the same parameter" failure (Channel-non-overlap
fail) is the dual-input arms race anti-pattern — when both
channels add into the same parameter, neither can ever fully
control it. Cite specific shader lines where both contribute.

## Layered composition probes

**Run this section only if the piece declares a layer stack** (a
`layers:` array in `meta.yaml`). Otherwise, write "Not applicable —
piece is a single-shader monolithic piece" and skip to Claim check.

The eight probes live in `taste.md` §"VJ lenses / Layered coupling"
and `brainstorming/techniques/layered-composition.md` — read those
first so your verdicts reference the same criteria the author will.

Probes 1, 2, 4, 5, 7, 8 are primarily shader/manifest-structure
checks — read each layer's `meta.yaml` block and `.frag`, walk the
coupling DAG. Cite the specific layer name, line, or driver
binding. Mark `shader-pass` / `shader-fail` / `shader-unclear`.
Probes 3 and 6 are frame-driven — judge from the captured frames.

| Probe                  | Verdict                                 | Why                                                       |
|------------------------|-----------------------------------------|-----------------------------------------------------------|
| Spatial-coupling       | pass/fail/weak/shader-*                 | ≥1 layer reads `u_below`/`consume` and uses it geometrically |
| Polyrhythm-of-clocks   | pass/fail/weak/shader-*                 | ≥3 distinct clock sources across ≤4 layers               |
| Eye-distribution       | pass/fail/weak                          | 2-4 dominance regions per frame, migrating across frames |
| Quiet-survives         | pass/fail/weak/shader-*                 | muting the loudest layer leaves a piece that still composes |
| Order-meaningfulness   | pass/fail/weak/shader-*                 | swapping two layers produces a visibly different composite |
| Blend-saturation       | pass/fail/weak                          | peak frame avoids cream-soup (mean L > 0.7 ∧ range < 0.1) |
| Coupling-cost          | pass/fail/weak/shader-*                 | 1.0 ≤ edges/N ≤ 1.5 (sparsely meaningfully coupled)      |
| Brightness-strobe      | pass/fail/weak/shader-*                 | ≤1 of N layers binds audio to brightness (no per-layer blink) |

Count passes (counting `shader-pass` as pass). Record
`layered_passes: N/8` in the YAML tail. 4/8 or fewer and the layer-
stack architecture isn't doing work the piece couldn't do in a
single shader — `top_fix` must address layer coupling, regardless
of other probe results, unless the piece can simply drop the layer
declaration and consolidate into a monolithic shader.

Critical reading-order for the manifest: dependencies are declared
top-down in `meta.yaml` but render bottom-up. A layer's `consume:`
binding MUST refer to a `publish:` from a layer earlier in the
declaration order. If you find a forward reference, that's an
engine-level error the piece can't possibly run with — flag it as
`shader-fail` on Order-meaningfulness with the specific layers cited.

The "decorative coupling" failure mode (anti-pattern 5) is the
hardest to catch: a layer reads `u_below` but the read is colour-
only (`fragColor.rgb = u_below.rgb * 0.9 + ownColor`). That's not
spatial coupling. Spatial coupling means `u_below` is sampled at
*displaced UVs* — `texture(u_below, vUv + warp)` — and the
displacement is non-trivial (driven by the layer's own field, not
just by `u_time`).

Three probes added 2026-05-05 (from the `stronger` build) — see
`taste.md` probes 9, 10, 11. They live alongside the original 8
in the "VJ lenses / Layered coupling" section. The threshold for
"layered composition" stays at 6/8 of the original probes; 9-11
are advisory but should be raised in the critique if the piece
claims flagship / mesmerizing status.

- **Layer-distinctness** — solo-each-layer mental test; piece
  fails if any layer's removal leaves a near-identical frame
- **Multi-input coupling** — at least 2 of {cursor, keyboard,
  audio} drive visible change across the stack
- **Visible phase-lock** — when audio plays + analysis JSON is
  loaded, ≥ 3 song-level uniforms drive geometry (rotation,
  snap, ring, palette flip, glitch); amplitude→brightness alone
  doesn't count

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

## Claim check

Pass or fail. One paragraph. Does the piece deliver what it claimed
above? Tie to frame-by-frame observations. A failed claim check is
the top fix, regardless of mesmerizing probes or 1-5 scores.

## Scores

| Dimension                | Score | Note                           |
|--------------------------|-------|--------------------------------|
| Palette cohesion         | X/5   | one-line specific observation  |
| Composition              | X/5   | one-line specific observation  |
| Motion                   | X/5   | one-line specific observation  |
| Intensity & dynamic range| X/5   | one-line specific observation  |
| Depth                    | X/5   | one-line specific observation  |
| Form & ending            | X/5   | n/a if untestable from stills  |

Notes are not rubric-speak. "Frame 0 has real black; frames 2-3
bleach in the upper third" is a Note. "Good dynamic range" is not.

## What's working

Ranked bullets. Concrete wins grounded in specific frames. Required
— name what landed before naming what didn't. If prior critiques
applied fixes, say whether they took.

## What's imperfect

Ranked bullets, grounded in specific frames or shader constants.
Number 1 is the most important fix. Priority order:

1. Failed claim check → that's #1.
2. Else, 3/5 or fewer mesmerizing probes → naming the missing
   probe(s) is #1.
3. Else, 3/7 or fewer interaction probes (if piece claims cursor
   reactivity) → interaction fix is #1.
4. Else, 2/4 or fewer music probes (if piece claims audio
   reactivity) → music fix is #1.
5. Else, 2/6 or fewer song-level composition probes (if piece has
   `audio.analysis.json` and references song-level uniforms) →
   song-level composition fix is #1.
6. Else, 3/7 or fewer dual-input probes (if piece declares both
   cursor and audio reactivity) → dual-input coordination fix is #1.
7. Else, 4/8 or fewer layered-composition probes (if piece declares
   a layer stack) → layer-coupling fix is #1.
8. Else, dimension scores below 3 → #1 raises the lowest.
9. Else, polish toward chef d'oeuvre.

## Verdict

One of exactly five values:

- `chef-doeuvre` — mesmerizing (5/5 probes), claim delivered, all
  testable dimensions ≥ 4. The piece holds. Stop polishing.
- `ship-it` — mesmerizing (≥ 4/5 probes), claim delivered, no
  dimension below 3. Shippable. Remaining gap is nuance, not
  failure modes. Further iteration would be noise.
- `needs-tweak` — 4/5 probes pass, claim delivered or close, one
  concrete shader change will raise the missing dimension or probe.
  Loop can auto-apply top_fix.
- `structural-rethink` — 3/5 or fewer probes, or scoring low in a
  way that needs a bigger change than a single Edit. Hand to user.
  This is the right verdict when mesmerizing quality is absent —
  don't try to tweak a non-mesmerizing piece into mesmerization.
- `premise-wrong` — the claim itself is broken or unachievable with
  this structure. Hand to user. Don't tweak.

Follow with one short paragraph justifying the verdict.

# YAML tail (required, parseable by the loop)

At the very end of the markdown, a single fenced YAML block:

```yaml
piece: <slug>
iteration: <N>
verdict: <chef-doeuvre|ship-it|needs-tweak|structural-rethink|premise-wrong>
claim_check: <pass|fail>
mesmerizing_passes: <0-5>
mesmerizing_probes:
  eye_landing: <pass|fail|weak>
  prediction: <pass|fail|weak>
  squint: <pass|fail|weak>
  hue_drift: <pass|fail|weak>
  mystery: <pass|fail|weak>
interaction_passes: <0-7 or "n/a">        # n/a if piece is not cursor-reactive
interaction_probes:                       # omit entirely if n/a
  composition:   <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  idle:          <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  readability:   <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  reversibility: <pass|fail|weak|shader-pass|shader-fail|shader-unclear|n/a-stateful>
  dominance:     <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  convention:    <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  latency:       <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
music_passes: <0-4 or "n/a">              # n/a if piece is not audio-reactive
music_probes:                             # omit entirely if n/a
  motion_over_luminance: <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  bass_movement:         <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  rhythm_in_stills:      <pass|fail|weak>
  quiet_reads_quiet:     <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
song_level_passes: <0-6 or "n/a">         # n/a if no audio.analysis.json or no song-level uniforms
song_level_probes:                        # omit entirely if n/a
  section_readability:    <pass|fail|weak|frame-unclear>
  downbeat_anchored:      <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  pre_tension:            <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  per_stem_discrimination:<pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  long_arc:               <pass|fail|weak|frame-unclear>
  recapitulation:         <pass|fail|weak|frame-unclear>
dual_input_passes: <0-7 or "n/a">         # n/a if piece is single-channel (cursor-only or audio-only)
dual_input_probes:                        # omit entirely if n/a
  dual_channel_readability: <pass|fail|weak|interaction-unclear>
  channel_non_overlap:      <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  music_without_cursor:     <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  cursor_without_music:     <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  conflict_resolution:      <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  authority_during_build:   <pass|fail|weak|interaction-unclear>
  idle_cell:                <pass|fail|weak|interaction-unclear>
layered_passes: <0-8 or "n/a">            # n/a if piece is monolithic (no `layers:` in meta.yaml)
layered_probes:                           # omit entirely if n/a
  spatial_coupling:      <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  polyrhythm_of_clocks:  <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  eye_distribution:      <pass|fail|weak>
  quiet_survives:        <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  order_meaningfulness:  <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  blend_saturation:      <pass|fail|weak>
  coupling_cost:         <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
  brightness_strobe:     <pass|fail|weak|shader-pass|shader-fail|shader-unclear>
scores:
  palette_cohesion: <1-5>
  composition: <1-5>
  motion: <1-5>
  intensity: <1-5>
  depth: <1-5>
  form_ending: <1-5 or "n/a">
top_fix:  # REQUIRED only when verdict == needs-tweak. Otherwise: null
  dimension: <which dimension / probe this raises, or "claim-check">
  what: |
    One paragraph. Concrete shader change — constant name, function
    name, line-hint if possible. Something the iterate loop can Edit
    without ambiguity.
  why: |
    One paragraph. Tie to specific frame numbers, probe failures, or
    shader constants. Not "composition needs work" — "frames 0-3 all
    have the bright mass in lower-centre, eye-landing probe fails."
  caution: |
    Which 5-rated dimension or passing probe this change must NOT
    break. "none" if the fix is safe.
evidence:  # REQUIRED — the exact frames this critique was graded from
  - evidence/<slug>-v<N>/<frame>.png   # paths relative to brainstorming/critiques/
  - ...                                # one entry per graded frame
```

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
(claim, frame-by-frame, mesmerizing probes, claim check, scores,
what's working, what's imperfect, verdict) are the cultivated record
and must survive.

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
critique, copy every frame the critic graded from (inspect stills +
any frames extracted from clips) into
`brainstorming/critiques/evidence/<slug>-v<N+1>/`, keeping original
filenames, and make sure the critique's `evidence:` list matches
those paths. Inspect frames get overwritten by later runs; the
evidence dir is the permanent record Louis can dig into from the
grades panel ("What the critic saw" strip). Tell the critic agent
the evidence paths up front so it can list them in the YAML tail.

To drive the loop, extract the YAML tail. Find the last ```yaml ...
``` fenced block in the file and parse it. Expected keys:

- `verdict` — one of `chef-doeuvre`, `ship-it`, `needs-tweak`,
  `structural-rethink`, `premise-wrong`
- `claim_check` — `pass` or `fail`
- `mesmerizing_passes` — integer 0-5
- `mesmerizing_probes` — map of five probe verdicts
- `interaction_passes` — integer 0-7 or "n/a"
- `interaction_probes` — map of seven probe verdicts (omit if n/a)
- `music_passes` — integer 0-4 or "n/a"
- `music_probes` — map of four probe verdicts (omit if n/a)
- `scores` — the 6-dimension map (unchanged shape)
- `top_fix` — object if `verdict: needs-tweak`, else `null`

If parsing fails (missing verdict, malformed YAML, ambiguous last
fenced block), re-spawn the critic with a follow-up asking for the
YAML tail explicitly. Don't guess.

**Log it:**
```
node bin/runs.mjs log $RUN_ID --event critique --iteration <N> \
  --data '{"verdict":"<verdict>","claim_check":"<pass|fail>","mesmerizing_passes":<N>,"scores":{...},"top_fix":{"dimension":"...","what":"..."}}'
```
The logged JSON mirrors the YAML tail. Rollup renders verdict +
mesmerizing_passes + scores in the per-iteration row.

#### 2d. Exit conditions (check in order)

1. **`verdict: chef-doeuvre`** — done. Tell the user, show scores
   and "5/5 mesmerizing, claim delivered", stop.
2. **`verdict: ship-it`** — done. Tell the user it's shippable,
   show scores and probe counts, stop. Do not polish further —
   further iteration would be noise.
3. **`verdict: premise-wrong`** — stop and hand to user. "The
   critic says the premise itself is broken. Read the critique."
   Don't apply a fix.
4. **`verdict: structural-rethink`** — stop and hand to user.
   "Scoring low in a way that needs more than one Edit — often
   because the piece isn't mesmerizing at the structural level.
   Read the critique." Don't apply a fix.
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
would affect a dimension currently scoring 5, or would break a
mesmerizing probe that currently passes, don't apply it — ask the
critic for an alternative.

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
- Summarise: how many iterations, final scores, final verdict,
  mesmerizing probes at start vs end, whether the claim check now
  passes.
- Show the user a before/after comparison listing score deltas and
  probe deltas from the first critique to the last.
- **Write `pieces/<slug>/scorecard.md`** — a single-page summary that
  lives WITH the piece (not buried in `brainstorming/critiques/`) so a
  future glance at the piece directory tells you where it stands.
  Format:

  ```markdown
  # <slug> — scorecard

  Last iterated: YYYY-MM-DD (run <RUN_ID>, <N> iterations)
  Latest verdict: <chef-doeuvre|ship-it|needs-tweak|structural-rethink|premise-wrong>
  Claim check: <pass|fail>

  ## Probe counts (latest critique)
  - Mesmerizing: N/5
  - Interaction: N/7   (or "n/a — not cursor-reactive")
  - Music: N/4         (or "n/a — silent piece")
  - Song-level: N/6    (or "n/a — no analysis JSON")
  - Dual-input: N/7    (or "n/a — single-channel")
  - Layered: N/8       (or "n/a — monolithic shader")

  ## Dimension scores (latest)
  | palette | composition | motion | intensity | depth | form |
  |---------|-------------|--------|-----------|-------|------|
  | X/5     | X/5         | X/5    | X/5       | X/5   | X/5  |

  ## Deltas (first → last critique this run)
  | metric             | first | last | Δ  |
  |--------------------|-------|------|----|
  | mesmerizing_passes | …     | …    | …  |
  | claim_check        | …     | …    | …  |
  | <each scored dim>  | …     | …    | …  |

  ## Most recent fix
  Dimension: <dim>
  What:      <one-line summary of last applied top_fix>

  Latest critique: brainstorming/critiques/<slug>-v<N>.md
  ```

  Overwrite the file each run; git history holds the prior scorecards.
  This is the file `bin/audit-piece.mjs` and any future "which pieces
  are at chef-d'oeuvre" tooling can scan cheaply.
- Propose a single bundled commit with the shader changes, all the
  per-iteration critiques, fresh inspect PNGs, the refreshed rollup
  markdown, AND the new/updated scorecard.
  ```
  git add pieces/<slug>/shader.frag pieces/<slug>/inspect \
          pieces/<slug>/scorecard.md \
          brainstorming/critiques/<slug>-v*.md \
          brainstorming/runs/<slug>.md
  git commit -m "<slug>: iterated refinement pass — <N> iterations

  Final verdict: <chef-doeuvre|ship-it|…>. Mesmerizing: <N>/5 probes.
  Claim check: <pass|fail>.
  Scores: palette=X composition=Y motion=Z intensity=W depth=V form=U.

  Key fix landed: <summary of biggest improvement>.

  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  ```

### 4. Stop

Don't iterate again unless Louis asks. Running the loop repeatedly on
the same piece just grinds down whatever's good and creates critique
noise.

## Failure modes to watch

- **Critic agent hallucinates scores it can't support from the
  frames.** If its `why:` text doesn't reference specific frame content,
  re-spawn with explicit "cite which frame number shows this" prompt.
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
