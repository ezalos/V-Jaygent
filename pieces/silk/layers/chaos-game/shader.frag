#version 300 es
// ABOUTME: Chaos-game polygonal field — each pixel iterates the n-vertex
// ABOUTME: midpoint-jump from its UV. The orbit endpoint's distance to
// ABOUTME: the nearest polygon vertex draws the lace; n snaps by section.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform sampler2D u_history;

uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_kick;
uniform float u_audio_playing;
uniform float u_audio_drums_stem;
uniform float u_downbeat;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_song_progress;
uniform float u_section_progress;

uniform float iter_count;
uniform float seeds_per_frag;
uniform float hit_brightness;
uniform float zoom;
uniform float polygon_n;
uniform float polygon_phase;
uniform float k_depth;
uniform float jump_r;

out vec4 fragColor;

vec2 polygonVertex(int v, int N, float phase) {
    float ang = float(v) * TAU / float(N) + phase + PI * 0.5;
    return vec2(cos(ang), sin(ang));
}

int pickVertex(int N, int kd, vec3 hist, vec2 seed, int iterIdx) {
    int v = int(floor(hash21(seed + vec2(float(iterIdx)*0.171, 0.0)) * float(N))) % N;
    int last = int(hist.x);
    if (kd >= 1) {
        for (int t = 0; t < 4; t++) {
            if (v != last) break;
            v = int(floor(hash21(seed + vec2(float(iterIdx)*0.171, float(t+1)*0.379)) * float(N))) % N;
        }
    }
    bool equalRun = false;
    if (kd >= 3) equalRun = (int(hist.x) == int(hist.y) && int(hist.y) == int(hist.z));
    else if (kd >= 2) equalRun = (int(hist.x) == int(hist.y));
    if (equalRun) {
        int prev = last;
        for (int t = 0; t < 4; t++) {
            bool isNeighbor = (abs(v - prev) == 1) || (((v + 1) % N) == prev) || (((prev + 1) % N) == v);
            if (!isNeighbor) break;
            v = int(floor(hash21(seed + vec2(float(iterIdx)*0.171, float(t+9)*0.617)) * float(N))) % N;
        }
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p_screen = (uv - 0.5) * vec2(aspect, 1.0);
    float h_ramp = smoothstep(0.0, 1.0, float(u_frame) / 30.0);
    vec3 below = texture(u_below, uv).rgb;

    // Section table.
    int N_table[8] = int[8](3, 5, 6, 7, 5, 3, 5, 6);
    int K_table[8] = int[8](0, 2, 2, 2, 2, 0, 2, 2);
    int sid = u_section_id;
    if (u_audio_playing < 0.5) {
        sid = int(mod(u_time / 12.0, 8.0));
    }
    int N = N_table[sid % 8];
    int kd = K_table[sid % 8];
    float r = jump_r;

    float phase = polygon_phase + u_time * 0.08 + 0.04 * u_downbeat;

    float drum_pulse = mix(0.5 + 0.5*sin(u_time*1.4), max(u_audio_kick, u_audio_drums_stem), u_audio_playing);

    int K = int(iter_count);

    // High-frequency hash input: adjacent pixels get totally divergent
    // vertex sequences so the orbit endpoint distribution covers the
    // fractal, not a single basin.
    vec2 hashIn = p_screen * 80.0;
    vec2 seed = p_screen * 1.6 * zoom;
    vec2 p = seed;
    vec3 hist = vec3(99.0, 98.0, 97.0);
    int lastV = 0;

    for (int i = 0; i < 64; i++) {
        if (i >= K) break;
        int v = pickVertex(N, kd, hist, hashIn, i);
        vec2 vert = polygonVertex(v, N, phase);
        p = mix(p, vert, r);
        hist = vec3(float(v), hist.x, hist.y);
        lastV = v;
    }

    // Now `p` is the orbit endpoint — somewhere on the polygon's chaos-game
    // attractor. Distance from p to the NEAREST polygon vertex defines the
    // lace: pixels whose orbits end near a vertex get bright; pixels whose
    // orbits end near a central void get dark.
    float minDistToVertex = 1e9;
    for (int j = 0; j < 8; j++) {
        if (j >= N) break;
        vec2 vert = polygonVertex(j, N, phase);
        minDistToVertex = min(minDistToVertex, length(p - vert));
    }
    // Tight gaussian so vertices read as discrete bright nodes.
    float vertexProximity = exp(-minDistToVertex * minDistToVertex * 18.0);

    // Hash-cell filament: adjacent pixels with similar endpoints share a
    // brightness bin, drawing the lace structure.
    vec2 q = floor(p * 6.0) / 6.0;
    float cell = hash21(q + float(N) * 0.137);
    float filament = smoothstep(0.5, 0.85, cell);

    // Drum spotlight: brighten the vertex that the beat is "pointing at".
    int activeV = int(floor(drum_pulse * float(N) + u_time * 1.7)) % N;
    float vert_boost = (lastV == activeV) ? (1.0 + 1.2 * drum_pulse) : 1.0;

    // Combine — vertex proximity + filament cells, both boosted.
    float brightness = max(vertexProximity * 1.0, filament * 0.6) * vert_boost;

    // Section-snap thin ring on downbeat — extra visual punch at boundaries.
    brightness += 0.3 * u_downbeat * exp(-pow(length(p_screen) - 0.45, 2.0) * 400.0);

    // Golden amber (distinguishable from Clifford cream).
    vec3 col = brightness * vec3(1.20, 0.65, 0.22);

    vec3 final = below + col * h_ramp * 0.9;
    fragColor = vec4(final, 1.0);
}
