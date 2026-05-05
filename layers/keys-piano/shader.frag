#version 300 es
// ABOUTME: Keys-piano layer — visualises the 9 white-key envelopes (u_keys[9])
// ABOUTME: as bright orbs in a horizontal row, with expanding rings triggered
// ABOUTME: by u_key_event[9] press pulses. Self-explanatory when paired with
// ABOUTME: the piece's meta.yaml notes ("press a-l").
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_keys[9];
uniform float u_key_event[9];
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

float orb(vec2 p, vec2 c, float r) {
    return smoothstep(r * 1.5, r * 0.6, length(p - c));
}

float ring(vec2 p, vec2 c, float r, float w) {
    float d = abs(length(p - c) - r);
    return smoothstep(w, 0.0, d);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Anchor row near the bottom of the frame so the upper 70% stays free
    // for trails and ambient layers above.
    float yRow = -0.30;

    // Idle pulse — when nothing is being pressed (max envelope ~ 0), each
    // orb breathes gently in sequence so the piece doesn't go dead and
    // the user sees the row inviting interaction.
    float anyEnv = 0.0;
    for (int i = 0; i < 9; i++) anyEnv = max(anyEnv, u_keys[i]);
    float idleBreath = (1.0 - smoothstep(0.0, 0.05, anyEnv));

    vec3 col = vec3(0.0);
    for (int i = 0; i < 9; i++) {
        float fi = float(i);
        // Spread 9 orbs across roughly aspect-corrected width.
        float xRow = (fi / 8.0 - 0.5) * 1.4 * aspect;
        vec2 c = vec2(xRow, yRow);

        // Idle breath has a phase offset per key — visible scanning across
        // the row about every 4 seconds.
        float idle = idleBreath * (0.18 + 0.18 * sin(u_time * 1.6 - fi * 0.7));

        // Held envelope: bright core + soft halo.
        float env = u_keys[i];
        float core = orb(p, c, 0.040 + 0.012 * env) * (0.10 + 1.30 * env + idle * 0.4);
        float halo = orb(p, c, 0.090 + 0.060 * env) * (0.06 + 0.55 * env + idle * 0.3);

        // Just-pressed pulse — expanding ring that grows over ~0.6s.
        // u_key_event decays from 1.0 at press to 0; we use (1 - event) as
        // the radius progress so the ring grows outward as the pulse fades.
        float ev = u_key_event[i];
        float ringProg = 1.0 - ev;          // 0 → 1 as the ring expands
        float ringR    = 0.04 + 0.55 * ringProg;
        float ringW    = 0.012 * ev + 0.001;
        float ringHit  = ring(p, c, ringR, ringW) * ev * 1.4;

        // Per-key warm tint — slight hue drift across the row so the eye
        // can locate which key just played even when several glow at once.
        // Stays inside the warm family (amber → ember).
        vec3 tint = mix(vec3(1.10, 0.55, 0.18),  // leftmost: amber
                        vec3(1.00, 0.42, 0.10),  // rightmost: ember
                        fi / 8.0);

        col += tint * (core + halo + ringHit);
    }

    // Composite over u_below (the ambient layer beneath). Use additive
    // mixing because the orbs are bright accents on a darker base.
    vec3 below = texture(u_below, uv).rgb;
    vec3 mixed = below + col;

    // History feedback — past press pulses leave fading echoes that drift
    // upward, suggesting "the note rises and dissipates". Sample at uv
    // shifted slightly down so the feedback PROCESS reads as upward motion.
    vec3 hist = texture(u_history, uv - vec2(0.0, 0.004)).rgb * 0.91;
    vec3 outCol = max(mixed, hist);

    // Output alpha 1; the compositor's blend mode for this layer should
    // be `replace` (or `add` if the piece wants the orbs to brighten
    // whatever's beneath rather than replace it).
    fragColor = vec4(outCol, 1.0);
}
