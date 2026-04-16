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

// Scalar potential that evolves slowly through time. The whole fog curls
// around this latent topography.
float phi(vec2 p, float t, float turbScale) {
    return fbm3(p * turbScale + vec2(0.0, t * 0.11));
}

vec2 curlVel(vec2 p, float t, float turbScale) {
    const float e = 0.020;
    float a = phi(p + vec2(e, 0.0), t, turbScale);
    float b = phi(p - vec2(e, 0.0), t, turbScale);
    float c = phi(p + vec2(0.0, e), t, turbScale);
    float d = phi(p - vec2(0.0, e), t, turbScale);
    // 2D curl of (0, 0, phi): (-dphi/dy, dphi/dx).
    return vec2(-(c - d), (a - b)) * (0.5 / e);
}

// ---------- density sources ----------

// Seven softly-pulsing heptagonal sources that the bass kicks. Position
// drifts slowly so the plume composition isn't static.
float sourceDensity(vec2 q, float t, float bass) {
    float s = 0.0;
    for (int k = 0; k < 7; k++) {
        float ang = float(k) * (TAU / 7.0) + 0.4 + 0.08 * sin(t * 0.17 + float(k));
        float rad = 0.55 + 0.08 * sin(t * 0.13 + float(k) * 1.6);
        vec2  pt  = rad * vec2(cos(ang), sin(ang));
        float d2  = dot(q - pt, q - pt);
        // Narrow bright core + wider halo, amplified by bass.
        s += 0.70 * exp(-28.0 * d2) * (0.35 + 1.9 * bass);
        s += 0.30 * exp(-6.0  * d2) * (0.20 + 1.0 * bass);
    }
    return s;
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
    vec2  q        = p;
    float fade     = 1.0;
    float stepSize = 0.028 + 0.020 * bass;   // stronger kick = longer trails

    float vortexGlint = 0.0;

    for (int i = 0; i < 6; i++) {
        float tp = t - float(i) * 0.06;
        vec2  v  = curlVel(q, tp, turbScale);

        // Cursor heat: upward buoyancy + mild radial push. Makes the cursor
        // feel like a flame whose plume rises above it.
        vec2 rm = q - mWorld;
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

    // Vortex glints: where the curl is intensely rotational, let highs
    // paint tiny bright specks. Hash-gated so it's sparse, not soupy.
    float glintGate = step(1.8, vortexGlint)
                    * step(0.55, high)
                    * step(0.90, hash(floor(p * 80.0) + floor(t * 5.0)));
    col += vec3(1.00, 0.85, 0.55) * glintGate * (0.6 + 1.4 * high);

    // Global exposure — silence reads as deep smoke, peaks as warm plume.
    float exposure = 0.75 + 0.95 * level + 0.55 * bass;
    col *= exposure;

    // Slight chromatic warm-shift on kicks (not full CA; cheaper and less
    // glitchy than channel offset).
    col.r *= 1.0 + 0.12 * bass;
    col.b *= 1.0 - 0.05 * bass;

    // Dark vignette — the plume lives inside a smoky room, not open sky.
    float r = length(p);
    col *= 1.0 - 0.45 * smoothstep(0.85, 1.35, r);
    col *= 1.0 - 0.10 * dot(p, p);

    // Final-second fade + warm flash.
    float endFade  = 1.0 - smoothstep(DURATION - 1.2, DURATION, t);
    col *= endFade;
    float endFlash = smoothstep(DURATION - 1.4, DURATION - 1.1, t)
                   * (1.0 - smoothstep(DURATION - 1.1, DURATION - 0.7, t));
    col += vec3(1.0, 0.72, 0.38) * endFlash * 1.2;

    fragColor = vec4(pow(max(col, 0.0), vec3(0.92)), 1.0);
}
