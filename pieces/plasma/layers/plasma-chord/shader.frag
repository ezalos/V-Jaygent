// ABOUTME: Keyboard chord layer — pressed keys add high-frequency sin terms
// ABOUTME: that screen onto u_below; mobile (no keyboard) falls back to a
// ABOUTME: subtle hue rotation so the layer always contributes something.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform float     u_keys[15];
uniform float     u_key_event[15];
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform sampler2D u_below;

out vec4 fragColor;

// Keyboard layout per memory: 15 keys (a..l whites = 0..8, w/e/t/y/u/o
// blacks = 9..14). Map each to a harmonic multiplier so going up the
// keyboard adds finer texture; whites = 2x..6x base, blacks = 7x..12x.
const float harmonics[15] = float[15](
    2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 4.5, 5.0, 5.5,    // whites a..l
    7.0, 7.8, 8.6, 9.4, 10.2, 11.0                    // blacks w/e/t/y/u/o
);

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) {
        below = vec3(0.20, 0.10, 0.30);
    }

    // Sum keyboard-driven harmonic field. Each held key adds a sin term
    // at its harmonic frequency, weighted by its envelope. Press-events
    // briefly boost amplitude so taps "pop". With nothing held, this
    // sum is zero and the layer reduces to its idle behaviour below.
    float harm = 0.0;
    float anyKey = 0.0;
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        anyKey = max(anyKey, env);
        if (env < 0.001) continue;
        float h = harmonics[i];
        float pop = 1.0 + 1.5 * u_key_event[i];
        harm += sin(p.x * 8.0 * h + u_time * 1.7) * env * pop;
        harm += sin(p.y * 8.0 * h + u_time * 2.1) * env * pop;
    }
    harm *= 0.18;   // hold the harmonic overlay below the base in amplitude

    // Idle hue rotation — a slow ~0.04 Hz cycle so the layer still
    // contributes when no key is held (mobile, hands-off desktop).
    // Mixed in so harmonics dominate when keys are active.
    float idle  = 1.0 - smoothstep(0.0, 0.08, anyKey);
    float drift = 0.05 * sin(u_time * 0.25) * idle;

    // Touch proximity gathers across active touches — cross-couples touch
    // input into this layer so the chord layer also visibly responds to
    // the cursor (per-layer-interactivity contract).
    float touchHeat = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 tP = (t.xy / u_resolution.xy - 0.5) * vec2(aspect, 1.0);
        float r = length(p - tP);
        touchHeat += exp(-r * 5.0) * exp(-t.z * 1.2);
    }

    // Modulate hue by rotating in a magenta↔cyan plane. Touch heat
    // pushes the rotation phase forward so a finger drag visibly drags
    // the chord-layer hue with it.
    float phase = u_time * 0.7 + touchHeat * 1.8;
    vec3 tint = vec3(
        0.5 + 0.5 * sin(phase + 0.0),
        0.5 + 0.5 * sin(phase + 2.1),
        0.5 + 0.5 * sin(phase + 4.2)
    );

    vec3 col = below;

    // Screen blend the harmonic field onto u_below. Screen formula:
    // 1 - (1-a)(1-b). Clamp before screening so negative harm
    // doesn't darken (it's an overlay, additive in feel).
    vec3 add = tint * max(harm, 0.0);
    col = vec3(1.0) - (vec3(1.0) - col) * (vec3(1.0) - add);

    // Add the idle drift as a subtle additive shimmer. Touch heat also
    // brightens the shimmer near contact points so the cursor leaves a
    // visible glow even when no key is pressed.
    col += tint * (drift + 0.18 * touchHeat);

    fragColor = vec4(col, 1.0);
}
