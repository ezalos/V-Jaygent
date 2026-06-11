#version 300 es
// ABOUTME: Sun-bloom layer for le-mystere-abyssal — the "soleil sous l'eau".
// ABOUTME: The only warmth in the piece; it never passes through extinction.
// ABOUTME: A faint promise at chorus 1, nearer at chorus 2, an ember through
// ABOUTME: the abyss, and a full golden bloom with upward rays at chorus 3.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_keys[15];
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_playing;
out vec4 fragColor;

// ======================= NARRATIVE (keep in sync across layers) ========
// Source of truth: brainstorming/pieces/le-mystere-abyssal.md
// Stage ids: 0 A1 surface · 1 A2 legend · 2 A3 expedition · 3 B1 tip-under
// 4 B2 descent · 5 B3 twilight · 6 B4 abyss · 7 C1 reversal
// 8 C2 remembrance · 9 C3 sun-bloom · 10 D outro
void narrative(float t, out int stage, out float sp, out float dep) {
    float T[12] = float[12](0.0, 23.1, 43.2, 64.0, 83.6, 124.7,
                            142.9, 154.6, 174.5, 195.2, 215.0, 229.0);
    float D[12] = float[12](0.0, 0.0, 0.0, 0.0, 0.15, 0.55,
                            0.78, 1.0, 0.25, 0.15, 0.18, 0.02);
    int s = 0;
    for (int i = 0; i < 11; i++) if (t >= T[i]) s = i;
    float p = clamp((t - T[s]) / max(T[s + 1] - T[s], 1e-3), 0.0, 1.0);
    stage = s;
    sp = p;
    float e = p * p * (3.0 - 2.0 * p);
    dep = mix(D[s], D[s + 1], e);
}
// ==================================================== end NARRATIVE ====

const vec3 SUN_CORE = vec3(1.00, 0.92, 0.72);
const vec3 SUN_GOLD = vec3(1.00, 0.72, 0.30);
const vec3 SUN_AMBR = vec3(0.85, 0.45, 0.12);

// Where the myth lives at each stage: position y, radius, gain.
void sunParams(int stage, float sp, float t, out vec2 c, out float r, out float g) {
    // frame bottom is p.y = -0.5: "below" means just under that edge,
    // close enough that the halo seeps into view
    float swayX = 0.06 * sin(t * 0.10);
    c = vec2(swayX, -0.58);
    r = 0.10;
    g = 0.0;
    if (stage == 3) {                       // first sighting: a tiny
        g = 0.30 * smoothstep(67.0, 71.0, t); // impossible star, far below
        c.y = -0.30;
        r = 0.025;
    } else if (stage == 4) {                // she descends toward it
        g = 0.18;
        c.y = -0.34;
        r = 0.022;
    } else if (stage == 5) {                // chorus 2: nearer, warmer
        g = 0.35;
        c.y = -0.40;
        r = 0.17;
    } else if (stage == 6) {                // an ember under the black
        g = 0.10;
        c.y = -0.32;
        r = 0.018;
    } else if (stage == 7) {
        g = 0.07;
    } else if (stage == 8) {
        g = 0.05;
    } else if (stage == 9) {                // chorus 3: the myth embraced
        float e = sp * sp * (3.0 - 2.0 * sp);
        c.y = mix(-0.55, -0.10, e);
        r = mix(0.16, 0.42, e);
        g = mix(0.25, 0.90, smoothstep(0.0, 0.5, sp));
    } else if (stage == 10) {               // she keeps it; it sinks gently
        c.y = mix(-0.10, -0.40, sp);
        r = mix(0.42, 0.30, sp);
        g = mix(0.60, 0.12, sp);
    }
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float t = u_time;

    vec2 sunC; float sunR, gain;
    sunParams(stage, sp, t, sunC, sunR, gain);
    if (gain < 0.001) { fragColor = vec4(0.0); return; }

    float drive = mix(0.40 + 0.25 * sin(t * 0.53),
                      0.5 * u_audio_level + 0.5 * u_audio_bass, u_audio_playing);

    // held keys feed the myth — the player can brighten it, a little
    float kb = 0.0;
    for (int i = 0; i < 15; i++) kb += u_keys[i];
    gain *= 1.0 + 0.35 * clamp(kb / 4.0, 0.0, 1.0);

    // organic edge: the glow breathes through warped water
    vec2 q = p - sunC;
    float d = length(q) + 0.05 * (fbmRot(p * 3.0 + t * 0.05) - 0.5);

    float core = exp(-d * d / (sunR * sunR * 0.20));
    float mid  = exp(-d * d / (sunR * sunR * 1.20)) * 0.55;
    float halo = exp(-d * 2.4) * 0.30;
    float breath = 0.85 + 0.30 * drive;

    vec3 col = (SUN_CORE * core + SUN_GOLD * mid + SUN_AMBR * halo) * gain * breath;

    // chorus 3: rays of gold reach upward through the water
    if (stage == 9 || stage == 10) {
        float ang = atan(q.x, q.y);   // 0 = straight up from the sun
        float f1 = pow(0.5 + 0.5 * sin(ang * 7.0 + t * 0.09), 3.0);
        float f2 = pow(0.5 + 0.5 * sin(ang * 17.0 - t * 0.06 + 0.9), 6.0) * 0.5;
        float len = length(q);
        float upMask = smoothstep(-0.1, 0.4, q.y / max(len, 1e-4));
        float radial = exp(-len * 1.6) * smoothstep(sunR * 0.5, sunR * 1.2, len);
        col += SUN_GOLD * (f1 + f2) * upMask * radial * gain * 0.55;
    }

    // NO extinction here — the myth ignores physics. That is the point.
    col = col / (1.0 + col * 0.5);
    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
