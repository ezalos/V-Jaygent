// ABOUTME: Eclipse — two balls on a warm field: small bright Julia body + big
// ABOUTME: black void. Per-pixel Julia iteration inside each, unequal-mass physics.
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
uniform float u_ball_radius[4];

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// Warm ramp for the bright ball + background. Deep wine → amber → warm cream.
vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.020, 0.010, 0.020);
    vec3 c1 = vec3(0.180, 0.040, 0.060);
    vec3 c2 = vec3(0.55,  0.12,  0.12 );
    vec3 c3 = vec3(0.95,  0.40,  0.15 );
    vec3 c4 = vec3(1.00,  0.82,  0.50 );
    if (t < 0.25) return mix(c0, c1,  t          * 4.0);
    if (t < 0.55) return mix(c1, c2, (t - 0.25)  * 3.333);
    if (t < 0.82) return mix(c2, c3, (t - 0.55)  * 3.704);
    return                mix(c3, c4, (t - 0.82)  * 5.555);
}

// Dark ramp for the black ball's interior — mostly black, with faint embers
// only at the deep points of the Julia set. The void reveals itself only in
// silhouette.
vec3 shadowEmber(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.000, 0.000, 0.000);
    vec3 c1 = vec3(0.035, 0.010, 0.020);
    vec3 c2 = vec3(0.18,  0.04,  0.04 );
    vec3 c3 = vec3(0.42,  0.15,  0.08 );
    if (t < 0.55) return mix(c0, c1,  t          * 1.818);
    if (t < 0.85) return mix(c1, c2, (t - 0.55)  * 3.333);
    return                mix(c2, c3, (t - 0.85)  * 6.666);
}

// Smooth-escape Julia iteration. Returns a float in [0, iters] that encodes
// smoothly-interpolated escape time (or == iters if the point stayed bounded).
// This is the heart of the fractal interior — per-pixel complex iteration.
float julia(vec2 z, vec2 c, int maxIters) {
    float iter = 0.0;
    for (int i = 0; i < 256; i++) {
        if (i >= maxIters) break;
        if (dot(z, z) > 64.0) {
            // Smooth escape: continuous iter so bands are seamless.
            return float(i) - log2(log2(dot(z, z))) + 4.0;
        }
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    return float(maxIters);
}

// A brief trail-of-iterations trap — minimum |z|² encountered during the
// iteration. Gives bands INSIDE the set, not just outside. Needed for the
// interior to have visible fractal structure rather than being flat.
vec2 juliaTrap(vec2 z, vec2 c, int maxIters) {
    float trap = 1e10;
    float iter = 0.0;
    bool escaped = false;
    for (int i = 0; i < 256; i++) {
        if (i >= maxIters) break;
        trap = min(trap, dot(z, z));
        if (dot(z, z) > 64.0) {
            iter = float(i) - log2(log2(dot(z, z))) + 4.0;
            escaped = true;
            break;
        }
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    if (!escaped) iter = float(maxIters);
    return vec2(iter, trap);
}

// Render a fractal "world" inside a ball. `p` is pixel coords, `centre` +
// `r` are the ball's position + radius. `c` is the Julia parameter.
// `outer` selects the palette for escaped points; `inner` for interior.
// Returns a contribution colour plus a mask-alpha to composite cleanly.
vec4 fractalBall(vec2 p, vec2 centre, float r, vec2 c, float hitPulse,
                 bool light, float bass, float mid, float high) {
    vec2 q = p - centre;
    float dq = length(q);
    if (dq >= r) return vec4(0.0);

    float mask = ballMask(dq, r);
    float rim  = ballRim (dq, r);

    // Local coordinates in [-1.8, 1.8] range — a comfortable zoom for Julia.
    // High-frequency energy breathes the zoom in/out so ball interiors shiver
    // on every hat. Geometric (scale), not brightness.
    vec2 z = (q / r) * 1.8 * (1.0 + 0.025 * high * sin(u_time * 11.0));

    // Parameter c slowly drifts so the fractal reshapes itself.
    vec2 cDrift = c + 0.08 * vec2(cos(u_time * 0.13), sin(u_time * 0.09));
    // Kicks of bass push c outward — the fractal recomposes on the beat.
    // Amplitude boosted from 0.05 to 0.18 so the shudder reads.
    cDrift += 0.18 * bass * vec2(cos(u_time * 0.70), sin(u_time * 0.90));
    // Mids drag c on a slower, orthogonal clock so mid-range energy deforms
    // the Julia landscape independently of the kick.
    cDrift += 0.09 * mid  * vec2(sin(u_time * 0.43), cos(u_time * 0.31));

    vec2 res   = juliaTrap(z, cDrift, 80);
    float iter = res.x;
    float trap = res.y;
    bool  inSet = iter >= 79.5;

    vec3 col;
    if (light) {
        // Bright world: warm exterior, softer warm interior.
        if (inSet) {
            // Inside-set banding from orbit trap — gives internal fractal structure.
            float band = smoothstep(0.05, 2.0, trap);
            col = ember(0.35 + 0.4 * band) * (0.45 + 0.35 * band);
        } else {
            float t = fract(iter * 0.05 + u_time * 0.02);
            col = ember(0.55 + 0.35 * t) * (0.55 + 0.6 * t);
        }
        col *= 1.0 + 0.8 * hitPulse;
    } else {
        // Dark world: nearly black interior, embers at deep approaches.
        if (inSet) {
            float band = smoothstep(0.01, 1.2, trap);
            col = shadowEmber(0.20 + 0.6 * band) * (0.5 + 0.45 * band);
        } else {
            float t = fract(iter * 0.06 + u_time * 0.02);
            col = shadowEmber(0.35 + 0.5 * t) * (0.35 + 0.5 * t);
        }
        // Deep horizon: edges of disk darker than middle.
        col *= 0.7 + 0.5 * smoothstep(0.0, r * 0.9, r - dq);
        col *= 1.0 + 0.6 * hitPulse;
    }

    // Rim tint — warm for the bright ball, deep ember for the black.
    vec3 rimTint = light
        ? ember(0.86) * (0.8 + 0.9 * hitPulse)
        : ember(0.58) * (0.5 + 1.1 * hitPulse);

    // Collision flash inside the disk.
    float coll = ballHitRing(dq, r, hitPulse);
    vec3  collTint = light ? ember(0.95) : ember(0.75);

    return vec4(col * mask + rimTint * rim + collTint * coll * mask, mask);
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

    // --- Warm drifting background: very slow fbm, reads as atmosphere.
    vec2 w = vec2(fbmGrid(p * 0.9 + vec2(0.0, t * 0.04)),
                  fbmGrid(p * 0.9 + vec2(4.1, 1.7) - t * 0.03));
    float bg = fbmGrid(p * 1.1 + 1.5 * w);
    vec3 col = ember(0.25 + 0.35 * bg) * (0.28 + 0.55 * level);

    // --- Ball 1: small bright "white" (warm cream) Julia body.
    vec2  c1 = vec2(-0.72, 0.18);       // classic Julia parameter
    vec4  b1 = fractalBall(p, u_ball_pos[0], u_ball_radius[0], c1,
                           u_ball_hit[0], true, bass, mid, high);
    // --- Ball 2: big "black" Julia void with shadowy interior.
    vec2  c2 = vec2(-0.12, 0.74);       // different c → different fractal shape
    vec4  b2 = fractalBall(p, u_ball_pos[1], u_ball_radius[1], c2,
                           u_ball_hit[1], false, bass, mid, high);

    // Compose: the black ball occludes (overwrites) the background, the
    // white ball lays over both. Done via mask weights.
    col = mix(col, b2.rgb, b2.a);
    col = mix(col, b1.rgb + col * (1.0 - b1.a * 0.3), b1.a);

    // Shockwaves from each ball's actual last hit position.
    for (int i = 0; i < 2; i++) {
        float h = u_ball_hit[i];
        if (h < 0.01) continue;
        float age = -log(max(h, 1e-4)) / 4.0;
        float wv  = ballShockwave(p, u_ball_hit_pos[i], age, 1.15, 0.035);
        col += ember(i == 0 ? 0.95 : 0.60) * wv * (0.35 + 1.2 * h);
    }

    // Wall glow when either ball is about to hit.
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2  bounds = vec2(aspect, 1.0) * 0.96;
    float wall   = max(ballWallEnergy(u_ball_pos[0], bounds),
                       ballWallEnergy(u_ball_pos[1], bounds));
    col += ember(0.78) * pow(wall, 3.0) * 0.10;

    // Vignette + tonemap + gamma.
    col *= 1.0 - 0.28 * dot(p, p);
    col  = reinhard(col * 1.25);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
}
