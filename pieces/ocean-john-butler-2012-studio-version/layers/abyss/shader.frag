#version 300 es
// ABOUTME: Abyss layer for ocean piece — deep blue volumetric gradient that
// ABOUTME: swells deeper as sections progress. Cursor pulls a localized "deep
// ABOUTME: pocket" toward itself; held keys carve coloured columns of depth
// ABOUTME: that the viewer sees stretching down into the water.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_key_event[15];
uniform float u_audio_low;
uniform float u_audio_playing;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
out vec4 fragColor;

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

    float lowDrive = mix(0.35 + 0.25 * sin(u_time * 0.6), u_audio_low, u_audio_playing);
    float depth    = diveDepth(u_section_id, u_section_progress);

    // Cursor pulls a "deep pocket" toward itself — a localized darkening that
    // draws the abyss up around the cursor like sinking your hand into water.
    float cursorPull = 0.0;
    if (!mouseIdle) {
        float cd = length(p - mp);
        cursorPull = exp(-cd * cd * 5.0) * 0.55;
    }

    float horizon = mix(0.85, 0.05, depth);
    horizon -= cursorPull * 0.18;  // cursor pulls horizon down locally

    vec3 cDeep = vec3(0.016, 0.071, 0.165);
    vec3 cMid  = vec3(0.039, 0.227, 0.361);
    vec3 cTop  = vec3(0.102, 0.416, 0.541);

    float yt = smoothstep(0.0, horizon, uv.y);
    vec3 col = mix(cDeep, cMid, yt);
    col = mix(col, cTop, smoothstep(horizon, horizon + 0.25, uv.y));

    float column = sin(p.x * 5.0 + u_time * 0.20) * 0.5 + 0.5;
    column *= sin(p.x * 11.0 - u_time * 0.13) * 0.5 + 0.5;
    col *= 0.85 + 0.20 * column;

    float swell = 0.04 * lowDrive;
    col += vec3(0.0, 0.05, 0.10) * swell * (1.0 - yt);

    // Cursor: deep-water tint draws ultramarine into the pocket.
    col = mix(col, col * vec3(0.55, 0.85, 1.20), cursorPull * 0.6);

    // Held keys carve vertical coloured columns of depth — each key owns a
    // narrow vertical band in the abyss, tinted with its own hue. White keys
    // = aqua / teal, black keys = ultramarine / violet.
    for (int i = 0; i < 15; i++) {
        float env = u_keys[i];
        if (env < 0.001) continue;
        bool isBlack = (i >= 9);
        vec2 kp = keyPos(i, aspect);
        float dx = abs(p.x - kp.x);
        float bandWid = isBlack ? 0.045 : 0.060;
        float band = smoothstep(bandWid, 0.0, dx);
        // Column reaches deeper as envelope fades — fresh press is a short
        // splash, sustain extends the column toward the abyss.
        float reach = (1.0 - smoothstep(-0.5, 0.5, p.y));    // 1 at bottom, 0 at top
        float intensity = band * reach * env * (isBlack ? 0.85 : 0.55);

        vec3 colTeal = vec3(0.20, 0.85, 1.00);
        vec3 colVio  = vec3(0.45, 0.30, 1.10);
        vec3 keyTint = isBlack ? colVio : colTeal;
        col += keyTint * intensity * 0.30;
    }

    // Pre-tension horizon glow.
    float preTension = 1.0 - smoothstep(0.0, 6.0, max(u_to_section_change, 0.0));
    float bandY = horizon;
    float bandD = abs(uv.y - bandY);
    float band  = smoothstep(0.025, 0.0, bandD);
    col += vec3(0.10, 0.30, 0.45) * band * preTension * 0.6;

    // Wave-break shockwave at section 5.
    if (u_section_id == 5) {
        float ringR = u_section_progress * 1.6;
        float ringD = abs(length(p) - ringR);
        float ring  = smoothstep(0.05, 0.0, ringD) * (1.0 - smoothstep(0.0, 0.6, u_section_progress));
        col += vec3(0.40, 0.70, 0.85) * ring * 0.9;
        col *= 1.0 + 0.4 * ring;
    }

    fragColor = vec4(col, 1.0);
}
