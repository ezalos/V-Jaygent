// ABOUTME: Display pass for "danzas-percs" — Gray-Scott state rendered as brushed
// ABOUTME: steel/cobalt; the live reaction term (state.b) glows ember. Cold experiment.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;

uniform float u_downbeat;          // cold-white flash on pattern edges
uniform float u_beat_phase;        // grain jitter clock
uniform float u_bar_phase;         // slow luminance breath
uniform int   u_section_id;        // per-section steel temperature micro-shift
uniform float u_section_progress;  // exposure build within a section
uniform float u_song_progress;     // vignette slowly tightens
uniform float u_energy_smooth;     // overall exposure
uniform float u_audio_high;        // sub-beat grain shimmer

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

// Steel arc — brainstorming/palettes/cold-question.md, the sanctioned non-warm
// experiment. Cohesion via luminance inside one cold family; never passes
// through pure grey (every anchor keeps a blue temperature).
vec3 steel(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 s0 = vec3(0.045, 0.050, 0.100);   // near-black, blue cast (substrate)
    vec3 s1 = vec3(0.100, 0.160, 0.320);   // midnight
    vec3 s2 = vec3(0.200, 0.300, 0.500);   // deep steel
    vec3 s3 = vec3(0.500, 0.620, 0.800);   // steel
    vec3 s4 = vec3(0.920, 0.950, 1.000);   // cold white (peaks)
    if (t < 0.30) return mix(s0, s1,  t          * 3.3333);
    if (t < 0.60) return mix(s1, s2, (t - 0.30)  * 3.3333);
    if (t < 0.88) return mix(s2, s3, (t - 0.60)  * 3.5714);
    return                mix(s3, s4, (t - 0.88) * 8.3333);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    // Read gradients at the SIM texture's native texel, not the display's
    // (ferment lesson: bilinear smears the gradient otherwise).
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));

    vec4  state = texture(u_state, uv);
    float v      = state.g;
    float reactF = state.b;
    float reactS = state.a;

    // Freshness of the chemistry: fast EMA leading the slow EMA = recently
    // ignited reaction. Settled metabolism (every living rim reacts steadily)
    // has fast == slow and stays COLD — that's what keeps ember rare.
    float fresh  = smoothstep(0.05, 0.30, reactF - reactS);

    // Body: settled pattern in cold steel. Toe keeps the empty substrate at
    // the near-black anchor. Per-section micro-temperature: each section tilts
    // the steel a few percent warmer or cooler — a quiet section signature.
    // Burning loci are NOT settled — hold their steel at mid-tone so the ember
    // reads against blue instead of summing with peak-white into cream.
    float t   = smoothstep(0.03, 0.46, v) * (1.0 - 0.55 * fresh);
    vec3  col = steel(t);
    float tilt = (u_section_id >= 0) ? float(u_section_id % 3) - 1.0 : 0.0;
    col *= 1.0 + 0.04 * tilt * vec3(1.0, 0.2, -1.0);

    // ---- THE THESIS PIXEL: freshly-ignited chemistry REPLACES the steel with
    // glowing ember — saturated orange on blue, not an additive wash. The
    // travelling front of the current kick burns; its wake cools back to steel
    // within a couple of beats. Rare by construction (firefly, not bonfire).
    vec3 emberGlow = mix(vec3(0.55, 0.16, 0.05), vec3(1.0, 0.55, 0.18),
                         smoothstep(0.25, 0.8, reactF));
    col = mix(col, emberGlow, fresh * 0.9);

    // ---- Brushed-steel relief: v-gradient -> fake normal, fixed cold key
    // light from upper-left, tight specular. Pattern reads as etched metal.
    float vx = texture(u_state, uv + vec2(simTexel.x, 0.0)).g
             - texture(u_state, uv - vec2(simTexel.x, 0.0)).g;
    float vy = texture(u_state, uv + vec2(0.0, simTexel.y)).g
             - texture(u_state, uv - vec2(0.0, simTexel.y)).g;
    vec3  nrm  = normalize(vec3(-vx * 14.0, -vy * 14.0, 1.0));
    vec3  L    = normalize(vec3(-0.45, 0.65, 0.62));
    float diff = max(dot(nrm, L), 0.0);
    float spec = pow(max(reflect(-L, nrm).z, 0.0), 24.0);
    col *= 0.72 + 0.42 * diff;

    // Cursor brightens the specular locally — polish the steel by hand.
    float specGain = 0.30;
    if (u_mouse.x != 0.0 || u_mouse.y != 0.0) {
        vec2  mN = u_mouse / u_resolution;
        float md = length((uv - mN) * vec2(u_resolution.x / u_resolution.y, 1.0));
        specGain += 0.55 * smoothstep(0.30, 0.0, md);
    }
    col += vec3(0.85, 0.92, 1.0) * spec * specGain;

    // ---- Macro brightness envelope: two slowly-wandering hot-zones so the
    // squint reads light/dark composition, not flat tessellation (the RD
    // failure my macro-envelope note warns about). Section-seeded phase so
    // the composition re-arranges at boundaries. Cold: a luminance lift only.
    {
        float sph = (u_section_id >= 0) ? float(u_section_id) * 1.7 : 0.0;
        vec2  pp  = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2  h1  = 0.30 * vec2(sin(u_time * 0.047 + sph), cos(u_time * 0.039 + sph));
        vec2  h2  = 0.33 * vec2(cos(u_time * 0.031 + 1.9 - sph), sin(u_time * 0.053 + 0.7 + sph));
        col *= 0.62
             + 0.55 * exp(-dot(pp - h1, pp - h1) / 0.11)
             + 0.40 * exp(-dot(pp - h2, pp - h2) / 0.075);
    }

    // ---- Phase-lock in the display:
    // downbeat: cold-white flash on the pattern EDGES only (not a global pulse).
    float grad = length(vec2(vx, vy));
    float edge = smoothstep(0.015, 0.10, grad);
    col += vec3(0.92, 0.95, 1.0) * edge * u_downbeat * 0.32;
    // bar breath + section build + overall energy exposure.
    col *= (1.0 + 0.05 * exp(-u_bar_phase * 4.0))
         * mix(0.94, 1.07, u_section_progress)
         * (0.85 + 0.35 * u_energy_smooth);

    // Sub-beat shimmer: fine film grain, faster when the highs are busy.
    float g = hash21(gl_FragCoord.xy + vec2(fract(u_time) * 61.0, u_beat_phase * 37.0));
    col += (g - 0.5) * 0.030 * (0.35 + u_audio_high);

    col = reinhard(col);

    // Vignette tightens across the track (the long-period envelope's visual
    // echo) + house gamma.
    vec2 q = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col *= 1.0 - mix(0.22, 0.40, u_song_progress) * dot(q, q);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.92)), 1.0);
}
