#version 300 es
// ABOUTME: Water-column base layer for le-mystere-abyssal — aerial lagoon with
// ABOUTME: the blue-hole disc (stages A), depth-graded water with macro light
// ABOUTME: pockets, the milky H2S stratum (B4), and a cursor pressure pocket.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
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

// Channel-ordered death of light with depth (red first, blue last).
vec3 extinction(float d) {
    float r = 1.0 - smoothstep(0.00, 0.25, d);
    float g = 1.0 - smoothstep(0.10, 0.70, d);
    float b = 1.0 - 0.90 * smoothstep(0.35, 1.00, d);
    return vec3(r, g, b);
}

// 1 above the surface (stages A), eases to 0 across B1 (the tip-under).
// The crossfade hides inside the swallowed-disc darkness (sp 0.35-0.60).
float aerialAmount(int stage, float sp) {
    if (stage < 3) return 1.0;
    if (stage == 3) return 1.0 - smoothstep(0.35, 0.60, sp);
    return 0.0;
}

// Blue-hole disc radius in p-space: breathes (legend), grows (approach),
// swallows the frame by sp=0.35 of the tip-under.
float discRadius(int stage, float sp) {
    if (stage == 0) return 0.105;
    if (stage == 1) return mix(0.105, 0.13, sp);
    if (stage == 2) return mix(0.13, 0.34, sp * sp);
    if (stage == 3) return mix(0.34, 2.0, smoothstep(0.0, 0.35, sp));
    return 2.0;
}

// Surface-window centre slides down-frame as depth grows, so the receding
// disc stays visible: dome overhead when shallow, small coin near the top
// of frame at the bottom of the dive.
vec2 snellCenter(float dep) {
    return vec2(0.0, mix(0.55, 0.30, smoothstep(0.10, 0.90, dep)));
}
const vec2 DISC_C = vec2(0.0, -0.10);   // aerial hole centre (p-space)
// ==================================================== end NARRATIVE ====

const vec3 SKY_PALE    = vec3(0.82, 0.88, 0.86);
const vec3 SKY_HIGH    = vec3(0.58, 0.72, 0.76);
const vec3 LAGOON_NEAR = vec3(0.35, 0.78, 0.70);
const vec3 LAGOON_FAR  = vec3(0.06, 0.45, 0.42);
const vec3 HOLE_DISC   = vec3(0.004, 0.02, 0.06);
const vec3 AZURE       = vec3(0.10, 0.42, 0.54);
const vec3 COBALT      = vec3(0.03, 0.16, 0.38);
const vec3 MIDNIGHT    = vec3(0.008, 0.05, 0.16);
const vec3 ABYSS       = vec3(0.001, 0.012, 0.035);
const vec3 MILKY       = vec3(0.42, 0.50, 0.52);

// Aerial view: Sugimoto bisected horizon, lagoon, the dark disc with its
// pale reef rim. The disc is vertically compressed (oblique view of the
// sea plane).
vec3 aerialColor(vec2 p, vec2 uv, float t, int stage, float sp) {
    // Horizon height in uv.y. During the tip-under we nose-dive into the
    // hole: the horizon (and the sky with it) rises out of the frame.
    float H = 0.80;
    if (stage == 3) H += 0.65 * smoothstep(0.02, 0.32, sp);

    // Sky band — pale at the horizon, slightly deeper above.
    vec3 sky = mix(SKY_PALE, SKY_HIGH, smoothstep(H, 1.0, uv.y));

    // Sea — bright lagoon near the viewer, deepening toward the horizon.
    // Two texture scales: wave bands (anisotropic, finer toward the
    // horizon for perspective) and broad drifting cloud-shadow patches.
    float toward = smoothstep(0.0, H, uv.y);
    vec3 sea = mix(LAGOON_NEAR, LAGOON_FAR, toward);
    float wave = fbmRot(vec2(p.x * mix(2.5, 6.5, toward), uv.y * 9.0)
                        + vec2(t * 0.060, t * 0.018));
    sea *= 0.88 + 0.20 * wave;
    float cloud = fbmRot(p * 0.85 + vec2(t * 0.009, -t * 0.004));
    sea *= 0.90 + 0.16 * cloud;

    // The blue hole: ellipse on the sea plane.
    float R = discRadius(stage, sp);
    if (stage == 1) R *= 1.0 + 0.025 * sin(t * 0.42); // the legend breathes
    vec2 q = (p - DISC_C) * vec2(1.0, 2.0);           // oblique compression
    float r = length(q);

    // The legend: a faint echo-ring leaves the hole every 8s (stage A2) —
    // the rumour radiating outward.
    if (stage == 1) {
        float tt = mod(t - 23.1, 8.0);
        float ringR = R + tt * 0.13;
        float echo = smoothstep(0.030, 0.0, abs(r - ringR)) * exp(-tt * 0.55);
        sea += vec3(0.10, 0.30, 0.28) * echo;
    }

    // Pale reef rim just outside the hole.
    float rim = smoothstep(R * 1.30, R * 1.04, r) * smoothstep(R * 0.98, R * 1.06, r);
    sea = mix(sea, LAGOON_NEAR * 1.13, rim * 0.8);

    // Hole interior: cobalt edge falling to near-black navy at centre.
    vec3 hole = mix(COBALT * 0.65, HOLE_DISC, smoothstep(R * 0.85, R * 0.25, r));
    float inside = smoothstep(R * 1.015, R * 0.985, r);
    sea = mix(sea, hole, inside);

    // Horizon line — a quiet bright seam (the Sugimoto bookend).
    float seam = smoothstep(0.006, 0.0, abs(uv.y - H));
    vec3 col = mix(sea, sky, smoothstep(H - 0.002, H + 0.002, uv.y));
    col += vec3(0.10, 0.09, 0.07) * seam;
    return col;
}

// Underwater: vertical gradient by effective optical depth, macro light
// pockets, milky stratum, cursor pressure pocket.
vec3 underwaterColor(vec2 p, vec2 uv, float t, int stage, float sp, float dep,
                     float bassDrive, vec2 mp, bool mouseIdle) {
    // Frame bottom reads deeper than frame top.
    float de = clamp(dep + (1.0 - uv.y) * 0.22, 0.0, 1.0);
    vec3 col = mix(AZURE, COBALT, smoothstep(0.00, 0.38, de));
    col = mix(col, MIDNIGHT, smoothstep(0.38, 0.72, de));
    col = mix(col, ABYSS, smoothstep(0.72, 1.00, de));

    // Macro envelope: one bright and one dark wandering pocket so the
    // squint always sees light/dark structure (incommensurate periods).
    // Both die in the true abyss — down there only the deep-life layer
    // is allowed to make light.
    float pocketGain = 1.0 - smoothstep(0.65, 0.85, dep);
    vec2 cBright = vec2(0.50 * sin(t / 41.0), 0.30 * sin(t / 67.0 + 1.7));
    vec2 cDark   = vec2(0.55 * sin(t / 53.0 + 3.1), 0.28 * sin(t / 31.0 + 0.6));
    float gb = exp(-dot(p - cBright, p - cBright) * 2.2);
    float gd = exp(-dot(p - cDark, p - cDark) * 3.0);
    col *= 1.0 + 0.30 * gb * pocketGain;
    col *= 1.0 - 0.22 * gd * pocketGain;

    // Bass swell — the low end breathes light into the upper water.
    col += vec3(0.0, 0.04, 0.09) * bassDrive * smoothstep(0.3, 1.0, uv.y) * (1.0 - dep);

    // Milky hydrogen-sulfide stratum: rises through the frame as we sink
    // past it across the break entry, edges warped so it reads as a fluid
    // boundary. Faint glow bleeds upward before it arrives.
    if (t > 141.0 && t < 155.0) {
        float yBand = mix(-0.40, 1.45, clamp((t - 142.5) / 9.5, 0.0, 1.0));
        float yLocal = uv.y + 0.06 * fbmRot(vec2(p.x * 2.6, t * 0.07));
        float band = exp(-pow((yLocal - yBand) / 0.09, 2.0));
        float bloom = exp(-max(yLocal - yBand, 0.0) * 4.5) * 0.30;
        col = mix(col, MILKY * 0.95, clamp(band * 0.75 + bloom, 0.0, 1.0));
    }

    // Eyes adjusting: the first seconds under the surface are darker, the
    // water resolves as the tip-under completes.
    if (stage == 3) col *= mix(0.20, 1.0, smoothstep(0.38, 0.95, sp));

    // Cursor pressure pocket: the water parts and darkens around the hand.
    if (!mouseIdle) {
        float cd = dot(p - mp, p - mp);
        float pocket = exp(-cd * 6.0);
        col = mix(col, col * vec3(0.50, 0.72, 1.05), pocket * 0.55);
    }
    return col;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float aer = aerialAmount(stage, sp);

    float bassDrive = mix(0.30 + 0.25 * sin(u_time * 0.61), u_audio_bass, u_audio_playing);

    vec3 col;
    if (aer >= 1.0) {
        col = aerialColor(p, uv, u_time, stage, sp);
    } else if (aer <= 0.0) {
        col = underwaterColor(p, uv, u_time, stage, sp, dep, bassDrive, mp, mouseIdle);
    } else {
        vec3 a = aerialColor(p, uv, u_time, stage, sp);
        vec3 b = underwaterColor(p, uv, u_time, stage, sp, dep, bassDrive, mp, mouseIdle);
        col = mix(a, b, smoothstep(0.0, 1.0, 1.0 - aer));
    }

    fragColor = vec4(col, 1.0);
}
