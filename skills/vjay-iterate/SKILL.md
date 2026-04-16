---
user-invocable: true
allowed-tools: Read, Edit, Bash, Agent, TaskCreate, TaskUpdate, TaskList
description: Refine an existing V-Jaygent piece via a critic-agent-in-loop. Spawns a critic against taste.md, applies the top fix, re-inspects, repeats until chef d'oeuvre or 4 iterations.
---

# /vjay-iterate — critic-in-the-loop piece refinement

## Trigger

`/vjay-iterate <slug>` — refine the V-Jaygent piece at `pieces/<slug>/`
by running a critic agent against `taste.md`, applying the top fix,
and re-rendering. Loop until chef d'oeuvre (all testable dimensions
≥ 4) or 4 iterations.

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
             ┌───── LOOP ≤ 4 ─────────────────────┐
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
          │ iter == 4?             │── YES → hand │
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
- Create a TaskCreate entry per iteration slot (up to 4).
- Determine the starting version number by reading
  `brainstorming/critiques/` — if the latest critique is `<slug>-vN.md`,
  the next will be `v(N+1)`.
- **Open a run:** `RUN_ID=$(node bin/runs.mjs start --slug <slug> --skill vjay-iterate)`.
  Keep `$RUN_ID` in context for logging throughout the loop.

### 2. Loop (for iteration in 1..4)

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
You are the V-Jaygent critic. Your job is to grade piece `<slug>` against
the rubric in taste.md and name exactly one top-priority fix.

Read, in this order:
1. /home/ezalos/42/V-Jaygent/taste.md             (the rubric)
2. /home/ezalos/42/V-Jaygent/VISION.md            (aesthetic context)
3. /home/ezalos/42/V-Jaygent/pieces/<slug>/meta.yaml
4. /home/ezalos/42/V-Jaygent/pieces/<slug>/shader.frag
5. Each of the 4 frames at
   /home/ezalos/42/V-Jaygent/pieces/<slug>/inspect/frame-*.png

Also read any previous critique at
/home/ezalos/42/V-Jaygent/brainstorming/critiques/<slug>-v*.md so you
know what has already been tried.

Output a single YAML block with exactly this shape:

piece: <slug>
iteration: <N>
scores:
  palette_cohesion: <1-5>
  composition: <1-5>
  motion: <1-5>
  intensity: <1-5>
  depth: <1-5>
  form_ending: <1-5 or "n/a">
chef_doeuvre: <true|false>
top_fix:
  dimension: <which dimension this raises>
  what: |
    One paragraph specific description of exactly what to change
    in shader.frag, with line-hint context if possible.
  why: |
    One paragraph explaining why this is top priority now, grounded
    in what the frames actually show.
  caution: |
    What 5-rated dimension this change must NOT break. If none,
    write "none".

Grade harshly. Be specific. The iterate loop depends on your
`top_fix.what` being concrete enough to apply via Edit without
ambiguity.

If chef_doeuvre is true, set `top_fix: null` and explain in a
`celebration:` field what specifically landed.
```

#### 2c. Parse the critique

The agent returns a YAML block. Extract:
- `chef_doeuvre` flag
- `scores`
- `top_fix` (if present)

Save the full critique as
`brainstorming/critiques/<slug>-v<N+1>.md` with the YAML block plus
a short summary paragraph you write yourself.

**Log it:**
```
node bin/runs.mjs log $RUN_ID --event critique --iteration <N> \
  --data '{"scores":{...}, "chef_doeuvre":<bool>, "top_fix":{"dimension":"...", "what":"..."}}'
```
The logged JSON should mirror the YAML exactly — the rollup depends on
it.

#### 2d. Exit conditions (check in order)

1. **`chef_doeuvre: true`** — done. Tell the user, show scores, stop.
2. **Any score < 3 with a fix that would take multiple iterations** —
   stop and hand to the user. "This needs a structural change, not
   incremental polish." Don't loop.
3. **Same top_fix as previous iteration** — the previous fix didn't
   help or made it worse. Stop and hand to the user.
4. **Iteration count == 4** — stop. "Four iterations without
   chef d'oeuvre; the piece needs human judgement."

If none of the above: proceed.

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
