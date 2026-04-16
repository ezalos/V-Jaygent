// ABOUTME: Prism — a dihedral kaleidoscope folding a living warm source,
// ABOUTME: with small bouncing sub-kaleidos (DVD-logo style) riding on top.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_audio_time;

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// ---------- palettes ----------

// Warm-family cyclic palette — anchors the background.
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);
    vec3 c1 = vec3(1.00, 0.55, 0.30);
    vec3 c2 = vec3(0.85, 0.25, 0.25);
    vec3 c3 = vec3(0.55, 0.18, 0.40);
    vec3 c4 = vec3(0.42, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

// Iñigo Quílez cosine palette — full spectrum, saturation pulled back so
// nothing clips to cyan/lime. Used inside the bouncing disks so each
// kaleidoscope can own its own hue while the background stays warm.
vec3 spectrum(float t) {
    vec3 a = vec3(0.52, 0.46, 0.50);
    vec3 b = vec3(0.45, 0.45, 0.45);
    vec3 c = vec3(1.00, 1.00, 1.00);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

// Reinhard tonemap — rolls peaks off instead of clipping to pure white.
vec3 tonemap(vec3 c) { return c / (1.0 + c); }

// ---------- noise ----------

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
               u.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; p += 1.7; a *= 0.55; }
    return v;
}

// ---------- helpers ----------

vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c) * p; }

// Triangle wave in [-1,1], period 2. The DVD bounce primitive.
float tri(float t) { return abs(fract(t * 0.5) * 2.0 - 1.0) * 2.0 - 1.0; }

// Smooth envelope peaking when a bounce axis is at the wall.
float wallBump(float x) { return smoothstep(0.88, 1.00, abs(x)); }

// Integer bounce count — increments on each wall hit.
float bounces(float t, float v, float phase) {
    return floor((t * v + phase) * 0.5);
}

// ---------- the kaleidoscope fold (dihedral D_n) ----------
vec2 kaleidoFold(vec2 p, float n, float axisAngle) {
    p = rot(p, -axisAngle);
    float r  = length(p);
    float a  = atan(p.y, p.x);
    float sector = TAU / n;
    a = mod(a, sector);
    a = abs(a - sector * 0.5);
    return vec2(cos(a), sin(a)) * r;
}

// ---------- the SOURCE material (what's between the mirrors) ----------
vec3 source(vec2 q, float t, float bass, float mid, float high, float level) {
    // Slow warm fbm "fluid" — domain-warped so it folds on itself organically.
    vec2 w1 = vec2(fbm(q * 1.2 + vec2(0.0, t * 0.09)),
                   fbm(q * 1.2 + vec2(5.2, 1.3) - t * 0.07));
    vec2 w2 = vec2(fbm(q * 1.5 + 2.8 * w1 + vec2(1.7, 9.2)),
                   fbm(q * 1.5 + 2.8 * w1 + vec2(8.3, 2.8) - t * 0.06));
    float fluid = fbm(q * 1.7 + 2.4 * w2 + 0.6 * bass);

    float hue = 0.20 + 0.25 * fluid + t * 0.018 + 0.14 * mid;
    vec3  col = warmCycle(hue) * (0.18 + 0.8 * fluid);
    col      *= 0.55 + 0.9 * level;

    // Three bright "beads" on coprime Lissajous rates.
    for (int k = 0; k < 3; k++) {
        float kf    = float(k);
        float rate  = (3.0 + 2.0 * kf);
        float phase = kf * 2.1;
        vec2  beadC = 0.55 * vec2(cos(t * 0.12 * rate + phase),
                                  sin(t * 0.09 * rate * 0.83 + phase * 1.3));
        float d = length(q - beadC);
        float bright = exp(-90.0 * d * d) * 1.2
                     + exp(-18.0 * d * d) * 0.28;
        col += warmCycle(0.05 + kf * 0.18 + t * 0.03) * bright * (0.6 + 1.3 * mid);
    }

    // Continuous soft shimmer (replaces the old hard step() sparkle) — reads
    // as breathing grain rather than blinking noise.
    float shimmer = 0.5 + 0.5 * fbm(q * 7.5 + t * 0.3);
    shimmer       = smoothstep(0.55, 0.95, shimmer) * (0.25 + 0.5 * high);
    col += warmCycle(0.02 + t * 0.02) * shimmer * 0.30;

    return col;
}

// ---------- interior content for a sub-kaleidoscope ----------
// Busy but never peaking to white. `hueBase` shifts the whole disk's colour
// signature — each bouncing disk gets its own, so the four of them can span
// the full spectrum without any single disk being rainbow-confetti.
vec3 interior(vec2 q, float t, float hueBase, float mid, float high, float level) {
    // Warm fluid backbone — palette shifted by the disk's hue.
    vec2 w = vec2(fbm(q * 2.2 + vec2(0.0, t * 0.20)),
                  fbm(q * 2.2 + vec2(4.1, 1.7) - t * 0.15));
    float fluid = fbm(q * 3.0 + 2.0 * w);
    vec3  col   = spectrum(hueBase + 0.18 * fluid + t * 0.04)
                * (0.25 + 0.95 * fluid);

    // Beads on two-frequency motion (irrational-feeling ratio) so orbits
    // never close — intricate, always evolving.
    for (int k = 0; k < 5; k++) {
        float kf     = float(k);
        float rate_a = 0.9 + kf * 0.41;
        float rate_b = 1.37 + kf * 0.29;
        float phase  = kf * 1.7;
        vec2  c = 0.48 * vec2(cos(t * rate_a + phase)       + 0.35 * cos(t * rate_b - phase),
                              sin(t * rate_a * 0.88 + phase) + 0.35 * sin(t * rate_b * 1.23));
        float d2 = dot(q - c, q - c);
        // Softer, wider beads — no exp(-120) spike that blows out to white.
        float bright = exp(-35.0 * d2) * 0.70
                     + exp(-9.0  * d2) * 0.22;
        col = max(col, spectrum(hueBase + 0.08 + kf * 0.06 + t * 0.03)
                       * bright * (0.8 + 1.0 * mid));
    }

    // Continuous soft shimmer — upper bound pulled down so highs don't slam
    // pure white into the output.
    float shimmer = smoothstep(0.58, 0.82, fbm(q * 9.0 + t * 0.45));
    col += spectrum(hueBase + 0.22 + t * 0.03) * shimmer * (0.22 + 0.55 * high);

    // Interior boost, but bounded.
    return col * (1.05 + 0.30 * level);
}

// ---------- a small bouncing sub-kaleidoscope ----------
// Nested dihedral fold with fold counts that drift slowly so each disk
// evolves over time — 7 → 11 → 13 → 17 and back, but smoothly. Each disk
// carries its own hue signature that cycles around the spectrum.
vec3 bouncingKaleido(vec2 p, vec2 centre, vec2 vel, vec2 phase,
                     float t, float nHome, float hueSeed, float bass,
                     float mid, float high, float level) {
    float r = 0.26 + 0.012 * sin(t * 0.19 + phase.x);   // breathing radius
    vec2 q = p - centre;
    float dq = length(q);
    if (dq > r * 1.15) return vec3(0.0);

    // Soft circular mask with a thin bright rim.
    float mask = smoothstep(r, r - 0.06, dq);
    float rim  = smoothstep(r - 0.01, r, dq) * (1.0 - smoothstep(r, r + 0.015, dq));

    // Fold count drifts within a small window around nHome. The fold lives
    // in floating-point — a slight "seam" appears one way across the disk,
    // reads as an organic crack rather than a bug, adds visible evolution.
    float nOuter = nHome + 3.0 * sin(t * 0.053 + phase.y * 1.3);
    float nInner = max(3.0, nHome * 0.5 + 2.0 * sin(t * 0.031 + phase.x * 2.1));

    // Outer axis rotates, inner axis counter-rotates at a different rate —
    // three temporal scales interacting, never closes.
    float axis1 = t * 0.38 + phase.x * 1.7 + bass * 0.25
                + 0.15 * sin(t * 0.07);
    float axis2 = -axis1 * 0.61 + phase.y * 2.3
                + 0.35 * sin(t * 0.11 + 1.3);

    // Slow interior zoom so the pattern "breathes".
    float innerZoom = 1.15 + 0.25 * sin(t * 0.047 + phase.x);

    vec2 src1 = kaleidoFold(q / r, nOuter, axis1);
    vec2 src2 = kaleidoFold(src1 * innerZoom - 0.08, nInner, axis2);

    // Hue signature cycles slowly — each disk owns its current colour.
    float hueBase = hueSeed + t * 0.018 + 0.08 * bass;

    vec3 inside = interior(src2 * 0.8, t, hueBase, mid, high, level);

    // Symmetric soft core — warm glow at the disk's folded centre, scaled
    // way back from the previous "punch through" version.
    float coreD = length(src2);
    inside += spectrum(hueBase + 0.04) * exp(-pow(coreD * 5.0, 2.0)) * 0.35;

    // DVD "colour change on bounce": hue shift near wall hits.
    float wallE = wallBump(tri(t * vel.x + phase.x))
                + wallBump(tri(t * vel.y + phase.y));
    float nBounces = bounces(t, vel.x, phase.x) + bounces(t, vel.y, phase.y);
    float hueShift = 0.10 * nBounces + 0.05 * wallE;
    vec3  tint     = spectrum(hueBase + hueShift);
    inside = mix(inside, inside * tint * 1.35, 0.55);
    inside *= 1.0 + 0.45 * wallE;

    vec3 rimCol = tint * (0.70 + 0.65 * wallE) * (0.5 + 0.55 * level);
    return inside * mask + rimCol * rim;
}

// ---------- main ----------

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;
    float audio = max(u_audio_playing, 0.0);
    float bass  = mix(0.28 + 0.18 * sin(t * 0.61),     u_audio_bass,  audio);
    float mid   = mix(0.25 + 0.14 * sin(t * 0.47+1.1), u_audio_mid,   audio);
    float high  = mix(0.22 + 0.11 * sin(t * 1.23+2.7), u_audio_high,  audio);
    float level = mix(0.33, u_audio_level, audio);

    // --- background kaleidoscope (no mouse — fully autonomous) ---
    // Fold count drifts slowly: 5 → 7 → 9 → 7 → 5 → ... on a very slow cycle.
    float nPhase = sin(t * 0.018) * 0.5 + 0.5;                 // [0, 1]
    float n      = floor(5.0 + nPhase * 4.999);                 // 5..9 integer
    float axisAngle = t * 0.08 + bass * 0.30;

    // Gentle zoom breathing with bass.
    float zoom = 1.05 + 0.08 * sin(t * 0.15) + 0.15 * bass;
    vec2  pZ   = p / zoom;

    vec2 src = kaleidoFold(pZ, n, axisAngle);
    vec3 col = source(src, t, bass, mid, high, level);

    // Second background kaleido at different n for depth.
    float n2 = floor(3.0 + (1.0 - nPhase) * 3.999);             // 3..6 integer
    vec2  src2 = kaleidoFold(pZ * 1.4, n2, -axisAngle * 0.7);
    vec3  col2 = source(src2, t * 0.85, bass * 0.7, mid, high * 0.6, level);
    col = max(col, col2 * 0.55);

    // Per-wedge gentle glow on kicks (softer than before).
    float wedgeFlash = exp(-pow(length(pZ) - 0.7, 2.0) * 16.0)
                    * (0.12 + 0.6 * bass);
    col += warmCycle(0.08 + t * 0.04) * wedgeFlash * 0.18;

    // --- bouncing sub-kaleidoscopes (DVD-logo style) ---
    // Four disks, coprime velocities so they never realign. Slow, drifting —
    // the kaleidoscopes themselves do the moving; the disks only creep.
    // Fold counts are primes (7, 11, 13, 17) for alien density.
    const int N_TILES = 4;
    float vels_x[N_TILES];  vels_x[0]=0.043; vels_x[1]=0.061; vels_x[2]=0.031; vels_x[3]=0.079;
    float vels_y[N_TILES];  vels_y[0]=0.029; vels_y[1]=0.053; vels_y[2]=0.083; vels_y[3]=0.019;
    float phas_x[N_TILES];  phas_x[0]=0.00;  phas_x[1]=0.73;  phas_x[2]=1.41;  phas_x[3]=2.07;
    float phas_y[N_TILES];  phas_y[0]=0.40;  phas_y[1]=1.11;  phas_y[2]=0.28;  phas_y[3]=1.89;
    float folds [N_TILES];  folds [0]=7.0;   folds [1]=11.0;  folds [2]=13.0;  folds [3]=17.0;

    // Bounds so the disk (radius 0.26 in world space) never clips the frame.
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2  bounds = vec2(aspect, 1.0) * 0.92;

    // Hue seeds — each disk sits in a different quadrant of the spectrum.
    // Slow global drift so a disk that was amber will be teal later, then
    // magenta, then amber again. Always evolving.
    float hueSeeds[N_TILES];
    hueSeeds[0] = 0.02;   // warm amber start
    hueSeeds[1] = 0.28;   // shifts through green over time
    hueSeeds[2] = 0.55;   // cool-teal/blue territory
    hueSeeds[3] = 0.78;   // magenta/violet

    float cornerProximity = 0.0;
    for (int i = 0; i < N_TILES; i++) {
        vec2 vel   = vec2(vels_x[i], vels_y[i]) * (1.0 + 0.06 * bass);
        vec2 phase = vec2(phas_x[i], phas_y[i]);
        vec2 bpx   = vec2(tri(t * vel.x + phase.x), tri(t * vel.y + phase.y));
        vec2 centre = bpx * (bounds - 0.26);
        col += bouncingKaleido(p, centre, vel, phase, t, folds[i], hueSeeds[i],
                               bass, mid, high, level);

        cornerProximity = max(cornerProximity,
                              min(wallBump(bpx.x), wallBump(bpx.y)));
    }

    // The iconic "is it going to hit?!" moment — subtle warm tint.
    col += warmCycle(0.02) * pow(cornerProximity, 3.0) * 0.18;

    // Vignette + Reinhard tonemap so peaks roll off instead of clipping
    // to pure white, then gentle gamma.
    col *= 1.0 - 0.22 * dot(p, p);
    col  = tonemap(col * 1.25);
    col  = pow(max(col, 0.0), vec3(0.88));

    fragColor = vec4(col, 1.0);
}
