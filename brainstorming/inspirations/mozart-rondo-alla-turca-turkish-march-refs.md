# Mozart Rondo Alla Turca (K. 331/3) — Shader Research References

**Track**: Mozart Piano Sonata No. 11, K. 331, 3rd movement. Rondo Alla Turca. ~3:30.  
**Thesis**: Gilded illuminated-manuscript rosette with 8-fold Ottoman star core + coprime tooth wheels (5/7/11/13) drifting through rondo episodes, snapping into alignment on the refrain. Warm palette (ember/amber/wine/cream). Audio-driven rotation, scale, tooth advance. Cursor warps locally.

---

## Concrete Steals

### 1. **Shadertoy: Polyrhythm Visualizer Fork**
- **Creator**: Community (Shadertoy collection)
- **URL**: https://www.shadertoy.com/view/Mfcyz4
- **Steal**: Real-time polyrhythm state visualization—pattern alignment/drift cycles. Use as blueprint for coprime wheel phase-locking logic (when 5/7/11/13 teeth sync). Can adapt timing curves to rondo section markers.

### 2. **Inigo Quilez: Kaleidoscope & Procedural Patterns Library**
- **Creator**: Inigo Quilez
- **URL**: https://iquilezles.org/ (articles on filterables, fractals, ray marching)
- **Shadertoy Profile**: https://www.shadertoy.com/user/iq
- **Steal**: Kaleidoscopic symmetry folding techniques (n-fold mirrors), noise-driven shape warping, and distance-field-based tile generation. Quilez's "painting with math" approach to rotating/scaling procedural geometry is directly applicable to the 8-fold star + rings problem.

### 3. **Zellige/Girih Geometry Foundation**
- **Mathematical Construction**: Wikipedia articles on [Girih tiles](https://en.wikipedia.org/wiki/Girih_tile) and [Islamic geometric patterns](https://en.wikipedia.org/wiki/Islamic_geometric_patterns)
- **Steal**: The 8-pointed star = two overlapping squares rotated 45°, all angles 45°, perfect 4-fold rotational harmony. Ottoman seals use this for symbolic balance. The compass-and-straightedge construction rules (no curves) are trivial to implement in shaders via algebraic SDF. The Topkapi Scroll pattern logic (15th-century Ottoman geometric sequences) provides historical validation.

### 4. **Procedural Fire/Candle/Gilding**
- **Creator**: Godot Shaders & Shadertoy community
- **URL**: https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/
- **Shadertoy reference**: Fires shader (https://www.shadertoy.com/view/Xd2BRc)
- **Steal**: Procedural flame perturbation + glow bloom for "candlelit" warmth. Layer warm color gradients (amber → wine) over metallic highlights to simulate gilded-metal facing in near-darkness. Use noise for organic flicker/alive quality.

### 5. **Audio-Reactive Shaders (FFT + Beat Tracking)**
- **References**: 
  - WebGL Fundamentals: [How to get audio data into a shader](https://webgl2fundamentals.org/webgl/lessons/webgl-qna-how-to-get-audio-data-into-a-shader/)
  - Shadertoy audio architecture: [Shadertoy: Visualizing Music in Real Time](https://www.productlondon.com/shadertoy/)
- **Steal**: Shadertoy uses FFT texture input (not raw floats) for frequency bands. Route low frequencies → 8-fold star rotation speed. Mid frequencies → tooth wheel advance. High frequencies → local cursor warp amplitude. This gives direct, tactile audio coupling without complex beat detection.

### 6. **Ottoman Culture & 8-Fold Symbolism**
- **Sources**:
  - [The Islamic 8-Pointed Star: Geometry, Meaning, and Modern Muslim Life](https://blog.alhannah.com/the-islamic-8-pointed-star-geometry-meaning-and-modern-muslim-life/)
  - Alâeddin Mosque (Konya, Turkey, 1220), girih 10/8/12-point stars
  - Topkapi Palace scroll collection (15th-century Ottoman geometric pattern sequences)
- **Steal**: The 8-fold star carries centuries of Ottoman imperial seals, janissary insignia, and mosque geometry. Using it as your visual center anchors the piece in historically resonant aesthetics. The "balanced intersecting forces" symbolism maps cleanly onto the rondo structure: A (stability, perfect alignment) vs. B/C episodes (drift, asymmetry, then snap back).

---

## Rondo Form Structure (Section State Machine)

**Mozart's Rondo Alla Turca Form**: A–B–C–D–E–C–A–B–C (+ coda)  
**Simplified**: Refrain (A, "Turkish march" staccato octaves in A major) alternates with contrasting episodes (B/C/D/E in varied keys, more legato and expressive).

**Visual Translation**:
- **A refrain** = 8-fold star locked in perfect alignment; tooth wheels synchronize; palette stable (amber/wine dominant)
- **B/C/D/E episodes** = Star rotates freely, tooth wheels drift out of phase; palette shifts (cream accents bloom, shadows deepen); local cursor warping active
- **Return to A** = Wheels snap back into coprime lock; alignment restores with a "tick" or glow pulse

This maps the rondo's recurring anchor onto visual coherence and the episodes onto visual entropy—a clean metaphor for the form's structure.

---

## Further Reading

- **Quasicrystalline Girih** (Lu & Steinhardt, 2007): [Islamic tiles reveal sophisticated maths](https://www.nature.com/news/2007/070219/full/news070219-9.html) — girih tilings predate Penrose tilings by 500 years; self-similar fractal properties unlock procedural animation.
- **Audio in Shaders**: [Codrops: Audio Reactive Shaders with Three.js](https://tympanus.net/codrops/2023/02/07/audio-reactive-shaders-with-three-js-and-shader-park/) — practical patterns for FFT binding.
- **Cyril Diagne**: [Personal website](https://cyrildiagne.com/) — procedural generative geometry reference; while not Islamic-specific, his AI-assisted pattern synthesis tooling is worth exploring for rapid girih variant generation.

---

## Implementation Priorities

1. **SDF for 8-fold star** (2–3 SDF calls: rotating square intersection, subtract pen strokes) → kaleidoscopic fold
2. **Coprime gear teeth** (parametric modular counts 5/7/11/13, polar wrap, phase offset per wheel) → audio-driven phase delta
3. **Warm palette mapping** (amber/wine/cream gradients tied to radius and angle) + candlelit glow bloom
4. **Section detection** (rondo A/B/C markers from iTime or explicit beat input) → snap/drift behavior switch
5. **Cursor warp** (local radial distortion via mouse.xy, amplitude modulated by audio high-freq band)

