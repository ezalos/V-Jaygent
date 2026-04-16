// ABOUTME: Braid — four billiard balls used as *gravity lenses*, bending a warm
// ABOUTME: kaleidoscopic field. Collisions emit shockwaves from the real hit point.
#version 300 es
precision highp float;

#include "billiards.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;

uniform vec2  u_ball_pos[4];
uniform float u_ball_hit[4];
uniform vec2  u_ball_hit_pos[4];

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// Warm-biased ramp — deep wine up through amber to a warm peak.
vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.020, 0.010, 0.020);
    vec3 c1 = vec3(0.180, 0.040, 0.060);
    vec3 c2 = vec3(0.55,  0.12,  0.12 );
    vec3 c3 = vec3(0.95,  0.40,  0.15 );
    vec3 c4 = vec3(1.00,  0.78,  0.45 );
    if (t < 0.25) return mix(c0, c1,  t          * 4.0);
    if (t < 0.55) return mix(c1, c2, (t - 0.25)  * 3.333);
    if (t < 0.82) return mix(c2, c3, (t - 0.55)  * 3.704);
    return                mix(c3, c4, (t - 0.82)  * 5.555);
}

vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c) * p; }

// Dihedral-5 fold — the substrate is a 5-fold kaleidoscope that the lenses
// then bend. The whole pane is already symmetric; gravity just warps which
// part of it you see through any given pixel.
vec2 kaleido5(vec2 p, float axisAngle) {
    p = rot(p, -axisAngle);
    float r = length(p);
    float a = atan(p.y, p.x);
    const float sector = TAU / 5.0;
    a = mod(a, sector);
    a = abs(a - sector * 0.5);
    return vec2(cos(a), sin(a)) * r;
}

// Substrate: domain-warped fbm — slow, evolving, warm, read through kaleido5.
vec3 substrate(vec2 q, float t) {
    vec2 w1 = vec2(fbm(q * 1.0 + vec2(0.0, t * 0.06)),
                   fbm(q * 1.0 + vec2(4.7, 1.3) - t * 0.04));
    vec2 w2 = vec2(fbm(q * 1.3 + 2.0 * w1 + vec2(1.7, 9.2)),
                   fbm(q * 1.3 + 2.0 * w1 + vec2(8.3, 2.8) - t * 0.03));
    float n = fbm(q * 1.5 + 2.0 * w2);
    return ember(smoothstep(0.22, 0.90, n));
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;
    float audio = max(u_audio_playing, 0.0);
    float bass  = mix(0.28 + 0.15 * sin(t * 0.61), u_audio_bass,  audio);
    float mid   = mix(0.25 + 0.12 * sin(t * 0.43), u_audio_mid,   audio);
    float high  = mix(0.22 + 0.10 * sin(t * 1.09), u_audio_high,  audio);
    float level = mix(0.33, u_audio_level, audio);

    // Gravitational-lens deflection from all four masses. Each ball bends
    // sample position toward it by 1/|p - ball|. Kick strengthens the bend.
    vec2 lensShift = vec2(0.0);
    float G = 0.085 + 0.060 * bass;
    for (int i = 0; i < 4; i++) {
        lensShift += ballLens(p, u_ball_pos[i], G, 0.12);
    }
    vec2 sampleP = p + lensShift;

    // Substrate read through the 5-fold kaleidoscope, rotating slowly.
    float axis = t * 0.07;
    vec2 src = kaleido5(sampleP * 1.1, axis);
    vec3 col = substrate(src, t);

    // Contrast boost where the lens is bending hard — space squeezed, light
    // concentrated. Makes the "four weights deforming a sheet" reading
    // visually explicit.
    float lensMag = length(lensShift);
    col *= 0.85 + 1.5 * lensMag;

    // Collision shockwaves, originating at each ball's last hit position.
    // hitPulse ~= exp(-4·age), so age = -log(hitPulse)/4. Waves expand at
    // 1.2 units/s with 0.04-unit thickness; fade entirely over ~1.2s.
    for (int i = 0; i < 4; i++) {
        float h = u_ball_hit[i];
        if (h < 0.01) continue;
        float age  = -log(max(h, 1e-4)) / 4.0;
        float wave = ballShockwave(p, u_ball_hit_pos[i], age, 1.2, 0.04);
        col += ember(0.95) * wave * (0.4 + 2.0 * h);
    }

    // Per-ball wall-proximity glow — brightens a zone when any ball is
    // about to hit a wall.
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2  bounds = vec2(aspect, 1.0) * 0.96;
    float wallGlow = 0.0;
    for (int i = 0; i < 4; i++) {
        wallGlow = max(wallGlow, ballWallEnergy(u_ball_pos[i], bounds));
    }
    col += ember(0.80) * pow(wallGlow, 3.0) * 0.12;

    // Tiny bright cores where the balls actually are. Most of the visual
    // story is the deformation they cause — these are just anchors for
    // the eye. Each ball carries a slightly different hue offset.
    for (int i = 0; i < 4; i++) {
        float d2 = dot(p - u_ball_pos[i], p - u_ball_pos[i]);
        float core = exp(-280.0 * d2) * 0.9
                   + exp(-40.0  * d2) * 0.18;
        float hueOffset = 0.72 + 0.06 * float(i);
        col += ember(hueOffset) * core * (0.75 + 1.3 * bass);
    }

    // Level gates global brightness so quiet moments read as quiet.
    col *= 0.55 + 1.1 * level;

    // Vignette + tonemap + gentle gamma.
    col *= 1.0 - 0.28 * dot(p, p);
    col  = reinhard(col * 1.3);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
}
