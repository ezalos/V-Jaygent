#version 300 es
// ABOUTME: heat-bed — colorizes the consumed `heat` field into a dark warm
// ABOUTME: fever ground that heats (hue) across the song; near-black canvas.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_song_progress;
uniform sampler2D u_heat;          // consumed publish from heat-field

out vec4 fragColor;

// --- fever palette (warm arc only; copy-pasted per piece per the phrasebook
// rule). x in [0,1]: 0 = near-black, 1 = cream-hot. Luminance carries
// contrast; hue stays inside the sanctioned warm arc gold->crimson->hot-pink.
vec3 fever(float x) {
    x = clamp(x, 0.0, 1.0);
    vec3 c0 = vec3(0.020, 0.006, 0.012);   // near-black
    vec3 c1 = vec3(0.300, 0.040, 0.105);   // deep wine
    vec3 c2 = vec3(0.760, 0.130, 0.120);   // ember-crimson
    vec3 c3 = vec3(1.000, 0.430, 0.150);   // tangerine
    vec3 c4 = vec3(1.000, 0.745, 0.350);   // amber-gold
    vec3 c5 = vec3(1.000, 0.880, 0.740);   // cream-hot
    vec3 c;
    if      (x < 0.2) c = mix(c0, c1, x / 0.2);
    else if (x < 0.4) c = mix(c1, c2, (x - 0.2) / 0.2);
    else if (x < 0.6) c = mix(c2, c3, (x - 0.4) / 0.2);
    else if (x < 0.8) c = mix(c3, c4, (x - 0.6) / 0.2);
    else              c = mix(c4, c5, (x - 0.8) / 0.2);
    return c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float prog = u_song_progress;

    float heat = texture(u_heat, uv).r;

    // slow warm fbm for the bed's mid-octave depth. Kept single-octave and
    // slow on purpose: an animated/fine texture under the moving heat-pool
    // reads as high-frequency motion and breaks prediction_continuity. The
    // frame's other octaves come from the pool (coarse) + filaments/clave
    // dots (fine) in the layers above.
    float coarse = fbmRot(p * 3.4 + vec2(0.0, u_time * 0.04));
    float grain = 0.60 + 0.34 * coarse;
    heat *= grain;

    // DISPLAY is dim and dark: only the pool glows, faintly. fever rises a
    // touch across the song (palette warmth) but the bed never blooms bright
    // — the rising fever is carried by the PENS, not a flooded canvas.
    float x = heat * (0.34 + 0.12 * prog) + 0.012;
    vec3 col = fever(x);

    // hot-pink injection toward the peak (mambo/pregón) — stays in warm arc.
    float peak = smoothstep(0.45, 0.78, prog) * (1.0 - smoothstep(0.86, 1.0, prog));
    col = mix(col, col * vec3(1.05, 0.74, 0.86), 0.30 * peak * smoothstep(0.4, 1.0, heat));

    col *= 0.62;                                         // keep the ground dark
    fragColor = vec4(col, 1.0);
}
