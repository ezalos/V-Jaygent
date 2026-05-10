// ABOUTME: 100 Lagrangian boids — direct finger-orbit forcing + Reynolds separation +
// ABOUTME: torus-wrapped position. Stored in a 10x10 region of an rgba16f ping-pong tex.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;   // sim field — read .gb (vel) for a tiny "current"
uniform sampler2D u_boids;   // self ping-pong

uniform vec4 u_touches[8];
uniform int  u_touch_count;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

const int   NUM_BOIDS = 100;
const float DT        = 0.04;

// Same ghost generator as sim.frag / shader.frag — keeps the three in sync.
bool sampleFinger(int i, out vec2 fingerUv, out float age, out float gain) {
    if (i < u_touch_count) {
        vec4 t = u_touches[i];
        if (t.w < 0.5) return false;
        fingerUv = t.xy / u_resolution;
        age      = t.z;
        gain     = 1.0;
        return true;
    }
    int g = i - u_touch_count;
    if (g >= 4 || i >= 8) return false;
    float fi = float(g);
    float fx = 0.077 + 0.029 * fi;
    float fy = 0.061 + 0.041 * fi;
    float ax = 0.34 + 0.05 * sin(u_time * 0.07 + fi * 1.7);
    float ay = 0.27 + 0.05 * cos(u_time * 0.09 + fi * 2.3);
    fingerUv = vec2(
        0.5 + ax * sin(TAU * fx * u_time + fi * PHI * 1.7),
        0.5 + ay * sin(TAU * fy * u_time + fi * PHI * 2.9)
    );
    age = mod(u_time + fi * 1.7, 6.5);
    gain = (u_touch_count > 0) ? 0.5 : 1.0;
    return true;
}

void main() {
    ivec2 myCoord = ivec2(gl_FragCoord.xy);
    int   id      = myCoord.y * 10 + myCoord.x;

    if (myCoord.x >= 10 || myCoord.y >= 10 || id >= NUM_BOIDS) {
        fragColor = vec4(0.0);
        return;
    }

    float fi = float(id);

    if (u_frame == 0) {
        vec2 hp = hash22(vec2(fi * 0.137 + 1.7, fi * 0.273 + 5.3));
        fragColor = vec4(hp, 0.0, 0.0);
        return;
    }

    vec4 self = texelFetch(u_boids, myCoord, 0);
    vec2 pos  = self.xy;
    vec2 vel  = self.zw;

    // ---- Lifespan / respawn.
    // Each boid lives 4-9 seconds (per-boid hash) then respawns at a new
    // random position with zeroed velocity. Detect wrap by comparing age
    // to a one-frame-earlier sample of the same modular function.
    float lifespan = 4.0 + 5.0 * fract(sin(fi * 1.71) * 41.73);
    float phase    = fract(cos(fi * 2.39) * 13.71) * lifespan;
    float age      = mod(u_time + phase, lifespan);
    float prevAge  = mod(u_time + phase - 0.016667, lifespan);
    if (age < prevAge) {
        // Respawn at a fresh hash-driven position. Use floor(u_time/lifespan)
        // as part of the seed so consecutive lives don't repeat the same spot.
        float gen = floor((u_time + phase) / lifespan);
        vec2  hp  = hash22(vec2(fi + gen * 7.13, fi * 0.7 + gen * 3.37));
        pos = hp;
        vel = vec2(0.0);
    }

    // ---- Direct finger forcing — orbital, not collapsing.
    // Mostly-tangential force with a light radial component. Boids that
    // wander near a finger curve around it like a moon, then escape.
    vec2 fingerAcc = vec2(0.0);
    for (int i = 0; i < 8; i++) {
        vec2  fUv;
        float fAge;
        float fGain;
        if (!sampleFinger(i, fUv, fAge, fGain)) continue;

        // Toroidal distance — shortest delta on the wrapped canvas.
        vec2 d = fUv - pos;
        d -= floor(d + 0.5);
        float r2 = dot(d, d) + 5e-4;
        float r  = sqrt(r2);
        vec2  nrm  = d / r;
        vec2  perp = vec2(-nrm.y, nrm.x);

        // Falloff dies fast outside the orbit radius — local effect, not a
        // canvas-wide gravity well.
        float falloff = 1.0 / (40.0 * r2 + 0.4);

        // Tangent dominates → orbit. Tiny radial → keeps them in orbit
        // range without ever fully collapsing in.
        fingerAcc += (perp * 1.4 + nrm * 0.12) * falloff * fGain;
    }

    // ---- Reynolds separation — boids repel from nearby boids.
    // Each boid checks all 99 others; quadratic but only 10k fetches/frame
    // total since boids pass is 100 fragments. The repulsion uses toroidal
    // distance so wrap-around neighbours still count.
    const float SEP_RADIUS  = 0.07;        // ~7% of canvas
    const float SEP_RADIUS2 = SEP_RADIUS * SEP_RADIUS;
    vec2 sepAcc = vec2(0.0);
    for (int j = 0; j < NUM_BOIDS; j++) {
        if (j == id) continue;
        ivec2 jc = ivec2(j % 10, j / 10);
        vec4  other = texelFetch(u_boids, jc, 0);
        vec2  op    = other.xy;

        vec2 d = pos - op;
        d -= floor(d + 0.5);
        float r2 = dot(d, d);
        if (r2 < SEP_RADIUS2) {
            float r = sqrt(r2 + 1e-6);
            // Linear falloff — strongest at contact, zero at SEP_RADIUS.
            float strength = (SEP_RADIUS - r) / SEP_RADIUS;
            sepAcc += (d / r) * strength * strength * 1.6;
        }
    }

    // ---- Tiny "current" coupling to the velocity field — boids drift along
    // existing streamlines but don't lock onto them.
    vec2 fieldVel = texture(u_state, pos).gb;

    // ---- Integrate
    vel += DT * (fingerAcc + sepAcc);
    vel  = mix(vel, fieldVel, 0.05);    // very weak field bias, not a leash

    // Per-boid wobble keeps the swarm visually broken up.
    vec2 wobble = (hash22(vec2(fi * 1.7, u_time * 1.1)) - 0.5);

    // Minimum-speed kick — stalled boids pick a random heading.
    if (length(vel) < 0.06) {
        vec2 kick = (hash22(vec2(fi * 3.1, u_time * 0.7)) - 0.5);
        vel += kick * 0.5;
    }

    // Velocity cap so the orbits stay readable.
    float speed = length(vel);
    if (speed > 1.6) vel *= 1.6 / speed;

    pos += vel * DT * 0.85 + wobble * 0.008;
    pos  = fract(pos);   // torus wrap

    fragColor = vec4(pos, vel);
}
