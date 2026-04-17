// ABOUTME: Persistent damage field for "brick" — cursor adds gaussian heat, decays over ~3s.
// ABOUTME: .r channel holds damage ∈ [0,1]. When idle, autonomous strikes keep the piece alive.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

out vec4 fragColor;

// Tuned so a held cursor clamps to 1.0 in ~10 frames, and a single tap decays
// through perceptible damage over roughly 3 seconds at 60 fps.
const float DECAY        = 0.988;
const float CURSOR_RATE  = 0.32;
const float CURSOR_SIGMA = 0.08;   // aspect-corrected kernel radius

// Autonomous "drummer" when the viewer isn't driving — so the published clip
// has an inner pulse instead of a frozen wall.
const float WALL_COMPLETE = 8.4;   // matches shader.frag's build window
const float AUTO_SIGMA    = 0.085;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    if (u_frame == 0) {
        fragColor = vec4(0.0);
        return;
    }

    float dmg = texture(u_state, uv).r;
    dmg *= DECAY;

    float aspect = u_resolution.x / u_resolution.y;

    // Cursor is the viewer's instrument — always adds when moved over the
    // wall. Gaussian heat at the cursor, accumulating to 1.0 under a held
    // hand in ~10 frames.
    if (!vjMouseIdle(u_mouse)) {
        vec2 mN = u_mouse / u_resolution.xy;
        vec2 d  = uv - mN;
        d.x *= aspect;
        float add = exp(-dot(d, d) / (CURSOR_SIGMA * CURSOR_SIGMA)) * CURSOR_RATE;
        dmg = min(dmg + add, 1.0);
    }

    // Invisible hammers strike the wall on-beat (~104 BPM) regardless of
    // cursor — so the wall is always under siege, and the cursor joins the
    // assault rather than being the only hand in the room. Each beat: a new
    // random cluster of 4 impacts (primary + satellites), sharp attack
    // envelope so hits read as percussive, not as a gliding brush.
    if (u_time > WALL_COMPLETE) {
        float t       = u_time - WALL_COMPLETE;
        float beats   = t * (104.0 / 60.0);
        float beatIdx = floor(beats);
        float beatPh  = fract(beats);
        float attack  = pow(1.0 - beatPh, 6.0);

        for (int s = 0; s < 4; s++) {
            float fs = float(s);
            vec2 pos = vec2(
                0.18 + 0.64 * hash21(vec2(beatIdx + fs * 3.17,  1.7)),
                0.22 + 0.56 * hash21(vec2(beatIdx + fs * 2.81,  7.3))
            );
            float sigma = 0.055 + 0.045 * hash21(vec2(beatIdx + fs * 5.91, 13.2));
            float amp   = (s == 0 ? 0.80 : 0.50)
                        * (0.75 + 0.5 * hash21(vec2(beatIdx + fs, 31.0)));
            vec2  d = uv - pos;
            d.x *= aspect;
            float add = exp(-dot(d, d) / (sigma * sigma)) * attack * amp;
            dmg = min(dmg + add, 1.0);
        }
    }

    fragColor = vec4(dmg, 0.0, 0.0, 1.0);
}
