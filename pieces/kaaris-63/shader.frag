#version 300 es
// ABOUTME: Fallback shader — runs only if the layer engine fails to load.
// ABOUTME: Replace with the piece's real shader when not using layers/.
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
out vec4 fragColor;
void main() {
    // Clear "broken" tell: solid dark red. If you see this, the layer
    // engine failed to load — the real piece is the layers/ stack.
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float bar = step(0.48, uv.y) * step(uv.y, 0.52);
    fragColor = vec4(0.35 + 0.4 * bar, 0.0, 0.0, 1.0);
}
