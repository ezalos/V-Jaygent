// ABOUTME: Plume — curl-noise smoke rendered via backward pathline integration.
// ABOUTME: Bass injects density at heptagonal sources, mids modulate turbulence,
// ABOUTME: highs glint on vortex cores, cursor is a buoyant heat source.
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

const float PI       = 3.14159265359;
const float TAU      = 6.28318530718;
const float DURATION = 500.0;

// ---------- dark-warm palette ----------

vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.010, 0.004, 0.010);
    vec3 c1 = vec3(0.120, 0.040, 0.030);
    vec3 c2 = vec3(0.430, 0.140, 0.060);
    vec3 c3 = vec3(0.880, 0.360, 0.120);
    vec3 c4 = vec3(1.000, 0.760, 0.380);
    if (t < 0.22) return mix(c0, c1,  t          / 0.22);
    if (t < 0.55) return mix(c1, c2, (t - 0.22)  / 0.33);
    if (t < 0.85) return mix(c2, c3, (t - 0.55)  / 0.30);
    return                mix(c3, c4, (t - 0.85) / 0.15);
}

// ---------- noise ----------

float hash(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float n){ return fract(sin(n * 91.345) * 47453.731); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
               u.y);
}

// 3-octave fbm, tuned light so the pathline loop stays cheap.
float fbm3(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.07; p += 1.7; a *= 0.55; }
    return v;
}

// ---------- curl-noise velocity ----------

// Scalar potential that evolves through time. The whole fog curls around
// this latent topography. Two moves for chaotic flux:
//   1. the lookup itself is domain-warped by another fbm so the potential
//      is a warped surface, not a stationary one;
//   2. a finer-scale potential is added on top so eddies live at two
//      distinct scales — big slow whorls with small fast ones inside.
float phi(vec2 p, float t, float turbScale) {
    // Calm coarse base — a single warped fbm carrying the big-shape flow.
    // This is close to what the background was before the fractal cascade,
    // but with faster time so the base keeps moving.
    vec2 w = vec2(fbm3(p * 0.60 + vec2(0.0, t * 0.22)),
                  fbm3(p * 0.60 + vec2(5.2, 1.3) - t * 0.17));
    float coarse = fbm3(p * turbScale + 1.30 * w + vec2(0.0, t * 0.38));

    // Fine-scale kaleidoscope — two fast small-scale layers. Self-similar
    // eddies live inside the calm base. Fast time coefficients so these
    // are always churning visibly.
    float fine  = fbm3(p * turbScale * 3.60 + 0.70 * w + t * 0.55) * 0.45;
          fine += fbm3(p * turbScale * 7.80 - 0.40 * w - t * 0.80) * 0.22;
    return coarse + fine;
}

vec2 curlVel(vec2 p, float t, float turbScale) {
    const float e = 0.018;
    float a = phi(p + vec2(e, 0.0), t, turbScale);
    float b = phi(p - vec2(e, 0.0), t, turbScale);
    float c = phi(p + vec2(0.0, e), t, turbScale);
    float d = phi(p - vec2(0.0, e), t, turbScale);
    // 2D curl of (0, 0, phi): (-dphi/dy, dphi/dx).
    return vec2(-(c - d), (a - b)) * (0.5 / e);
}

// ---------- density sources ----------

// Seven heptagonal sources the bass kicks. Tighter Gaussians and further
// out so they read as seven distinct points rather than one blob. Baseline
// amplitude pulled way down so silence = sparse; kicks = bright.
float sourceDensity(vec2 q, float t, float bass) {
    float s = 0.0;
    for (int k = 0; k < 7; k++) {
        float ang = float(k) * (TAU / 7.0) + 0.4 + 0.08 * sin(t * 0.17 + float(k));
        float rad = 0.78 + 0.08 * sin(t * 0.13 + float(k) * 1.6);
        vec2  pt  = rad * vec2(cos(ang), sin(ang));
        float d2  = dot(q - pt, q - pt);
        s += 0.70 * exp(-52.0 * d2) * (0.08 + 1.9 * bass);
    }
    return s;
}

// Slow macro drift — wanders the composition across the frame so the
// "interesting part" isn't pinned to the centre. Two coprime-period
// cosines so the path doesn't return to itself.
vec2 macroDrift(float t) {
    return 0.25 * vec2(sin(t * 0.038) + 0.55 * sin(t * 0.083 + 1.3),
                       cos(t * 0.031) + 0.55 * cos(t * 0.071 + 2.7));
}

// ---------- main ----------

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;
    float audio = max(u_audio_playing, 0.0);
    float bass  = u_audio_bass  * audio;
    float mid   = u_audio_mid   * audio;
    float high  = u_audio_high  * audio;
    float level = u_audio_level * audio;

    // Mouse in world coords.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mWorld = (u_mouse - 0.5 * u_resolution.xy)
                / min(u_resolution.x, u_resolution.y) * 2.0;
    if (mouseIdle) mWorld = vec2(1e4);   // push off-screen so the heat term is zero

    // Turbulence scale — mids tighten the eddies. Loud mids = fine turbulence.
    float turbScale = 1.1 + 1.6 * mid;

    // Backward pathline accumulation. Six steps keeps us within budget; the
    // exponential fade weights the head of the trail heavily.
    vec3  col      = vec3(0.0);
    vec2  drift    = macroDrift(t);
    vec2  q        = p - drift;              // whole composition wanders
    float fade     = 1.0;
    float stepSize = 0.028 + 0.020 * bass;   // stronger kick = longer trails

    float vortexGlint = 0.0;

    for (int i = 0; i < 6; i++) {
        float tp = t - float(i) * 0.06;
        vec2  v  = curlVel(q, tp, turbScale);

        // Global upward buoyancy — smoke rises. Always-on baseline plus
        // a little extra when the track is loud. Gives felt direction.
        v.y += 0.08 + 0.22 * level;

        // Cursor heat: upward buoyancy + mild radial push. Makes the cursor
        // feel like a flame whose plume rises above it.
        vec2 rm = q - (mWorld - drift);
        float d2 = dot(rm, rm);
        vec2 heatV = vec2(0.0, 1.1) * exp(-5.0 * d2)
                   + normalize(rm + 1e-4) * 0.35 * exp(-8.0 * d2);
        v += heatV;

        // Advect backward.
        q -= v * stepSize;

        // Density here.
        float dens = fbm3(q * 1.4 + vec2(0.0, t * 0.02));
        dens = smoothstep(0.25, 0.90, dens);
        dens += sourceDensity(q, tp, bass);

        // Hue shifts with density; brighter parcels read warmer.
        float hue = clamp(0.12 + 0.75 * dens, 0.0, 1.0);
        col += ember(hue) * dens * fade;

        // Track curl magnitude for vortex glints.
        vortexGlint += length(v) * fade;

        fade *= 0.72;
    }

    // Vortex glints: slow-bucketed and soft-enveloped so they fade in/out
    // instead of blinking on and off frame by frame. Bucket = 180 ms.
    float gbucket = floor(t * 5.5);
    float gfrac   = fract(t * 5.5);
    float genv    = 4.0 * gfrac * (1.0 - gfrac);              // smooth bump
    float glintGate = smoothstep(1.6, 2.3, vortexGlint)
                    * smoothstep(0.55, 0.85, high)
                    * step(0.90, hash(floor(p * 40.0) + vec2(gbucket)));
    col += vec3(0.95, 0.80, 0.52) * glintGate * genv * 0.55;

    // Global exposure — keep peaks in range. Less boost on bass so kicks
    // add motion rather than brightness.
    float exposure = 0.55 + 0.65 * level + 0.25 * bass;
    col *= exposure;

    // Very subtle warm-channel nudge on kicks. Earlier version was heavy
    // enough to read as chromatic oversaturation; 0.04 is almost invisible
    // but still ties colour to pulse.
    col.r *= 1.0 + 0.04 * bass;

    // Gentle radial tint. The previous hard vignette was doing the work
    // the fluid should do; edge-dark now has to come from actual density
    // falloff, not a mask.
    col *= 1.0 - 0.08 * dot(p, p);

    // Reinhard tone-map so peaks compress instead of clipping. Kills the
    // "everything is white on the kick" failure mode.
    col = col / (1.0 + col);

    // Final-second fade + warm flash.
    float endFade  = 1.0 - smoothstep(DURATION - 1.2, DURATION, t);
    col *= endFade;
    float endFlash = smoothstep(DURATION - 1.4, DURATION - 1.1, t)
                   * (1.0 - smoothstep(DURATION - 1.1, DURATION - 0.7, t));
    col += vec3(1.0, 0.72, 0.38) * endFlash * 0.8;

    fragColor = vec4(pow(max(col, 0.0), vec3(0.95)), 1.0);
}
