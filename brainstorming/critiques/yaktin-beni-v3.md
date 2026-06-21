# yaktin-beni — v3 critique (Louis watchthrough redline batch #2)

Redlines from Louis watching v2 live:
1. **"Only beautiful when paused"** — crazy beautiful frozen at t=195.18, boring
   when playing. "I think you have a bug where it's only beautiful on pause."
2. **Cornered lights at the beginning** — "the weird lights with the corners,
   that's not mesmerizing."
3. **More tunnel** — "I want more tunnel, stack layers on top... be projected
   on the hyperspace." (Re-cited at t=163.27.)

## #1 — the real bug (FIXED + verified)
Root cause found by reading the analysis JSON: at t=195.18 the song has a
**bass + drum DROPOUT** (bass_stem=0.001, drums=0.007 — vocal + synth only), and
the long-peak bass is spiky 4-on-floor (0→0.75→0 every ~0.49s). Liveness used
`mix(synthetic, real, playing)`, so:
- PLAYING -> real bass ~0 -> drop/glow/writhe collapse to a dead floor -> boring.
- PAUSED  -> playing flips to 0 -> the lively SYNTHETIC driver -> beautiful.
Pausing literally swapped in a different, livelier driver. Fix: a
**section-scaled lively floor** that real audio ADDS to
(`bass = max(max(real_bass, 0.6*level)*playing, sectE*livelyOsc)`), in
acid-filament + hyperspace-tunnel (+ bloom-grain for the mouth). Playing is now
never deader than the idle baseline; quiet sections keep a low floor. VERIFIED:
the t=195 *playing* clip is now lively (was dead).

## #2 — cornered lights (FIXED)
- Removed the scattered ember-dot FIELD from girih-mandala entirely (flagged 3
  runs running: "square grid" -> "corners" -> "not mesmerizing"). Mandala is now
  the clean kaleidoscope strapwork; lights are the tunnel + filament + bloom.
- bloom-grain sparks: single-cell -> 3x3 neighbourhood (no edge-clip squares).

## #3 — more tunnel (PARTIAL — needs a compositional rework)
- New `hyperspace-tunnel` layer (log-polar warp: rings rush outward past stable
  radial streaks; cursor steers the vanishing point). Made it fast + bright +
  dominant; dark-tunnel-mouth darkening in bloom-grain at the drop.
- HONEST STATUS: it does not yet read as "projected into a hyperspace tunnel".
  The piece is a BRIGHT-CENTRED mandala; a tunnel needs a DARK vanishing point +
  radial streaks, but the bright mid-radius filament FLOWER + the bloom refill
  the centre and fight it. Six fade-based attempts could not overcome the
  centred-mandala composition. The real fix is a drop-mode compositional pivot:
  the mandala opens into a dark tunnel and the filament draws as RADIAL streaks
  (not a tangential flower). Staged as the next focused pass (handed to Louis to
  confirm direction first).

## Also fixed
- Filament drop motion was incoherent flicker (m-2.2 vs m-2.3, 0.1s apart, were
  totally different) -> removed the ~7Hz `rush` strobe + fast fbm; slowed the
  chaos clocks; the fast flythrough now lives in the (coherent log-polar) tunnel
  layer. Filament trail 0.85 -> 0.65 (motion-washout guard).

## Lint gate
palette PASS (0.00% cool), idle PASS. (Motion/tunnel judged from clips.)
