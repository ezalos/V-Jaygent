#version 300 es
// ABOUTME: Abyss layer for ocean piece — deep blue volumetric gradient that
// ABOUTME: swells deeper as sections progress, with a once-per-piece wave-break
// ABOUTME: shockwave at section 5 (the percussive climax of John Butler's Ocean).
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_low;
uniform float u_audio_playing;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
out vec4 fragColor;

// dive-depth curve indexed by section id, smoothed by section progress.
// 8 sections: calm-surface → deep-storm → surfacing breach.
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

    // Self-play: when no audio, breathe a synthetic low-freq pulse so the
    // bottom layer never goes flat.
    float lowDrive = mix(0.35 + 0.25 * sin(u_time * 0.6), u_audio_low, u_audio_playing);
    float depth    = diveDepth(u_section_id, u_section_progress);

    // Vertical gradient: deep at bottom, less-deep at top. As `depth`
    // rises, the deep band climbs the frame — viewer sinks.
    float horizon = mix(0.85, 0.05, depth);  // y-coord of horizon glow

    // Three-stop palette: deep → mid → near-surface
    vec3 cDeep = vec3(0.016, 0.071, 0.165);  // #04122a
    vec3 cMid  = vec3(0.039, 0.227, 0.361);  // #0a3a5c
    vec3 cTop  = vec3(0.102, 0.416, 0.541);  // #1a6a8a

    float yt = smoothstep(0.0, horizon, uv.y);          // 0 at deep, 1 at horizon
    vec3 col = mix(cDeep, cMid, yt);
    col = mix(col, cTop, smoothstep(horizon, horizon + 0.25, uv.y));

    // Slow vertical column drift — caustic shadows passing through deep water.
    float column = sin(p.x * 5.0 + u_time * 0.20) * 0.5 + 0.5;
    column *= sin(p.x * 11.0 - u_time * 0.13) * 0.5 + 0.5;
    col *= 0.85 + 0.20 * column;

    // Low-frequency swell pulses the depth band height by a small amount —
    // the music breathing.
    float swell = 0.04 * lowDrive;
    col += vec3(0.0, 0.05, 0.10) * swell * (1.0 - yt);

    // Pre-tension horizon glow that intensifies as a section ends.
    // u_to_section_change is seconds-until-next-section; flip to a 0..1
    // that climbs in the last ~6 seconds.
    float preTension = 1.0 - smoothstep(0.0, 6.0, max(u_to_section_change, 0.0));
    float bandY = horizon;
    float bandD = abs(uv.y - bandY);
    float band  = smoothstep(0.025, 0.0, bandD);
    col += vec3(0.10, 0.30, 0.45) * band * preTension * 0.6;

    // Wave-break shockwave: section 5 (zero-indexed) at section start.
    // Single ring expanding from centre, distorts the gradient as it passes.
    if (u_section_id == 5) {
        float ringR = u_section_progress * 1.6;       // expands across the frame
        float ringD = abs(length(p) - ringR);
        float ring  = smoothstep(0.05, 0.0, ringD) * (1.0 - smoothstep(0.0, 0.6, u_section_progress));
        col += vec3(0.40, 0.70, 0.85) * ring * 0.9;
        // displace the horizon as the ring passes — water disturbed
        col *= 1.0 + 0.4 * ring;
    }

    fragColor = vec4(col, 1.0);
}
