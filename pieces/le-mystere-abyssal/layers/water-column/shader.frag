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
uniform float u_bar_phase;
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

// 1 above the surface (stages A), eases to 0 across B1 (the tip-under),
// and RETURNS across the outro (stage 10) — the piece resurfaces to the
// horizon bookend. The tip-under crossfade hides inside the swallowed-disc
// darkness (sp 0.35-0.60).
float aerialAmount(int stage, float sp) {
    if (stage < 3) return 1.0;
    if (stage == 3) return 1.0 - smoothstep(0.35, 0.60, sp);
    if (stage == 10) return smoothstep(0.30, 0.85, sp);
    return 0.0;
}

// Blue-hole disc radius in p-space: breathes (legend), grows (approach),
// swallows the frame by sp=0.35 of the tip-under, and recedes to a small
// dark coin behind us as we resurface.
float discRadius(int stage, float sp) {
    if (stage == 0) return 0.105;
    if (stage == 1) return mix(0.105, 0.13, sp);
    if (stage == 2) return mix(0.13, 0.34, sp * sp);
    if (stage == 3) return mix(0.34, 2.0, smoothstep(0.0, 0.35, sp));
    if (stage == 10) return mix(0.40, 0.12, smoothstep(0.30, 0.90, sp));
    return 2.0;
}

// How present the myth-sun is (0..1). Other layers consult this to carve
// darkness for the gold — add-blended gold over bright blue reads white
// (v1 critique), so when the sun comes, the water and the real surface
// light step back.
float sunPresence(int stage, float sp) {
    if (stage == 5) return 0.45;
    if (stage == 9) return smoothstep(0.0, 0.5, sp);
    if (stage == 10) return 1.0 - smoothstep(0.0, 0.7, sp);
    return 0.0;
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

// Accretion gate: part 1 assembles itself one element at a time.
float accr(float t, float t0, float ramp) {
    return smoothstep(t0, t0 + ramp, t);
}

// The pulse: a travelling pressure front from the hole that WARPS the
// water (texture, glitter, rim light bend as it passes) instead of being
// a drawn ring. Gentle 8s breathing on the legend; bar-locked and strong
// on the expedition. Returns front strength; outputs the warp offset.
float holePulse(vec2 p, float t, int stage, float barPhase, float playing,
                out vec2 warp) {
    warp = vec2(0.0);
    if (stage != 1 && stage != 2) return 0.0;
    float ph = (stage == 1)
        ? fract((t - 23.1) / 8.0)
        : mix(fract(t / 2.5), barPhase, playing);
    float amp = (stage == 1) ? 0.45 : 1.0;
    vec2 q = (p - DISC_C) * vec2(1.0, 2.0);
    float r = max(length(q), 1e-4);
    float ringR = 0.12 + ph * 1.05;
    float band = exp(-pow((r - ringR) / 0.085, 2.0));
    float front = band * exp(-ph * 2.4) * amp;
    warp = (q / r) * vec2(1.0, 0.5) * front * 0.05;
    return front;
}

// Aerial view: Sugimoto bisected horizon, lagoon, the dark disc with its
// pale reef rim. The disc is vertically compressed (oblique view of the
// sea plane).
vec3 aerialColor(vec2 p, vec2 uv, float t, int stage, float sp,
                 float barPhase, float playing) {
    // Horizon height in uv.y. During the tip-under we nose-dive into the
    // hole: the horizon (and the sky with it) rises out of the frame.
    float H = 0.80;
    if (stage == 3) H += 0.65 * smoothstep(0.02, 0.32, sp);

    // --- the first minute assembles itself (one element per ~5s) ---
    float gWave  = accr(t, 4.5, 3.5);    // waves wake the water
    float gRefl  = accr(t, 8.0, 3.5);    // the sky reflects into it
    float gSkyWC = accr(t, 10.5, 4.0);   // the water colours the sky
    float gHole  = accr(t, 12.8, 3.5);   // the hole arrives with the chords

    // --- the pulse warps everything that follows ---
    vec2 warp;
    float front = holePulse(p, t, stage, barPhase, playing, warp);
    vec2 pw = p + warp;

    // Sky band — pale at the horizon, deeper above, and (once the water
    // has claimed it) washed with drifting watercolor pigment.
    vec3 sky = mix(SKY_PALE, SKY_HIGH, smoothstep(H, 1.0, uv.y));
    if (gSkyWC > 0.001) {
        float wcA = fbmRot(p * vec2(1.4, 2.8) + vec2(t * 0.011, t * 0.004));
        float wcB = fbmRot(p * vec2(3.1, 5.2) - vec2(t * 0.007, t * 0.013) + 4.7);
        float blot = smoothstep(0.42, 0.78, wcA) * (0.55 + 0.45 * wcB);
        float grain = 0.85 + 0.15 * vnoise(p * 28.0);   // paper tooth
        vec3 pigment = mix(vec3(0.55, 0.80, 0.78), vec3(0.88, 0.93, 0.84), wcB);
        sky = mix(sky, pigment, blot * grain * 0.50 * gSkyWC);
    }

    // Sea — bright lagoon near the viewer, deepening toward the horizon.
    float toward = smoothstep(0.0, H, uv.y);
    vec3 sea = mix(LAGOON_NEAR, LAGOON_FAR, toward);
    float wave = fbmRot(vec2(pw.x * mix(2.5, 6.5, toward), uv.y * 9.0)
                        + vec2(t * 0.060, t * 0.018));
    sea *= 1.0 + gWave * (0.20 * wave - 0.10);
    float cloud = fbmRot(pw * 0.85 + vec2(t * 0.009, -t * 0.004));
    sea *= 1.0 + gWave * (0.16 * cloud - 0.08);

    // Sky reflections: vertical pale streaks lying on the water.
    if (gRefl > 0.001) {
        float streak = fbmRot(vec2(pw.x * 7.0, uv.y * 2.2 - t * 0.025));
        float sMask = smoothstep(0.55, 0.85, streak) * (1.0 - toward * 0.55);
        sea = mix(sea, SKY_PALE * 0.92, sMask * 0.35 * gRefl);
    }

    // The blue hole — born at 12.8s, belonging to the water: its contour
    // is displaced by the same wave field that textures the surface, its
    // rim light shimmers with the wave phase and flares when the pulse
    // front crosses it.
    if (gHole > 0.001) {
        float R = discRadius(stage, sp) * gHole;
        if (stage == 1) R *= 1.0 + 0.025 * sin(t * 0.42); // the legend breathes
        vec2 q = (p - DISC_C) * vec2(1.0, 2.0);
        float rWob = (wave - 0.5) * 0.16 * R + (cloud - 0.5) * 0.07 * R;
        float r = length(q) + rWob;

        float rim = smoothstep(R * 1.30, R * 1.04, r) * smoothstep(R * 0.98, R * 1.06, r);
        sea = mix(sea, LAGOON_NEAR * (1.04 + 0.18 * wave + 0.50 * front),
                  rim * 0.8 * gHole);

        vec3 hole = mix(COBALT * 0.65, HOLE_DISC, smoothstep(R * 0.85, R * 0.25, r));
        // surface texture continues over the edge and drowns toward centre
        float edgeTex = smoothstep(R * 0.30, R * 0.95, r);
        hole *= 1.0 + (0.20 * wave - 0.10) * edgeTex * gWave;
        // outro: she kept the sun — a faint warm ember deep in the hole
        if (stage >= 10) {
            hole += vec3(0.60, 0.32, 0.10)
                  * exp(-pow(length(q) / max(R * 0.45, 1e-3), 2.0)) * 0.40;
        }
        float inside = smoothstep(R * 1.015, R * 0.985, r);
        sea = mix(sea, hole, inside * gHole);
    }

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

    // The reversal has its own light: as we rise, dawn grows from above —
    // the surface calling us back (gives C1 a legible signature; v1 read
    // as undifferentiated dark).
    if (stage == 7) {
        float dawn = smoothstep(0.05, 0.85, sp);
        col += vec3(0.05, 0.16, 0.24) * dawn * smoothstep(0.25, 1.0, uv.y);
    }

    // When the myth-sun is present, the water steps back — darkness is
    // carved under the bloom so the gold survives add-blend compositing
    // (v1 critique: gold over bright blue reads white).
    float presence = sunPresence(stage, sp);
    if (presence > 0.001) {
        float lower = 0.45 + 0.55 * smoothstep(0.9, 0.0, uv.y);
        col *= 1.0 - 0.60 * presence * lower;
    }

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
        col = aerialColor(p, uv, u_time, stage, sp, u_bar_phase, u_audio_playing);
    } else if (aer <= 0.0) {
        col = underwaterColor(p, uv, u_time, stage, sp, dep, bassDrive, mp, mouseIdle);
    } else {
        vec3 a = aerialColor(p, uv, u_time, stage, sp, u_bar_phase, u_audio_playing);
        vec3 b = underwaterColor(p, uv, u_time, stage, sp, dep, bassDrive, mp, mouseIdle);
        col = mix(a, b, smoothstep(0.0, 1.0, 1.0 - aer));
        // Resurfacing (stage 10): breaking the surface is a passage through
        // light, not a double exposure — a pale bloom peaks mid-crossfade
        // and hides the dissolve (the tip-under solved this with darkness;
        // the return solves it with brightness).
        if (stage == 10) {
            float breakthrough = 4.0 * aer * (1.0 - aer);
            col += vec3(0.75, 0.88, 0.90) * breakthrough * 0.55;
        }
    }

    fragColor = vec4(col, 1.0);
}
