#version 300 es
// ABOUTME: Click-selection state for the bubbles lab — a tiny ping-pong
// ABOUTME: texture holding (selected treatment, prev-touch flag). Click a
// ABOUTME: bottom tick = lock it; same tick again = back to auto-cycle;
// ABOUTME: anywhere else = step to the next treatment.
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
out vec4 fragColor;

const float CYCLE = 12.0;

void main() {
    vec2 prev = texture(u_state, vec2(0.5)).xy;
    float sel = prev.x;   // -1 = auto-cycle, 0..11 = locked treatment
    float was = prev.y;   // touch flag last frame (for edge detection)
    if (u_frame < 1) { sel = -1.0; was = 0.0; }

    float touch = (u_touch_count > 0) ? 1.0 : 0.0;
    if (touch > 0.5 && was < 0.5) {        // touch-down edge
        vec2 tuv = u_touches[0].xy / u_resolution;
        // tick strip: ticks live at uv.x = 0.5 + (i - 5.5) * 0.05, uv.y ~ 0.03
        if (tuv.y < 0.09) {
            float fi = (tuv.x - 0.5) / 0.05 + 5.5;
            float idx = floor(fi + 0.5);
            if (idx >= 0.0 && idx < 12.0 && abs(fi - idx) < 0.5) {
                // clicking the already-locked tick releases back to auto
                sel = (abs(sel - idx) < 0.5) ? -1.0 : idx;
            }
        } else {
            // click anywhere else: step to the next treatment (locks)
            float cur = (sel < -0.5) ? floor(mod(u_time / CYCLE, 12.0)) : sel;
            sel = mod(cur + 1.0, 12.0);
        }
    }

    fragColor = vec4(sel, touch, 0.0, 1.0);
}
