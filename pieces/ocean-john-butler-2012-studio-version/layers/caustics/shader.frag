#version 300 es
// ABOUTME: Caustics layer for ocean piece — chladni-style summed-sin filaments
// ABOUTME: lit by mid-frequency content (the long fingerpicked arpeggios). Pattern
// ABOUTME: principal axis snaps 90 degrees at each new bar, smoothed at bar-end.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
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

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Self-play synthetic mid-driver when no audio.
    float midDrive = mix(0.30 + 0.25 * sin(u_time * 0.9 + 0.7), u_audio_mid, u_audio_playing);

    // Bar-phase axis snap: rotation steps 90° per bar. The last 10% of a bar
    // smooths to the next angle so the snap reads as a quick turn, not a jump.
    float baseAngle = float(u_bar_index) * (PI * 0.5);
    float nextAngle = baseAngle + (PI * 0.5);
    float ease      = smoothstep(0.90, 1.00, u_bar_phase);
    float angle     = mix(baseAngle, nextAngle, ease);

    vec2 q  = rot(angle) * p;

    // Slow drift so the pattern is alive even at zero u_audio_mid.
    q += 0.08 * vec2(sin(u_time * 0.21), cos(u_time * 0.17));

    // Three rotated sin-wave grids summed — chladni-ish without solving the
    // PDE. Frequencies are coprime so the pattern doesn't repeat.
    float k1 = 17.0, k2 = 13.0, k3 = 23.0;
    float a = sin(q.x * k1) * cos(q.y * k1 * 0.93);
    float b = sin((q.x + q.y) * k2 * 0.71);
    vec2  q3 = rot(0.6) * q;
    float c = sin(q3.x * k3 * 0.61) * cos(q3.y * k3 * 0.47);

    float field = a * 0.5 + b * 0.30 + c * 0.40;
    // Filaments: sharp where the field crosses 0 (zero-set of summed sines).
    float filament = 1.0 - smoothstep(0.00, 0.18, abs(field));

    // Brightness from mid energy — long arpeggio middle = caustics in glory.
    float bright = 0.30 + 0.85 * midDrive;

    // Caustics fade with depth so they don't fight the abyss in deep sections.
    float depth = diveDepth(u_section_id, u_section_progress);
    float depthFade = mix(1.0, 0.45, depth);

    // Palette: turquoise body to highlight tip
    vec3 body = vec3(0.482, 0.906, 0.827);  // #7be7d3
    vec3 high = vec3(0.808, 0.976, 0.922);  // #cef9eb
    vec3 col  = mix(body, high, filament);

    float intensity = filament * bright * depthFade;
    fragColor = vec4(col * intensity, intensity);
}
