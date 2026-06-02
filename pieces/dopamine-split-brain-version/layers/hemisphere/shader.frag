#version 300 es
// ABOUTME: One cerebral hemisphere of the split-brain piece — a hex-tiled field
// ABOUTME: of Kuramoto oscillators with per-cell phase = omega*t + noise_offset.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_energy_smooth;

uniform float side;
uniform float omega;
uniform float palette_temp;
uniform float rotation;

out vec4 fragColor;

vec3 paletteCool(float t) {
    // wine -> mauve -> cream (low-luminance warm, the "thinker" side)
    vec3 a = vec3(0.18, 0.04, 0.10);
    vec3 b = vec3(0.55, 0.18, 0.30);
    vec3 c = vec3(1.00, 0.86, 0.72);
    return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, (t - 0.5) * 2.0);
}

vec3 paletteHot(float t) {
    // ember -> amber -> gold (hot warm, the "feeler" side)
    vec3 a = vec3(0.22, 0.05, 0.02);
    vec3 b = vec3(0.95, 0.50, 0.16);
    vec3 c = vec3(1.00, 0.88, 0.50);
    return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, (t - 0.5) * 2.0);
}

// Hex-cell coordinate: returns (cell, frac) where cell is the integer hex
// index and frac is the in-cell offset in [-0.5, 0.5]^2.
// Brick-row offset on odd rows gives the hex appearance.
void hexCell(vec2 p, float size, out vec2 cell, out vec2 frac) {
    vec2 grid = p / size;
    float row = floor(grid.y);
    float xOffset = mod(row, 2.0) * 0.5;
    cell = vec2(floor(grid.x - xOffset), row);
    frac = vec2(grid.x - xOffset - cell.x - 0.5, grid.y - cell.y - 0.5);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 pAspect = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);

    // Optional rotation around screen centre (used so left/right hemispheres
    // have visibly different hex orientations — 0 rad vs 60 deg = 1.047 rad).
    vec2 q = pAspect - 0.5;
    q = rot2d(rotation) * q;
    q += 0.5;

    // Hex lattice. ~7 cells across the visible half-frame is dense enough to
    // read as a field but sparse enough that individual oscillators have
    // identity.
    const float HEX_SIZE = 0.085;
    vec2 cell, frac;
    hexCell(q, HEX_SIZE, cell, frac);

    // In-cell radial distance (anisotropic to match hex aspect: y-row spacing
    // is 1.0 in hex units, but visually rows are √3/2 = 0.866 apart, so
    // squash y).
    vec2 fracAniso = vec2(frac.x, frac.y * 1.155);
    float d = length(fracAniso);

    // Per-cell phase offset — random fixed seed per cell + per side.
    float seed = hash21(cell + side * 17.71);
    float phi_offset = seed * TAU;

    // Per-cell natural frequency jitter so cells aren't all synced even on
    // one side (this is the "ω_i drawn from a distribution" part of
    // Kuramoto). ±20% spread.
    float omega_local = omega * (0.85 + 0.30 * hash21(cell + side * 31.3));

    // Sub-beat jitter — small wobble at ~4-6 Hz so the field is never frozen.
    float jitter = 0.35 * sin(u_time * (5.2 + 1.3 * seed) + seed * TAU);

    // Headless fallback: synthesize a beat clock when audio is paused.
    float synthBeat = 0.5 + 0.5 * sin(u_time * (2.27 * TAU));
    float beatPulse = mix(synthBeat, u_audio_bass, u_audio_playing);
    float energy = mix(0.4 + 0.2 * sin(u_time * 0.7), u_energy_smooth, u_audio_playing);

    float phi = omega_local * u_time + phi_offset + jitter;

    // Brightness has two components per the lead-layer always-on-band rule:
    //   silhouette: always-on hex centre (0.30 baseline)
    //   accent:    cos(phi) modulation, brightened by audio energy
    float silhouette = smoothstep(0.42, 0.10, d) * 0.30;
    float accent = exp(-d * d * 7.0) * (0.5 + 0.5 * cos(phi));
    accent *= 0.50 + 0.80 * beatPulse;            // bass kicks brighten accent
    accent *= 0.65 + 0.80 * energy;               // section energy scales overall

    float intensity = max(silhouette, accent);

    // Macro composition envelope — slow-drifting hotzone so the squint reads
    // a wandering composition, not a flat texture.
    vec2 hot = vec2(
        0.25 + 0.22 * sin(u_time * 0.041 + side * 1.7),
        0.55 + 0.28 * cos(u_time * 0.053 + side * 0.5)
    );
    float hotW = exp(-pow(length(uv - hot) * 1.6, 2.0));
    intensity *= mix(0.55, 1.45, hotW);

    // Side mask — this hemisphere only renders on its own side, with a thin
    // feather around the seam. Section 4 ramps fusion in so the two
    // hemispheres bleed all the way across.
    float fusion = (u_section_id == 4) ? smoothstep(0.0, 0.55, u_section_progress) : 0.0;
    float seamCenter = 0.5;
    float feather = mix(0.06, 0.55, fusion);
    // smoothstep requires edge0 < edge1; flip with (1 - ...) for the left side.
    float rightFade = smoothstep(seamCenter - feather, seamCenter + feather, uv.x);
    float sideEdge = (side < 0.0) ? (1.0 - rightFade) : rightFade;
    intensity *= sideEdge;

    // Cursor coupling — when the cursor is near the seam (x≈0.5), brighten
    // local oscillators on this side: the cursor IS the corpus callosum.
    vec2 mouseUv = u_mouse / u_resolution;
    if (!vjMouseIdle(u_mouse)) {
        float seamCursor = exp(-pow((mouseUv.x - 0.5) * 6.0, 2.0));    // 1 at seam, ~0 far away
        float cursorDist = length((uv - mouseUv) * vec2(aspect, 1.0));
        float cursorGlow = exp(-cursorDist * 9.0) * seamCursor;
        intensity = max(intensity, cursorGlow * 0.9);
    }

    // Downbeat phase-lock pulse — every downbeat fires a brief flash across
    // the WHOLE hemisphere. This is the corpus callosum firing — both sides
    // see it simultaneously, so both hemispheres briefly align.
    intensity += 0.20 * u_downbeat * sideEdge;

    // Section-boundary chaos — brief intensity spike at the start of each
    // section (smoothstep over the first 4% of the section's progress).
    float sectionPulse = (1.0 - smoothstep(0.0, 0.04, u_section_progress)) * 0.45;
    intensity += sectionPulse * silhouette * 1.5;

    // Section 0 (intro) — only the LEFT hemisphere is visible; right is dark.
    // This is the wake-up moment of the piece.
    if (u_section_id == 0 && side > 0.0) {
        intensity *= u_section_progress * 0.3;   // right side dim-fades in over the intro
    }

    // Palette selection — palette_temp blends cool (wine/mauve) to hot
    // (ember/gold) so the same shader can be either hemisphere.
    vec3 colCool = paletteCool(clamp(intensity, 0.0, 1.0));
    vec3 colHot  = paletteHot(clamp(intensity, 0.0, 1.0));
    vec3 col = mix(colCool, colHot, palette_temp);

    // Multiply by intensity so dark regions stay near-black (avoids
    // warm-on-warm collapse to mid-warm soup).
    col *= clamp(intensity * 1.3, 0.0, 1.4);

    fragColor = vec4(col, clamp(intensity, 0.0, 1.0));
}
