// ABOUTME: Gray-Scott reaction-diffusion for "danzas-percs" — kicks launch travelling
// ABOUTME: wavefronts from a 2x2 dance-step lattice; sections morph the Turing regime.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

uniform vec4 u_touches[8];
uniform int  u_touch_count;

// Song-level audio (zeroed when no analysis / silent).
uniform float u_beat_phase;        // [0,1) sawtooth — the front's travel clock
uniform int   u_beat_index;        // which beat — picks the lattice site (the dance step)
uniform float u_downbeat;          // bar-start impulse — accents the front
uniform int   u_section_id;        // Turing regime selector
uniform float u_section_progress;  // regime cross-fade + boundary sweep clock
uniform float u_to_section_change; // seconds to next boundary — recovers elapsed-time
uniform float u_song_progress;     // wavelength drift + ending starvation
uniform float u_energy_smooth;     // boundary-sweep amplitude
uniform float u_audio_drums_stem;  // gates the kick-fronts
uniform float u_audio_other_stem;  // melodic stem — wobbles the feed rate F
uniform float u_audio_high;        // live FFT highs — wobbles the kill rate k
uniform float u_audio_playing;

#include "math.glsl"
#include "diffusion.glsl"
#include "noise.glsl"

out vec4 fragColor;

// Pearson regime table, vec2(F, k) — hand-tailored to THIS track's 8 analysed
// sections (the piece ships married to audio.mp3, so the mapping is per-track
// by design): silent intro -> groove -> hotter -> breakdown -> pre-drop break
// -> THE DROP (251.6s, longest+hottest act gets the dense labyrinth) ->
// wind-down -> silence (starved by the ending ramp anyway).
const vec2 REGIMES[8] = vec2[8](
    vec2(0.030,  0.062),   // 0 intro      — solitons, near-empty steel
    vec2(0.037,  0.060),   // 1 groove     — spots (ferment-proven constants)
    vec2(0.046,  0.063),   // 2 hotter     — worms, crawling stripes
    vec2(0.030,  0.062),   // 3 breakdown  — thin back to solitons
    vec2(0.0367, 0.0649),  // 4 break      — mitosis: spots quietly dividing
    vec2(0.0545, 0.062),   // 5 THE DROP   — coral labyrinth, densest growth
    vec2(0.046,  0.063),   // 6 wind-down  — worms keep moving
    vec2(0.030,  0.062)    // 7 outro      — solitons under the F-starve ending
);

// 2x2 lattice walked in a crossing order (LL -> RR -> LR -> RL): the kicks
// "dance" across the frame instead of pulsing one centre. Aspect-centred space.
const vec2 SITES[4] = vec2[4](
    vec2(-0.32, -0.20), vec2(0.32, 0.20), vec2(-0.32, 0.20), vec2(0.32, -0.20)
);

void main() {
    vec2 uv     = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel  = 1.0 / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p      = (uv - 0.5) * vec2(aspect, 1.0);   // centred, aspect-true

    if (u_frame == 0) {
        // Sparse seed — the intro reads as nearly clean steel; the first kicks
        // paint it. Threshold higher than ferment's so fewer islands survive.
        vec2 q = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
        float seed = vnoise(q * 5.0) + 0.55 * vnoise(q * 13.7);
        float v0   = smoothstep(1.02, 1.25, seed);
        fragColor  = vec4(1.0 - 0.5 * v0, 0.25 * v0, 0.0, 0.0);
        return;
    }

    vec4  state = texture(u_state, uv);
    float u     = state.r;
    float v     = state.g;
    float reactF = state.b;   // fast EMA of the reaction rate
    float reactS = state.a;   // slow EMA — fast-minus-slow = FRESH ignition

    // ---- Regime: cross-fade (F,k) from the previous section's regime over the
    // first 6% of each section. Stateless: previous = (id+3) % 4.
    vec2 FK;
    if (u_section_id < 0) {
        FK = REGIMES[1];                                  // idle: ferment's spots
    } else {
        vec2 cur  = REGIMES[u_section_id % 8];
        vec2 prev = REGIMES[(u_section_id + 7) % 8];
        FK = mix(prev, cur, smoothstep(0.0, 0.06, u_section_progress));
    }
    // Melodic stem breathes the feed rate; live highs sharpen/soften domain
    // boundaries via the kill rate. Small — regime character must survive.
    float F = FK.x + 0.0025 * (u_audio_other_stem - 0.30);
    float K = FK.y + 0.0015 * (u_audio_high      - 0.30);
    // Ending: starve the feed in the last 4% — patterns dissolve honestly.
    F = mix(F, 0.008, smoothstep(0.96, 1.0, u_song_progress));

    // ---- The one sustained transformation: scale BOTH diffusion rates so the
    // pattern wavelength (∝ sqrt(D)) slowly coarsens across the track without
    // changing regime. Explicit-Euler stability: D_U*1.30 = 0.208 < 0.25. ✓
    float Dscale = mix(0.80, 1.30, u_song_progress);
    float D_U = 0.16 * Dscale;
    float D_V = 0.08 * Dscale;

    vec4  lap = laplacian4(u_state, uv, texel);
    float uvv = u * v * v;
    u += D_U * lap.r - uvv + F * (1.0 - u);
    v += D_V * lap.g + uvv - (F + K) * v;

    // Reaction-rate band-pass — the display's ember signal. Steady-state
    // Gray-Scott metabolises on EVERY living rim, so a plain EMA paints the
    // whole pattern hot (v1 mistake: "the night is on fire"). Fast-minus-slow
    // isolates freshly IGNITED chemistry: fronts flare ember, settled pattern
    // converges (fast == slow) and cools back to steel.
    reactF = mix(reactF, uvv * 12.0, 0.08);
    reactS = mix(reactS, uvv * 12.0, 0.012);

    // ---- Travelling kick-front: the active lattice site fires an annulus whose
    // radius is driven by beat_phase — the injection locus TRAVELS (propagation,
    // not pulse). Gated by the drums stem so the intro/breaks stay quiet.
    if (u_section_id >= 0 && u_audio_playing > 0.5) {
        int   si   = u_beat_index % 4;
        vec2  site = SITES[si] + 0.05 * vec2(sin(u_time * 0.07 + float(si) * 2.1),
                                             cos(u_time * 0.05 + float(si) * 1.3));
        float r    = u_beat_phase * 0.45;
        float dist = length(p - site);
        float ring = exp(-pow((dist - r) / 0.010, 2.0));
        float gate = smoothstep(0.12, 0.45, u_audio_drums_stem);
        float amp  = 0.045 * gate * (1.0 + 1.5 * u_downbeat) * (1.0 - 0.45 * u_beat_phase);
        v += ring * amp;
        u  = max(u - ring * amp * 0.3, 0.0);

        // ---- Section-boundary sweep (the structural moment): a diagonal planar
        // front crosses the whole frame in the first ~1.6 SECONDS of each
        // section (sections here run 9-160s, so a progress fraction won't do —
        // recover elapsed time from progress and to_change). Direction rotates
        // by the golden angle per section. Amplitude floored so the drop
        // detonates even though the energy envelope lags (kinetic-energy lesson).
        float elapsed = (u_section_progress < 0.999)
            ? u_section_progress * u_to_section_change / (1.0 - u_section_progress)
            : 1e3;
        float sweepT = elapsed / 1.6;
        if (u_section_id >= 1 && sweepT < 1.0) {
            float ang   = float(u_section_id) * 2.39996;
            vec2  nrm   = vec2(cos(ang), sin(ang));
            float sweep = mix(-0.75, 0.75, sweepT);
            float line_ = exp(-pow((dot(p, nrm) - sweep) / 0.009, 2.0));
            float amp2  = 0.05 * (0.5 + 0.9 * u_energy_smooth);
            v += line_ * amp2;
            u  = max(u - line_ * amp2 * 0.3, 0.0);
        }
    }

    // ---- Cursor brush (ferment's): hovering feeds the reaction by hand.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    if (!mouseIdle) {
        vec2  mN   = u_mouse / u_resolution.xy;
        vec2  d    = (uv - mN) * vec2(aspect, 1.0);
        float feed = exp(-dot(d, d) * 600.0) * 0.09;
        v += feed;
        u  = max(u - feed * 0.3, 0.0);
    }
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2  tN   = t.xy / u_resolution.xy;
        vec2  d    = (uv - tN) * vec2(aspect, 1.0);
        float feed = exp(-dot(d, d) * 600.0) * 0.09;
        v += feed;
        u  = max(u - feed * 0.3, 0.0);
    }

    u = clamp(u, 0.0, 1.0);
    v = clamp(v, 0.0, 1.0);
    reactF = clamp(reactF, 0.0, 1.0);
    reactS = clamp(reactS, 0.0, 1.0);

    fragColor = vec4(u, v, reactF, reactS);
}
