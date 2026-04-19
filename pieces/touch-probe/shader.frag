// ABOUTME: Debug piece for mobile gestures — visualises u_zoom / u_pan / u_tap_pulse
// ABOUTME: so manual QA and smoke tests can verify the uniforms are wired live.
#version 300 es
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_zoom;
uniform vec2  u_pan;
uniform float u_tap_pulse;
out vec4 fragColor;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 w  = (uv - u_pan) / max(u_zoom, 1e-3);

  float r = length(w);
  float rings = sin(r * 30.0 - u_time * 1.5);
  float field = 0.5 + 0.5 * rings;

  vec2 m = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 mw = (m - u_pan) / max(u_zoom, 1e-3);
  float cursor = smoothstep(0.04, 0.0, length(w - mw));

  float flash = u_tap_pulse;

  vec3 col = vec3(field * 0.4);
  col += vec3(1.0, 0.8, 0.4) * cursor * 0.9;
  col += vec3(1.0, 0.9, 0.7) * flash * 0.6;
  fragColor = vec4(col, 1.0);
}
