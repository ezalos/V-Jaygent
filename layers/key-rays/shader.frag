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
uniform float u_keys[15];
uniform float u_key_event[15];
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

    // 15 angular positions: 9 white at integer i/8.0 of a fanned arc,
    // 6 black at the half-positions (between white pairs that have a
    // semitone between them). Black keys get a slightly different angle
    // shift outward so the visual reads as "sharps sit between naturals"
    // rather than overlapping.
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);

    for (int i = 0; i < 15; i++) {
        float pos;
        bool isBlack = (i >= 9);
        if (isBlack) pos = halfPositions[i - 9];
        else         pos = float(i);

        float keyAng = -PI + 0.35 + (pos / 8.0) * (TAU - 0.7);
        float aDist = angDist(ang, keyAng);

        float env = u_keys[i];
        float ev  = u_key_event[i];

        // Held beam — narrow line from r=0.55 outward. Black keys get a
        // slightly tighter beam so they read as accent rays, not voices
        // that fight the white naturals.
        float beamWidth = (isBlack ? 0.014 : 0.020) + 0.030 * env;
        float innerR    = isBlack ? 0.50 : 0.45;
        float beamMask  = smoothstep(beamWidth, 0.0, aDist)
                        * smoothstep(innerR, innerR + 0.17, r);

        // Press spear — leading edge travels inward as event decays.
        float spearR = mix(0.55, 1.05, 1.0 - ev);
        float spearD = abs(r - spearR);
        float spear  = smoothstep(0.05, 0.0, spearD)
                     * smoothstep(isBlack ? 0.012 : 0.018, 0.0, aDist) * ev * 1.3;

        // Per-key warm tint: amber → ember → wine left to right across
        // the chromatic semitone count (15 steps).
        vec3 amber = vec3(1.20, 0.60, 0.18);
        vec3 ember = vec3(1.10, 0.40, 0.10);
        vec3 wine  = vec3(0.95, 0.25, 0.05);
        // Map by SEMITONE index (chromatic) so adjacent white+black
        // pairs share similar hue — sharps don't jump across the
        // palette.
        float semitone = isBlack ? halfPositions[i - 9] : float(i);
        float tHue = semitone / 8.0;
        vec3 tint = mix(amber, mix(ember, wine, smoothstep(0.5, 1.0, tHue)),
                        smoothstep(0.0, 0.5, tHue));
        // Black keys slightly darker / cooler-warm so they read distinct.
        if (isBlack) tint *= 0.85;

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
