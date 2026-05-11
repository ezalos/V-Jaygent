#version 300 es
// ABOUTME: Mozart Rondo Alla Turca as percussion-as-light. Monolithic shader,
// ABOUTME: cream-against-near-black. 8-arm cross + beat-fired rings + high-band
// ABOUTME: sparks. Architecture A — single-shader Caravaggio-tight contrast.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "sdf.glsl"
#include "tonemap.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_cymbal;
uniform float u_audio_flash;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_downbeat;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform int   u_section_id;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// Two warm palettes that alternate per section_id — the rondo refrain is
// the cooler-warm cream-amber; episodes drift to the warmer-warm ember-rust.
// Both anchor on near-black ground; figure stays bright cream.
vec3 cream_palette(float t) {
    t = clamp(t, 0.0, 1.0);
    return mix(vec3(0.95, 0.55, 0.20), vec3(1.00, 0.92, 0.65), t);
}
vec3 ember_palette(float t) {
    t = clamp(t, 0.0, 1.0);
    return mix(vec3(0.55, 0.10, 0.05), vec3(1.00, 0.55, 0.20), t);
}

// 8-arm cross with ASYMMETRIC arm lengths so rotation is visible. The
// primary cross is full-length (arm_len); the rotated 45° cross is
// shorter (arm_len * 0.72) — breaks the 8-fold symmetry just enough that
// a quarter-bar rotation reads as a different pose.
float sd8ArmCross(vec2 p, float arm_len, float arm_w) {
    float d1 = min(
        sdSegment(p, vec2(0.0, -arm_len), vec2(0.0, arm_len)),
        sdSegment(p, vec2(-arm_len, 0.0), vec2(arm_len, 0.0))
    ) - arm_w;
    vec2 q = mat2(cos(PI*0.25), -sin(PI*0.25), sin(PI*0.25), cos(PI*0.25)) * p;
    float short_arm = arm_len * 0.72;
    float d2 = min(
        sdSegment(q, vec2(0.0, -short_arm), vec2(0.0, short_arm)),
        sdSegment(q, vec2(-short_arm, 0.0), vec2(short_arm, 0.0))
    ) - arm_w * 0.85;
    return min(d1, d2);
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution)
           / min(u_resolution.x, u_resolution.y) * 2.0;
    float r = length(p);
    float ang = atan(p.y, p.x);

    float playing = u_audio_playing;

    // Synthetic drivers when silent — the piece must self-play. Idle synth
    // tuned to keep mean motion above the lint floor (≥ 0.025): faster beat
    // phase + sharper synthetic kick at every beat boundary.
    float bp     = mix(fract(u_time * 0.8),   u_beat_phase,         playing);
    float ba     = mix(fract(u_time * 0.20),  u_bar_phase,          playing);
    // Synthetic kick fires at every beat onset (bp near 0) — gives the beat
    // ring a real punch even when audio is silent.
    float synth_kick = pow(max(1.0 - bp, 0.0), 8.0);
    float kick   = mix(synth_kick, u_audio_kick,   playing);
    // Synthetic cymbal pulse at half-beat (off-beat) for spark variety.
    float synth_cym = pow(max(1.0 - fract(bp + 0.5), 0.0), 6.0);
    float cymbal = mix(synth_cym * 0.5, u_audio_cymbal, playing);
    float bass   = mix(0.40 + 0.25 * sin(u_time * 1.1), u_audio_bass, playing);
    float high   = mix(0.30 + 0.20 * abs(sin(u_time * 2.3)), u_audio_high, playing);
    float dbeat  = mix(0.0, u_downbeat, playing);
    float sprog  = mix(fract(u_time * 0.05), u_section_progress, playing);
    float gprog  = mix(fract(u_time * 0.01), u_song_progress,    playing);
    float toSect = (playing > 0.5) ? u_to_section_change : 1e3;

    // ---------- court ground: deep ember radial gradient (max L ~0.07) ----------
    // Always-on slow breathing keeps the entire frame above the lint motion
    // floor even with audio silent (the breathing covers all pixels, vs the
    // cross/rings which only cover ~10% — small per-pixel changes spread
    // across the frame add up).
    float breathe = 1.0 + 0.18 * sin(u_time * 0.6) * cos(u_time * 0.31);
    float core = 1.0 - smoothstep(0.0, 1.30, r);
    vec3 ground = vec3(0.075, 0.025, 0.010) * (0.3 + 0.7 * core) * breathe;
    // Outro deepening — the coda fades to absolute black.
    ground *= mix(1.0, 0.40, smoothstep(0.85, 1.0, gprog));

    // Always-on soft halo around the cross center — gives the eye a
    // landing zone and keeps mean luminance above the lint floor.
    float halo = exp(-r * r * 4.5) * 0.10;

    // ---------- cursor pull: cross center drifts toward cursor ----------
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    vec2 cross_center = mw * 0.20 * smoothstep(0.05, 0.5, length(mw));
    vec2 cp = p - cross_center;

    // ---------- 8-arm rotating cross ----------
    // Bar-phase rotation — one full revolution per bar. On every section flip,
    // snap angle back to zero (rondo recapitulation).
    float snapWindow = 1.0 - smoothstep(0.0, 0.04, sprog);
    float angle = ba * TAU;
    angle = mix(angle, 0.0, snapWindow * 0.85);
    float ca = cos(angle), sa = sin(angle);
    vec2 cq = mat2(ca, -sa, sa, ca) * cp;

    // Cross scale: base length pulses on downbeat + bass. Pre-tension squeeze
    // before section changes.
    float preTension = 1.0 - smoothstep(0.0, 8.0, toSect);
    float arm_len = 0.55 * (1.0 + 0.10 * bass + 0.18 * dbeat) * mix(1.0, 0.78, preTension);
    float arm_w   = 0.018 * (1.0 + 0.30 * dbeat);

    float cross_d = sd8ArmCross(cq, arm_len, arm_w);
    float cross_mask = smoothstep(0.006, -0.004, cross_d);

    // Section palette flip — refrain (even section) = cream; episode (odd) = ember.
    bool isEpisode = (u_section_id % 2) == 1;
    float tint = 0.30 + 0.55 * fract(gprog * 1.3);
    vec3 cross_col = isEpisode ? ember_palette(tint) : cream_palette(tint);

    // Post-section-flip flash — brief cream wash on the cross right after the snap.
    float postFlash = (1.0 - smoothstep(0.0, 0.06, sprog)) * float(playing > 0.5);
    cross_col = mix(cross_col, vec3(1.00, 0.95, 0.75), postFlash * 0.6);

    // ---------- beat rings: expanding from center on every beat ----------
    // TWO concurrent beat rings half a beat out of phase — at any given
    // moment, two rings are visible at different radii, contributing
    // more inter-frame motion to the lint sampler.
    float bp_alt = fract(bp + 0.5);
    float beat_r1  = bp     * 1.20;
    float beat_r2  = bp_alt * 1.20;
    float beat_t1  = 0.015 + 0.022 * (1.0 - bp);
    float beat_t2  = 0.015 + 0.022 * (1.0 - bp_alt);
    float beat_b1  = pow(1.0 - bp,     2.0) * (0.45 + 0.55 * bass) + kick * 0.70;
    float beat_b2  = pow(1.0 - bp_alt, 2.0) * (0.30 + 0.45 * bass);
    float beat_ring = smoothstep(beat_t1, 0.0, abs(r - beat_r1)) * beat_b1
                    + smoothstep(beat_t2, 0.0, abs(r - beat_r2)) * beat_b2;

    // ---------- bar ring: bigger ring on every downbeat ----------
    float bar_r = ba * 1.30;
    float bar_thickness = 0.035 + 0.035 * (1.0 - ba);
    float bar_brightness = pow(1.0 - ba, 1.6) * 0.95;
    float bar_d = abs(r - bar_r);
    float bar_ring = smoothstep(bar_thickness, 0.0, bar_d) * bar_brightness;

    // ---------- perimeter sweep: slow continuous arc rotating outside the cross ----------
    // Always-on element so headless idle frames pick up motion even when
    // beat-driven elements happen to be at low-contrast moments.
    float sweep_ang = u_time * 0.35;                  // ~17s/revolution
    float sweep_r   = 0.78 + 0.05 * sin(u_time * 0.27);
    float sweep_dr  = abs(r - sweep_r);
    float sweep_dAng = atan(sin(ang - sweep_ang), cos(ang - sweep_ang));
    float sweep_arc = smoothstep(0.025, 0.0, sweep_dr) *
                      smoothstep(0.45, 0.0, abs(sweep_dAng)) * 0.55;

    // ---------- high-band sparks: 8 angular slots, fired by cymbal/high ----------
    // Each beat picks a random subset of slots to fire — driven by hash21 of
    // the beat index. Sparks live as bright cream points at radius ~0.55.
    float beat_idx = floor(u_time * 4.0);
    float spark_intensity = 0.0;
    for (int i = 0; i < 8; i++) {
        float slotAng = -PI + float(i) / 4.0 * PI + ba * TAU * 0.1;
        float dAng = atan(sin(ang - slotAng), cos(ang - slotAng));
        float angMask = exp(-dAng * dAng * 70.0);
        // Per-slot fire decision: hash determines if this slot fires this beat.
        float seed = hash21(vec2(float(i) * 1.7, beat_idx));
        float fires = step(0.55, seed);
        float r_slot = 0.45 + 0.20 * hash21(vec2(float(i), beat_idx + 17.0));
        float radMask = smoothstep(0.045, 0.0, abs(r - r_slot));
        // Decay across the beat.
        float pulse = pow(max(1.0 - bp, 0.0), 2.5);
        float amp = (0.30 + 1.10 * high + 1.40 * cymbal);
        spark_intensity += fires * angMask * radMask * pulse * amp;
    }

    // ---------- per-key sparks: each key fires a bright spark at its slot ----------
    float key_intensity = 0.0;
    for (int k = 0; k < 15; k++) {
        float env = u_keys[k] + u_key_event[k] * 0.7;
        if (env < 0.001) continue;
        float keyAng = -PI + (float(k) + 0.5) / 15.0 * TAU;
        float dAng = atan(sin(ang - keyAng), cos(ang - keyAng));
        float angMask = exp(-dAng * dAng * 50.0);
        float r_key = 0.55 + 0.05 * float(k % 3);
        float radMask = smoothstep(0.06, 0.0, abs(r - r_key));
        key_intensity += env * angMask * radMask * 1.6;
    }

    // ---------- compose ----------
    vec3 cream_acc = vec3(1.00, 0.92, 0.68);

    vec3 col = ground + vec3(0.55, 0.18, 0.06) * halo;
    col = max(col, cross_col * cross_mask);
    col += cream_acc * beat_ring * 0.85;
    col += cream_acc * bar_ring  * 1.05;
    col += cream_acc * sweep_arc;
    col += cream_acc * spark_intensity;
    col += cream_acc * key_intensity;

    // Vignette — gentle corner darkening keeps focus central.
    float vig = 1.0 - 0.45 * smoothstep(0.65, 1.30, r);
    col *= vig;

    // Reinhard so peaks roll asymptotically toward 1.0; preserves warm hue at
    // the brightest moments (ring crests, post-section flash).
    col = reinhard(col);

    // Gentle gamma — lit, not printed (per VISION).
    col = pow(max(col, 0.0), vec3(0.88));

    fragColor = vec4(col, 1.0);
}
