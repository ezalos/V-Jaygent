// ABOUTME: 1000 Reynolds boids — separation, alignment, cohesion. Stored in a 32x32
// ABOUTME: region of an rgba16f ping-pong texture; rg = pos uv, ba = vel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_boids;   // self ping-pong

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

const int   GRID       = 32;       // 32 x 32 = 1024 slots; first NUM are alive
const int   NUM_BOIDS  = 1000;
const float DT         = 0.016;

// Reynolds rule weights. Tuned for the wrap-toroidal world with the boid
// density (1000 in [0,1]²) and the perception radius below.
const float PERCEPT_R   = 0.085;
const float SEPARATE_R  = 0.022;
const float W_SEPARATE  = 0.55;
const float W_ALIGN     = 0.06;
const float W_COHESION  = 0.045;
const float MAX_SPEED   = 0.42;
const float MIN_SPEED   = 0.10;

void main() {
    ivec2 myCoord = ivec2(gl_FragCoord.xy);
    int   id      = myCoord.y * GRID + myCoord.x;

    // Texels outside the 32x32 grid (and the unused tail past NUM_BOIDS) are zeros.
    if (myCoord.x >= GRID || myCoord.y >= GRID || id >= NUM_BOIDS) {
        fragColor = vec4(0.0);
        return;
    }

    float fi = float(id);

    if (u_frame == 0) {
        vec2 hp  = hash22(vec2(fi * 0.137 + 1.7, fi * 0.273 + 5.3));
        vec2 hv  = hash22(vec2(fi * 0.711 + 9.1, fi * 0.493 + 3.7)) - 0.5;
        // Initial speed somewhere in the comfortable band.
        vec2 v0  = normalize(hv + 1e-3) * (MIN_SPEED + 0.2 * fract(sin(fi * 4.7)));
        fragColor = vec4(hp, v0);
        return;
    }

    vec4 self = texelFetch(u_boids, myCoord, 0);
    vec2 pos  = self.xy;
    vec2 vel  = self.zw;

    // Reynolds accumulators.
    vec2 sepSum   = vec2(0.0);
    vec2 alignSum = vec2(0.0);
    vec2 cohSum   = vec2(0.0);
    int  alignN   = 0;
    int  cohN     = 0;

    const float P2 = PERCEPT_R  * PERCEPT_R;
    const float S2 = SEPARATE_R * SEPARATE_R;

    for (int j = 0; j < NUM_BOIDS; j++) {
        if (j == id) continue;
        ivec2 jc    = ivec2(j % GRID, j / GRID);
        vec4  other = texelFetch(u_boids, jc, 0);
        vec2  op    = other.xy;
        vec2  ov    = other.zw;

        // Toroidal delta — neighbours across the wrap edge still count.
        vec2 d = pos - op;
        d -= floor(d + 0.5);
        float r2 = dot(d, d);
        if (r2 > P2) continue;

        // Cohesion + alignment over the perception radius.
        cohSum   += op + d;     // = pos - d + d = pos's frame neighbour
        cohN     += 1;
        alignSum += ov;
        alignN   += 1;

        // Separation only inside the tighter radius. Linear falloff.
        if (r2 < S2) {
            float r = sqrt(r2 + 1e-6);
            sepSum += (d / r) * (1.0 - r / SEPARATE_R);
        }
    }

    // Cohesion: steer toward average neighbour position.
    if (cohN > 0) {
        vec2 avg = cohSum / float(cohN);
        vec2 toward = avg - pos;
        toward -= floor(toward + 0.5);   // toroidal
        vel += toward * W_COHESION;
    }

    // Alignment: steer toward average neighbour heading.
    if (alignN > 0) {
        vec2 avgVel = alignSum / float(alignN);
        vel += (avgVel - vel) * W_ALIGN;
    }

    // Separation: shove away from close neighbours.
    vel += sepSum * W_SEPARATE;

    // Speed clamps — keep flocks visibly moving but not warping.
    float speed = length(vel);
    if (speed > MAX_SPEED) vel *= MAX_SPEED / speed;
    if (speed < MIN_SPEED && speed > 1e-5) vel *= MIN_SPEED / speed;
    if (speed < 1e-5) {
        // Stalled — kick into a random direction.
        vec2 k = hash22(vec2(fi, u_time * 1.3)) - 0.5;
        vel = normalize(k + 1e-3) * MIN_SPEED;
    }

    pos += vel * DT;
    pos  = fract(pos);   // torus wrap

    fragColor = vec4(pos, vel);
}
