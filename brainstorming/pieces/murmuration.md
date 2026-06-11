# murmuration — boids-style starling cloud over warm dusk

## Brief gates (vjay-new-piece §1b)

canonical_ref: |
  novel: Craig Reynolds' boids (1987) — distributed flocking from three
  local rules per agent (separation: steer away from neighbours within
  small radius; alignment: match average velocity of neighbours within
  medium radius; cohesion: steer toward average position of neighbours
  within medium radius). The emergent behaviour is recognisable
  murmuration — coherent flock motion with no leader, density waves,
  turning shears, and split-and-merge events. Standard implementation
  is an O(N²) per-step neighbour sum bounded by perception radius;
  faithful renderings show 100-1000 agents at interactive rates.
  We approximate this in a fragment shader without a CPU sim by
  sampling N agent positions per pixel through deterministic hashes
  + a shared curl-noise velocity field (the field carries the
  alignment/cohesion signal; per-agent separation emerges from the
  density readout's gradient).
  Closest siblings in canonical-pieces.md: braid (multiple moving
  attractors deforming a substrate) and throb (discrete events
  firing geometry). We're closer to braid — many moving particles
  reading positions into a shared field — but with N≈80 instead of
  N≈4, and density rather than per-mass lensing as the readout.

eye_landing_candidates:
  - flock body centroids (2-3 visible dense clusters drifting across
    the dusk)
  - shockwave rings (warm bright expanding circles fired on near-
    collision between centroids — discrete events, distinct landing
    zone per fire)
  - the cursor attractor halo (when active — a single drift point
    pulling birds inward; not required for idle)
  - the warm horizon band (low-luminance gradient at the bottom that
    gives the dusk reading and grounds the composition)

warm_cycle: [near-black, ember, wine, amber, cream]
  # near-black for the high sky and bird silhouettes; ember/wine for
  # the dusk horizon; amber/cream for density peaks and shockwave
  # rims. No cool intrusions. Birds are darker than sky at zenith,
  # warmer than sky near horizon — silhouette inverts across the
  # vertical gradient (autumn dusk authentic).

idle_behaviour: |
  At u_mouse=(0,0) the flocks still flow — the curl-noise velocity
  field is driven by u_time on two coprime clocks (0.13 Hz macro
  rotation + 0.071 Hz fine churn). Birds drift along the field;
  centroids wander across the sky on a ~20s circuit. Shockwaves
  fire autonomously when two centroids' density-peak distance
  drops below a threshold (~8 events per minute idle, based on the
  curl field's typical collision rate). No cursor needed for the
  piece to feel alive.
