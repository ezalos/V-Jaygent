#version 300 es
// ABOUTME: Petal blooms at the 8 Ottoman star tips. Right-hand triplet runs
// ABOUTME: (u_audio_high) flare them; held keys add per-key blooms at fixed
// ABOUTME: angular slots around the star.
precision highp float;

#include "math.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_high;
uniform float u_audio_mid;
uniform float u_audio_playing;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_keys[15];
uniform float u_key_event[15];

uniform float tip_radius;

out vec4 fragColor;

void main() {
    vec2 c = (gl_FragCoord.xy - 0.5 * u_resolution)
           / min(u_resolution.x, u_resolution.y);

    float playing = u_audio_playing;
    float hi  = mix(0.20 + 0.15 * abs(sin(u_time * 2.3)), u_audio_high, playing);
    float mid = mix(0.30 + 0.20 * sin(u_time * 0.9),      u_audio_mid,  playing);
    float ba  = mix(fract(u_time * 0.125),                u_bar_phase,  playing);

    float r   = length(c);
    float ang = atan(c.y, c.x);

    // Star-tip rotation matches ottoman-star: bar_phase rotation.
    // (We don't have access to the snap window here, but the triplet bloom
    //  reads as bright points at the tips — slight angular drift between
    //  rotations doesn't visibly break the alignment, and the snap on
    //  ottoman-star will dominate the eye anyway.)
    float starAng = ba * TAU;

    // Petal-tip glow at 8 slots around the star.
    vec3 tipCol = vec3(1.00, 0.78, 0.40);
    float bloom = 0.0;

    // High-band drives the bloom RADIUS (geometric, not brightness).
    // Triplet runs in the right hand expand the petals outward visibly.
    float r_eff = tip_radius * (1.0 + 0.50 * hi);

    for (int i = 0; i < 8; i++) {
        float slotAng = -PI + float(i) / 4.0 * PI + starAng;
        float dAng = atan(sin(ang - slotAng), cos(ang - slotAng));
        float angMask = exp(-dAng * dAng * 90.0);

        float dr = abs(r - r_eff);
        float radMask = smoothstep(0.060, 0.0, dr);

        // Per-tip phase variation so they don't all blink together — driven by
        // beat_phase + slot index.
        float tipPhase = fract(ba * 4.0 + float(i) * 0.13);
        float pulse = pow(max(1.0 - tipPhase, 0.0), 3.0);
        bloom += angMask * radMask * pulse * 0.85;
    }

    // Held keys — each adds a bloom at its angular slot. 15 keys around the
    // ring at radius slightly outside the tips.
    float keyBloom = 0.0;
    for (int k = 0; k < 15; k++) {
        float env = u_keys[k] + u_key_event[k] * 0.7;
        if (env < 0.001) continue;
        float keyAng = -PI + (float(k) + 0.5) / 15.0 * TAU;
        float dAng = atan(sin(ang - keyAng), cos(ang - keyAng));
        float angMask = exp(-dAng * dAng * 60.0);
        float dr = abs(r - (tip_radius + 0.05));
        float radMask = smoothstep(0.050, 0.0, dr);
        keyBloom += env * angMask * radMask * 1.4;
    }

    vec3 col = tipCol * bloom + vec3(1.00, 0.90, 0.65) * keyBloom;

    // Soft compress.
    col = col / (1.0 + col * 0.5);

    fragColor = vec4(col, 1.0);
}
