# 17 — Generative artists with liquid-metal / fluid-sim shader work

## summary
Survey of artists whose work touches liquid-metal or fluid-sim
shading, ranked by what's *liftable* into a single-blob ferrofluid
piece. Marie-Pier Pruvost: could not verify — almost certainly a
misremembered name; do not cite.

## why_mesmerizing
Borrowing one specific move per artist — and ONLY one — is the
shortcut to credibility without pastiche. The risk is the opposite:
shader artists tend to over-cite, ending up with a Frankenstein piece
that reads as "generative art moodboard" rather than ferrofluid.

## concrete_steal
One move per artist, in priority order:

1. **Inigo Quilez — soft-min metaball blending.** `iq`'s smooth-min
   `polynomial smin(a, b, k)` is THE function for fusing the body
   with rising spike-tips. Use it as the SDF combine operator
   between body sphere and per-spike SDFs, with `k` modulated by
   `u_audio_bass` (high bass = looser fusion = taller, thinner
   spikes that read as separate; low bass = single mass).
2. **Memo Akten — MSAFluid as advection layer.** Don't simulate
   Navier–Stokes; steal the *visual signature* of a Jos-Stam
   semi-Lagrangian velocity field for the surface skin's lateral
   drift. A 256x256 RG16F velocity field advected once per frame
   (item already in V-Jaygent's `passes:` toolkit) gives the
   "wet skin sliding under the spikes" look that distinguishes
   alive-fluid from animated-shape.
3. **Sage Jenson (mxsage) — particle-with-trail feedback.** From
   *36 Points*: per-particle parameters (sense distance, sense
   angle, rotation, move) controlled by *sampled trail value at
   particle position*. Apply to the satellite-droplet system from
   item 13: each satellite's drift parameters depend on the
   field-strength field it samples. Result: satellites curl back
   toward magnet centres rather than drifting passively.
4. **Tyler Hobbs — flow field as skin texture.** Fidenza-style
   2D vector-field curl-noise drives high-frequency capillary chop
   on the skin, NOT the macro shape. One curl-noise call per
   pixel, mapped to a sub-pixel normal perturbation.
5. **Ksawery Komputery / Refik Anadol — skip.** Aesthetically
   adjacent (LED/data sculpture) but their work runs on bespoke
   hardware and AI pipelines; nothing portable to a fragment
   shader. Cite as mood, not technique.
6. **Casey Reas — skip.** Process series is rule-driven 2D mark-
   making, not fluid.
7. **Andrew Huang — skip as inspiration source.** His ferrofluid
   appearance is a Love Hultén physical visualizer, not generative
   work. Useful as proof of music-coupled ferrofluid market fit;
   nothing to lift.

## glsl_path
- iq smin: `lib/sdf.glsl` (already in V-Jaygent's lib tier — verify
  signature). Used in the SDF compositor pass.
- MSAFluid-style advection: new `passes:` ping-pong, RG16F velocity
  + R8 dye, 256x256, run before the SDF pass.
- 36-points feedback: extends the satellite ring-buffer from item 13
  with a per-frame field-sample step.
- Curl-noise normal: in the lighting pass, perturbs the SDF normal.

## caveats
- `iq.smin`'s `k` is sensitive: `k > 0.3` makes spikes look like
  candle wax; `k < 0.05` makes them detach (which is sometimes the
  point — see item 13 pinch-off).
- MSAFluid advection at 256² adds ~0.4ms per pass; check budget.
- Marie-Pier Pruvost: name not confirmed in any search. Probable
  misremembering of Marpi (Marcin Ignac), Marie Chatfield, or
  similar. Skip the citation rather than fabricate.

## references
- [Inigo Quilez — distance functions / smin](https://iquilezles.org/articles/distfunctions/)
- [Inigo Quilez — Shadertoy profile](https://www.shadertoy.com/user/iq)
- [Memo Akten — MSAFluid (2008)](https://www.memo.tv/works/msafluid/)
- [memoakten/ofxMSAFluid — GitHub](https://github.com/memoakten/ofxMSAFluid)
- [Sage Jenson — 36 Points](https://www.sagejenson.com/36points/)
- [Sage Jenson — physarum](https://cargocollective.com/sagejenson/physarum)
- [Tyler Hobbs — Fidenza writeup](https://www.tylerxhobbs.com/words/fidenza)
- [Refik Anadol — works](https://refikanadol.com/works/) (mood reference only)
- [Ksawery Komputery — Kate Vass studio profile](https://www.katevassgalerie.com/ksawery-kirklewski) (mood reference only)
- "Marie-Pier Pruvost" — UNVERIFIED, do not cite.
