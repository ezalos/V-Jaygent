// ABOUTME: Spatial-bin pass for swarm — buckets the 1000 boids into a 32x32 grid so
// ABOUTME: display only checks the local 3x3 neighbourhood instead of every boid.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform int       u_frame;
uniform sampler2D u_boids;

out vec4 fragColor;

const int BOIDS_GRID = 32;     // matches boids.frag — 32x32 = 1024 slots
const int NUM_BOIDS  = 1000;
const int BIN_GRID   = 32;     // 32x32 bins covering the unit canvas
const int BIN_CAP    = 4;      // boids per cell stored — overflow drops

void main() {
    ivec2 myCoord = ivec2(gl_FragCoord.xy);

    // Texels outside the 32x32 bin region: write sentinels.
    if (myCoord.x >= BIN_GRID || myCoord.y >= BIN_GRID) {
        fragColor = vec4(-1.0);
        return;
    }

    // This cell's bbox in normalized uv space.
    vec2 cellMin = vec2(myCoord)         / float(BIN_GRID);
    vec2 cellMax = vec2(myCoord + 1)     / float(BIN_GRID);

    vec4 ids    = vec4(-1.0);
    int  filled = 0;

    for (int i = 0; i < NUM_BOIDS; i++) {
        if (filled >= BIN_CAP) break;
        ivec2 bc = ivec2(i % BOIDS_GRID, i / BOIDS_GRID);
        vec2  bp = texelFetch(u_boids, bc, 0).xy;
        if (bp.x >= cellMin.x && bp.x < cellMax.x &&
            bp.y >= cellMin.y && bp.y < cellMax.y) {
            ids[filled] = float(i);
            filled++;
        }
    }

    fragColor = ids;
}
