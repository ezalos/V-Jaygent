---
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, Agent, TaskCreate, TaskUpdate, TaskList, AskUserQuestion
description: Create a new V-Jaygent piece end-to-end — brainstorm, research, scaffold, shader, audio, sanity-render, auto-critique, iterate once, commit. Takes a track URL or theme.
---

# /vjay-new-piece — end-to-end piece creation

## Trigger

`/vjay-new-piece [track URL or theme]` — create a new V-Jaygent piece.
If no argument, ask the user what the brief is (track URL, theme, open
brief).

## Preamble — read before starting

- `VISION.md` at the repo root — what V-Jaygent is for.
- `taste.md` — the scoring rubric the critic uses.
- `~/.claude/projects/-home-ezalos-42-V-Jaygent/memory/MEMORY.md` — any
  stored preferences.
- `brainstorming/README.md` — the cultivation convention.

Don't skip these. They shape every decision that follows.

## Flow

```
           /vjay-new-piece [brief]
                     │
                     ▼
         ┌──── 1. clarify ────┐
         │ track URL? theme?  │── AskUserQuestion for anchors
         │ duration? palette? │
         └─────────┬──────────┘
                   ▼
         ┌──── 2. research ───┐
         │ Explore agent (bg) │── WebFetch / WebSearch
         │ → inspirations file│
         └─────────┬──────────┘
                   ▼
         ┌──── 3. brainstorm ─┐
         │ write pieces/*.md  │── thesis, form candidates,
         │ stub committing    │   what-I-don't-want
         └─────────┬──────────┘
                   ▼
         ┌──── 4. decide ─────┐
         │ one form. no menu. │── palette, symmetry, driving idea
         └─────────┬──────────┘
                   ▼
         ┌──── 5. audio? ─────┐
         │ uvx yt-dlp         │── if track, download to pieces/<slug>/
         └─────────┬──────────┘
                   ▼
         ┌──── 6. scaffold ───┐── node bin/new-piece.mjs <slug>
         └─────────┬──────────┘
                   ▼
         ┌──── 7. shader ─────┐
         │ pieces/<slug>/     │── write shader.frag
         │   shader.frag      │   (ABOUTME header, #version)
         └─────────┬──────────┘
                   ▼
         ┌──── 8. meta ───────┐── fill meta.yaml, declare audio
         └─────────┬──────────┘   + render_scale
                   ▼
         ┌──── 9. sanity ─────┐
         │ publish.mjs 3s     │── catches compile errors
         │ compile err → fix  │
         └─────────┬──────────┘
                   ▼
         ┌──── 10. inspect ───┐
         │ bin/inspect.mjs    │── 4 frames, Read each
         │ write v1 critique  │   → brainstorming/critiques/<slug>-v1.md
         └─────────┬──────────┘
                   ▼
         ┌──── 11. iterate? ──┐
         │ any dim < 3? apply │── one top_fix before shipping
         │ top_fix, re-render │
         └─────────┬──────────┘
                   ▼
         ┌──── 12. commit ────┐── bundled: shader + meta + audio +
         │ single commit      │   critique + brainstorm + refs
         └─────────┬──────────┘
                   ▼
         ┌──── 13. current ───┐── echo <slug> > pieces/current.txt
         └─────────┬──────────┘
                   ▼
              DONE — piece at https://vjaygent.develle.fr/<slug>
```

## Steps in detail

### 1. Clarify the brief

Use `AskUserQuestion` if anything's missing. Gather:
- **Track URL** (SoundCloud or YouTube) or **theme-only** (no audio).
- **Slug** (kebab-case, max 20 chars). If not given, propose 2 based on
  the theme and let the user pick.
- **Duration** if a track — read from the SoundCloud oembed or YouTube
  page. For themes, default 60-120s.
- **Aesthetic anchor**, if the user has one in mind ("dark warm",
  "kaleidoscopic", "fluid", "hyperbolic"). Not required.

Don't ask more than 3 questions. If the brief is "track URL X", that's
enough — you can derive everything else.

### 2. Research pass

Spawn **one background Explore agent** via Agent tool. Prompt template:

```
Artistic/technical research for a V-Jaygent piece.

Track: <URL or "theme-only">
Theme anchors: <what the user said>
Duration: <N seconds>

Find 4-6 concrete references I can cultivate:
- Shader / Shadertoy pieces relevant to the theme (URL + creator + one-line steal)
- Visual/VJ artists whose *single move* is worth learning here
- Any known mathematical or physical phenomenon that fits

Use WebFetch / WebSearch. If web is unavailable, work from training
knowledge but mark references "verify URLs later".

Output one markdown body I can save to
brainstorming/inspirations/<slug>-refs.md.

Keep under 500 words. Specificity > breadth.
```

Background. Continue with steps 3-5 while it runs.

### 3. Brainstorm stub

Write `brainstorming/pieces/<slug>.md` with:
- Thesis: one sentence on what this piece is about.
- Form candidates: 2-3 concrete technical shapes (e.g., "curl-noise
  smoke", "hyperbolic tiling", "Julia set parameter walk").
- What I don't want: explicit anti-patterns for this piece (generic
  FFT bars, literal illustration, loops-with-no-end, whatever's
  tempting to default to).
- Open questions: things I'll know only after seeing it run.

Style: short specific sentences. Not an essay.

### 4. Decide

Commit to ONE form. Write the decision at the top of the stub as
"## Decision" before moving on. No menus — V-Jaygent's feedback
memory is explicit: "commit to your taste."

If torn between two forms, pick the one that teaches more (harder
technique, new territory) — the brainstorming stub still captures
the road-not-taken for future pieces.

### 5. Audio

If there's a track:

```
mkdir -p pieces/<slug>
uvx yt-dlp -x --audio-format mp3 --audio-quality 2 \
  -o 'pieces/<slug>/audio.%(ext)s' '<URL>'
ffprobe -v error -show_entries format=duration,size pieces/<slug>/audio.mp3
```

Verify:
- File size 5-15 MB (if it's <1 MB, yt-dlp probably failed silently)
- Duration matches the track metadata within 10%

If theme-only, skip this step.

### 6. Scaffold

```
node bin/new-piece.mjs <slug>
```

This creates `pieces/<slug>/shader.frag` + `meta.yaml` from templates.
You'll overwrite the shader in step 7.

### 7. Shader

Write `pieces/<slug>/shader.frag`. Respect:
- **2-line `ABOUTME:`** at top
- **`#version 300 es`** on the first code line (the hoister handles it
  even if ABOUTME is above)
- **`precision highp float;`** second
- **Warm palette** per VISION — cream/amber/ember/wine/mauve family.
  `warmCycle` or `ember` function inline (duplicated per piece is
  correct).
- **Audio uniforms declared if audio is used**: u_audio_bass,
  u_audio_mid, u_audio_high, u_audio_level, u_audio_playing, u_audio_time.
- **`render_scale`** set in meta.yaml for any shader with:
  - pathline integration
  - ray marching
  - > 32 inner iterations per pixel
  - Suggested starting values: 0.45-0.55 for expensive, 0.65-0.75 for
    moderate, 1.0 for cheap.

### 8. Meta

Fill `pieces/<slug>/meta.yaml`. Required fields:
- `title` — human name (can differ from slug)
- `slug` — matches directory name
- `created` — ISO timestamp
- `duration` — in seconds
- `render_scale` — 0.3 to 1.0
- `notes` — *real* notes, not boilerplate. At minimum:
  - Dedication / track / source
  - The thesis in one sentence
  - Audio bindings: what each band drives
  - Mouse: what the cursor does, if anything
  - Palette: family, what's restricted
  - Arc: how it ends
- `audio: audio.mp3` if audio-reactive
- `time_source: audio` if audio-reactive (so u_time == audio.currentTime)
- `published_at: null`

### 9. Sanity render

```
node bin/publish.mjs <slug> --duration 3
```

If it errors:
- **GLSL compile error** — read the log, fix the shader, retry. Common:
  `#version` not on line 1 (the hoister fails silently on malformed
  comments), undefined identifier, type mismatch.
- **ffmpeg error** — the webm captured OK but conversion failed. Usually
  a dimension parity issue. Check the vf pad filter in publish.mjs.
- **Playwright timeout** — the shader is too slow for swiftshader to
  capture. Lower `render_scale` and try again.

### 10. Inspect & self-critique

```
node bin/inspect.mjs <slug> 4 8
```

This takes ~35 seconds of wall time. Then Read each PNG yourself
(multimodal input). Write `brainstorming/critiques/<slug>-v1.md`
following the shape of existing critiques:
- What you see in each frame (honest, specific)
- Scores against `taste.md` dimensions
- Ranked fixes

This critique is YOUR first-person view, not the critic agent's. Saves
the cold-open read of the piece before any iteration.

### 11. Iterate once before shipping

If any dimension scores below 3 in your v1 critique:
- Apply **one** top fix via Edit.
- Re-render (`bin/publish.mjs <slug> --duration 2`).
- If it helped: proceed to commit.
- If it didn't help or made it worse: revert and ship v1 honestly.
  Running more iterations in this skill hits diminishing returns;
  that's what `/vjay-iterate` is for.

### 12. Commit

One bundled commit:

```
git add pieces/<slug> \
        brainstorming/pieces/<slug>.md \
        brainstorming/critiques/<slug>-v1.md \
        brainstorming/inspirations/<slug>-refs.md
git commit -m "add <slug>: <one-line description>

<why this piece — the thesis from the brainstorm stub>

Bindings:
  - bass   → …
  - mid    → …
  - high   → …

<known weaknesses from v1 critique, if any, with pointer to run
/vjay-iterate if they bother anyone>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### 13. Point current.txt at the new piece

```
echo <slug> > pieces/current.txt
```

Then tell the user:
- Public URL: `https://vjaygent.develle.fr/<slug>`
- Summary of what the piece does
- Any weaknesses v1 flagged
- Suggest running `/vjay-iterate <slug>` if a dimension scored < 4

## What not to do

- **Don't skip step 3.** Writing the stub clarifies what you're making
  before you write shader code — it's cheap, it's short, and it saves
  re-writes.
- **Don't offer menus** in step 4. Pick. That's the cultivated feedback:
  commit to the taste, don't outsource it.
- **Don't over-iterate inside this skill.** Step 11 is one fix max.
  Deeper polish is `/vjay-iterate`'s job, kept separate so the history
  is clean.
- **Don't commit the v1 critique without having actually Read the PNGs
  yourself.** The critique is first-person; you can't write it from
  imagination.
- **Don't forget `pieces/current.txt`.** The studio server looks at
  it for the default piece.

## Notes for future maintenance

If the studio runtime gains new capabilities (multi-pass, new uniforms),
update the shader template section here. If `taste.md` adds a dimension,
update step 10's scoring guidance. The skill should stay in sync with
VISION, taste, and the runtime's ambient capabilities.
