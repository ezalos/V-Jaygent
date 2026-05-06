#version 300 es
// ABOUTME: Fallback shader — runs only if the layer engine fails to load.
// ABOUTME: Replace with the piece's real shader when not using layers/.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
out vec4 fragColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 col = mix(vec3(0.05, 0.02, 0.0), vec3(1.0, 0.6, 0.2), uv.y);
    col *= 1.0 + 0.2 * u_audio_bass;
    fragColor = vec4(col, 1.0);
}
