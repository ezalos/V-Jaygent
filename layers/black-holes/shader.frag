#version 300 es
// ABOUTME: Black-holes layer — N moving dark wells that gravitationally lens
// ABOUTME: u_below. Each well is a 1/r^2 attractor; pixels near it sample
// ABOUTME: u_below at displaced coords producing visible spacetime warping.
// ABOUTME: Cursor adds a 5th well so the user can drag-pull the cosmos.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_downbeat;
uniform float u_section_progress;
uniform int   u_section_id;
uniform float u_keys[15];
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

const int N_HOLES = 4;

// Returns the lensed UV displacement contribution from a single well at `c`
// with strength `s`. 1/r^2 falloff with smoothing inside the event horizon
// so we don't divide by zero.
vec2 holePull(vec2 p, vec2 c, float s) {
    vec2 d = p - c;
    float r2 = dot(d, d) + 0.012;     // event-horizon smoothing
    return -d * s / r2;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Four wells on independent slow orbits at golden-ratio rates.
    float t = u_time * 0.5;
    vec2 holes[5];
    holes[0] = 0.42 * vec2(cos(t * 0.21),       sin(t * 0.13));
    holes[1] = 0.38 * vec2(cos(t * 0.31 + 1.7), sin(t * 0.21 + 0.9));
    holes[2] = 0.30 * vec2(cos(t * 0.13 + 3.1), sin(t * 0.31 + 2.2));
    holes[3] = 0.50 * vec2(cos(t * 0.07 + 5.0), sin(t * 0.11 + 1.4));
    // Cursor as a 5th well (idle = vec2(0), so it sits at origin and adds
    // weight to the centre — visually fine).
    vec2 mouseW = vjMouseWorldOrZero(u_mouse, u_resolution);
    holes[4] = mouseW;

    // Aggregate gravitational pull → UV displacement.
    float strength = 0.025 + 0.020 * u_audio_bass;
    vec2 disp = vec2(0.0);
    for (int i = 0; i < N_HOLES; i++) {
        disp += holePull(p, holes[i], strength);
    }
    // Cursor well is stronger so the user feels the drag.
    disp += holePull(p, holes[4], strength * 1.6);

    // Sample u_below at displaced UVs — the lensed image of what's beneath.
    vec2 lensedUv = uv + disp;
    vec3 below = texture(u_below, lensedUv).rgb;

    // Render dark cores at each well. Each pixel near a well gets multiplied
    // by a darkening factor that approaches 0 at the centre.
    float darkness = 0.0;
    for (int i = 0; i < N_HOLES; i++) {
        float r = length(p - holes[i]);
        darkness = max(darkness, smoothstep(0.10, 0.018, r));
    }
    {
        float r = length(p - holes[4]);
        darkness = max(darkness, smoothstep(0.08, 0.014, r) * 1.1);
    }
    vec3 col = below * (1.0 - darkness * 0.92);

    // Bright accretion-disc rim around each well — a thin warm ring
    // where the lensing is strongest.
    for (int i = 0; i < N_HOLES; i++) {
        float r = length(p - holes[i]);
        float ring = smoothstep(0.014, 0.0, abs(r - 0.07));
        col += vec3(1.20, 0.55, 0.18) * ring * 0.5 * (0.5 + u_audio_mid);
    }

    // Pulse on each downbeat — wells briefly inflate (visible as the dark
    // disc growing). Scaled into the darkness term so this is geometric,
    // not a flash.
    if (u_downbeat > 0.05) {
        float pulse = u_downbeat * 0.35;
        for (int i = 0; i < N_HOLES; i++) {
            float r = length(p - holes[i]);
            col *= 1.0 - smoothstep(0.20, 0.05, r) * pulse;
        }
    }

    // History feedback so the lensed pattern smears into a swirling tail
    // as the wells drift.
    vec3 hist = texture(u_history, uv - disp * 0.4).rgb * 0.86;
    col = max(col, hist);

    fragColor = vec4(col, 1.0);
}
