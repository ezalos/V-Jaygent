#version 300 es
// ABOUTME: Caustics layer for ocean piece — chladni-style summed-sin filaments
// ABOUTME: lit by mid-frequency content. Cursor warps the chladni grid in a
// ABOUTME: local pocket (drag the pattern around). Each pressed key adds a
// ABOUTME: ringing point-source that emits caustic rings from the key's spawn.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform float u_audio_mid;
uniform float u_audio_playing;
uniform float u_bar_phase;
uniform int   u_bar_index;
uniform int   u_section_id;
uniform float u_section_progress;
out vec4 fragColor;

const float PI = 3.14159265358979;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float diveDepth(int sid, float prog) {
    float curve[8] = float[8](0.10, 0.30, 0.50, 0.60, 0.70, 1.00, 0.40, 0.00);
    int   nid = clamp(sid + 1, 0, 7);
    int   cid = clamp(sid, 0, 7);
    return mix(curve[cid], curve[nid], clamp(prog, 0.0, 1.0));
}

vec2 keyPos(int i, float aspect) {
    bool isBlack = (i >= 9);
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float x = (-0.45 + (pos / 8.0) * 0.90) * aspect;
    float y = isBlack ? -0.30 : -0.40;
    return vec2(x, y);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float midDrive = mix(0.30 + 0.25 * sin(u_time * 0.9 + 0.7), u_audio_mid, u_audio_playing);

    // Bar-phase axis snap (unchanged).
    float baseAngle = float(u_bar_index) * (PI * 0.5);
    float nextAngle = baseAngle + (PI * 0.5);
    float ease      = smoothstep(0.90, 1.00, u_bar_phase);
    float angle     = mix(baseAngle, nextAngle, ease);

    vec2 q  = rot(angle) * p;
    q += 0.08 * vec2(sin(u_time * 0.21), cos(u_time * 0.17));

    // Cursor warp: the chladni domain bends around the cursor — local UV
    // offset that decays with distance. Cursor visibly drags the pattern.
    if (!mouseIdle) {
        float cd  = length(p - mp);
        float pull = exp(-cd * cd * 4.0);
        q += (mp - p) * pull * 0.45;
    }

    // Three rotated sin-wave grids summed.
    float k1 = 17.0, k2 = 13.0, k3 = 23.0;
    float a = sin(q.x * k1) * cos(q.y * k1 * 0.93);
    float b = sin((q.x + q.y) * k2 * 0.71);
    vec2  q3 = rot(0.6) * q;
    float c = sin(q3.x * k3 * 0.61) * cos(q3.y * k3 * 0.47);

    float field = a * 0.5 + b * 0.30 + c * 0.40;

    // Held keys add ringing point-sources to the field — each key emits
    // expanding caustic rings from its bottom-row spawn point. White =
    // tighter rings, black = wider rings.
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.001) continue;
        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i, aspect);
        float r = length(p - kp);
        float freq = isBlack ? 18.0 : 26.0;
        // Age-driven outward sweep: ringRadius grows as envelope decays.
        float age    = 1.0 - env;
        float ring   = sin(r * freq - age * 8.0) * exp(-r * 1.6) * env;
        field += ring * (isBlack ? 0.55 : 0.40);
    }

    float filament = 1.0 - smoothstep(0.00, 0.18, abs(field));
    float bright = 0.30 + 0.85 * midDrive;

    // Cursor brightens the local pocket — caustics shine where you stir.
    if (!mouseIdle) {
        float cd = length(p - mp);
        bright += exp(-cd * cd * 6.0) * 0.6;
    }

    float depth = diveDepth(u_section_id, u_section_progress);
    float depthFade = mix(1.0, 0.45, depth);

    vec3 body = vec3(0.482, 0.906, 0.827);
    vec3 high = vec3(0.808, 0.976, 0.922);
    vec3 col  = mix(body, high, filament);

    // Cursor tints local caustics warmer (sun-touched water).
    if (!mouseIdle) {
        float cd = length(p - mp);
        float warm = exp(-cd * cd * 5.0);
        col = mix(col, vec3(1.00, 0.92, 0.65), warm * 0.45);
    }

    float intensity = filament * bright * depthFade;
    fragColor = vec4(col * intensity, intensity);
}
