// ABOUTME: Eulerian boid-fluid sim — density / velocity / per-finger affinity in
// ABOUTME: rgba16f. Reynolds (alignment, cohesion, separation) + multi-finger forcing.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;

uniform vec4 u_touches[8];   // xy = px (target space), z = age_seconds, w = active 0/1
uniform int  u_touch_count;  // number of real fingers (0 → ghost orbiters)

#include "math.glsl"
#include "diffusion.glsl"
#include "noise.glsl"

out vec4 fragColor;

// Per-iteration timestep — combined with iterations: 2 in meta gives the
// field ~2 ticks per display frame at the chosen forcing constants.
const float DT = 0.04;

// Returns finger position (in normalized uv) and age. Synthesises 4 ghost
// orbiters when no real touches are active.
bool sampleFinger(int i, out vec2 fingerUv, out float age) {
    if (u_touch_count > 0) {
        vec4 t = u_touches[i];
        if (t.w < 0.5) return false;
        fingerUv = t.xy / u_resolution;
        age      = t.z;
        return true;
    }
    if (i >= 4) return false;
    float fi = float(i);
    // Mutually-prime-ish frequencies (Hz) so ghosts never re-align cleanly.
    float fx = 0.077 + 0.029 * fi;
    float fy = 0.061 + 0.041 * fi;
    float ax = 0.34 + 0.05 * sin(u_time * 0.07 + fi * 1.7);
    float ay = 0.27 + 0.05 * cos(u_time * 0.09 + fi * 2.3);
    fingerUv = vec2(
        0.5 + ax * sin(TAU * fx * u_time + fi * PHI * 1.7),
        0.5 + ay * sin(TAU * fy * u_time + fi * PHI * 2.9)
    );
    // Cycle 0..6.5 so ghosts periodically "lift off" and respawn — keeps
    // injection lively even on a desktop without a touchscreen.
    age = mod(u_time + fi * 1.7, 6.5);
    return true;
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution;
    vec2 texel = 1.0 / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    if (u_frame == 0) {
        // Seed: faint warm haze. Density mild, velocity zero, affinity mid.
        float seed = fbm(uv * 7.0) + 0.4 * fbm(uv * 22.0);
        float d0   = 0.08 + 0.18 * smoothstep(0.6, 1.3, seed);
        fragColor  = vec4(d0, 0.0, 0.0, 0.5);
        return;
    }

    // ---- Semi-Lagrangian advection ----
    vec4 self = texture(u_state, uv);
    vec2 vel  = self.gb;

    // Step backwards along velocity by DT (velocity is "uv per second").
    // Reflective boundary on each axis.
    vec2 advUv = uv - vel * DT;
    if (advUv.x < 0.0 || advUv.x > 1.0) vel.x *= -0.6;
    if (advUv.y < 0.0 || advUv.y > 1.0) vel.y *= -0.6;
    advUv = clamp(advUv, vec2(0.001), vec2(0.999));

    vec4  adv     = texture(u_state, advUv);
    float density = adv.r;
    vel           = adv.gb;
    float aff     = adv.a;

    // ---- Reynolds-on-a-grid ----
    vec4 lap = laplacian4(u_state, uv, texel);

    // Alignment: velocity diffusion (cells average neighbour velocities).
    vel += DT * 1.6 * lap.gb;
    // Density diffusion — kept tiny so density stays carried by advection,
    // not smeared by the kernel. Higher values turn the swarm into wash.
    density += DT * 0.05 * lap.r;

    // Density gradient — central differences.
    float dxR = texture(u_state, uv + vec2(texel.x, 0.0)).r
              - texture(u_state, uv - vec2(texel.x, 0.0)).r;
    float dyR = texture(u_state, uv + vec2(0.0, texel.y)).r
              - texture(u_state, uv - vec2(0.0, texel.y)).r;
    vec2  grad = vec2(dxR, dyR);
    float gMag = length(grad) + 1e-4;

    // Cohesion: pull toward density crests.
    vel += DT * 1.4 * grad;
    // Separation: push away from over-dense cells (negative-Laplacian = "I'm
    // denser than my neighbours") along the local gradient.
    vel -= DT * 2.2 * max(-lap.r, 0.0) * (grad / gMag);

    // ---- Multi-finger forcing + density injection ----
    for (int i = 0; i < 8; i++) {
        vec2  fUv;
        float fAge;
        if (!sampleFinger(i, fUv, fAge)) continue;

        // Aspect-correct so radii are circular in screen pixels.
        vec2  delta = (fUv - uv) * vec2(aspect, 1.0);
        float d2    = dot(delta, delta) + 4e-4;
        float d     = sqrt(d2);
        vec2  n     = delta / d;
        vec2  perp  = vec2(-n.y, n.x);

        // Newborn fingers spawn fastest, then settle.
        float newness = exp(-fAge * 0.55);

        // Inverse-square-ish falloff with softening.
        float falloff = 1.0 / (35.0 * d2 + 0.6);

        // Radial attraction.
        vel += DT * 0.55 * (1.0 + 1.7 * newness) * n * falloff;
        // Tangential swirl — orbital stirring character.
        vel += DT * 0.95 * perp * falloff;

        // Gaussian density injection at the finger. Tight σ keeps the
        // injection a readable cluster instead of a wide cloud.
        float sigma  = 0.028 + 0.010 * sin(u_time * 0.7 + float(i) * 1.7);
        float blob   = exp(-d2 / (sigma * sigma));
        density     += DT * (0.45 + 0.9 * newness) * blob;

        // Affinity pull toward this finger's slot.
        float targetAff = (float(i) + 0.5) / 8.0;
        float affPull   = saturate(DT * 6.0 * blob * (1.0 + 0.6 * newness));
        aff = mix(aff, targetAff, affPull);
    }

    // ---- Decay ----
    // Density half-life ~1s; velocity half-life ~3s. Decay > injection
    // is what gives the field room to breathe — saturation kills the
    // swarm character.
    density *= 0.965;
    vel     *= 0.985;

    // Float-precision caps. Density cap is the rim where Reinhard rolls
    // peaks toward warm-white; keeping it tight forces sharp edges on
    // dense cells.
    vel     = clamp(vel,     vec2(-2.5), vec2(2.5));
    density = clamp(density, 0.0,        1.6);
    aff     = saturate(aff);

    fragColor = vec4(density, vel.x, vel.y, aff);
}
