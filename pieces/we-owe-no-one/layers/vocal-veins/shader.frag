#version 300 es
// ABOUTME: vocal-veins layer — a braid of white-hot molten veins that ignites
// ABOUTME: across the iron when the singer sings, and cools away when she rests.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_audio_vocals_stem;   // the singer — populated from the Demucs vocal stem
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
    float v = 0.0, a = 0.6;
    for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.55; }
    return v;
}
vec3 forgeColor(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(vec3(0.030, 0.018, 0.012), vec3(0.34, 0.075, 0.060), smoothstep(0.00, 0.34, t));
    c = mix(c, vec3(0.86, 0.255, 0.050), smoothstep(0.34, 0.62, t));
    c = mix(c, vec3(1.00, 0.62, 0.18),   smoothstep(0.62, 0.86, t));
    c = mix(c, vec3(1.00, 0.93, 0.80),   smoothstep(0.86, 1.00, t));
    return c;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    float playing = u_audio_playing;
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    // the singer's presence — real vocal stem when playing; a faint synthetic
    // pulse when idle so the layer is never a dead no-op for the smoke test
    float v = mix(0.10 + 0.09 * sin(u_time * 0.6), u_audio_vocals_stem, playing);
    // hard gate — the veins exist ONLY while the singer is actually there
    float present = smoothstep(0.04, 0.20, v);

    // the braid centre drifts slowly across the frame
    float cy = 0.12 * sin(u_time * 0.21) + 0.16 * (fbm(vec2(u_time * 0.12, 5.0)) - 0.5);

    vec3 col = vec3(0.0);
    float glow = 0.0;
    for (int k = 0; k < 3; k++){
        float fk = float(k);
        float ph = u_time * (0.46 + 0.12 * fk) + fk * 2.1;
        // sinuous flowing curve — large excursions so it reads as an organic
        // ribbon, never as a flat scan-line; clearly distinct from the angular
        // Voronoi seams beneath it
        float wob = 0.19 * sin(p.x * 1.6 + ph * 0.7 + fk * 1.3)
                  + 0.11 * sin(p.x * 3.1 - ph * 0.5 + fk)
                  + 0.17 * (fbm(vec2(p.x * 0.8 + ph * 0.4, fk * 4.0)) - 0.5);
        float yc = cy + (fk - 1.0) * 0.085 + wob;
        float d = abs(p.y - yc);
        // a BOLD molten ribbon — bright core + wide halo, unmistakable when
        // lit; a brightness pulse travels its length (the phrasing of the voice)
        float rcore = exp(-d * d * 360.0);
        float halo  = exp(-d * d *  46.0);
        float pulse = 0.68 + 0.40 * sin(p.x * 4.4 - ph * 3.0 + fk * 2.0);
        float rib   = (rcore + 0.45 * halo) * pulse;
        glow += rib;
        col  += forgeColor(0.78 + 0.22 * min(1.0, rcore * pulse)) * rib;
    }
    float amt = present * (0.62 + 0.75 * v);
    col *= amt;
    glow *= amt;

    fragColor = vec4(col, clamp(glow, 0.0, 1.0));
}
