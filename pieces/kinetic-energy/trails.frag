// ABOUTME: Trail accumulation for kinetic-energy — ping-pong feedback buffer. Reads its
// ABOUTME: own previous frame * decay, gathers nearby particles, splats speed^2 -> light.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;    // particle pos/vel
uniform sampler2D u_bins;     // spatial hash
uniform sampler2D u_trails;   // self ping-pong (previous frame)

uniform float u_energy_smooth;
uniform float u_downbeat;
uniform float u_audio_playing;
uniform vec2  u_mouse;        // cursor in target pixels; (0,0) when idle
uniform vec4  u_touches[8];
uniform int   u_touch_count;

out vec4 fragColor;

const int   PGRID    = 32;
const int   BIN_GRID = 48;
const float REF_SPEED = 0.42;    // speed that maps to full white-hot
const float SPLAT_R   = 0.0055;  // base streak scale in torus uv
const float DECAY     = 0.86;    // per-frame trail retention (streak length); BOUNDED so
                                 // continuous playback can't accumulate to a full-frame wash
const float DEPOSIT   = 1.15;    // peak deposition — high to offset the tight sharp streak
const float EMBER     = 0.045;   // speed-independent ember floor: slow particles deposit a
                                 // faint glow so calm passages show filaments, not a void
                                 // (v4 fix — kept tiny so quiet still reads quiet)
const float CURSOR_R  = 0.022;   // cursor ember-wake halo radius (torus uv)
const float CURSOR_DEP = 0.075;  // per-frame wake deposition; steady state ≈ dep/(1-DECAY)

// Warm luminance ramp: dim ember (coasting) -> amber -> cream-white (driven).
// All warm — fast particles read as white-hot light, never a cool intrusion.
vec3 heat(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 ember = vec3(0.32, 0.07, 0.015);
    vec3 amber = vec3(1.00, 0.46, 0.13);
    vec3 cream = vec3(1.00, 0.94, 0.82);
    vec3 c = mix(ember, amber, smoothstep(0.0, 0.5, t));
    c     = mix(c,     cream, smoothstep(0.45, 1.0, t));
    return c;
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    if (u_frame == 0) { fragColor = vec4(0.0); return; }

    // Constant decay. (An earlier energy-scaled boost lengthened trails at the
    // peak — exactly where coverage is already highest — and washed the frame
    // to a full gold field under continuous playback. Keep it flat and bounded.)
    vec3 col = texture(u_trails, uv).rgb * DECAY;

    ivec2 myCell = ivec2(uv * float(BIN_GRID));

    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            ivec2 cell = ivec2(
                (myCell.x + dx + BIN_GRID) % BIN_GRID,
                (myCell.y + dy + BIN_GRID) % BIN_GRID);
            vec4 ids = texelFetch(u_bins, cell, 0);
            for (int s = 0; s < 4; s++) {
                float idF = ids[s];
                if (idF < 0.0) continue;
                int id = int(idF + 0.5);
                vec4  st = texelFetch(u_state, ivec2(id % PGRID, id / PGRID), 0);
                vec2  pp = st.xy;
                vec2  pv = st.zw;

                vec2 d = uv - pp; d -= floor(d + 0.5);   // toroidal
                d *= vec2(aspect, 1.0);
                float r2 = dot(d, d);
                if (r2 > (SPLAT_R * 4.5) * (SPLAT_R * 4.5)) continue;

                float speed  = length(pv);
                float speedN = clamp(speed / REF_SPEED, 0.0, 1.0);
                float lum    = speedN * speedN;          // kinetic energy ~ v^2

                // Anisotropic streak: TIGHT perpendicular cross-section (crisp,
                // a few px wide) stretched ALONG velocity (the motion line). A
                // thin sharp profile reads sharp — the round Gaussian blob was
                // the blur. Faster particles streak longer.
                vec2  fwd  = speed > 1e-5 ? pv / speed : vec2(1.0, 0.0);
                vec2  side = vec2(-fwd.y, fwd.x);
                float along = dot(d, fwd);
                float perp  = dot(d, side);
                float wPerp  = SPLAT_R * 0.40;                  // crisp width
                float wAlong = SPLAT_R * (0.6 + 1.7 * speedN);  // streak grows with speed
                float q = (along * along) / (wAlong * wAlong)
                        + (perp  * perp ) / (wPerp  * wPerp);
                float splat = exp(-q);
                splat *= splat;                                 // sharpen the profile

                // Deposition is speed-gated with a small EMBER floor: fast
                // particles burn cream-white, slow ones leave a faint ember
                // filament instead of vanishing (the ground still reads
                // near-black; the floor is far below the music's dynamic range).
                col += heat(max(lum, 0.08)) * splat * (lum + EMBER) * DEPOSIT;
            }
        }
    }

    // --- Cursor light budget (v4 fix, path A): the pointer deposits its own
    // dim ember wake, independent of particle speed and of the music — the
    // cursor is a second LIGHT SOURCE, not just a second force. The ping-pong
    // decay turns the moving halo into a fading comet tail automatically.
    // v5 fix: the wake was one stop too dim through the display envelope's
    // minima in silence (cursor_without_music was the critique's closest pass).
    // Boost deposition when SILENT (floor-and-ceiling so the lit case doesn't
    // double-brighten) — the same shape the silent particle drive uses.
    float cursorDep = CURSOR_DEP * mix(1.8, 1.0, u_audio_playing);
    if (dot(u_mouse, u_mouse) > 1.0) {
        vec2 mp = u_mouse / u_resolution;
        vec2 d = uv - mp; d -= floor(d + 0.5);
        d *= vec2(aspect, 1.0);
        float g = exp(-dot(d, d) / (CURSOR_R * CURSOR_R));
        col += heat(0.22) * g * cursorDep;
    }
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 fp = t.xy / u_resolution;
        vec2 d = uv - fp; d -= floor(d + 0.5);
        d *= vec2(aspect, 1.0);
        float g = exp(-dot(d, d) / (CURSOR_R * CURSOR_R));
        col += heat(0.22) * g * cursorDep;
    }

    fragColor = vec4(col, 1.0);
}
