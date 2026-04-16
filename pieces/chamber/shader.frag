// ABOUTME: Chamber — techno piece. Dark warm polar scene: kick drum radiates
// ABOUTME: from origin, mid drives haze, highs light up rim slashes, mouse pans.
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
const float DURATION = 375.0;

// ---------- palette: deep ember ramp, monotone warm ----------

vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.012, 0.005, 0.010);    // near-black warm
    vec3 c1 = vec3(0.120, 0.030, 0.030);    // deep burgundy
    vec3 c2 = vec3(0.420, 0.110, 0.045);    // rust
    vec3 c3 = vec3(0.880, 0.330, 0.110);    // ember orange
    vec3 c4 = vec3(1.000, 0.720, 0.320);    // warm amber, peaks only
    if (t < 0.25) return mix(c0, c1,  t          * 4.0);
    if (t < 0.55) return mix(c1, c2, (t - 0.25)  * 3.3333);
    if (t < 0.85) return mix(c2, c3, (t - 0.55)  * 3.3333);
    return                mix(c3, c4, (t - 0.85) * 6.6666);
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

float fbm2(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; p += 1.7; a *= 0.55; }
    return v;
}

// 1D noise on angle — used for rim relief.
float nangle(float a) {
    float i = floor(a), f = fract(a);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash1(i), hash1(i + 1.0), f);
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

    // Mouse yaw + slow idle drift so the room breathes when untouched.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    float mouseYaw = mouseIdle
        ? t * 0.020
        : ((u_mouse.x / u_resolution.x) - 0.5) * TAU * 1.2 + t * 0.006;

    float r  = length(p);
    float th = atan(p.y, p.x) + mouseYaw;

    // --- haze (fog) density driven by mid. Loud mids = thick smoke. ---
    float sigma    = 1.3 + 5.8 * mid;
    float transmit = exp(-sigma * r);     // how much emission makes it to this pixel

    // --- core emission: sustained core pulses with bass. ---
    float coreEnv  = 0.45 + 1.60 * bass;
    float coreGlow = exp(-r * (6.5 - 3.2 * bass))
                   + exp(-r * 2.6) * 0.35 * coreEnv;
    float emission = coreGlow * coreEnv;

    // --- outward rings: the visual impression of a beat pushing light outward.
    // Continuous rings moving outward at fixed speed; brightness gated by bass.
    // Evokes waves without needing actual beat-onset history.
    float ringPhase = fract(r * 1.6 - t * 0.45);
    float rings     = exp(-pow((ringPhase - 0.5) * 4.5, 2.0));
    emission       += rings * (0.08 + 1.25 * bass) * (1.0 - smoothstep(0.7, 1.05, r));

    // --- rim architecture: fbm-noise relief at the chamber boundary (r ~ 1.0).
    // Only visible where light from the core reaches it (transmit is high enough).
    float rimDepth  = nangle(th * 2.2) * 0.6 + nangle(th * 6.3) * 0.25
                    + nangle(th * 14.1) * 0.12;
    float rimInset  = 0.06 + 0.32 * rimDepth;         // depth of the relief
    float rimR      = 1.08 - rimInset;                 // actual wall radius at this angle
    float wall      = smoothstep(rimR - 0.03, rimR, r) * (1.0 - smoothstep(rimR, rimR + 0.05, r));

    // Wall luminance comes from the emission that reached it.
    float wallLight = wall * transmit * (0.55 + 1.1 * level);

    // --- rim slashes: percussive hits light up thin radial wedges. ---
    // 13 fixed angular slots, each with an independent stutter driven by highs.
    // Uses a hash tied to (slot, time-bucket) so the pattern is random but stable per frame.
    float bucket = floor(t * 14.0);
    float slashSum = 0.0;
    for (int k = 0; k < 13; k++) {
        float slotAngle = float(k) / 13.0 * TAU + 0.27;
        float dTh       = th - slotAngle;
        dTh             = dTh - TAU * floor((dTh + PI) / TAU);
        float wedge     = exp(-pow(dTh / 0.025, 2.0));
        float fire      = step(0.82 - 0.32 * high, hash1(float(k) * 17.3 + bucket));
        float rimMask   = smoothstep(0.55, 0.95, r) * (1.0 - smoothstep(0.98, 1.10, r));
        slashSum       += wedge * fire * rimMask * (0.30 + 1.8 * high);
    }

    // --- air grain: very faint fbm texture in the mid-air, visible in haze. ---
    float airGrain = fbm2(vec2(th * 1.2, r * 3.0) + t * 0.06);
    float airGlow  = (0.15 + 0.55 * mid) * airGrain * transmit * 0.35;

    // --- compose luminance ---
    float lum = emission * transmit       // volumetric haze falloff
              + wallLight * (0.30 + 0.85 * rimDepth)
              + slashSum
              + airGlow;

    // Small ambient term so silence isn't pure black (unless we're ending).
    lum += 0.015 * exp(-r * 1.5) * (1.0 - step(DURATION - 1.5, t));

    // --- palette lookup. Higher luminance = pushed further up the ember ramp. ---
    // Audio level compresses the curve so peaks are hot-amber and quiet is deep black.
    float expose = 0.85 + 0.55 * level;
    vec3  col    = ember(clamp(lum * expose, 0.0, 1.0));

    // --- final flash + crush at the end ---
    float endFade = 1.0 - smoothstep(DURATION - 1.2, DURATION, t);
    col *= endFade;
    float endFlash = smoothstep(DURATION - 1.5, DURATION - 1.2, t)
                   * (1.0 - smoothstep(DURATION - 1.2, DURATION - 0.8, t));
    col += vec3(1.0, 0.72, 0.38) * endFlash * 1.4;

    // Subtle vignette to deepen the chamber feel.
    col *= 1.0 - 0.28 * dot(p, p);

    // Gentle gamma, tuned a touch brighter than in-seven because the piece
    // lives at low luminance already.
    fragColor = vec4(pow(max(col, 0.0), vec3(0.85)), 1.0);
}
