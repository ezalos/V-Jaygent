# days-without-you

Track: **Days Without You** — Satori feat. Miou Amadée (organic/deep house,
80.7 BPM, C minor, 401s). Source (Spotify):
https://open.spotify.com/track/4FBfibrcrzJ2aqeNMbPYGu — audio from the
KROOKS Records YouTube upload (duration-matched 401s, the 2015 album version).

## RESTART (2026-06-21) — the v1 thesis was boring

First thesis was a two-mode Bose-Einstein condensate (Josephson junction):
two lobes + an interference bridge. Shipped, then Louis: **"booooooring."**
He's right — it was ONE smooth motif stretched over 6.5 min, gentle and
low-energy, ignoring the track's groove. It failed the 20-second-window
test: every window the same rule at a different brightness. Restarting with
a thesis built for variety, groove, depth, and unpredictability.

## Thesis

A **living Lenia ecosystem** — continuous cellular automata (Bert Chan,
2018). A warm field where emergent organisms bloom, glide, meet, merge, and
dissolve, never settling. The music animates the ecosystem: the **beat feeds
and spawns life**, and each section drives it through a dramatically
different life-regime — sparse gliders → lush colony → turbulent bloom →
die-off → rebirth. For "Days Without You": presence and loss as the endless
cycle of forms emerging and passing; the groove is the pulse that keeps the
field alive.

## Canonical-name check

**Lenia** — continuous-state, continuous-space generalization of Conway's
Life. State `A ∈ [0,1]` on a grid evolves as:

    A(t+dt) = clamp( A + dt · G(K * A), 0, 1 )

- `K` = a smooth radial kernel (a ring/shell), `K*A` = convolution =
  neighbourhood potential `U`.
- `G` = growth mapping, a gaussian bump: `G(u) = 2·exp(-(u-μ)²/(2σ²)) - 1`,
  range [-1,1]. μ = growth centre, σ = growth width.
- Orbium reference: R=13, μ=0.15, σ=0.015, dt=0.1. For a lively SOUP (not a
  single glider) push toward the turbulent-life regime (higher μ/σ).

Pure gather (convolution + local growth) → fits the ping-pong engine with NO
scatter (unlike Physarum, which the engine can't do). Architecture C.

**Robustness / liveness mechanism (the anti-knife-edge fix):** Lenia from a
random soup can die or freeze. Two guards keep it perpetually alive without a
global reduction: (1) **primordial-soup feed** — inject faint noise ONLY
where the local field is below a threshold, so empty regions keep birthing
life while populated regions evolve cleanly; (2) **beat blooms** — kick/bass
inject seed patches, so the ecosystem breathes and re-seeds on the groove.
Death + rebirth is also the emotional arc.

## Brief gates (vjay-new-piece §1b + §1c)

```
canonical_ref: "novel for this catalog: Lenia continuous cellular automata
  (Bert Chan 2018). Nearest sibling is ferment (Gray-Scott RD) for the
  ping-pong state-bearing architecture; the dynamics are different (wide
  smooth kernel + growth mapping -> emergent gliders/organisms, not RD spots)."
eye_landing_candidates:
  - emergent organisms (gliders/rotators) drifting across the field
  - dense colony cores (bright lush clusters) that bloom and migrate
  - the birth front (where primordial-soup noise crystallizes into life)
  - beat-bloom spawns (kick-triggered patches erupting into creatures)
  - die-off voids (dark regions where a colony collapsed)
warm_cycle: [near-black, deep-wine, ember, amber, cream]
idle_behaviour: "the ecosystem evolves autonomously (Lenia is self-driving);
  the gated noise-feed perpetually re-seeds empty regions and a slow internal
  clock drifts the regime, so it never repeats and never dies. Rich w/o input."
architecture: C   # ping-pong feedback — Lenia is a state-bearing CA
arch_rationale: "A(t) must persist between frames (a cellular automaton). One
  sim pass (lenia.frag, rgba16f ping-pong) computes the kernel convolution +
  growth update; display reads the state. Wrong choices: A loses state; B is
  for <=200 discrete agents; layers have no clean persistent publish."
```

## Two-timescale unpredictability (VISION)

- **Continuity ~0.4-0.8s:** organisms glide and morph smoothly; the eye tracks
  a creature across the field.
- **Divergence ~15-25s:** the ecosystem reconfigures completely — a colony
  that dominated one window has dissolved and a new regime (triggered by the
  section's μ/σ/dt) has taken over by the next. Lenia is a genuinely chaotic
  CA, so windows are categorically different event vocabularies (gliders vs
  turbulence vs colony vs die-off), not re-shaded params. This is the explicit
  fix for the v1 boringness.

## Section -> regime map (μ, σ, dt, feed)

```
0  0-31s    intro      sparse, slow: low feed, few gliders forming
1  31-126s  verse      gliders + small colonies (vocals warm the regime)
2  126-158s drop       turbulent bloom: dt up, feed up, frantic spawning
3  158-236s vocal      lush colony: high growth, dense bright clusters (together)
4  236-284s build      colonies migrate + merge, rising density
5  284-331s climax     frantic/chaotic: max dt + drum agitation, life everywhere
6  331-378s outro      die-off: feed down, colonies collapse into voids
7  378-401s fade       near-empty, a last glider, then to near-black
```

## Audio bindings (motion + life, not glow)

- `u_audio_kick` / `u_audio_bass_stem` -> beat blooms: inject seed patches +
  a global growth pulse (the field breathes/spawns on the kick).
- `u_audio_drums_stem` -> agitation: raise dt (faster evolution = frantic life).
- `u_audio_vocals_stem` -> μ shift toward the lush-life regime (warmer growth).
- `u_audio_other_stem` -> σ / kernel width -> morphology change.
- `u_section_id` -> regime preset (the map above); `u_downbeat` -> spawn ring.

## Inputs

- **Cursor**: a fertile zone — drag to inject living matter + boost local
  growth (garden the ecosystem). Idle -> none.
- **Keyboard synth**: each key plants a seed patch at a key-mapped position.

## What I don't want

- A single repeated motif (the v1 failure). The regimes MUST look categorically
  different across sections — verify with cross-window clips, not stills.
- A dead or frozen field (the Lenia knife-edge) — the gated noise-feed +
  beat blooms + auto-reseed guard against it.
- Blow-out to flat-bright (clamp A to [0,1]; growth is bounded).
- Smooth low-detail blobs (the v1 depth fail) — Lenia creatures have ringed
  interiors = native fine texture + depth.

## Open questions

- Which μ/σ/dt regime gives the most gorgeous lively SOUP (tune live).
- Kernel radius R vs cost (R=13 = 729 taps; RTX 4090 handles it at scale 0.5).
- Does the gated noise-feed disrupt creatures or feed them — tune the gate.
