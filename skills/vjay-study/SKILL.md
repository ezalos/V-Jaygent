---
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Agent, TaskCreate, TaskUpdate, TaskList, AskUserQuestion
description: Take a cross-cutting topic seriously — deep-research it, land findings in brainstorming/techniques/, update taste.md and /vjay-iterate's critic with new probes, optionally extract canonical primitives into lib/. Use when a recurring concern in pieces (interactivity, audio reactivity, curved space, palette theory) graduates from ad-hoc to deserving formal treatment.
---

# /vjay-study — promote a topic to formal treatment

## Trigger

`/vjay-study <topic>` — take the named topic seriously. The skill
researches it, writes the cultivation note, updates the critic with
probes grounded in the research, and — when the topic has a stable
mathematical core — lifts canonical helpers into `lib/`.

If no topic is given, ask what triggered the request. A topic without
a concrete motivation usually shouldn't be promoted — promotion is
expensive, and doing it for "seems interesting" calcifies the project
prematurely.

## When to reach for this skill

Promote a topic when **any two** of the following are true:

- A piece just surfaced a question the author couldn't answer from
  existing notes ("which zoom mapping is right?" "how do I pick a
  BPM pulse that doesn't feel mechanical?").
- The same decision has been re-litigated across ≥ 2 pieces with
  inconsistent answers.
- The critic agent gave conflicting guidance on this topic between
  pieces.
- A piece failed a `taste.md` lens check and no one knew which probe
  would have caught it earlier.
- The topic obviously needs a canonical `lib/` primitive that three
  pieces have copy-pasted versions of.

**Don't** promote a topic because it sounds important in the
abstract. The brainstorming dir is cultivation — it grows when
specific ideas need somewhere to live, not when categories need
headings.

## Flow

```
              /vjay-study <topic>
                       │
                       ▼
            ┌── 1. frame the topic ──┐
            │ trigger? which piece?  │── AskUserQuestion if
            │ what decision to make? │   motivation unclear
            └──────────┬─────────────┘
                       ▼
            ┌── 2. survey existing ──┐
            │ brainstorming/         │── Glob + Read; if already
            │ + taste.md + VISION.md │   covered, stop and say so
            └──────────┬─────────────┘
                       ▼
            ┌── 3. deep research ────┐
            │ web-search-agent (bg)  │── 1.2–1.8k words,
            │ + WebFetch / WebSearch │   concrete references,
            │                        │   6+ named artists,
            │                        │   recipes where applicable
            └──────────┬─────────────┘
                       ▼
            ┌── 4. distill ──────────┐
            │ brainstorming/         │── match fluid-dynamics.md
            │   techniques/<t>.md    │   style — short, specific,
            │                        │   cite inline
            └──────────┬─────────────┘
                       ▼
            ┌── 5. update taste.md ──┐── ONLY if research reveals
            │ lens text or probes    │   concrete pass/fail criteria
            └──────────┬─────────────┘   the critic can apply
                       ▼
            ┌── 6. update /vjay-     ┐
            │    iterate critic      │── add topic-specific
            │ new probes if warranted│   questions to the
            │                        │   critic's Markdown output
            └──────────┬─────────────┘
                       ▼
            ┌── 7. lib/ extraction ──┐── ONLY if the research
            │ canonical primitives   │   surfaces a stable
            │                        │   mathematical core three
            │                        │   pieces would reuse
            └──────────┬─────────────┘
                       ▼
            ┌── 8. commit bundled ───┐── one commit:
            │                        │   techniques + taste
            │                        │   + critic + lib
            └──────────┬─────────────┘
                       ▼
            ┌── 9. if triggered by ──┐
            │    a specific piece:   │── optional — apply the
            │ apply one concrete fix │   research to the trigger
            │ to that piece          │   piece, separate commit
            └──────────┬─────────────┘
                       ▼
                    DONE
```

## Observability

Open a run at step 1 and log through the flow:

```
RUN_ID=$(node bin/runs.mjs start --slug topic-<kebab> --skill vjay-study)
# ... one event per numbered step: research, distill, taste_update,
# critic_update, lib_extract, commit ...
node bin/runs.mjs end $RUN_ID --status <shipped|aborted>
node bin/runs.mjs rollup topic-<kebab>
```

The slug convention `topic-<kebab>` (e.g. `topic-interactivity`,
`topic-audio-reactivity`) keeps study runs distinguishable from
piece-creation and piece-iteration runs in the rollup directory.

## Steps in detail

### 1. Frame the topic

Gather:
- **Name** — one or two words, kebab-cased for the filename
  (`interactivity`, `audio-reactivity`, `curved-space`).
- **Trigger** — the specific piece or moment that surfaced this.
  Written in the techniques note as the "why now" at the top.
- **Decisions to make** — the concrete questions the study should
  answer. Without these, the research is shapeless.

If the user didn't give a trigger, ask. A topic with no motivating
decision usually doesn't warrant a study — it's a reading list, not
a cultivation.

### 2. Survey existing material

Before spending compute on research, check what's already written:

```
ls brainstorming/techniques/ brainstorming/inspirations/
grep -i -l '<topic keywords>' brainstorming/**/*.md VISION.md taste.md
```

If `brainstorming/techniques/<topic>.md` already exists: read it.
You're updating, not writing fresh. Frame the new research as
*delta* on top of what's there.

If `taste.md` already has a lens touching this topic: read it. Your
taste.md update, if any, extends rather than rewrites.

### 3. Deep research

Spawn **one background research agent** (`subagent_type:
web-search-agent`) with a prompt that includes:

- The V-Jaygent context (single-pass fragment shaders, warm palette,
  manifesto pointer, runtime limits: no click/scroll in current
  `u_mouse` schema, etc.).
- The trigger piece and the specific decision.
- An explicit request for:
  - **Named artists / works** (≥ 6, with URLs when verifiable,
    "verify URL" tag when not)
  - **Concrete patterns / techniques** with recipes where applicable
    (GLSL snippet, formula, pseudo-code)
  - **Anti-patterns** specific to this topic
  - **Pass/fail probes** (≥ 5) suitable for the V-Jaygent critic
- Length cap: 1.2–1.8k words. Dense beats long.
- Style note: match `brainstorming/techniques/fluid-dynamics.md` —
  short, specific, citable. Quote directly when a source said it
  better.

Background so steps 4-7 can scaffold while research runs. Poll for
completion with Monitor or continue parallel non-dependent work.

### 4. Distill to brainstorming/techniques/&lt;topic&gt;.md

Copy the research agent's output verbatim as the body, then:

- Add a **"Why now"** section at the top (the trigger piece and the
  specific decision).
- Add **"How to apply in V-Jaygent"** at the end — what the critic
  should check, what lib helpers (if any) exist or should, which
  existing pieces would benefit from retro-fitting.
- Cross-link: mention the relevant piece files in
  `brainstorming/pieces/`, the technique files this one builds on,
  the `lib/` modules it relates to.
- Shorten ruthlessly. 1500 words of dense material beats 3000 words
  of filler. If a paragraph doesn't add specificity, delete it.

### 5. Update taste.md (conditional)

**Only** if the research surfaces pass/fail criteria the critic can
concretely apply. "Interactivity should feel alive" is not a
criterion. "The cursor must change composition (not just local
appearance) when dragged across the full width of the frame" is.

Extend the relevant **VJ lens** section (taste.md §"VJ lenses") with
the new probe. If no existing lens fits, this is a signal the topic
deserves its *own* lens — add one, but sparingly. The lenses are a
small set by design.

Never delete an existing probe in the name of "updating." If a probe
genuinely stops being useful, deprecate it with a dated note, don't
erase.

### 6. Update /vjay-iterate critic prompt

Open `skills/vjay-iterate/SKILL.md`, find the critic prompt template
(search for "# Read, in this order"). Extend it with:

- A reading-order line for the new techniques file:
  `N. /home/ezalos/42/V-Jaygent/brainstorming/techniques/<topic>.md`
- A new probe or probe-group in the critic's Markdown output
  section, matching the rest of the output's structure.
- If `taste.md` grew a new lens, mention it in the critic prompt's
  overview paragraph so the agent knows to apply it.

Keep changes minimal — the critic prompt is already dense. One new
probe or one extended existing probe, not a re-architecture.

### 7. Lib/ extraction (conditional)

**Only** if the research surfaces a function or formula with:
- One right answer (not aesthetic choice)
- Three or more pieces could use it (existing or planned)
- No palette or mood opinion baked in

Write `lib/<topic>.glsl` with `#ifndef` guard and 2-line ABOUTME.
Update `skills/vjay-new-piece/SKILL.md`'s `lib/` listing in the
Preamble.

Do NOT move palette functions, mood-specific helpers, or anything
that is aesthetic. VISION.md is explicit: "Duplication beats
coupling for artistic phrases." Lib is infrastructure, not
phrasebook.

### 8. Commit bundled

One commit covering all touched files:

```
git add brainstorming/techniques/<topic>.md \
        taste.md \
        skills/vjay-iterate/SKILL.md \
        skills/vjay-new-piece/SKILL.md \
        lib/<topic>.glsl            # if created
git commit -m "study: <topic> — formal treatment + critic probes

Trigger: <piece that surfaced this, or 'cross-cutting concern'>.

Research: brainstorming/techniques/<topic>.md — <one-line summary>.
Taste lens: <which lens was touched and how>.
Critic probes: <N new / extended>.
Lib: <lib/<topic>.glsl extracted | none — remained per-piece>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### 9. Apply to the triggering piece (conditional)

If the study was triggered by a specific piece's weakness, the
research is in the repo but the piece is still broken. Do one
concrete fix on that piece informed by the research, and commit
separately:

```
git commit -m "<slug>: apply <topic> study — <concrete change>

Per brainstorming/techniques/<topic>.md — <one-line why>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Separating the study commit from the piece fix keeps the history
honest: the research stands on its own, and the piece shows an
application of it.

## What not to do

- **Don't promote a topic to study without a concrete decision it
  must answer.** Shapeless research produces shapeless notes; they
  calcify the brainstorm dir without teaching.
- **Don't rewrite taste.md or the critic prompt from scratch.** The
  update is an extension in the same register, not a re-architecture.
  If you catch yourself rewriting the rubric, stop — that's a
  separate conversation with Louis, not a side-effect of a study.
- **Don't lift `lib/` primitives prematurely.** Three pieces using a
  formula is the bar. Two is a coincidence.
- **Don't conflate the study commit with the piece fix.** One
  commit for the infrastructure, one for the piece that triggered it.
- **Don't skip step 2.** Duplicate brainstorming dirs and stale
  probes are worse than no notes at all.

## Notes for future maintenance

If `/vjay-iterate`'s critic prompt grows unwieldy because studies
keep bolting on new probes, consider factoring the probes out of the
skill file into `taste.md` and having the critic read them from
there. Don't pre-factor — wait until the skill file actually hurts
to read.

If the brainstorming/techniques/ dir accumulates files that never
inform a piece, they're worth deleting (VISION.md §"Cultivate this"
calls for it). A technique file justifies itself by being read when
a piece is being built.

## Wrap up — automatic, mandatory

After the bundled study commit lands (step 8), invoke the `wrap-up`
skill via the Skill tool. The study itself is one form of memory
update, but wrap-up captures any meta-lessons from this run
(corrections from the user, patterns about how the study should
have been framed) and surfaces them in V-Jaygent memory. Louis
asked on 2026-05-05 for this to be automatic at end of every
skill session.

```
[Skill tool] wrap-up
```
