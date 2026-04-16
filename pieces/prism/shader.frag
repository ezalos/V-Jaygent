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

// ---------- palette ----------

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
// A more concentrated, higher-contrast source than the background `source()`.
// This is what gets folded inside each bouncing disk — "what's between the
// mirrors" needs to be busy for the kaleidoscope to show its work.
vec3 interior(vec2 q, float t, float mid, float high, float level) {
    // Warm fluid backbone.
    vec2 w = vec2(fbm(q * 2.2 + vec2(0.0, t * 0.28)),
                  fbm(q * 2.2 + vec2(4.1, 1.7) - t * 0.21));
    float fluid = fbm(q * 3.0 + 2.0 * w);
    vec3  col   = warmCycle(0.15 + 0.5 * fluid + t * 0.06)
                * (0.25 + 1.1 * fluid);

    // Bright beads on fast orbits — these give the interior crisp symmetric
    // highlights through the fold.
    for (int k = 0; k < 5; k++) {
        float kf    = float(k);
        float rate  = 2.0 + kf * 1.3;
        float phase = kf * 1.7;
        vec2  c     = 0.55 * vec2(cos(t * rate + phase),
                                  sin(t * rate * 0.77 + phase * 1.4));
        float d = length(q - c);
        float bright = exp(-120.0 * d * d) * 1.6
                     + exp(-22.0  * d * d) * 0.38;
        col += warmCycle(0.03 + kf * 0.22 + t * 0.05) * bright * (0.8 + 1.4 * mid);
    }

    // Continuous soft shimmer.
    float shimmer = smoothstep(0.55, 0.95, fbm(q * 9.0 + t * 0.6));
    col += warmCycle(0.02 + t * 0.04) * shimmer * (0.35 + 0.9 * high);

    // Boost the whole thing — interior should feel hot.
    return col * (1.15 + 0.5 * level);
}

// ---------- a small bouncing sub-kaleidoscope ----------
// Circular disk at `centre`, radius `r`. Inside: a NESTED dihedral fold of
// the interior source — fold, transform, fold again at a different n. High
// fold counts (primes 7/11/13/17) for alien density.
vec3 bouncingKaleido(vec2 p, vec2 centre, vec2 vel, vec2 phase,
                     float t, float nLocal, float bass, float mid,
                     float high, float level) {
    float r = 0.26;
    vec2 q = p - centre;
    float dq = length(q);
    if (dq > r * 1.15) return vec3(0.0);

    // Soft circular mask with a thin bright rim.
    float mask = smoothstep(r, r - 0.06, dq);
    float rim  = smoothstep(r - 0.01, r, dq) * (1.0 - smoothstep(r, r + 0.015, dq));

    // Two-stage kaleido fold: outer fold at nLocal, then a smaller inner fold
    // at ~nLocal/2 (rounded to integer) on the folded coordinates. Makes the
    // interior obviously-kaleidoscopic — you see symmetry inside symmetry.
    float axis1 = t * 0.55 + phase.x * 1.7 + bass * 0.40;   // faster inner spin
    float axis2 = -axis1 * 0.6 + phase.y * 2.3;
    float nInner = max(3.0, floor(nLocal * 0.5 + 0.5));

    vec2 src1 = kaleidoFold(q / r, nLocal, axis1);
    vec2 src2 = kaleidoFold(src1 * 1.35 - 0.1, nInner, axis2);

    vec3 inside = interior(src2 * 0.8, t, mid, high, level);

    // Extra symmetric bright core at the disk's centre, folded through the
    // same transform — punches through the pattern like a lens focus point.
    float coreD = length(src2);
    inside += warmCycle(0.06 + phase.x * 0.13) * exp(-pow(coreD * 6.0, 2.0)) * 0.8;

    // DVD "colour change on bounce": intensity + hue shift near wall hits.
    float wallE = wallBump(tri(t * vel.x + phase.x))
                + wallBump(tri(t * vel.y + phase.y));
    float nBounces = bounces(t, vel.x, phase.x) + bounces(t, vel.y, phase.y);
    float hueShift = 0.14 * nBounces + 0.06 * wallE;
    vec3  tint     = warmCycle(0.10 + hueShift + phase.x * 0.07);
    inside = mix(inside, inside * tint * 1.5, 0.55);
    inside *= 1.0 + 0.55 * wallE;

    // Rim in the tint colour so the disk edges clearly.
    vec3 rimCol = tint * (0.85 + 0.9 * wallE) * (0.6 + 0.7 * level);

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

    float cornerProximity = 0.0;
    for (int i = 0; i < N_TILES; i++) {
        // Very gentle bass nudge on speed so kicks don't turn them into racers.
        vec2 vel   = vec2(vels_x[i], vels_y[i]) * (1.0 + 0.08 * bass);
        vec2 phase = vec2(phas_x[i], phas_y[i]);
        vec2 bpx   = vec2(tri(t * vel.x + phase.x), tri(t * vel.y + phase.y));
        vec2 centre = bpx * (bounds - 0.26);
        col += bouncingKaleido(p, centre, vel, phase, t, folds[i],
                               bass, mid, high, level);

        // Track "close to corner" across all tiles — used for a rare global
        // flash when any tile is about to hit a corner.
        cornerProximity = max(cornerProximity,
                              min(wallBump(bpx.x), wallBump(bpx.y)));
    }

    // The iconic "is it going to hit?!" moment — subtle global tint when any
    // tile is near a corner. Soft so it's a feeling, not a strobe.
    col += warmCycle(0.02) * pow(cornerProximity, 3.0) * 0.22;

    // Vignette + gentle gamma.
    col *= 1.0 - 0.22 * dot(p, p);
    col  = pow(max(col, 0.0), vec3(0.88));

    fragColor = vec4(col, 1.0);
}
