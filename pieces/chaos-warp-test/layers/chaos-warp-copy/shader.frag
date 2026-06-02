#version 300 es
// ABOUTME: Chaos-warp layer — slow curl-noise flow + heavy u_history smear that
// ABOUTME: gives the composition Lyapunov-style chaos: locally smooth/continuous
// ABOUTME: (the eye locks on and tracks), globally divergent (20s windows look
// ABOUTME: categorically different). No discrete events, no high-frequency noise.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform float u_audio_bass;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform int   u_section_id;
uniform float u_section_progress;

uniform float base_strength;
uniform float smear_decay;

out vec4 fragColor;

// Smooth 3-octave value-noise with per-octave rotation + offset. Hides the
// grid-aligned artefacts that `lib/noise.glsl`'s `fbm` produces (its own
// header explicitly warns to "prefer fbmRot for pieces that hold still" —
// the heavy u_history decay in this layer holds the field still long enough
// that 5-octave grid-aligned fbm baked block-shaped patches into the trails).
// 3 octaves is enough chaos for the curl; more octaves only feed
// high-frequency noise into the gradient.
float smoothNoise(vec2 p) {
    float v = 0.0, a = 0.62;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p = rot * p * 2.0 + vec2(1.7, 9.2);
        a *= 0.55;
    }
    return v;
}

// Curl of a 2D scalar field — divergence-free, swirly. The curl ensures the
// warp preserves area locally (no pinching), giving fluid-like motion. Time
// evolves a slowly drifting offset; over ~30s the field morphs into a
// qualitatively different topology, but on any 1s window the field is
// nearly stationary so motion reads as smooth continuous flow. Larger eps
// (0.030 vs the v3 0.018) low-passes the gradient, killing residual
// high-frequency content that would amplify into pixel-grid artefacts.
vec2 curlNoise(vec2 p, float t) {
    float eps = 0.030;
    vec2 drift = vec2(t * 0.08, t * 0.061);   // slow time-evolution
    float n0 = smoothNoise(p + drift);
    float n1 = smoothNoise(p + drift + vec2(eps, 0.0));
    float n2 = smoothNoise(p + drift + vec2(0.0, eps));
    float dx = (n1 - n0) / eps;
    float dy = (n2 - n0) / eps;
    return vec2(dy, -dx);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 pAspect = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);

    // u_below sample — the two hemispheres + seam already composited beneath.
    vec3 belowSample0 = texture(u_below, uv).rgb;
    bool belowEmpty = dot(belowSample0, vec3(1.0)) < 0.005;

    // === Single-scale smooth curl-noise flow ===
    // ONLY the coarse scale. The fine-scale curl-noise that v3 used produced
    // sub-cell deformation that read as pixel noise — Louis's "pixelated
    // square pattern". A single coarse scale gives whole regions a coherent
    // drift direction.
    vec2 flow = curlNoise(pAspect * 1.4, u_time);

    // Headless / silent fallback — keep chaos breathing without audio.
    float synthLevel = 0.45 + 0.30 * sin(u_time * 0.21);
    float audioMix = mix(synthLevel,
                         0.35 + 0.65 * u_audio_level,
                         u_audio_playing);

    // Section-state shapes the chaos *budget* — total displacement, not
    // event frequency. We never inject events. The budget rises smoothly
    // from intro to climax then fades through the outro.
    float sectionChaos = 0.30;
    if (u_section_id == 0)      sectionChaos = 0.12;
    else if (u_section_id == 1) sectionChaos = 0.35;
    else if (u_section_id == 2) sectionChaos = 0.55;
    else if (u_section_id == 3) sectionChaos = 0.72;
    else if (u_section_id == 4) sectionChaos = 0.90;
    else if (u_section_id == 5) sectionChaos = 0.55 * (1.0 - u_section_progress);

    // Smooth ramp within each section so the chaos budget doesn't jump on
    // section boundaries — the viewer should feel the chaos rise gradually,
    // not see a step at every transition.
    float sectionSmooth = smoothstep(0.0, 0.55, u_section_progress);
    sectionChaos = mix(sectionChaos * 0.75, sectionChaos, sectionSmooth);

    // Cursor coupling — when cursor is non-idle, LOCALLY suppress warp so
    // the viewer can carve out a coherent zone (cursor as a still anchor
    // inside the flow). No additive cursor; only multiplicative
    // suppression. Disjoint from audio-driven chaos.
    vec2 mouseUv = u_mouse / u_resolution;
    float cursorActive = step(0.5, length(u_mouse));
    float cursorDist = length((uv - mouseUv) * vec2(aspect, 1.0));
    float cursorCalm = cursorActive * exp(-cursorDist * 4.0) * 0.85;

    // Final warp magnitude. Notice: no discrete events, no per-beat pulses,
    // no audio kick. Audio only gently scales the smooth budget.
    vec2 warp = flow * base_strength * sectionChaos * (0.7 + 0.5 * audioMix);
    warp *= (1.0 - cursorCalm);

    // Sample u_below at the warped UV. Aspect-correct the displacement so
    // x and y read at the same physical magnitude.
    vec2 warpUv = uv + vec2(warp.x / aspect, warp.y);
    vec3 below = texture(u_below, warpUv).rgb;
    if (belowEmpty) below = vec3(0.04, 0.02, 0.01);

    // === Heavy u_history feedback (the 20-second divergence engine) ===
    // u_history is sampled at a slightly drifted UV so trails advect along
    // the dominant flow direction. With decay around 0.92, trails persist
    // ~12 frames at 60fps but compound for many more — the cumulative
    // structure recorded in u_history is what makes 20s windows
    // categorically different even when the underlying flow looks smooth.
    vec2 histShift = -flow * base_strength * sectionChaos * 0.7;
    vec3 hist = texture(u_history, uv + vec2(histShift.x / aspect, histShift.y)).rgb;
    float histRamp = smoothstep(0.0, 30.0, float(u_frame));
    // Smaller decay variation than v3 — keep the trail length stable so
    // continuity reads the same in every section. Chaos comes from where
    // the flow goes, not from how long trails persist.
    float decay = smear_decay * (0.97 + 0.04 * sectionChaos);
    hist *= decay * histRamp;

    // Compose: max blend keeps the brightest oscillator peaks intact, while
    // trails fill the dark regions between oscillators with fluid streaks.
    vec3 col = max(below, hist);

    fragColor = vec4(col, 1.0);
}
