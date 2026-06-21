#version 300 es
// ABOUTME: yaktin-beni girih mandala — quasicrystal interference (sum of N plane
// ABOUTME: waves → k-fold Islamic star field) whirling like a sema; vocals light the antinodes.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_vocals_stem;
uniform float u_audio_other_stem;
uniform float u_audio_level;
uniform float u_downbeat;
uniform float u_bar_index;
uniform float u_section_id;
uniform float u_song_progress;
uniform float u_key_event[15];

out vec4 fragColor;

// Quasicrystal field: sum of N plane waves at evenly spaced angles over PI →
// a pattern with 2N-fold rotational symmetry (the canonical girih construction).
// freq is the plane-wave frequency (the 303 cutoff "re-tiles" the field), phase
// the slow sweep.
float girihField(vec2 p, float freq, int n, float phase) {
    float v = 0.0;
    for (int j = 0; j < 8; j++) {
        if (j >= n) break;
        float a = float(j) * PI / float(n);
        vec2 dir = vec2(cos(a), sin(a));
        v += cos(freq * dot(p, dir) + phase);
    }
    return v / float(n);   // ~[-1, 1]
}

// Nested kaleidoscope: fold into bigK triangular wedges, then mirror subN
// times inside each wedge — a "kaleidoscope inside each triangle" (Louis
// redline). The extra sub-mirror seams subdivide every sector.
vec2 kaleidoFold(vec2 q, float bigK, float subN) {
    float rr = length(q);
    float a  = atan(q.y, q.x);
    float seg = TAU / bigK;
    a = mod(a, seg);
    a = abs(a - seg * 0.5);              // the triangle (wedge mirror)
    float sseg = seg / subN;
    a = mod(a, sseg);
    a = abs(a - sseg * 0.5);             // nested sub-mirror inside the triangle
    return vec2(cos(a), sin(a)) * rr;
}

// Round soft ember-light on a wandering jittered lattice — circular glows,
// no angular corners (Louis redline: the blinking lights had weird corners).
float roundEmbers(vec2 q, float tt) {
    vec2 g = q * 3.2;
    vec2 cell = floor(g);
    float e = 0.0;
    for (int oy = -1; oy <= 1; oy++)
    for (int ox = -1; ox <= 1; ox++) {
        vec2 cc = cell + vec2(float(ox), float(oy));
        vec2 h = hash22(cc);
        vec2 epos = cc + 0.5 + 0.38 * sin(h * TAU + tt * 0.6);
        float d = length(g - epos);
        float tw = 0.45 + 0.55 * sin(tt * 2.4 + h.x * TAU);   // blink
        e = max(e, exp(-d * d * 6.0) * tw);
    }
    return e;
}

void main() {
    vec2 res = u_resolution;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = u_audio_playing;

    // --- section state machine: symmetry order per section ----------------
    // idle (no audio) cycles all vocabularies so the piece still evolves.
    float sidF = mix(floor(mod(u_time * 0.066, 7.0)), u_section_id, playing);
    int sid = int(sidF + 0.5);
    // born 6-fold -> 8 -> 10 -> 10 -> FRACTURE -> 12 -> cool 12. (N>=3: a pure
    // 4-fold quasicrystal is an egg-carton square grid — start at 6-fold.)
    int waves = 3;                         // N; pattern symmetry = 2N
    if (sid == 1) waves = 4;
    else if (sid == 2) waves = 5;
    else if (sid == 3) waves = 5;
    else if (sid == 4) waves = 3;          // breakdown: collapse + heavy fracture
    else if (sid == 5) waves = 6;
    else if (sid == 6) waves = 6;
    float fracture = (sid == 4) ? 1.0 : 0.0;

    // drivers (synthesised when silent) -----------------------------------
    float vocals = mix(0.30 + 0.30 * sin(u_time * 2.3 + 0.5), u_audio_vocals_stem, playing);
    float other  = mix(0.30 + 0.25 * sin(u_time * 1.1), u_audio_other_stem, playing);
    float barI   = mix(floor(u_time * 123.0 / 60.0 / 4.0), u_bar_index, playing);
    float prog   = mix(fract(u_time * 0.01), u_song_progress, playing);

    // --- whirl: continuous sema + a per-bar snap notch (visible phase-lock) -
    float whirl = u_time * 0.045 + barI * 0.11;
    // cursor tilts the fold centre (floor-and-ceiling) and pans it a touch.
    vec2 mw = vjMouseWorld(u_mouse, res);
    vec2 panMw = vjMouseWorldOrZero(u_mouse, res);
    vec2 pc = p - 0.18 * panMw;
    pc = rot2d(-whirl) * pc;               // rot2d is CW; negate for CCW sema

    // breakdown fracture: shear/jitter the lattice so the stars break apart.
    if (fracture > 0.0) {
        pc += fracture * 0.25 * vec2(fbmRot(pc * 2.0 + u_time * 0.3) - 0.5,
                                     fbmRot(pc * 2.0 + 5.1 - u_time * 0.3) - 0.5);
    }

    // 303 cutoff sweep: frequency + phase climb; key events bump frequency.
    float keyEnergy = 0.0;
    for (int k = 0; k < 15; k++) keyEnergy += u_key_event[k];
    float freq  = 7.0 + 3.0 * prog + 1.5 * other + 0.6 * keyEnergy;
    float phase = u_time * 0.20 + 1.2 * other;

    // nested kaleidoscope: mirror inside each triangular wedge. The sub-fold
    // count breathes with the vocal so the mirrors shimmer.
    float subN = 2.0 + step(0.5, vocals);
    vec2 pk = kaleidoFold(pc, float(2 * waves), subN);

    float q = girihField(pk, freq, waves, phase);

    // --- strapwork lines only (the kaleidoscope cells) -------------------
    // The scattered ember-dot field is GONE: Louis flagged it three runs
    // running ("square grid" -> "weird corners" -> "not mesmerizing"). The
    // mandala is now the clean kaleidoscope strapwork; the moving lights are
    // the hyperspace-tunnel streaks + the filament + bloom, not a dot field.
    float lines = smoothstep(0.045, 0.0, abs(q)) * 0.9;           // zero-contour strapwork
    float intensity = lines;

    // focal radial envelope — bright always-on core (lead silhouette), edges
    // fall toward near-black so it reads as a mandala, not a wall-to-wall grid.
    float r = length(p);
    float env = 0.14 + 0.86 * exp(-r * r * 0.8);
    intensity *= env * (1.0 - 0.65 * fracture);

    // brightness band: always-on silhouette ~0.30, accents ride on top.
    float starGain = max(0.30, 0.45 + 1.05 * vocals);
    float bright = intensity * starGain;
    bright += 0.25 * u_downbeat * intensity;                      // downbeat swell
    bright += 0.6 * keyEnergy * smoothstep(0.4, 0.0, r);          // key petal flash
    bright += 0.35 * vjCursorHeat(p, mw, 0.4) * intensity;        // cursor brighten

    // colour: strapwork in ember/wine, dense strapwork near the core flares
    // to cream (soft, round — derived from the smooth line field, not dots).
    vec3 col = warmCycle(0.83 + 0.10 * lines + 0.05 * prog) * bright * 1.2;
    col += vec3(1.0, 0.86, 0.62) * pow(lines, 2.0) * starGain * 0.7 * smoothstep(0.6, 0.0, r);

    // at the drop, recede so the filament's hyperspace tunnel dominates (the
    // mandala stays present as the kaleidoscope walls, just dimmer).
    float drop = ((sid == 3 || sid == 5) ? 1.0 : (sid == 2 ? 0.5 : 0.0))
               * saturate(0.5 + 0.8 * u_audio_level);
    col *= 1.0 - 0.45 * drop;
    col *= mix(1.0, smoothstep(0.0, 0.42, r), drop);   // open a dark tunnel mouth at the drop

    // cool the outro to near-black (the embers die at the cierre).
    col *= 1.0 - 0.7 * smoothstep(0.93, 1.0, prog);

    // Output only this layer's light; the engine screen-blends it onto u_below.
    fragColor = vec4(max(col, 0.0), 1.0);
}
