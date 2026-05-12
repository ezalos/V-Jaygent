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
uniform int   u_bar_index;
uniform int   u_beat_index;
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

// 8-arm cross with PER-ARM asymmetric lengths driven by hash on (arm, beat).
// Each beat reshuffles which arms are long vs short — breaks the rate-lock
// of pure rotation. The cross looks like a different shape every beat,
// not just a rotated version of the same shape.
float sd8ArmCrossChaotic(vec2 p, float base_len, float arm_w, float beat_seed) {
    float d = 1e6;
    for (int i = 0; i < 8; i++) {
        // Per-arm random length scale ∈ [0.45, 1.10]
        float h = hash21(vec2(float(i) * 1.7, beat_seed));
        float L = base_len * mix(0.45, 1.10, h);
        float W = arm_w * mix(0.85, 1.20, hash21(vec2(float(i), beat_seed + 3.7)));
        float a = float(i) * PI * 0.25;     // every 45°
        vec2 tip = vec2(cos(a), sin(a)) * L;
        d = min(d, sdSegment(p, vec2(0.0), tip) - W);
    }
    return d;
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

    // ---------- 8-arm chaotic cross ----------
    // Predictability-break: per-section rotation rate + direction; per-bar
    // hold-or-spin gate; per-beat per-arm length reshuffle. The cross is
    // never the same shape twice consecutive beats; never the same rate
    // across consecutive sections; never the same rotation arc twice.
    int sec  = u_section_id;
    int bidx = (playing > 0.5) ? u_bar_index  : int(floor(u_time * 0.5));
    int bbi  = (playing > 0.5) ? u_beat_index : int(floor(u_time * 2.0));

    // Per-section rotation profile: rate ∈ [-1.6, +1.6] revs per bar (sign = direction).
    float sec_dir  = (hash21(vec2(float(sec) * 0.31, 1.7)) > 0.5) ? 1.0 : -1.0;
    float sec_rate = mix(0.55, 1.60, hash21(vec2(float(sec) * 1.13, 4.7)));

    // Per-bar hold-or-spin: ~35% of bars HOLD (no rotation, cross stationary).
    // Holds let the eye breathe; spins surprise the eye-ahead prediction.
    float hold = step(hash21(vec2(float(bidx) * 0.71, 9.3)), 0.35);
    float spin_factor = 1.0 - hold;

    // Within a spin-bar, rotation accelerates non-linearly across the bar
    // (ease-in-out, not linear) — eye can't extrapolate the next pose by
    // dead reckoning.
    float ba_eased = ba * ba * (3.0 - 2.0 * ba);
    float angle = ba_eased * TAU * sec_dir * sec_rate * spin_factor;

    // Section snap still fires.
    float snapWindow = 1.0 - smoothstep(0.0, 0.04, sprog);
    angle = mix(angle, 0.0, snapWindow * 0.85);

    float ca = cos(angle), sa = sin(angle);
    vec2 cq = mat2(ca, -sa, sa, ca) * cp;

    // Per-section base scale variation — sections with sec_rate < 1.0 read
    // bigger (slower-rotating, more time on screen at each pose).
    float sec_scale = mix(0.85, 1.15, hash21(vec2(float(sec), 12.7)));
    float preTension = 1.0 - smoothstep(0.0, 8.0, toSect);
    float arm_base = 0.55 * sec_scale * (1.0 + 0.10 * bass + 0.18 * dbeat) * mix(1.0, 0.78, preTension);
    float arm_w    = 0.018 * (1.0 + 0.30 * dbeat);

    // Beat seed reshuffles per-arm length every beat — chaotic scrambling
    // of which arm points where, with which length.
    float beat_seed = float(bbi) * 0.137 + float(sec) * 7.31;
    float cross_d = sd8ArmCrossChaotic(cq, arm_base, arm_w, beat_seed);
    float cross_mask = smoothstep(0.006, -0.004, cross_d);

    // Section palette flip — refrain (even section) = cream; episode (odd) = ember.
    bool isEpisode = (u_section_id % 2) == 1;
    float tint = 0.30 + 0.55 * fract(gprog * 1.3);
    vec3 cross_col = isEpisode ? ember_palette(tint) : cream_palette(tint);

    // Post-section-flip flash — brief cream wash on the cross right after the snap.
    float postFlash = (1.0 - smoothstep(0.0, 0.06, sprog)) * float(playing > 0.5);
    cross_col = mix(cross_col, vec3(1.00, 0.95, 0.75), postFlash * 0.6);

    // ---------- beat rings: per-beat fire decision + per-beat radius curve ----------
    // Per-beat hash decides which beats fire rings — some beats fire none,
    // some fire one outward-expanding, some fire one INWARD-contracting.
    // Per-beat radius CURVE shape (linear vs ease-out vs spike) is also
    // hash-driven. The eye can't predict whether the next beat will produce
    // an expanding ring, a contracting ring, or silence.
    float h_fire   = hash21(vec2(float(bbi) * 0.91, 31.0));
    float h_dir    = hash21(vec2(float(bbi) * 0.43, 17.0));
    float h_curve  = hash21(vec2(float(bbi) * 1.27, 53.0));
    float fires    = step(0.30, h_fire);                          // 70% of beats fire
    float ring_dir = (h_dir > 0.55) ? -1.0 : 1.0;                 // 45% inward
    float bp_curved = mix(bp, sqrt(bp), h_curve);                 // mix linear / ease-out
    float beat_r   = (ring_dir > 0.0)
                   ? bp_curved * 1.20                              // outward
                   : (1.20 - bp_curved * 1.20);                    // inward
    float beat_thickness = 0.015 + 0.022 * (1.0 - bp);
    float beat_brightness = pow(1.0 - bp, 2.0) * (0.45 + 0.55 * bass) + kick * 0.70;
    float beat_ring = smoothstep(beat_thickness, 0.0, abs(r - beat_r))
                    * beat_brightness * fires;

    // ---------- bar ring: directional + curved per bar ----------
    // Same trick at the bar level: per-bar hash decides direction (out/in)
    // and curve (linear vs ease-out vs accelerating).
    float bh_dir   = hash21(vec2(float(bidx) * 0.59, 91.0));
    float bh_curve = hash21(vec2(float(bidx) * 1.71, 73.0));
    float bar_dir   = (bh_dir > 0.5) ? -1.0 : 1.0;
    float ba_curved = mix(ba, ba * ba, bh_curve);
    float bar_r    = (bar_dir > 0.0)
                   ? ba_curved * 1.30
                   : (1.30 - ba_curved * 1.30);
    float bar_thickness = 0.035 + 0.035 * (1.0 - ba);
    float bar_brightness = pow(1.0 - ba, 1.6) * 0.95;
    float bar_ring = smoothstep(bar_thickness, 0.0, abs(r - bar_r)) * bar_brightness;

    // ---------- perimeter sweep: arc with non-uniform angular velocity ----------
    // Always-on rotating arc, but its angular VELOCITY varies with time — speeds
    // up and slows down so the eye can't pre-compute its position. Two slightly-
    // out-of-sync sin terms create a chaotic-feeling drift even though it's
    // deterministic.
    float sweep_ang = u_time * 0.35 + 0.6 * sin(u_time * 0.13) + 0.35 * cos(u_time * 0.27);
    float sweep_r   = 0.74 + 0.10 * sin(u_time * 0.21);
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
