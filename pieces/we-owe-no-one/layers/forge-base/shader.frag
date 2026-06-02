#version 300 es
// ABOUTME: forge-base layer — near-black hearth with a coal-bed glow rising from
// ABOUTME: the bottom; breathes on energy, collapses dark in the breakdown.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_energy_smooth;
uniform float u_song_progress;
out vec4 fragColor;

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1, 0));
    float c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbmGrid(vec2 p){
    float v = 0.0, a = 0.55;
    mat2 r = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = r * p * 2.0 + vec2(1.7, 9.2); a *= 0.55; }
    return v;
}
// blackbody-honest warm cycle: cold iron -> wine -> ember -> amber -> white-hot
vec3 forgeColor(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(vec3(0.030, 0.018, 0.012), vec3(0.34, 0.075, 0.060), smoothstep(0.00, 0.34, t));
    c = mix(c, vec3(0.86, 0.255, 0.050), smoothstep(0.34, 0.62, t));
    c = mix(c, vec3(1.00, 0.62, 0.18),   smoothstep(0.62, 0.85, t));
    c = mix(c, vec3(1.00, 0.93, 0.80),   smoothstep(0.85, 1.00, t));
    return c;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);

    // energy: real envelope when playing, a slow synthetic breath when idle
    float breath = 0.34 + 0.16 * sin(u_time * 0.55);
    float energy = mix(breath, clamp(u_energy_smooth * 1.7, 0.0, 1.0), u_audio_playing);

    // coal bed — heat rises from the bottom; fbm pockets so it is never flat
    float bed     = smoothstep(1.15, -0.15, uv.y);
    float coals   = fbmGrid(vec2(p.x * 3.0, uv.y * 2.4 - u_time * 0.07));
    float pockets = fbmGrid(vec2(p.x * 6.0 + 3.0, uv.y * 5.0 - u_time * 0.13));
    float heat = bed * (0.42 + 0.85 * coals) + bed * bed * pockets * 0.55;
    heat *= 0.30 + 1.05 * energy;

    // three slow hot coal-cores low in the frame — landing spots in the base
    for (int k = 0; k < 3; k++){
        float fk = float(k);
        vec2 cc = vec2((hash21(vec2(fk, 1.0)) - 0.5) * aspect * 1.25,
                       0.05 + 0.17 * hash21(vec2(fk, 7.0)));
        float d = length((p - cc) * vec2(1.0, 1.7));
        heat += exp(-d * 7.0) * (0.22 + 0.34 * energy) * (0.62 + 0.38 * sin(u_time * 0.7 + fk * 2.1));
    }

    float t = heat * (0.60 + 0.10 * u_song_progress);
    vec3 col = forgeColor(clamp(t, 0.0, 0.66));
    col *= 0.52 + 0.48 * energy;          // the whole hearth dims when the forge cools
    col *= smoothstep(0.0, 0.05, u_song_progress);   // first ~14s the hearth lights from black

    fragColor = vec4(col, 1.0);
}
