# Lab pieces — brainstorm an idea, POC it outside the work

Formalized 2026-06-12 after the `bubbles` lab picked the bubble
language for le-mystere-abyssal in one review round. When a piece
element isn't up to standard and the right treatment is genuinely
unknown, do NOT iterate inside the piece — build a lab.

## The loop

1. **Deep research first.** One background research agent on the
   visual subject (physics, shader prior art, fine-art abstractions,
   VFX techniques). The brief must demand CONCRETE mechanisms (math,
   shader IDs, named works), not vibes, and end with a proposed list
   of N distinct treatments spanning photoreal → stylized → abstract.
   (See the 2026-06-11 bubble-rendering brief for the shape.)
2. **One lab piece, N treatments.** A standalone piece named after the
   subject (`pieces/<subject>/`), every treatment implemented in one
   shader behind a selector. N ≈ 12 is the sweet spot: enough spread
   that the comparison teaches taste, few enough to build in a
   session. Treatments must differ in VOCABULARY (refraction vs cells
   vs ink vs dots), not in parameters.
3. **Make switching effortless** — the review experience is the
   product: auto-cycle (~12s per treatment) + CLICK a bottom tick to
   lock / same tick to release / anywhere else to step + hold a piano
   key to override. Tick row = which one you're seeing. Document the
   key→treatment map in meta notes.
4. **Louis reviews live, picks 1–3, redlines them** ("2 if small",
   "5 smooth the wrap", "12 white, colors when hope comes"). Iterate
   the lab treatments per redline so the pick is confirmed on the
   updated look.
5. **Integrate the winner into the real piece** — translated into the
   piece's narrative terms (the lab's hope-demo breath became the
   piece's narrative hope curve), keeping the piece's couplings
   (stems, u_below, stages). The lab stays in the catalog as the
   decision record.

## The selector skeleton (copy-paste)

Selection needs persistent state → `passes:` with a tiny ping-pong
texture. From `pieces/bubbles/` (the canonical example):

```yaml
passes:
  - name: select
    shader: select.frag
    target: { format: rgba16f, ping_pong: true, scale: 0.02 }
    inputs: { u_state: select }
  - name: display
    shader: shader.frag
    target: screen
    inputs: { u_state: select }
```

`select.frag` holds `(selected, prevTouch)` in one texel: touch-down
edge detection on `u_touches[0]` (per-pass scaled — normalize by
u_resolution); tick-strip hit test selects; same-tick click releases
to auto; elsewhere steps. `shader.frag` reads
`texture(u_state, vec2(0.5)).x` (−1 = auto-cycle on
`mod(u_time/CYCLE, N)`), lets held `u_keys` override momentarily, and
draws the clickable tick row (locked = steady warm + ring; auto =
pulsing). Gotchas: `active` is a GLSL reserved word; a sub-frame
synthetic click never registers (real clicks span frames).

## Why outside the piece

- The piece's narrative machinery (stages, stems, couplings) drowns
  treatment differences; the lab isolates the vocabulary question.
- Side-by-side comparison is a prediction-probe for taste: if two
  treatments read the same in the lab, they were one idea.
- Bad treatments cost nothing to discard; inside the piece they cost
  a revert and re-critique.
- The lab survives as a reusable palette: the next water piece can
  re-shop the same twelve.
