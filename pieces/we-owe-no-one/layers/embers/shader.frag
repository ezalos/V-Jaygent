#version 300 es
// ABOUTME: embers layer — sparks that rise off the hottest plates; bursts on
// ABOUTME: high-frequency transients; rising trails via u_history feedback.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_high;
uniform float u_audio_bass;
uniform sampler2D u_below;
uniform sampler2D u_history;
out vec4 fragColor;

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    float playing = u_audio_playing;

    float high = mix(0.18 + 0.16 * abs(sin(u_time * 3.1)), u_audio_high, playing);
    float bass = mix(0.32 + 0.18 * sin(u_time * 1.5),      u_audio_bass, playing);

    // a set of vertical lanes; each carries staggered sparks that rise + wrap.
    // burst rate (lanes lit) and rise speed both climb with high-freq energy.
    const float NX = 30.0;
    float lane = floor(uv.x * NX);
    vec3 spark = vec3(0.0);
    for (int k = 0; k < 5; k++){
        float fk = float(k);
        float h  = hash21(vec2(lane, fk * 7.0 + 1.0));
        float lit = step(h, 0.14 + 0.46 * high);
        float speed = 0.20 + 0.16 * hash21(vec2(lane, fk * 2.0)) + 0.55 * high;
        float ph = fract(u_time * speed * 0.28 + h * 5.0 + fk * 0.37);
        float sx = (lane + 0.5) / NX + 0.012 * sin(u_time * 2.0 + lane + fk);
        vec2  sp = vec2(sx, ph);
        float d  = length((uv - sp) * vec2(aspect, 1.0));
        float life = 1.0 - ph;                       // fade as it climbs
        // white-hot core so sparks read against the bright molten plates
        spark += vec3(1.0, 0.88, 0.62) * lit * life * exp(-d * 190.0);
    }
    // emit denser/brighter where the plate below is hot
    float hot = smoothstep(0.14, 0.66, lum(texture(u_below, uv).rgb));
    spark *= 0.46 + 1.9 * hot;
    spark *= 0.55 + 0.85 * bass;                     // the whole shower swells on the kick

    // cursor: the hammer throws a spark fountain where it strikes
    if (u_mouse.x != 0.0 || u_mouse.y != 0.0) {
        vec2 mUv = u_mouse / u_resolution;
        vec2 d = (uv - mUv) * vec2(aspect, 1.0);
        float md = length(d);
        vec2  jc = floor(uv * 110.0);
        float jh = hash21(jc + floor(u_time * 14.0) * 1.7);
        // jittered sparks, biased upward from the strike point
        float burst = step(0.90, jh) * exp(-md * 6.0) * smoothstep(-0.16, 0.26, d.y);
        spark += vec3(1.0, 0.90, 0.66) * burst * 1.3;
    }

    // trails: sample history slightly BELOW so old sparks appear to rise
    float ramp = smoothstep(0.0, 1.0, float(u_frame) / 30.0);
    vec3 hist = texture(u_history, uv - vec2(0.0, 0.0055)).rgb * 0.80 * ramp;

    vec3 col = max(spark, hist);
    fragColor = vec4(col, max(spark.r, hist.r * 0.5));
}
