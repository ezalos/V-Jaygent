#version 300 es
// ABOUTME: Display pass for "ink-bloom" — paper, granulation, Beer-Lambert
// ABOUTME: subtractive pigment compositing, blur-difference edge darkening.
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_field;        // pigment sim: rgb densities, a wetness

uniform float u_energy_smooth;
uniform float u_song_progress;
uniform float u_audio_playing;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

// Pigment transmittance per unit density — multiply-only, so overlapping
// glazes can only darken (the watercolour identity move). Sienna / carmine /
// indigo: an analogous sweep, no complementary jumps.
const vec3 T_SIENNA  = vec3(0.80, 0.50, 0.30);
const vec3 T_CARMINE = vec3(0.72, 0.30, 0.36);
const vec3 T_INDIGO  = vec3(0.34, 0.40, 0.56);
const vec3 PAPER     = vec3(0.945, 0.905, 0.825);

float tooth(vec2 q) {
    // paper grain at three scales; valleys (low) catch pigment
    return vnoise(q * 0.060) * 0.5
         + vnoise(q * 0.121 + 31.7) * 0.3
         + hash21(floor(q * 0.31)) * 0.2;
}

void main() {
    vec2 uv  = gl_FragCoord.xy / u_resolution;
    vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p   = uv * asp;
    // fixed virtual paper resolution so the grain is render_scale-invariant
    vec2 q   = p * 1100.0;

    vec4  f    = texture(u_field, uv);
    vec3  dens = f.rgb;
    float wet  = f.a;
    float dry  = 1.0 - smoothstep(0.05, 0.5, wet);

    // --- Granulation: pigment settles into the paper valleys as it dries.
    // Static (sampled fresh each frame, never fed back), per-family offsets so
    // the families separate slightly — the warm/cool settling split.
    float granAmt = 0.30 + 0.38 * dry;
    float g0 = 1.0 - smoothstep(0.25, 0.65, tooth(q));
    float g1 = 1.0 - smoothstep(0.25, 0.65, tooth(q + 13.1));
    float g2 = 1.0 - smoothstep(0.25, 0.65, tooth(q + 27.3));
    vec3 gd = dens * mix(vec3(1.0), 0.55 + 0.90 * vec3(g0, g1, g2), granAmt);

    // --- Paper: cream with tooth shading and a soft deckle vignette.
    float pt = tooth(q * 1.7 + 5.0);
    vec3 paper = PAPER * (0.975 + 0.045 * pt);
    vec2 eb = min(p, asp - p);
    paper *= 0.92 + 0.08 * smoothstep(0.0, 0.05, min(eb.x, eb.y));

    // --- Subtractive compositing: Beer-Lambert per family. Multiply-only.
    vec3 col = paper
             * pow(T_SIENNA,  vec3(gd.r))
             * pow(T_CARMINE, vec3(gd.g))
             * pow(T_INDIGO,  vec3(gd.b));

    // --- Edge darkening (blur-difference on total density): the dark rim where
    // a wash ends — THE cue that flips dye into paint. Stronger where dry.
    vec2 spx = 1.6 / vec2(textureSize(u_field, 0));
    float total = dot(dens, vec3(1.0));
    float blurT = 0.0;
    for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7853982;        // 8-tap ring
        blurT += dot(texture(u_field, uv + vec2(cos(a), sin(a)) * spx).rgb,
                     vec3(1.0));
    }
    blurT *= 0.125;
    float edge = clamp(abs(total - blurT) * 2.6, 0.0, 0.85)
               * (0.45 + 0.55 * dry);
    col = pow(col, vec3(1.0 + edge * 1.35));

    // --- Wet sheen: standing water lifts the surface slightly while it flows.
    col *= 1.0 + 0.05 * smoothstep(0.3, 0.9, wet);

    // --- Macro envelope: two slow wandering light zones so the squint reads
    // light/dark, not flat texture. Plus a gentle warm lean as the song peaks.
    vec2 hz1 = vec2(0.5 * asp.x, 0.5)
             + 0.33 * vec2(sin(u_time * 0.047 + 2.0), cos(u_time * 0.035));
    vec2 hz2 = vec2(0.5 * asp.x, 0.5)
             + 0.36 * vec2(sin(u_time * 0.026 + 4.5), cos(u_time * 0.041 + 1.1));
    vec2 d1 = p - hz1, d2 = p - hz2;
    float men = mix(0.52, u_energy_smooth, u_audio_playing);
    col *= 0.955 + (0.055 + 0.115 * men) * exp(-dot(d1, d1) / 0.17)
                 - (0.035 + 0.070 * men) * exp(-dot(d2, d2) / 0.23);
    col *= mix(vec3(1.0), vec3(1.025, 0.995, 0.955),
               0.5 * mix(0.3, u_energy_smooth, u_audio_playing));

    // dither against 8-bit banding on the big flat paper field
    col += (hash21(gl_FragCoord.xy + fract(u_time) * 61.7) - 0.5) / 255.0;

    fragColor = vec4(saturate3(col), 1.0);
}
