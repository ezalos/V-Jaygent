---
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Agent, TaskCreate, TaskUpdate, TaskList, AskUserQuestion
description: Start a V-Jaygent piece from an audio URL. Downloads via yt-dlp, runs the offline analyzer (BPM/sections/key, optional Demucs stems), scaffolds a piece directory with audio_features wired and a placeholder layer stack ready for /vjay-new-piece to refine. MVP scope is --draft (scaffold and stop); full autonomous mode is deferred.
---

# /vjay-from-url — start a piece from a music URL

## Trigger

`/vjay-from-url <url> [--slug <slug>] [--stems]` — given a YouTube /
SoundCloud / etc URL, set up a piece directory with the audio
downloaded, analysis JSON computed, and a meta.yaml scaffolded. Then
hand off to `/vjay-new-piece` (or hand-edit) for the artistic
decisions.

If `<url>` is omitted, ask the user for one. Don't try to guess.

## When to reach for this skill

- The user gave you a music link and wants a piece made for it.
- You're starting from "here's a track" rather than "here's a theme".
- The piece will be audio-driven, not theme-only.

If the user wants a theme-only piece (no audio), use `/vjay-new-piece`
directly — this skill's whole point is wrapping the audio download +
analysis steps.

## Flow

```
            /vjay-from-url <url> [opts]
                       │
                       ▼
            ┌── 1. confirm intent ────┐
            │ slug? stems? draft?     │── AskUserQuestion if URL alone
            └──────────┬──────────────┘
                       ▼
            ┌── 2. CLI does mechanical ┐
            │ work:                     │── node bin/vjay-from-url.mjs
            │   yt-dlp download         │
            │   bin/analyze-audio.mjs   │
            │   scaffold meta + fallback│
            └──────────┬───────────────┘
                       ▼
            ┌── 3. hand off ──────────┐
            │ /vjay-new-piece <slug>  │── for artistic decisions
            │ (or hand-edit)          │   (layer stack, drivers, etc)
            └──────────┬──────────────┘
                       ▼
            ┌── 4. iterate ───────────┐
            │ /vjay-iterate <slug>    │── critic-in-the-loop
            └──────────┬──────────────┘
                       ▼
                    DONE
```

## Steps in detail

### 1. Confirm intent

Use `AskUserQuestion` if anything's missing. Gather:

- **URL** — required. YouTube, SoundCloud, Bandcamp, Vimeo — anything
  yt-dlp can pull. If the user pasted multiple links, ask which one
  they want.
- **Slug** — optional. If omitted, the CLI derives one from yt-dlp's
  title (sanitized to kebab-case, deduplicated against existing
  pieces). Ask only if the auto-derived slug would be embarrassing
  (e.g. when the title is mostly punctuation).
- **Stems?** — Demucs adds 2-3 GB of model + minutes of CPU. Default
  no. Suggest yes only if the piece's thesis explicitly needs per-
  stem reactivity (vocals as focal element, drums as kinetic accent
  — see `brainstorming/techniques/music-composition.md` §"Per-stem
  patterns").

### 2. Run the CLI

```bash
node bin/vjay-from-url.mjs '<url>' [--slug <slug>] [--stems]
```

The CLI is mechanical and self-contained. It:

1. Resolves the slug (auto-derive from yt-dlp title or take `--slug`).
2. Creates `pieces/<slug>/`.
3. Downloads audio via `uvx yt-dlp -x --audio-format mp3` to
   `pieces/<slug>/audio.mp3`.
4. Runs `node bin/analyze-audio.mjs pieces/<slug>/audio.mp3 [--stems]`
   to produce `audio.analysis.json` (BPM, beats, downbeats, sections,
   energy envelope, optional stems, key).
5. Scaffolds `meta.yaml` with `audio_features:` declared and a
   placeholder `layers:` stack ([solid-warm, wave-distort]) so the
   piece renders something visible immediately.
6. Scaffolds a fallback `shader.frag` (used only if the layer engine
   fails to load).

If yt-dlp fails (geo-restriction, login required, removed video), the
CLI surfaces the error and exits non-zero. Common workaround: pass a
different URL or download the audio manually and use
`/vjay-new-piece` instead.

**Spotify URLs (added 2026-06-12, no-son-of-mine run).** yt-dlp cannot
download from Spotify (DRM). Resolve the track first, then source from
YouTube:

```bash
# 1. track title from the oEmbed endpoint (no auth needed)
curl -s 'https://open.spotify.com/oembed?url=<spotify-track-url>'
#    → .title, e.g. "No Son Of Mine - Remastered 2007"
# 2. find the best YouTube source (prefer the artist's official channel,
#    album-length version)
uvx yt-dlp --no-warnings --print '%(id)s | %(title)s | %(duration)s | %(channel)s' \
  'ytsearch5:<artist> <title> official audio'
# 3. run the CLI with the chosen YouTube URL + an explicit --slug
#    (the auto-derived one would inherit YouTube title noise)
```

Pick the official-channel "(Official Audio)" upload over music videos
(videos often have intros/outros that shift the analysis grid).

### 3. Hand off to artistic decisions

Once the scaffold is in place, the piece is *technically* ready to
preview but *artistically* a placeholder. The layer stack in
`meta.yaml` is `[solid-warm, wave-distort]` — readable but not the
real piece.

Run `/vjay-new-piece <slug>` to:

- Read the analysis JSON (sections, key, BPM are now known).
- Brainstorm the actual thesis from the music's structure.
- Decide monolithic vs layer-stack (see `/vjay-new-piece` step 4).
- Replace the placeholder layer stack with the real one (or convert
  to a single-shader piece by deleting `layers:` and writing
  `shader.frag` from scratch).
- Continue through the rest of the new-piece workflow.

If you'd rather hand-edit, the placeholder is structured to make
that easy: the audio is pre-wired, the analysis is loaded, you just
swap layers / write shaders.

### 4. Iterate via the critic

`/vjay-iterate <slug>` — the standard refinement loop. With analysis
JSON loaded, the critic now has access to the song-level probes
(section-readability, downbeat-anchored, pre-tension, per-stem-
discrimination, long-arc, recapitulation) on top of the per-frame
music probes. Threshold: 4/6 song-level + 3/4 per-frame to claim
"composes with the music".

## What's NOT in the MVP

The original spec called for an autonomous mode (no `--draft`) that
chains analyze → scaffold → render → critic-gate → publish to
`studio.develle.fr`. That requires:

- A reliable autonomous-scaffold path (today, layer-stack scaffolding
  needs the agent's artistic judgement; `/vjay-new-piece` is
  interactive).
- The critic loop running headlessly until ship-it.
- The private subdomain wired (Phase 3.6 / task #17).

Until those land, `--draft` is the only mode. The CLI will exit with
an explicit error if `--no-draft` is passed.

## What not to do

- **Don't** invoke this skill for theme-only pieces (no audio). Use
  `/vjay-new-piece` directly.
- **Don't** download to a temp dir and copy. The CLI writes directly
  into `pieces/<slug>/` so the analysis JSON sits next to the audio
  (the runtime resolves paths relative to the piece dir).
- **Don't** skip the `audio_features:` declaration when the analysis
  succeeded. Without it, the runtime won't fetch the analysis JSON
  and the piece misses the song-level uniforms. The CLI handles this
  for you; don't strip it from the scaffolded meta.yaml.
- **Don't** publish a placeholder. The scaffold is INSIDE
  `pieces/<slug>/` which means it appears in the public catalog as
  soon as `pieces/current.txt` points at it. Refine the layer stack
  before announcing.

## See also

- `bin/vjay-from-url.mjs` — the CLI this skill wraps.
- `bin/analyze-audio.mjs` — the analyzer, called per piece.
- `skills/vjay-new-piece/SKILL.md` — the artistic workflow this hands
  off to.
- `skills/vjay-iterate/SKILL.md` — the critic-in-the-loop refinement.
- `brainstorming/techniques/music-composition.md` — the song-level
  rules the analysis JSON unlocks.
- `brainstorming/techniques/using-lib.md` §"audio analysis JSON
  contract" — the schema the analyzer produces.

## Wrap up — automatic, mandatory

After the scaffold completes (or after the autonomous flow ships,
once that mode lands), invoke the `wrap-up` skill via the Skill
tool. Captures lessons from this run, updates V-Jaygent memory
with anything new (e.g. a yt-dlp option that helped, a new analyzer
edge case). Auto-runs without an explicit "wrap up" phrase — Louis's
2026-05-05 instruction.

```
[Skill tool] wrap-up
```
