#version 300 es
// ABOUTME: heat-haze layer — rising fbm displacement of u_below; warp amount
// ABOUTME: scales with audio level + energy. The forge shimmer.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform float u_audio_playing;
uniform float u_audio_level;
uniform float u_energy_smooth;
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1, 0));
    float c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
    float v = 0.0, a = 0.55;
    mat2 r = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = r * p * 2.0 + vec2(1.7, 9.2); a *= 0.55; }
    return v;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float playing = u_audio_playing;

    float level  = mix(0.32 + 0.20 * sin(u_time * 0.8), u_audio_level, playing);
    float energy = mix(0.34 + 0.16 * sin(u_time * 0.55), u_energy_smooth, playing);

    // rising heat cells — the warp field scrolls upward
    vec2 wcoord = vec2(uv.x * 5.0, uv.y * 5.0 - u_time * 0.45);
    vec2 warp = vec2(fbm(wcoord), fbm(wcoord + 17.0)) - 0.5;
    // hotter near the bottom of the frame where the forge is fiercest
    float rise = mix(1.0, 0.35, smoothstep(0.0, 1.0, uv.y));
    float amt = (0.0045 + 0.020 * level + 0.016 * energy) * rise;

    vec2 q = uv + warp * amt;
    vec3 col = texture(u_below, q).rgb;

    // bottom-layer / empty fallback
    if (dot(col, vec3(1.0)) < 0.01) col = texture(u_below, uv).rgb;

    // faint heat ghosting — the shimmer has a little temporal persistence
    float ramp = smoothstep(0.0, 1.0, float(u_frame) / 30.0);
    vec3 hist = texture(u_history, q).rgb;
    col = mix(col, max(col, hist), 0.12 * ramp);

    fragColor = vec4(col, 1.0);
}
