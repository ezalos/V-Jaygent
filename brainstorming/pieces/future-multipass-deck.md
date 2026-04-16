# Future: multi-pass VJ deck

The next architectural step for V-Jaygent, after `strata` proves layered
composition works in a single pass.

## The idea

Today a piece is `shader.frag` + `meta.yaml`. Tomorrow a piece is a
**manifest of layers**, each with its own shader:

```yaml
# pieces/hypothetical/meta.yaml
title: "Hypothetical Deck"
layers:
  - source: layer0-ground.frag
    rate: 0.5
    blend: over
    audio: bass
  - source: layer1-rings.frag
    rate: 3.0
    blend: screen
    mask: sdRoundedRect(centre=lissajous, size=0.5)
    audio: bass
  - source: layer2-tile.frag
    rate: 5.0
    blend: max
    mask: sdTriangle(centre=lissajous, size=0.7)
    audio: mid
  # ...
```

The runtime:
1. Compiles each layer as its own fragment shader writing to an intermediate
   framebuffer (a texture).
2. Renders them sequentially, each one reading the accumulated framebuffer as
   input.
3. A tiny composition shader applies the declared blend mode + mask for each
   layer.
4. Hot-reload works per-layer — change one `.frag` file, just that layer
   recompiles.

## What this unlocks

- **Per-layer iteration.** Edit layer 2's shader without breaking layer 3.
- **Per-layer palette.** Each layer can live in its own colour-family.
- **Shared library layers.** One `fbm-ground.frag` reused across pieces.
- **Live-switching.** Swap a layer at runtime (VJ cut).
- **Real ping-pong for trails.** A layer reads its own previous frame →
  particle trails, reaction-diffusion, fluids.
- **Histogram accumulation.** True fractal flames become possible.

## Technical shape

- Each layer gets a `RGBA8` or `RGBA16F` framebuffer.
- The runtime maintains a small FBO pool.
- Mask functions are a tiny GLSL snippet pasted into a composition shader per
  layer.
- Audio uniforms propagate to every layer.

## Blockers / decisions to think about

- WebGL2 framebuffer-object ping-pong is well-trodden but adds complexity.
- The scaffolder (`bin/new-piece.mjs`) needs to understand multi-layer pieces.
- The publisher (`bin/publish.mjs`) already records the canvas, so if the
  runtime composites to the main canvas the publisher still works as-is.
- `render_scale` applies per-layer? Globally? Answer: globally, with per-layer
  override for very expensive layers.

## When

Not yet. Do `strata` single-pass first. If the thesis holds, promote to
multi-pass.

## References

- Ping-pong primer: <https://ostefani.dev/tech-notes/ping-pong-technique>
- three.js pattern: <https://discourse.threejs.org/t/recursive-trail-ping-pong-three-js-render-to-texture-feedback/89718>
