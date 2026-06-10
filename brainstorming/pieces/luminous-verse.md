# luminous-verse — the poem is the light

## One-line concept

Lyrics (or a short poem) rendered as MSDF glyphs that don't *draw* but
*emit* — each letter is a window into a generative field, its edges glow
and bleed through an HDR bloom, and the type erodes / re-forms on the
beat. Text as the brush, light as the subject.

## Why this piece

Seeded by Kat / the Poet Engineer's "luminous"
(`inspirations/x-finds-2026-06-10.md`). It's the first V-Jaygent piece to
make **typography load-bearing** — and it has a natural music hook: a
song *has lyrics*, so the text can be the literal words, phase-locked to
the vocal stem. Technique detail in `techniques/luminous-bloom.md` +
`techniques/sdf-masks.md`.

## Architecture — `passes:` (bloom is a post chain)

1. **Scene (→ RGBA16F).** MSDF glyphs (median-of-RGB, pixel-range
   threshold). Each glyph's interior = a generative field (fbm/flow in
   glyph-local UV); each glyph's edge = an emission band. Push cores >1.0.
2. **Bloom pyramid.** COD/Jimenez downsample (Karis average on step 1 to
   stop edge sparkle) → additive tent upsample. *The* quality lever.
3. **Composite + tonemap.** Additive scene + bloom → exposure tonemap →
   gamma.

## Music + interaction coupling

- **Vocal stem** (`reference_audio_analyzer_stems`) → which line is lit;
  word onset → that word flares (threshold + edge-glow spike) =
  `feedback_visual_phase_lock` on the type itself.
- **Cursor** = gestural shaping: `sd += noise(uv - cursor)*amp` erodes /
  grows letters near the pointer (her "shape a poem with a gesture").
- **Keyboard** = each key reshapes a glyph's interior field or shifts the
  accent hue.
- **Bass/drums** → bloom radius + interior-field turbulence, so a 2nd
  channel reacts (`feedback_per_layer_interactivity`), not just the type.

## Palette & discipline

Cream/white emissive cores + **one** hue-drift accent over near-black —
`feedback_warm_on_warm_collapse` applies hard here. Resist colouring the
whole frame; the dark is what makes the light read as light.

## Open questions

- Glyph atlas at build time vs. a small runtime MSDF set — probably ship
  a fixed atlas per piece (the lyric is known).
- Legibility vs. abstraction: how far can the interior field dissolve the
  letter before it stops being a word? The tension *is* the piece — tune
  it so the word resolves on the downbeat and dissolves between.
- Verify motion on `clip.mp4`: bloom sparkle + sub-beat type-shimmer are
  invisible in stills (`feedback_stills_under_grade_motion`).
