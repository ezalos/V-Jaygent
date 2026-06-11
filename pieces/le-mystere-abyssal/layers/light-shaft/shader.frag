#version 300 es
// ABOUTME: Light-shaft layer for le-mystere-abyssal — the Snell window (the
// ABOUTME: surface seen from below), god rays fanning down from it, the diver
// ABOUTME: silhouette occluding the light, and the radio thread that frays
// ABOUTME: and severs when her trace is lost (~97s).
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "sdf.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_high;
uniform float u_audio_vocals_stem;
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

vec3 extinction(float d) {
    float r = 1.0 - smoothstep(0.00, 0.25, d);
    float g = 1.0 - smoothstep(0.10, 0.70, d);
    float b = 1.0 - 0.90 * smoothstep(0.35, 1.00, d);
    return vec3(r, g, b);
}

float aerialAmount(int stage, float sp) {
    if (stage < 3) return 1.0;
    if (stage == 3) return 1.0 - smoothstep(0.35, 0.60, sp);
    if (stage == 10) return smoothstep(0.30, 0.85, sp);
    return 0.0;
}

float discRadius(int stage, float sp) {
    if (stage == 0) return 0.105;
    if (stage == 1) return mix(0.105, 0.13, sp);
    if (stage == 2) return mix(0.13, 0.34, sp * sp);
    if (stage == 3) return mix(0.34, 2.0, smoothstep(0.0, 0.35, sp));
    if (stage == 10) return mix(0.40, 0.12, smoothstep(0.30, 0.90, sp));
    return 2.0;
}

float sunPresence(int stage, float sp) {
    if (stage == 5) return 0.45;
    if (stage == 9) return smoothstep(0.0, 0.5, sp);
    if (stage == 10) return 1.0 - smoothstep(0.0, 0.7, sp);
    return 0.0;
}

vec2 snellCenter(float dep) {
    return vec2(0.0, mix(0.55, 0.30, smoothstep(0.10, 0.90, dep)));
}
const vec2 DISC_C = vec2(0.0, -0.10);
// ==================================================== end NARRATIVE ====

// Diver path: appears as "elle est partie" lands (88.7s), sinks through the
// descent verse, drifts deeper through chorus 2, fades into the abyss break
// where the deep-life layer takes over with dissolution particles.
vec2 diverPos(float t) {
    float pr = smoothstep(88.7, 124.7, t);
    float slow = smoothstep(124.7, 140.0, t);
    float y = mix(0.30, -0.40, pr) - 0.10 * slow;
    float x = 0.05 * sin(t * 0.23) ;
    return vec2(x, y + 0.012 * sin(t * 0.9));
}

float diverFade(float t) {
    return smoothstep(86.5, 90.0, t) * (1.0 - smoothstep(139.5, 143.0, t));
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
    float uw = 1.0 - aer;

    if (uw < 0.001) { fragColor = vec4(0.0); return; }

    float highDrive = mix(0.30 + 0.22 * sin(u_time * 1.31), u_audio_high, u_audio_playing);
    float vocDrive  = mix(0.40 + 0.30 * sin(u_time * 0.47), u_audio_vocals_stem, u_audio_playing);

    // ---- Snell window: the surface as a receding bright disc ------------
    float rs   = mix(0.55, 0.075, smoothstep(0.0, 1.0, dep));
    float bWin = mix(0.85, 0.02, smoothstep(0.0, 0.92, dep));
    // eyes adjusting after the tip-under: the light blooms in
    if (stage == 3) bWin *= smoothstep(0.45, 0.95, sp);
    // when the myth-sun blooms, the real surface light steps back —
    // the gold must own the frame (v1: white-out under add-blend)
    float presence = sunPresence(stage, sp);
    bWin *= 1.0 - 0.65 * presence;

    vec2 SNELL_C = snellCenter(dep);
    vec2 q = p - SNELL_C;
    // the sky seen through a wobbling surface
    vec2 qw = q + 0.05 * rs * vec2(fbmRot(q * 2.5 / rs + u_time * 0.17) - 0.5,
                                   fbmRot(q * 2.5 / rs + 4.7 - u_time * 0.13) - 0.5);
    float rr = length(qw * vec2(0.87, 1.0));
    float win = smoothstep(rs, rs * 0.78, rr);
    float interior = 0.72 + 0.28 * fbmRot(qw * 3.2 / rs + u_time * 0.11);

    vec3 col = vec3(0.96, 0.99, 1.00) * win * interior * bWin;

    // refraction-fringed rim — kept quiet and welded to the window's own
    // brightness (at 0.45 it read as a detached donut during the bloom,
    // Louis flagged it at ~79s)
    float ring = smoothstep(rs * 1.10, rs, rr) * smoothstep(rs * 0.86, rs * 0.98, rr);
    col += vec3(0.30, 0.60, 1.00) * ring * bWin * 0.16 * smoothstep(0.10, 0.45, bWin * interior);

    // ---- God rays fanning down from the window --------------------------
    float len = length(q);
    float ang = atan(q.x, -q.y);          // 0 = straight down from the window

    // cursor warping deactivated for now (Louis 2026-06-11: the mouse
    // warps add nothing meaningful) — flip to re-enable when the cursor
    // language gets rethought
    const bool MOUSE_WARP = false;
    float bend = 0.0;
    if (MOUSE_WARP && !mouseIdle) bend = clamp((mp.x - SNELL_C.x) * 0.8, -0.6, 0.6);
    float angB = ang + 0.30 * bend * smoothstep(0.1, 0.9, len);

    float f1 = pow(0.5 + 0.5 * sin(angB * 9.0  + u_time * 0.07), 4.0);
    float f2 = pow(0.5 + 0.5 * sin(angB * 21.0 - u_time * 0.11 + 1.7), 8.0) * 0.6;
    float flicker = 0.70 + 0.30 * vnoise(vec2(angB * 6.0, u_time * 0.9));
    float downMask = smoothstep(0.15, 0.65, -q.y / max(len, 1e-4)); // only below
    float radial = exp(-len * 1.05) * smoothstep(rs * 0.55, rs * 1.35, len);
    float rayGain = pow(1.0 - dep, 2.2) * (0.30 + 0.50 * highDrive);
    if (stage == 3) rayGain *= smoothstep(0.45, 0.95, sp);
    rayGain *= 1.0 - 0.55 * presence;

    vec3 rays = vec3(0.85, 0.95, 1.00) * (f1 + f2) * flicker * downMask * radial * rayGain;
    col += rays;

    // sunlight is filtered by the water column it crossed
    col *= extinction(dep * 0.8);

    // ---- The diver: a scaphandrier against the light --------------------
    // Hard-hat suit lowered upright on the line — helmet, boxy torso,
    // arms, legs with weighted boots; limbs sway on slow incommensurate
    // clocks. (v1's plain capsule read as a pill — too cheap for her.)
    float dFade = diverFade(u_time);
    if (dFade > 0.001) {
        vec2 dp = diverPos(u_time);
        vec2 lp = p - dp;
        float swayA = sin(u_time * 0.61);
        float swayL = sin(u_time * 0.47);

        float sd = length(lp - vec2(0.0, 0.054)) - 0.020;                  // helmet
        sd = min(sd, sdSegment(lp * vec2(0.80, 1.0),
                               vec2(0.0, 0.030), vec2(0.0, -0.022)) - 0.0245); // torso
        vec2 handR = vec2( 0.036 + 0.004 * swayA, -0.016 + 0.003 * swayA);
        vec2 handL = vec2(-0.036 - 0.004 * swayA, -0.020 - 0.003 * swayA);
        sd = min(sd, sdSegment(lp, vec2( 0.020, 0.024), handR) - 0.0085);  // arms
        sd = min(sd, sdSegment(lp, vec2(-0.020, 0.024), handL) - 0.0085);
        vec2 bootR = vec2( 0.015 + 0.005 * swayL, -0.074);
        vec2 bootL = vec2(-0.013 - 0.005 * swayL, -0.072);
        sd = min(sd, sdSegment(lp, vec2( 0.011, -0.026), bootR) - 0.0095); // legs
        sd = min(sd, sdSegment(lp, vec2(-0.011, -0.026), bootL) - 0.0095);
        sd = min(sd, length(lp - bootR - vec2( 0.004, -0.004)) - 0.009);   // boots
        sd = min(sd, length(lp - bootL - vec2(-0.004, -0.004)) - 0.009);

        float occl = mix(1.0, smoothstep(0.001, 0.010, sd), dFade);
        col *= occl;
        // scattered-blue edge fringe so she reads against the dark too
        float rim = smoothstep(0.020, 0.006, abs(sd - 0.010));
        col += vec3(0.22, 0.50, 0.85) * rim * 0.30 * dFade * (1.0 - dep * 0.6);
        // one glint on the helmet glass
        vec2 vis = lp - vec2(0.006, 0.056);
        col += vec3(0.75, 0.90, 1.00) * exp(-dot(vis, vis) * 12000.0) * 0.5 * dFade;
    }

    // ---- Radio thread: her voice as a line of light ---------------------
    // appears with "elle nous parlait par radio" (93.6), frays from 95.5,
    // severs at 97.0 ("on a perdu sa trace"), gone by 98.4.
    float t = u_time;
    if (t > 93.6 && t < 98.4 && dFade > 0.001) {
        vec2 top = SNELL_C;
        vec2 bot = diverPos(t) + vec2(0.0, 0.076);   // the line meets the helmet
        float fray = smoothstep(95.5, 97.0, t);
        float sev  = smoothstep(97.0, 98.2, t);

        // perpendicular wobble grows as the signal degrades
        float wob = fray * 0.020 * sin(p.y * 70.0 + t * 13.0)
                  + fray * 0.012 * sin(p.y * 31.0 - t * 7.0);
        vec2 pw = p + vec2(wob, 0.0);

        // after the sever the upper stub retracts toward the window and
        // the lower remnant fades where she was
        vec2 upperEnd = mix(bot, top, sev);
        float sdU = sdSegment(pw - top, vec2(0.0), upperEnd - top) - 0.0022;
        float thU = smoothstep(0.005, 0.0, sdU);
        float sdL = sdSegment(pw - bot, vec2(0.0), (upperEnd - bot) * 0.25) - 0.0022;
        float thL = smoothstep(0.005, 0.0, sdL) * (1.0 - sev);

        float pulse = 0.45 + 0.55 * vocDrive;
        col += vec3(0.70, 0.90, 1.00) * (thU + thL) * pulse * 0.75 * (1.0 - sev * 0.6);
    }

    col *= uw;
    // soft saturate: additive layer must not blow out the composite
    col = col / (1.0 + col * 0.45);

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
