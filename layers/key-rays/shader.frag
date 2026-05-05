#version 300 es
// ABOUTME: Key-rays layer — keyboard a..l fire glowing rays from the canvas
// ABOUTME: edge inward at angles fanned around the centre. Held keys sustain
// ABOUTME: a beam; press triggers a brightening spear that travels inward.
// ABOUTME: Per-key warm-family hue so the user can identify which key plays.
precision highp float;

#include "math.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[9];
uniform float u_key_event[9];
uniform float u_audio_bass;
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

// Anti-aliased line/ray distance: returns intensity 0..1 along an angle.
float angDist(float a, float b) {
    float d = a - b;
    return abs(atan(sin(d), cos(d)));
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    float r   = length(p) + 1e-4;
    float ang = atan(p.y, p.x);

    vec3 col = vec3(0.0);

    for (int i = 0; i < 9; i++) {
        float fi = float(i);
        // Angles fanned around the upper hemisphere for visual clarity:
        // 9 keys spaced over 280° starting from -200° (a is upper-left,
        // l is upper-right). Avoids piling the rays at the bottom where
        // mirror-bloom's outer ring sits.
        float keyAng = -PI + 0.35 + (fi / 8.0) * (TAU - 0.7);

        float aDist = angDist(ang, keyAng);

        // Held envelope makes a sustained beam — narrow soft line at this
        // angle from r=0.55 outward to the canvas edge.
        float env = u_keys[i];
        float beamWidth = 0.020 + 0.030 * env;
        float beamMask  = smoothstep(beamWidth, 0.0, aDist) * smoothstep(0.45, 0.62, r);

        // Press pulse — a bright spear that travels inward as the event
        // decays. event=1 at press; the spear's leading edge starts at
        // the screen edge (r ≈ 1.0) and moves toward the gear (r ≈ 0.55).
        float ev   = u_key_event[i];
        float spearR = mix(0.55, 1.05, 1.0 - ev);
        float spearD = abs(r - spearR);
        float spear  = smoothstep(0.05, 0.0, spearD)
                     * smoothstep(0.018, 0.0, aDist) * ev * 1.3;

        // Per-key warm tint: amber → ember → wine across the row, plus
        // a brightness boost on the bass for a felt "weight" on each note.
        vec3 amber = vec3(1.20, 0.60, 0.18);
        vec3 ember = vec3(1.10, 0.40, 0.10);
        vec3 wine  = vec3(0.95, 0.25, 0.05);
        float t = fi / 8.0;
        vec3 tint = mix(amber, mix(ember, wine, smoothstep(0.5, 1.0, t)),
                        smoothstep(0.0, 0.5, t));

        col += tint * (beamMask * env * (0.7 + 0.6 * u_audio_bass) + spear);
    }

    // Composite over u_below (the gear). Beams are additive so they brighten
    // the gear edges where they cross — interaction is visible.
    vec3 below = texture(u_below, uv).rgb;
    vec3 mixed = below + col;

    // History feedback so beams leave brief contrails that fade as the key
    // releases — the rotation of the gear beneath drags the trails subtly.
    vec3 hist = texture(u_history, uv).rgb * 0.86;
    mixed = max(mixed, hist);

    fragColor = vec4(mixed, 1.0);
}
