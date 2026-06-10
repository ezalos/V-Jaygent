// ABOUTME: Spatial-bin pass for kinetic-energy — buckets 2304 particles into a 48x48
// ABOUTME: grid so the trail pass only gathers the local 3x3 neighbourhood per pixel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform int       u_frame;
uniform sampler2D u_state;

out vec4 fragColor;

const int PGRID    = 32;     // matches sim.frag — 32x32 = 1024 particles
const int NUM      = 1024;
const int BIN_GRID = 48;     // 48x48 bins covering the unit canvas (~0.4 particle/cell)
const int BIN_CAP  = 4;      // particles per cell stored — overflow drops (trails hide it)

void main() {
    ivec2 c = ivec2(gl_FragCoord.xy);
    if (c.x >= BIN_GRID || c.y >= BIN_GRID) { fragColor = vec4(-1.0); return; }

    vec2 cellMin = vec2(c)     / float(BIN_GRID);
    vec2 cellMax = vec2(c + 1) / float(BIN_GRID);

    vec4 ids    = vec4(-1.0);
    int  filled = 0;

    for (int i = 0; i < NUM; i++) {
        if (filled >= BIN_CAP) break;
        ivec2 pc = ivec2(i % PGRID, i / PGRID);
        vec2  pp = texelFetch(u_state, pc, 0).xy;
        if (pp.x >= cellMin.x && pp.x < cellMax.x &&
            pp.y >= cellMin.y && pp.y < cellMax.y) {
            ids[filled] = float(i);
            filled++;
        }
    }

    fragColor = ids;
}
