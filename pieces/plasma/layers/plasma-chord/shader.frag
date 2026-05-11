// ABOUTME: Keyboard-driven extra discharge paths — each held key adds a fixed
// ABOUTME: radial filament in addition to the chaotic field beneath. Touch
// ABOUTME: heat brightens the global ionisation tint.
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

#define TAU 6.28318530718

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;

    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) {
        below = vec3(0.025, 0.010, 0.055);
    }

    float r = length(p);
    float a = atan(p.y, p.x);

    // Stepped time — match the discharge cadence of plasma-base.
    float tStep = floor(u_time * 28.0) / 28.0;

    // Each held key claims a fixed angle slot around the electrode and
    // sustains a filament there. Press-events (u_key_event) flash that
    // filament brighter for ~150ms. White keys clockwise from top,
    // black keys counter-clockwise — symmetric, easy to reason about.
    vec3 keyArcs = vec3(0.0);
    float anyKey = 0.0;

    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        anyKey = max(anyKey, env);
        if (env < 0.001) continue;

        float fi = float(i);
        bool isWhite = i < 9;
        float keyAngle = isWhite
            ? -1.5708 + (fi / 9.0) * TAU            // whites clockwise from top
            : -1.5708 - ((fi - 9.0) / 6.0) * TAU;   // blacks counter-clockwise

        // Angular distance from this fragment to the key's filament,
        // wrapped into [-π, π].
        float dA = a - keyAngle;
        dA = atan(sin(dA), cos(dA));

        // Per-key noise wobble so even key-driven arcs look ionised,
        // not painted-on radial spokes.
        float wob = sin(r * 14.0 + tStep * 9.0 + fi * 2.3) * 0.06
                  + sin(r * 28.0 - tStep * 7.0 + fi * 1.7) * 0.025;
        float dW  = abs(dA - wob);

        // Glow falls off radially so key arcs don't reach to the corners.
        float radialFade = smoothstep(1.7, 0.05, r);

        // Press-event boost — a tap pops the arc bright before it
        // settles to the hold envelope.
        float pop = 1.0 + 1.8 * u_key_event[i];

        float core = exp(-dW * 55.0) * radialFade * env * pop;
        float wide = exp(-dW * 18.0) * radialFade * env * pop * 0.30;

        // Whites lean cyan-white; blacks lean magenta-violet so the two
        // groups are visually distinct.
        vec3 tintCore = isWhite
            ? vec3(0.75, 0.95, 1.00)
            : vec3(1.00, 0.55, 0.95);
        vec3 tintWide = isWhite
            ? vec3(0.55, 0.30, 0.80)
            : vec3(0.85, 0.20, 0.65);

        keyArcs += tintCore * core;
        keyArcs += tintWide * wide;
    }

    // Touch heat — sum of inverse-distance contributions from active
    // touches. Cross-couples touch input into this layer so the cursor
    // is visible here too even without keys (per per-layer-interactivity
    // contract in CLAUDE memory).
    float touchHeat = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 tP = (t.xy / u_resolution.xy - 0.5) * vec2(aspect, 1.0) * 2.0;
        float r2c = length(p - tP);
        touchHeat += exp(-r2c * 3.5) * exp(-t.z * 1.0);
    }

    // Global ionisation glow — touches and key-presses both raise the
    // ambient violet, like overdriving the gas in the bulb. Subtle so
    // it doesn't wash the arcs out.
    vec3 ambientBoost = vec3(0.40, 0.10, 0.55) * (touchHeat * 0.20 + anyKey * 0.10);

    vec3 col = below + keyArcs + ambientBoost;

    fragColor = vec4(col, 1.0);
}
