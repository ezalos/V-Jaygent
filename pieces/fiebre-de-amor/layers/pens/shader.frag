#version 300 es
// ABOUTME: pens — three coprime harmonograph pens trace damped-Lissajous comet
// ABOUTME: filaments (polyrhythm made visible); heat-haze refracts u_below,
// ABOUTME: u_history light-paints the trails, sections gear-shift the vocabulary.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "sdf.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_high;
uniform float u_audio_bass_stem;
uniform float u_audio_drums_stem;
uniform float u_audio_other_stem;
uniform float u_bar_phase;
uniform float u_bar_index;
uniform float u_beat_phase;
uniform float u_downbeat;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform sampler2D u_heat;       // consumed publish from heat-bed

out vec4 fragColor;

#define NS 56
const vec2 RAT[3]  = vec2[3](vec2(2.0, 3.0), vec2(3.0, 5.0), vec2(5.0, 7.0));
const vec3 PCOL[3] = vec3[3](
    vec3(1.00, 0.52, 0.16),     // conga — amber
    vec3(0.85, 0.16, 0.18),     // bass  — ember-wine
    vec3(1.00, 0.62, 0.24)      // brass — warm amber-gold (not olive)
);
const vec2 PPH[3]  = vec2[3](vec2(0.0, 1.57), vec2(0.9, 0.2), vec2(2.1, 3.0));

// each pen's STATION relocates per section (the gear-shift snaps the figure to
// a new place) and travels on a slow incommensurate wander — so the macro
// layout changes across the song (divergence) instead of staying fixed.
vec2 stationHome(float sid, float seed) {
    return 0.42 * vec2(sin(sid * 2.3 + seed * 2.1), cos(sid * 1.7 + seed * 1.3));
}

// pen activation per section: intro/cuerpo = brass alone; verse adds bass;
// montuno..pregón = all three; breakdown sheds bass; cierre = one faint brass.
// Genuinely different COUNTS per section so the sections read distinct.
float penActive(int pen, int sec) {
    if (pen == 0) {                                  // conga: montuno..pregón + final
        if (sec < 3) return 0.0;
        if (sec == 6) return 0.5;                    // breakdown: drums persist, dimmer
        if (sec == 8) return 0.0;                    // cierre: gone
        return 1.0;
    }
    if (pen == 1) {                                  // bass: from verse, gone in breakdown + cierre
        if (sec < 2) return 0.0;
        if (sec == 6) return 0.0;                    // breakdown: bass drops out
        if (sec == 8) return 0.0;
        return 1.0;
    }
    // brass (pen 2): the lead voice — alone in intro/cuerpo, faint recap in cierre
    if (sec == 8) return 0.45;
    return 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float playing = step(0.5, u_audio_playing);
    int sec = u_section_id;
    float prog = u_song_progress;

    // --- idle-safe stem drivers ----------------------------------------
    float drums = mix(0.30 + 0.30 * abs(sin(u_time * 1.9)), u_audio_drums_stem + 0.5 * u_audio_bass, playing);
    float bassS = mix(0.35 + 0.25 * sin(u_time * 0.9),      u_audio_bass_stem,  playing);
    float other = mix(0.30 + 0.25 * sin(u_time * 1.3 + 1.0), u_audio_other_stem, playing);
    drums = clamp(drums, 0.0, 1.3); bassS = clamp(bassS, 0.0, 1.3); other = clamp(other, 0.0, 1.3);

    // --- bloque: freeze (slow-mo + desaturate) through the breakdown,
    // then SLAM on the coro-final entry. --------------------------------
    float bloque = (sec == 6) ? smoothstep(0.15, 0.9, u_section_progress) : 0.0;
    float slam   = (sec == 7) ? exp(-u_section_progress * 5.0) : 0.0;
    slam = max(slam, (sec == 7) ? u_downbeat * exp(-u_section_progress * 2.5) : 0.0);
    float freqScale = mix(1.0, 0.10, bloque);        // slow-mo freeze

    // base figure frequency (one figure per clave cycle), drifts for divergence.
    // Kept moderate so the comet-head stays smoothly trackable (continuity).
    float f0 = 0.74;

    // cursor "conducts": drags the shared pen centre up to a third out.
    vec2 m = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
    float hasMouse = step(0.5, length(u_mouse));
    vec2 ctr = mix(vec2(0.0), m, 0.33 * hasMouse);

    // keyboard zones: low→bass pen, mid→conga pen, high→brass pen.
    float kLow = 0.0, kMid = 0.0, kHigh = 0.0;
    for (int i = 0; i < 5;  i++)  kLow  = max(kLow,  u_keys[i]);
    for (int i = 5; i < 10; i++)  kMid  = max(kMid,  u_keys[i]);
    for (int i = 10; i < 15; i++) kHigh = max(kHigh, u_keys[i]);
    float kAmp[3]; kAmp[0] = kMid; kAmp[1] = kLow; kAmp[2] = kHigh;
    float stemAmp[3]; stemAmp[0] = drums; stemAmp[1] = bassS; stemAmp[2] = other;

    // mambo/peak nudges the ratios denser (gear-shift vocabulary).
    float dense = smoothstep(3.5, 5.0, float(sec)) * (1.0 - step(5.5, float(sec)));

    vec3 fresh = vec3(0.0);
    float headHot = 0.0;            // brightest-lobe accumulator for heat-haze

    for (int pen = 0; pen < 3; pen++) {
        float act = penActive(pen, sec);
        if (act < 0.01) continue;

        vec2 rat = RAT[pen] + dense * vec2(0.0, 0.6);             // y-ratio climbs (eased for continuity)
        float seed = float(pen) * 1.7;
        // dual-LFO coprime drift: the figure precesses / reshapes over ~18-37 s
        // so windows a divergence-scale apart are categorically different
        // figures, not the same rose at a different phase.
        float drift = 0.10 * sin(u_time * 0.055 + seed) + 0.055 * sin(u_time * 0.026 + seed * 2.0);
        float fx = f0 * rat.x * (1.0 + drift) * freqScale;
        float fy = f0 * rat.y * (1.0 - drift) * freqScale;

        // amplitude = base, breathing with this pen's stem + key + a bar swell,
        // re-energized by the slam. Geometry (radius), not brightness.
        float swell = 0.6 + 0.7 * stemAmp[pen] + 0.8 * kAmp[pen];
        swell *= 1.0 + 2.2 * slam;
        float amp = (0.16 + 0.06 * float(pen == 2)) * swell * (0.7 + 0.5 * prog);
        amp *= mix(1.0, 0.55, bloque);                            // figure shrinks a touch when frozen

        float t = u_time;
        // STATION = per-section home (relocates at each gear-shift, smoothed
        // over the first ~bar so it slides not teleports) + a bold slow wander
        // (periods ~48-70 s, so the figure traverses a real fraction of the
        // frame within an 18 s divergence window) + the cursor offset. This is
        // the divergence engine: the macro layout genuinely moves over the song.
        vec2 home = mix(stationHome(float(sec - 1), seed), stationHome(float(sec), seed),
                        smoothstep(0.0, 0.12, u_section_progress));
        vec2 wander = 0.30 * vec2(sin(u_time * 0.090 + seed * 1.7),
                                  sin(u_time * 0.131 + seed * 2.9));
        vec2 penCtr = ctr + home + wander;
        penCtr = clamp(penCtr, vec2(-0.60, -0.40), vec2(0.60, 0.40));
        // comet polyline: NS samples back over ~1.3 s, drawn as connected
        // segments so the filament never dots. Older points fade.
        // a filament is the UNION (max) of its segments, not the sum — max-
        // accumulate so dense lobes give constant-width curves instead of
        // blowing white where the curve doubles back.
        float glow = 0.0;
        vec2 prev = vec2(1e9);
        for (int k = 0; k < NS; k++) {
            float fk = float(k) / float(NS - 1);
            float tau = 2.20 * fk;
            float tt = t - tau;
            vec2 hp = penCtr + vec2(amp * sin(fx * tt + PPH[pen].x),
                                    amp * 1.05 * sin(fy * tt + PPH[pen].y));
            if (k > 0) {
                float sd = sdSegment(p, prev, hp);
                float w = exp(-tau * 1.05);                       // tail fade
                glow = max(glow, w * exp(-sd * sd * 1300.0));     // wider = more trackable
            }
            prev = hp;
        }
        // compact head bloom = the eye-landing lobe (small + bright, not a blob).
        vec2 head = penCtr + vec2(amp * sin(fx * t + PPH[pen].x),
                                  amp * 1.05 * sin(fy * t + PPH[pen].y));
        float hd = length(p - head);
        float headG = exp(-hd * hd * 700.0);
        glow = max(glow, 0.85 * headG);
        headHot += headG * act;

        vec3 pcol = PCOL[pen];
        // desaturate toward dim wine while frozen (bloque suspense).
        pcol = mix(pcol, vec3(0.32, 0.06, 0.10), 0.6 * bloque);
        fresh += pcol * glow * act;
    }

    // global brightness: rises with the fever, dims under the freeze, flares
    // on the slam. Keep the figure always-visible (lead-layer always-on band).
    // comets LEAD: brighter than the (now-dimmed, off-centre) clave clock.
    float bright = (0.95 + 0.5 * prog) * mix(1.0, 0.45, bloque) * (1.0 + 1.4 * slam);
    fresh *= bright;

    // hot-pink shift toward the peak; warm arc only.
    float peak = smoothstep(0.45, 0.78, prog) * (1.0 - smoothstep(0.9, 1.0, prog));
    fresh = mix(fresh, fresh * vec3(1.05, 0.62, 0.74), 0.22 * (peak + slam));

    // soft-tonemap the summed pens so the interference KNOTS (where two
    // curves cross) compress to warm-white instead of clipping and over-
    // blooming. Keeps thin filaments linear, rolls off only the bright knots.
    fresh = fresh / (1.0 + 0.55 * max(max(fresh.r, fresh.g), fresh.b));

    // consume the heat field: pens burn brighter inside the hot-zone. The bed
    // is dim, so its red channel reads low — scale it back up to a 0..1 field.
    float heat = clamp(texture(u_heat, uv).r * 2.6, 0.0, 1.0);
    fresh *= 0.85 + 0.6 * heat;

    // --- heat-haze: refract u_below where the filaments burn (spatial
    // coupling — the bed + clave shimmer behind the heat). ---------------
    float hazeAmt = 0.010 * (clamp(headHot + length(fresh) * 0.5, 0.0, 1.5)) + 0.003 * heat;
    float ang = fbmRot(p * 4.0 + u_time * 0.07) * TAU;          // slow haze (continuity)
    vec2 hazeOff = vec2(cos(ang), sin(ang)) * hazeAmt;
    vec3 below = texture(u_below, uv + hazeOff).rgb;

    // The figure is the clean analytic comet over the displaced bed. NO
    // u_history feedback: it is the full post-processed composite, so trailing
    // it paints grey/magenta blobs that fill the frame. Divergence comes from
    // the MIGRATING stations (the figure travels the frame + relocates per
    // section) — a moving macro layout, not accumulation.
    vec3 col = max(below, fresh);

    fragColor = vec4(col, 1.0);
}
