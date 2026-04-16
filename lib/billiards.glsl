// ABOUTME: Shader-side primitives for billiard-ball disks whose positions come
// ABOUTME: from a CPU physics step (see studio/billiards.mjs). Visible silhouette
// ABOUTME: = exactly r, so physics and rendering agree on "edges meet" moments.
#ifndef VJ_BILLIARDS_GLSL
#define VJ_BILLIARDS_GLSL

// Alpha mask for a disk of radius r centred at the origin. Hard-edge at r
// with narrow antialiasing inward. Zero at dq >= r — nothing the disk
// contributes exists past the silhouette.
float ballMask(float dq, float r) {
    return smoothstep(r, r - 0.015, dq);
}

// Outline ring just inside the silhouette. Peaks at dq = r - 0.015, dies
// cleanly at dq = r. Gives the disk a defined edge without overshooting.
float ballRim(float dq, float r) {
    return smoothstep(r - 0.020, r - 0.010, dq)
         * (1.0 - smoothstep(r - 0.010, r - 0.002, dq));
}

// Collision flash. `hitPulse` is the CPU-side energy (typically exp(-k·age)).
// Lives entirely inside the disk — centred at 0.82·r with a tight Gaussian,
// so a post-collision bloom doesn't extend past the silhouette.
float ballHitRing(float dq, float r, float hitPulse) {
    return exp(-pow(dq - r * 0.82, 2.0) * 380.0) * hitPulse * 1.2;
}

// Wall proximity for a ball at `centre` inside an axis-aligned box with
// half-extents `bounds`. 0 deep in the middle, 1 against a wall. Handy for
// per-ball or aggregate "about-to-bounce" visual cues.
float ballWallEnergy(vec2 centre, vec2 bounds) {
    float wx = smoothstep(bounds.x * 0.70, bounds.x * 0.95, abs(centre.x));
    float wy = smoothstep(bounds.y * 0.70, bounds.y * 0.95, abs(centre.y));
    return max(wx, wy);
}

#endif
