#version 300 es
// ABOUTME: Silk display pass — composites the two scatter accumulators
// ABOUTME: (Clifford filament + chaos-game lace) with log tone-map onto
// ABOUTME: a near-black ground, then warm-cycles through wine→rust→amber→cream.
precision highp float;

uniform sampler2D u_clifford;
uniform sampler2D u_chaos;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_level;

out vec4 fragColor;

vec3 warmCycle(float t) {
    // 5-stop warm ramp: near-black → wine → rust → amber → cream.
    vec3 c0 = vec3(0.015, 0.005, 0.005);
    vec3 c1 = vec3(0.20,  0.05,  0.04);
    vec3 c2 = vec3(0.62,  0.24,  0.07);
    vec3 c3 = vec3(1.05,  0.62,  0.20);
    vec3 c4 = vec3(1.18,  0.86,  0.52);
    if (t < 0.25)      return mix(c0, c1, t / 0.25);
    else if (t < 0.5)  return mix(c1, c2, (t - 0.25) / 0.25);
    else if (t < 0.75) return mix(c2, c3, (t - 0.5) / 0.25);
    else               return mix(c3, c4, min(1.0, (t - 0.75) / 0.25));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Read the two density accumulators.
    vec3 dC = texture(u_clifford, uv).rgb;
    vec3 dG = texture(u_chaos, uv).rgb;

    // Compose: Clifford filament + chaos-game lace, both add.
    vec3 acc = dC + dG;

    // Log tone-map per-channel — fractal-flame convention. Accumulated
    // brightness can be huge in dense regions; log compresses to display.
    // Pushed harder so dense regions hit the amber / cream stops.
    vec3 toned = log(1.0 + acc * 22.0) / log(10.0);
    toned = clamp(toned, 0.0, 2.5);

    // Apply warm-cycle palette based on luminance — bright pixels go cream,
    // dim pixels stay near-black, mid range cycles wine→rust→amber.
    float lum = dot(toned, vec3(0.30, 0.59, 0.11));
    float t = clamp(lum * 1.6, 0.0, 1.0);
    vec3 col = warmCycle(t);

    // Audio-driven brightness lift on bass hits — keeps the filament alive
    // even at low accumulator density.
    col *= 0.95 + 0.4 * u_audio_bass;

    // Soft Reinhard cap.
    col = col / (1.0 + 0.25 * col);

    // Gentle gamma for display (per VISION).
    col = pow(max(col, 0.0), vec3(0.88));

    fragColor = vec4(col, 1.0);
}
