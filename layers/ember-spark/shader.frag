#version 300 es
// ABOUTME: Ember-spark layer — sparse warm sparks that leave trails via
// ABOUTME: u_history feedback. Hash-driven positions on a slow drift; trail
// ABOUTME: half-life ~140ms (0.92/frame) per TouchDesigner empirical norm.
precision highp float;

// hash21 inlined to dodge a layer-engine compile path issue with #include
// resolution when 3+ layers stack (root cause TBD).
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform sampler2D u_history;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Sparse spark field — 8 spark centres on a slow lissajous, plus a
    // jittered cloud of micro-sparks driven by hash21.
    vec3 spark = vec3(0.0);
    for (int k = 0; k < 8; k++) {
        float fk = float(k);
        vec2 c = vec2(
            0.5 + 0.4 * sin(u_time * (0.13 + fk * 0.07) + fk * 1.7),
            0.5 + 0.4 * cos(u_time * (0.11 + fk * 0.09) + fk * 2.3)
        );
        float d = length((uv - c) * vec2(u_resolution.x / u_resolution.y, 1.0));
        float core = exp(-d * 60.0) * (0.6 + 0.4 * sin(u_time * 1.3 + fk));
        spark += vec3(1.0, 0.65, 0.25) * core;
    }
    // Jittered cloud
    vec2 cell = floor(uv * 64.0);
    float h = hash21(cell);
    if (h > 0.985) {
        vec2 cellPos = (cell + 0.5) / 64.0;
        float d = length((uv - cellPos) * vec2(u_resolution.x / u_resolution.y, 1.0));
        spark += vec3(1.0, 0.8, 0.4) * exp(-d * 320.0) * (0.6 + 0.4 * u_audio_bass);
    }

    // Trails via u_history — slight inward drift toward centre (a ghost of
    // gravity) so old sparks slowly migrate, not just decay in place.
    vec2 drift = (vec2(0.5) - uv) * 0.002;
    vec3 hist = texture(u_history, uv + drift).rgb * 0.92;

    fragColor = vec4(max(spark, hist), max(spark.r, hist.r * 0.5));
}
