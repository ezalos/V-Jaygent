---
user-invocable: true
allowed-tools: Read, Edit, Bash, Agent, TaskCreate, TaskUpdate, TaskList
description: Refine an existing V-Jaygent piece via a critic-agent-in-loop. Spawns a critic against taste.md, applies the top fix, re-inspects, repeats until chef d'oeuvre or 8 iterations.
---

# /vjay-iterate — critic-in-the-loop piece refinement

## Trigger

`/vjay-iterate <slug>` — refine the V-Jaygent piece at `pieces/<slug>/`
by running a critic agent against `taste.md`, applying the top fix,
and re-rendering. Loop until chef d'oeuvre (all testable dimensions
≥ 4) or 8 iterations.

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
      │ reads taste.md, VISION.md, meta,         ││
      │       shader, frame-*.png, prior crits   ││
      │ outputs YAML: scores + one top_fix       ││
      └───────────────┬──────────────────────────┘│
                      ▼                           │
        save critique → brainstorming/critiques/  │
                        │                         │
                        ▼                         │
          ┌──── exit conditions ───┐              │
          │ chef_doeuvre?          │── YES → DONE │
          │ score<3 + big fix?     │── YES → hand │
          │ repeat of prior fix?   │── YES → hand │
          │ iter == 8?             │── YES → hand │
          └────────┬───────────────┘              │
                   │ NO                           │
                   ▼                              │
      caution? (would break a 5?) → YES → ask for alt
                   │ NO                           │
                   ▼                              │
       apply top_fix via Edit on shader.frag      │
                   │                              │
                   ▼                              │
      sanity render (publish.mjs 2s)              │
       compile error? → revert, continue          │
                   │ OK                           │
                   └──────── back to inspect ─────┘
                   │
                   ▼
          summarise deltas → one bundled commit
```

Invariants: critic has no Edit tool (separation of eyes); one top_fix
per iteration (no multi-change stacking); history cumulative (prior
critiques read each loop, prevents oscillation); caution field blocks
fixes that would break a 5-rated dimension; one commit at end.

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

#### 2a. Capture fresh frames

```
node bin/inspect.mjs <slug> 4 8
node bin/runs.mjs log $RUN_ID --event inspect --iteration <N> --status ok --data '{"frames":4}'
```

Writes `pieces/<slug>/inspect/frame-*.png`. Read each one yourself —
you want to know what the critic is seeing, and frames change each
iteration as the shader changes.

#### 2b. Spawn the critic agent

Use the Agent tool with `subagent_type: "Explore"`. The Explore agent
has Read, Grep, Glob, WebFetch but **critically also multimodal image
input via Read**, which is the whole point.

Critic agent prompt template (fill in placeholders):

```
You are the V-Jaygent critic. Your single job is to judge whether
piece `<slug>` is *mesmerizing* — does it hold the eye without
exhausting it? — and whether it delivers on its own claim. Scoring
against the taste.md rubric supports that judgment; it does not
replace it.

A piece that scores 5s across every rubric dimension but isn't
mesmerizing is a failed piece. A piece that scores 3s everywhere but
locks the eye for three minutes is a success. Your allegiance is to
the eye, not the checklist.

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

7. Each of the 4 frames at
   /home/ezalos/42/V-Jaygent/pieces/<slug>/inspect/frame-*.png
   Actually look. Your observations must cite specific frame numbers.

8. Any previous critique at
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
3. Else, dimension scores below 3 → #1 raises the lowest.
4. Else, polish toward chef d'oeuvre.

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
```

#### 2c. Parse the critique

The agent returns a full Markdown critique followed by a single
fenced YAML block at the very end. Save the whole document verbatim
as `brainstorming/critiques/<slug>-v<N+1>.md` — the Markdown sections
(claim, frame-by-frame, mesmerizing probes, claim check, scores,
what's working, what's imperfect, verdict) are the cultivated record
and must survive.

To drive the loop, extract the YAML tail. Find the last ```yaml ...
``` fenced block in the file and parse it. Expected keys:

- `verdict` — one of `chef-doeuvre`, `ship-it`, `needs-tweak`,
  `structural-rethink`, `premise-wrong`
- `claim_check` — `pass` or `fail`
- `mesmerizing_passes` — integer 0-5
- `mesmerizing_probes` — map of five probe verdicts
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

Guard rail: before applying, check `top_fix.caution`. If the fix would
affect a dimension currently scoring 5, don't apply it — ask the
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
- Summarise: how many iterations, final scores, whether chef d'oeuvre.
- Show the user a before/after comparison by listing the score deltas
  from the first critique to the last.
- Propose a single bundled commit with the shader changes, all the
  per-iteration critiques, fresh inspect PNGs, AND the refreshed
  rollup markdown.
  ```
  git add pieces/<slug>/shader.frag pieces/<slug>/inspect \
          brainstorming/critiques/<slug>-v*.md \
          brainstorming/runs/<slug>.md
  git commit -m "<slug>: iterated refinement pass — <N> iterations
  
  Final scores: palette=X composition=Y motion=Z intensity=W depth=V
  form=U. Chef d'oeuvre: <yes|no>.
  
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
