# Luminous — light as the subject (HDR bloom + emissive type)

Seeded by Kat / the Poet Engineer's "luminous" (see
`inspirations/x-finds-2026-06-10.md`). The goal: forms that *emit* and
*glow*, not forms that are lit. Pairs with `sdf-masks.md` for the
typography half.

## The discipline (this is most of it)

1. **Light-as-subject, not lit-from-outside.** No external key light.
   Colour is an **emission term written straight to the framebuffer**;
   the ground is near-black; **brightness *is* the form**. Push emissive
   cores well above 1.0 so they read as light sources, not surfaces.
2. **HDR working space, then tonemap.** Render to `RGBA16F`
   (`EXT_color_buffer_float`) so cores sit at luminance 2–8. Bloom is
   extracted from the >1.0 headroom; then an exposure tonemap
   (`1 - exp(-hdr*exposure)`) folds it back so highlights *bleed*
   instead of clipping to a flat disc.
3. **Additive accumulation.** Overlapping luminous elements `+` or `max`,
   never alpha-over — keeps cores hot where strokes cross.
4. **Cream/white cores + a single hue-drift accent over near-black.**
   Directly my `warm-on-warm collapse` lesson: resist filling the frame
   with mid-warm; keep it cream-on-near-black.

## Bloom pipeline (multi-pass — this is a `passes:` piece)

**Cheap, do-first (LearnOpenGL separable Gaussian):** bright-pass (soft
knee, not a hard `if`) → horizontal+vertical 5-tap Gaussian, ping-pong
~10× → additive composite + exposure tonemap + gamma.

**Better (the actual "luminous" quality lever) — COD/Jimenez pyramid:**
progressive **downsample** through a mip pyramid with a 13-tap filter and
a **Karis average** (`weight = 1/(1+luma)`) on the *first* step to kill
fireflies, then progressive **upsample** with a 3×3 tent filter
*accumulating additively*. Energy-preserving, temporally stable, soft and
wide — the difference between "has a glow filter" and "luminous." Skip
the Karis average and bright glyph corners sparkle frame-to-frame (a
`stills-under-grade-motion` trap — check `clip.mp4`, not a still).

## Cheap single-pass fake (no extra targets)

Glow straight off an SDF — the workhorse for glowing type/shapes:
```glsl
float d = sdf(uv);
float glow = exp(-d * k);          // exp falloff > 1/d (no hard core spike)
col += clamp(glow, 0.0, 1.0) * glowColor;   // gradient that fades with distance
```
Two factors sell it: high contrast vs a near-black background, and a
colour that fades with distance. Sum two exp octaves to fake the
multi-mip energy spread in one pass.

## Typography as the brush (the poetengineer move)

Text is the medium, so the SDF does double duty as **glyph + emission
mask** for generative content:
- **MSDF atlas** (`msdfgen` → RGB distance + JSON `pxRange`); shader takes
  the **median** of RGB, `smoothstep` against a pixel-range-scaled
  threshold. Stays crisp at any zoom (plain SDF rounds corners).
- **Fill the glyph with a field:** `color = fieldColor * insideMask`,
  field = fbm/flow/audio noise in glyph-local UV.
- **Emit from the edge:** `smoothstep(0., w, abs(sd))` band → feed the
  glow → bloom. Edge-glow + interior-field = luminous type.
- **Gestural shaping:** offset the threshold by noise or cursor
  (`sd += noise(uv)*amp`) to erode/grow letters — reproduces her "shape a
  poem with a gesture" feel as pure shader.
- Drive threshold / edge-glow from a beat or stem → **visible phase-lock
  on the typography** (my hard gate). → `pieces/luminous-verse.md`.

## References

- LearnOpenGL Bloom + HDR — <https://learnopengl.com/Advanced-Lighting/Bloom>
- Jimenez, Next-Gen Post Processing (COD:AW) — pyramid bloom + Karis —
  <https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/>
- Chlumsky/msdfgen — <https://github.com/chlumsky/msdfgen>
- Red Blob Games, SDF fonts — <https://www.redblobgames.com/x/2403-distance-field-fonts/>
- GM Shaders mini: Bloom / Lights (Xor) — <https://mini.gmshaders.com/p/gm-shaders-mini-bloom>
