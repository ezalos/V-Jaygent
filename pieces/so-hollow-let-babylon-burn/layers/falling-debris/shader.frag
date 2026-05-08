#version 300 es
// ABOUTME: Falling-debris — top-down ember rain. Hash-grid particles fall
// ABOUTME: at varying speeds; cursor pushes them sideways; section gating
// ABOUTME: turns the rain on at vortex/apocalypse, off in calm sections.
// ABOUTME: Vertical-flow vocabulary, distinct from radial wheel/lensing.
precision highp float;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float hash11(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
}

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_history;

uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;

uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_downbeat;

uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_energy_smooth;

out vec4 fragColor;

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass    = mix(0.30, u_audio_bass, playing);
    float high    = mix(0.0, u_audio_high, playing);

    // ----- Per-section rain density -----
    // Off in calm sections, full at vortex/apocalypse, fading out in cooldown.
    float secDens[8] = float[8](0.0, 0.05, 0.45, 0.0, 1.20, 0.85, 0.20, 0.05);
    int   sid       = clamp(u_section_id, 0, 7);
    int   nid       = clamp(sid + 1, 0, 7);
    float spS       = smoothstep(0.70, 0.95, u_section_progress);
    float density   = mix(secDens[sid], secDens[nid], spS);

    if (density < 0.02) {
        // Pass through history fade so prior rain trails out gracefully
        vec3 hist = texture(u_history, uv).rgb * 0.78;
        fragColor = vec4(hist - 0.10, max(hist.r, max(hist.g, hist.b)));
        return;
    }

    // ----- Hash-grid particles -----
    // Divide screen into a grid; each cell may spawn a falling particle.
    // Particles fall continuously; their y-position is (start_y - speed*t)
    // wrapped, so they re-spawn at top after exiting bottom.
    float gridX = 80.0;
    float gridY = 60.0;

    vec3 col = vec3(0.0);

    // Sample the 3 nearest cells in each direction so particles smoothly
    // cross cell boundaries.
    for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
            vec2 cell = floor(uv * vec2(gridX, gridY)) + vec2(float(dx), float(dy));
            float h    = hash21(cell);
            float h2   = hash21(cell + vec2(7.13, 13.7));
            float h3   = hash21(cell + vec2(31.5, 17.3));

            // Spawn probability: higher density = more cells active
            if (h > 1.0 - density * 0.55) {
                // Fall speed varies per particle — fast: 0.30/sec, slow: 0.10/sec
                float speed = 0.10 + h2 * 0.50 * (0.7 + 0.5 * bass);
                float lifeT = mod(u_time * speed + h * 17.3, 1.4);
                float yPos  = 0.6 - lifeT * 1.2;          // top to bottom

                // Particle x: cell base + small drift, plus cursor lateral push
                float xBase = (cell.x + 0.5) / gridX * aspect - aspect * 0.5;
                xBase += (h3 - 0.5) * 0.03;

                // Cursor pushes particles sideways near it
                float pushX = 0.0;
                if (!mIdle) {
                    float cdx = mp.x - xBase;
                    float cdy = abs(mp.y - yPos);
                    pushX = clamp(cdx * 0.4, -0.20, 0.20) * exp(-cdy * 4.0);
                }

                // Wind drift — bar-phase modulated horizontal sway
                float wind = 0.04 * sin(u_bar_phase * 6.28 + h * 6.28);

                vec2 partPos = vec2(xBase + wind + pushX, yPos);
                float d = length((p - partPos) * vec2(1.0, 0.55));   // y-stretched

                // Particle gets brighter as it falls (ember heating up?)
                float ageBright = mix(0.55, 1.30, lifeT * 0.7);

                // Trail: short streak above the particle
                float streakY = max(0.0, partPos.y + 0.025 - p.y) / 0.06;
                float streakX = abs(p.x - partPos.x);
                float streak  = exp(-streakX * streakX * 4000.0)
                              * smoothstep(1.0, 0.0, streakY) * 0.6;

                // Body: small dot
                float body = exp(-d * d * 6000.0);

                // Color: hot to deep red as it falls
                vec3 cBody = mix(vec3(1.50, 1.05, 0.55),
                                 vec3(1.20, 0.40, 0.10),
                                 lifeT);
                col += cBody * (body + streak * 0.7) * ageBright;
            }
        }
    }

    // Density modulates global brightness too — denser sections look
    // wholesale brighter
    col *= density * (0.85 + 0.50 * u_energy_smooth);

    // History feedback: short trails (faster decay than typical so falling
    // particles don't smear into vertical bars)
    vec3 hist = texture(u_history, uv + vec2(0.0, 0.012)).rgb * 0.62;
    col = max(col, hist - 0.05);

    fragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}
