// ABOUTME: breath — heat diffusion seeded by audio bands; silence = natural decay to black.
// ABOUTME: Single scalar field in .r; 8 sub-steps/frame, decay tuned to half-life ~0.9s.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;
uniform float     u_audio_bass;
uniform float     u_audio_mid;
uniform float     u_audio_high;
uniform float     u_audio_playing;
uniform float     u_audio_time;

#include "diffusion.glsl"
#include "noise.glsl"

out vec4 fragColor;

// Half-life ~0.9s at 480 sub-steps/sec: 0.5^(1/(0.9*480)) ≈ 0.9984.
const float DECAY   = 0.9983;
// 5-point stencil stability cap is 0.25; 0.22 gives headroom.
const float D_COEF  = 0.22;
// Per-sub-step deposit. v1 used 0.030 and saturated the field in ~5s;
// 0.004 holds source-centre equilibrium near the top of the palette's
// readable range so silence can actually register as a drop in level.
const float SEED_AMP = 0.004;

float gaussSource(vec2 p, vec2 c, float sigma) {
    vec2 d = p - c;
    return exp(-dot(d, d) / (sigma * sigma));
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    if (u_frame == 0) {
        // Start dark. The piece earns its first bloom.
        fragColor = vec4(0.0);
        return;
    }

    // Aspect-corrected field coords so source footprints read round.
    vec2  p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_audio_time;

    // Slow stereo drift of source x-positions (coprime periods) so the bands
    // migrate across the field instead of piling on the same column.
    float panBass = 0.22 * sin(t * 0.48);
    float panMid  = 0.30 * sin(t * 0.31 + 1.7);
    float panHigh = 0.38 * sin(t * 0.67 + 3.1);

    // Tiny spatial jitter via vnoise — keeps blobs from looking stamped.
    vec2 jitter = 0.03 * vec2(vnoise(vec2(t * 0.7,      0.3)) - 0.5,
                              vnoise(vec2(0.17,    t * 0.63)) - 0.5);

    // Bass low, mid middle, high upper. Mirrors piano register.
    vec2 cBass = vec2(panBass + jitter.x, -0.26 + jitter.y);
    vec2 cMid  = vec2(panMid  - jitter.y,  0.02 + jitter.x);
    vec2 cHigh = vec2(panHigh + jitter.x,  0.28 - jitter.y);

    // Band-specific spatial footprints.
    float sBass = gaussSource(p, cBass, 0.18);
    float sMid  = gaussSource(p, cMid,  0.12);
    float sHigh = gaussSource(p, cHigh, 0.07);

    // Audio gate: silence stops depositing. Decay does the rest.
    float seed = u_audio_playing * SEED_AMP *
                 (u_audio_bass * sBass
                + u_audio_mid  * sMid
                + u_audio_high * sHigh);

    float f  = texture(u_state, uv).r;
    float L  = laplacian(u_state, uv, texel, 0);
    float fn = (f + D_COEF * L) * DECAY + seed;

    fragColor = vec4(fn, 0.0, 0.0, 1.0);
}
