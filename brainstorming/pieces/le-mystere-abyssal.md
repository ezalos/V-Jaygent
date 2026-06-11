# le-mystere-abyssal — brief

**Song:** MPL — "Le mystère abyssal" (*L'Étoile*, 2020). 228.5s, 95.7 BPM, G minor.
**Occasion:** birthday gift from Louis to Alexandre (surfer, Lisbon, ocean-lover).
**Meaning:** the album is a tribute to "Lulu", a friend the band lost. The diver
who never resurfaces is the lost friend; the chorus chooses a hopeful myth —
"she found a sun under the water" — over grief. The piece must carry that
tenderness: loss told as light.

## Thesis

> **Depth is loss; light is memory.** One unbroken fall through a water column.
> The death of color with depth tells the story; the warm sun under the water is
> the only warmth in the piece, blooming exactly when the friends choose myth
> over grief.

Palette: BLUE — sanctioned by VISION's cold exception (form = water; warm accent
= the underwater sun, physically and narratively motivated).

## Assets

- `pieces/le-mystere-abyssal/audio.mp3` — studio mix (YouTube TpIFwi7BwAE).
- `audio.analysis.json` — beats, downbeats, 8 energy sections, **Demucs stems**.
- `lyrics.lrc` — synced lyrics (lrclib id 9859966). Verified against analysis:
  energy boundary 174.47s ↔ lyric "Et on y repense parfois" 174.51s.

## Narrative state machine (hand-authored, driven by u_time with time_source: audio)

The engine's `u_section_id` follows energy sections — do NOT use it for story
gates. Gate on `u_time` against these boundaries (the NARRATIVE block, pasted
identically into every layer):

| Stage | t (s) | Story | depth(t) | Vocabulary |
|---|---|---|---|---|
| A1 SURFACE | 0–23.1 | instrumental intro | aerial | Sugimoto bisected horizon, turquoise lagoon glitter, the near-black disc of the blue hole, small |
| A2 LEGEND | 23.1–43.2 | stories, Cousteau, "bout du monde" | aerial | disc breathes/beckons on slow clock, caustic shimmer drifts |
| A3 EXPEDITION | 43.2–64.0 | set sail; "guidés par le sonar" @59.0 | aerial | sonar rings expand from disc on downbeats; disc grows (approach); wake lines |
| B1 TIP-UNDER | 64.0–83.6 | **Chorus 1**; "soleil sous l'eau" @69.0 | 0→0.15 | disc fills frame and inverts: dark-disc-in-turquoise becomes bright-Snell-disc-in-blue; god rays open; FAINT warm glimmer far below |
| B2 DESCENT | 83.6–124.7 | dice @83.6; "elle est partie" @88.7; radio @93.6; trace lost ~97; "les bulles" @98.9; questions; "le gong" @118.7 | 0.15→0.55 | double-six snap; silhouette descends against the ray cone; one bright radio-thread to the disc; thread frays + **severs ~97**; bubbles become the only voice (vocal stem); red/orange/yellow die in order |
| B3 TWILIGHT | 124.7–142.9 | **Chorus 2** | 0.55→0.78 | Snell disc a dim coin; sun glimmer closer/warmer; bubble rims catch gold |
| B4 ABYSS | 142.9–154.6 | instrumental break (deepest) | 0.78→1.0 | pass the **milky H₂S stratum** (143–147) into near-black; bioluminescence only; one lure-light; silhouette **dissolves into marine snow** |
| C1 REVERSAL | 154.6–174.5 | "le temps a repris son cours" | 1.0→0.25 | Viola reversal: snow drifts upward, we rise; palette returns but changed |
| C2 REMEMBRANCE | 174.5–195.2 | "quand l'un de nous décroche"; bulles @189.2 | ~0.15 hover | just under the surface; occasional friend-light slips below the waterline; bubble trains arrive from the dark |
| C3 SUN BLOOM | 195.2–215.0 | **Chorus 3** | ~0.18 | the gold sun rises from below and floods the blue — the myth embraced; gentle orbital drift of everything around it |
| D OUTRO | 215.0–228.5 | ooho fade | →0.02 | bubbles ascend to the bright surface; horizon bookend; the hole's disc remains far below, a small dark coin |

Key one-shot events: dice double-flash (6-fold) @83.61 · thread sever @97.0 ·
milky wipe @142.88 · chorus rings @64.04 / 124.66 / 195.25.

## Staging

Vertical slice of water column. Light always from top. Aerial stages (A) are
top-down (disc center ~(0.5, 0.58)); the B1 inversion is the camera "falling
in": dark disc grows → fills frame → becomes the bright Snell window shrinking
toward top-center for the rest of the dive. depth(t) is the master parameter
every layer consumes: palette extinction, disc size/brightness, haze, ray gain,
caustic gain, bubble travel, snow direction.

## Color extinction (the physics spine)

Channel-ordered death, driven by depth: red multiplier →0 by depth 0.25,
green →0 by 0.70, blue persists then dims to near-black at 1.0.
Implement as `vec3 extinction(float depth)` in the NARRATIVE block so every
layer's emission passes through the same curve. Warm sources (sun, bubble gold
rims at B3+) bypass extinction deliberately — that's the POINT (myth ignores
physics). Nothing else may bypass.

Palette anchors (lit, not printed; Reinhard at composite):
- lagoon `vec3(0.35,0.78,0.70)` / mid turquoise `vec3(0.06,0.45,0.42)` / sky band `vec3(0.82,0.88,0.86)`
- azure `vec3(0.10,0.42,0.54)` → cobalt `vec3(0.03,0.16,0.38)` → midnight `vec3(0.008,0.05,0.16)` → abyss `vec3(0.001,0.012,0.035)`
- hole disc `vec3(0.004,0.02,0.06)`
- sun core `vec3(1.0,0.92,0.72)`, gold `vec3(1.0,0.72,0.30)`, halo `vec3(0.85,0.45,0.12)`
- biolum `vec3(0.25,0.95,0.75)`; lure pale `vec3(0.85,0.95,1.0)`; milky `vec3(0.42,0.50,0.52)`

## Layer stack (piece-local, bottom → top)

1. **water-column** (normal) — base. Aerial lagoon + hole disc (A), depth
   gradient + extinction + macro envelope (1–2 wandering luminance pockets),
   milky stratum at B4 entry. Cursor: pressure pocket (local darkening/parting).
2. **caustics-veil** (screen) — voronoi-filament caustics; gain fades with
   depth; axis rotates with u_bar_phase; doubles as A-stage surface glitter.
   Cursor: local agitation brightens filaments.
3. **light-shaft** (add) — Snell disc + god rays + silhouette occluder +
   radio-thread. Rays bend toward cursor. Dims with depth, dies in B4.
4. **sun-bloom** (add) — the warm radial glow below. Faint B1, closer B3, floods
   C3. Held-key sum feeds gain (+limit). Bypasses extinction.
5. **bubbles** (screen) — rising columns w/ wobble, rim+glint render (NO
   u_history: it holds the full composite, trails would smear the window);
   emission gated by **u_audio_vocals_stem** (her voice = bubbles) from B2 on,
   arriving in per-column trains; keyboard = bubble burst at key x (white aqua
   / black violet); cursor deflects columns; gold bubbles on choruses 2/3.
6. **deep-life** (screen) — marine snow (direction flips at C1 reversal),
   dinoflagellate sparkle around cursor motion (in B4: touch is the only
   light), lure-light at B4, silhouette dissolution particles.
7. **events** (add) — sonar rings (A3 downbeats), dice snap, chorus one-shot
   rings, brief radio-static chroma flicker at trace-loss (~96–98s).

Add-blend budget: light-shaft is depth-dimmed; events sparse one-shots;
sun-bloom strong only when shafts are weak (C3). Keep summed add ≤1.4.

Per-layer interactivity audit: cursor → 2,3,5,6 (+1 pocket); keyboard → 4,5,6.
Phase-lock receipts: sonar/downbeat, caustics/bar-phase, bubbles/vocal-stem,
dice & chorus one-shots at absolute timestamps, B4 wipe.

## Probes / risks (taste.md)

- **Prediction:** vocabularies differ per 20s window by construction (stage
  machine). Risk: B2 is 41s — break it with the thread-sever event + question
  bursts (key-light flickers on the questions ~104–119s).
- **Squint:** macro envelope on water-column + the disc/sun as eye anchors.
- **Liveness:** three timescales — sub-beat bubble wobble, beat sonar/caustics,
  section stage shifts.
- **Stills under-grade motion:** check clip-peak.mp4 at B2 and C3.
- **Idle/self-play:** every layer mixes synthetic drivers when u_audio_playing=0.
- **Frame-0:** u_history ramp-in on bubbles/deep-life.

## Build phases

1. Spine: NARRATIVE block + water-column + caustics-veil + light-shaft;
   inspect renders at t = 5/30/55/70/100/130/148/165/185/205/222.
2. bubbles + events (sonar, dice, sever, chorus rings).
3. sun-bloom + deep-life (snow, sparkle, lure, dissolution).
4. Critic loops (/vjay-iterate), clip renders, Louis watchthrough, polish.

Dedication (meta notes + studio page): « Pour Alexandre — joyeux anniversaire. »
