#version 300 es
// ABOUTME: Fire-core — a pulsating portal/sun behind the pillars. Slow drift,
// ABOUTME: cursor pulls it toward the cursor, bass scales it, downbeat ringx,
// ABOUTME: bar-phase rotates a spiral. The eye-anchor of the composition.
precision highp float;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_history;

uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;

uniform float u_bar_phase;
uniform float u_beat_phase;
uniform float u_downbeat;

uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform float u_song_progress;
uniform float u_energy_smooth;

out vec4 fragColor;

#define PI 3.14159265

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61),    u_audio_bass, playing);
    float mid     = mix(0.20 + 0.15 * sin(u_time * 1.27 + 1.7), u_audio_mid,  playing);
    float high    = mix(0.0,                                 u_audio_high, playing);
    float kick    = mix(0.0,                                 u_audio_kick, playing);

    // Slow drifting centre — lissajous so it never quite repeats
    vec2 drift = vec2(0.20 * sin(u_time * 0.13 + 0.7),
                      0.06 * cos(u_time * 0.17 + 1.3));
    vec2 anchor = vec2(0.0, 0.05);
    vec2 center = anchor + drift;
    if (!mIdle) {
        // Cursor pulls the core ~halfway toward it
        center = mix(center, vec2(mp.x * 0.7, mp.y * 0.5 + 0.05), 0.55);
    }

    vec2  d   = p - center;
    float r   = length(d);
    float ang = atan(d.y, d.x);

    // Per-section base intensity — stays quiet at low energy, hot but not
    // overpowering at peak. Tuned so the core never swallows the pillars.
    float secInt[8] = float[8](0.18, 0.32, 0.55, 0.28, 0.85, 0.55, 0.30, 0.18);
    int   sid       = clamp(u_section_id, 0, 7);
    int   nid       = clamp(sid + 1, 0, 7);
    float secIntensity = mix(secInt[sid], secInt[nid], smoothstep(0.0, 1.0, u_section_progress));

    // ----- Core glow (gaussian) — kept compact -----
    float coreR = 0.045 + 0.030 * bass + 0.035 * u_energy_smooth + 0.025 * kick;
    float core  = exp(-r * r / max(coreR * coreR + 0.001, 1e-4));

    // ----- Expanding pulse ring on every downbeat -----
    // Each new downbeat resets the ring to small; it grows over the next
    // bar phase. Use bar_phase as the radius driver (resets to 0 each downbeat).
    float ringR    = u_bar_phase * (0.65 + 0.30 * u_energy_smooth);
    float ringT    = abs(r - ringR);
    float ringFade = (1.0 - u_bar_phase);    // ring brightest fresh, fades out
    float ring     = exp(-ringT * 38.0) * ringFade;

    // Secondary ring from kick (mid-frequency) — adds polyrhythmic pulses
    float ring2R   = mod(u_time * 0.55, 1.2) * 0.55;
    float ring2T   = abs(r - ring2R);
    float ring2    = exp(-ring2T * 50.0) * (1.0 - mod(u_time * 0.55, 1.2) / 1.2) * 0.55;

    // ----- Spiral / rays -----
    // Rotating radial rays — bar-phase drives rotation; rays pulse on beat.
    float rayPhase = u_bar_phase * 2.0 * PI - r * 6.0;
    float rays     = sin(ang * 8.0 + rayPhase) * 0.5 + 0.5;
    rays           = pow(rays, 3.0);
    float rayDecay = exp(-r * 3.0);
    float beatPulse = smoothstep(0.0, 0.20, 1.0 - u_beat_phase);

    // ----- Halo turbulence — fbm-like grain so the core isn't a clean disc -----
    float grain = vnoise(vec2(ang * 4.0 + u_time * 0.4, r * 8.0 - u_time * 0.3));

    // ----- Compose colours -----
    vec3 lowColor  = vec3(0.55, 0.18, 0.08);    // dim ember
    vec3 midColor  = vec3(1.00, 0.50, 0.15);    // ember orange
    vec3 hotColor  = vec3(1.50, 1.05, 0.55);    // white-hot yellow
    float palT     = clamp(0.20 + 0.50 * u_energy_smooth + 0.35 * bass, 0.0, 1.0);
    vec3 fc        = mix(mix(lowColor, midColor, smoothstep(0.0, 0.5, palT)),
                          hotColor, smoothstep(0.5, 1.0, palT));

    vec3 col = vec3(0.0);
    col += fc * core * (1.0 + 0.7 * bass + 0.3 * beatPulse) * secIntensity;
    col += fc * ring * (0.6 + 0.4 * u_energy_smooth) * secIntensity;
    col += fc * 0.40 * ring2 * secIntensity;
    col += fc * rays * rayDecay * 0.25 * (0.5 + 0.5 * beatPulse) * secIntensity;
    col *= 0.75 + 0.50 * grain;

    // Section-transition flare — a hot bloom right around the boundary
    float boundary = max(1.0 - smoothstep(0.0, 0.10, u_section_progress),
                         1.0 - smoothstep(0.0, 1.5, max(u_to_section_change, 0.0)));
    if (boundary > 0.001) {
        col += hotColor * exp(-r * r * 8.0) * boundary * 0.30;
    }

    // History feedback — gives the core a slight "afterglow" so it pulses
    // organically rather than abruptly. Decays slightly faster so it doesn't
    // accumulate.
    vec3 hist = texture(u_history, uv).rgb * 0.78;
    col = max(col, hist - 0.20);

    // Cap at modest brightness so the screen-blend doesn't blow out the sky
    col = min(col, vec3(1.10));

    fragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}
