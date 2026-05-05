#version 300 es
// ABOUTME: Flow-particles — real physics layer. Consumes a published `force`
// ABOUTME: vec2 field, advects sparse hash-driven particles via semi-
// ABOUTME: Lagrangian integration through u_history (per-frame state). Each
// ABOUTME: frame: spawn at hash positions, advect existing particles by the
// ABOUTME: field, decay. Gives visible streamers being pulled toward the
// ABOUTME: published mass points.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_kick;
uniform float u_keys[15];
uniform float u_downbeat;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform sampler2D u_force;
out vec4 fragColor;

vec2 decodeForce(vec2 uv) {
    return texture(u_force, uv).rg * 2.0 - 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // === ADVECTION ===
    // Sample force at uv and step backward through it. Each stride samples
    // u_history at where the particle WAS the previous frame, so particles
    // visibly travel along force lines from frame to frame.
    vec2 vel = decodeForce(uv);
    float strength = 0.012 + 0.006 * u_audio_bass;

    // 3-step backward integration with mid-step force re-samples (RK2 vibe).
    vec2 q = uv;
    vec3 carried = vec3(0.0);
    float weight = 0.0;
    for (int s = 0; s < 4; s++) {
        vec2 fs = decodeForce(q);
        q -= fs * strength;
        float w = exp(-float(s) * 0.6);
        carried += texture(u_history, q).rgb * w;
        weight  += w;
    }
    carried /= max(weight, 1e-3);
    // Decay so trails don't accumulate to white. Slightly stronger decay
    // than the implicit u_history * 0.92 in mirror-bloom — particles
    // should fade visibly within a couple of seconds.
    carried *= 0.86;

    // === SPAWN ===
    // Sparse hash-driven seeding. Cell grid provides spawn density that
    // doesn't drift with the camera. Each cell has a hash-determined birth
    // probability; live cells emit a bright warm dot. Spawn density scales
    // with bass and any held key so playing notes inflates the cloud.
    float anyKey = 0.0;
    for (int i = 0; i < 15; i++) anyKey = max(anyKey, u_keys[i]);

    vec2 cell = floor(p * 22.0 + u_time * 0.15);
    float h = hash21(cell);
    float spawnGate = 0.97 - 0.06 * u_audio_bass - 0.06 * anyKey;
    vec3 fresh = vec3(0.0);
    if (h > spawnGate) {
        vec2 cellPos = (cell + 0.5) / 22.0;
        float d = length((p - cellPos) * vec2(1.0, 1.0));
        fresh = vec3(1.20, 0.65, 0.22) * smoothstep(0.012, 0.0, d) * (0.6 + 0.5 * h);
    }

    // Downbeat burst — strong outward spawn from centre on each bar's
    // downbeat. Particles get carried by the field thereafter.
    {
        float burstR = 0.04 + (1.0 - u_downbeat) * 0.18;
        float burstD = abs(length(p) - burstR);
        fresh += vec3(1.40, 0.85, 0.40) * smoothstep(0.014, 0.0, burstD) * u_downbeat * 0.9;
    }

    // === COMPOSITE ===
    vec3 below = texture(u_below, uv).rgb;
    // Particles ride OVER below; max-blend so they brighten without
    // washing the substrate to cream.
    vec3 col = max(below, carried + fresh);

    fragColor = vec4(col, 1.0);
}
