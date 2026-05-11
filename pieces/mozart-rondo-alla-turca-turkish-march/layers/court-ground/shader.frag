#version 300 es
// ABOUTME: Deep ember court ground — radial gradient, max luminance ~0.18.
// ABOUTME: Replaces solid-warm for this piece — the haze + star + rings need a
// ABOUTME: dark stage to read against, not a bright cream wash.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_playing;
uniform float u_song_progress;

out vec4 fragColor;

void main() {
    vec2 c = (gl_FragCoord.xy - 0.5 * u_resolution)
           / min(u_resolution.x, u_resolution.y);
    float r = length(c);

    float playing = u_audio_playing;
    float bass = mix(0.0, u_audio_bass, playing);
    float gprog= mix(fract(u_time * 0.01), u_song_progress, playing);

    // Deep ember radial gradient — bright (but dim) at center, near-black at
    // edges. Maximum luminance kept low (~0.18) so the geometry layers above
    // can read against it.
    float core = 1.0 - smoothstep(0.0, 1.10, r);
    core *= 0.18;
    // Slow song-long deepening: outro ramps toward absolute black.
    core *= mix(1.0, 0.55, smoothstep(0.85, 1.0, gprog));
    // Subtle bass breathing on the core only.
    core *= 1.0 + 0.08 * bass;

    vec3 ember = vec3(0.55, 0.18, 0.06);
    vec3 col = ember * core;

    fragColor = vec4(col, 1.0);
}
