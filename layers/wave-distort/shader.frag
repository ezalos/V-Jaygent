#version 300 es
// ABOUTME: Wave-distort layer — samples u_below at displaced UVs along a
// ABOUTME: low-frequency sine field, refracting whatever is beneath.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform sampler2D u_below;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float strength = 0.04 + 0.04 * u_audio_bass;
    vec2 wave = vec2(
        sin(uv.y * 8.0 + u_time * 0.5),
        cos(uv.x * 6.0 + u_time * 0.4)
    ) * strength;
    vec3 below = texture(u_below, uv + wave).rgb;
    fragColor = vec4(below, 1.0);
}
