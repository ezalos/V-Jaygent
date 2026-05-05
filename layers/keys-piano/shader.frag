#version 300 es
// ABOUTME: Keys-piano layer — visualises the 9 white-key envelopes (u_keys[15])
// ABOUTME: as bright orbs in a horizontal row, with expanding rings triggered
// ABOUTME: by u_key_event[15] press pulses. Self-explanatory when paired with
// ABOUTME: the piece's meta.yaml notes ("press a-l").
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_keys[15];
uniform float u_key_event[15];
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

    // Idle pulse — across all 15 keys (9 white + 6 black).
    float anyEnv = 0.0;
    for (int i = 0; i < 15; i++) anyEnv = max(anyEnv, u_keys[i]);
    float idleBreath = (1.0 - smoothstep(0.0, 0.05, anyEnv));

    // Black keys sit above white keys at the half-positions that match
    // semitone gaps (no black between E-F or B-C).
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    float yWhite = -0.30;
    float yBlack = -0.18;

    vec3 col = vec3(0.0);
    // White keys (indices 0..8)
    for (int i = 0; i < 9; i++) {
        float fi = float(i);
        float xRow = (fi / 8.0 - 0.5) * 1.4 * aspect;
        vec2 c = vec2(xRow, yWhite);

        float idle = idleBreath * (0.18 + 0.18 * sin(u_time * 1.6 - fi * 0.7));
        float env = u_keys[i];
        float core = orb(p, c, 0.040 + 0.012 * env) * (0.10 + 1.30 * env + idle * 0.4);
        float halo = orb(p, c, 0.090 + 0.060 * env) * (0.06 + 0.55 * env + idle * 0.3);

        float ev = u_key_event[i];
        float ringProg = 1.0 - ev;
        float ringR    = 0.04 + 0.55 * ringProg;
        float ringW    = 0.012 * ev + 0.001;
        float ringHit  = ring(p, c, ringR, ringW) * ev * 1.4;

        vec3 tint = mix(vec3(1.10, 0.55, 0.18),
                        vec3(1.00, 0.42, 0.10),
                        fi / 8.0);
        col += tint * (core + halo + ringHit);
    }
    // Black keys (indices 9..14, smaller orbs above the row)
    for (int i = 0; i < 6; i++) {
        float pos = halfPositions[i];
        float xRow = (pos / 8.0 - 0.5) * 1.4 * aspect;
        vec2 c = vec2(xRow, yBlack);

        float idle = idleBreath * (0.10 + 0.12 * sin(u_time * 1.6 - pos * 0.7 + 1.5));
        float env = u_keys[9 + i];
        float core = orb(p, c, 0.026 + 0.010 * env) * (0.08 + 1.10 * env + idle * 0.3);
        float halo = orb(p, c, 0.060 + 0.040 * env) * (0.05 + 0.45 * env + idle * 0.2);

        float ev = u_key_event[9 + i];
        float ringProg = 1.0 - ev;
        float ringR    = 0.03 + 0.45 * ringProg;
        float ringW    = 0.010 * ev + 0.001;
        float ringHit  = ring(p, c, ringR, ringW) * ev * 1.2;

        // Black keys slightly cooler-warm so they read distinct from whites.
        vec3 tint = mix(vec3(1.00, 0.42, 0.10),
                        vec3(0.85, 0.30, 0.06),
                        pos / 8.0);
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
