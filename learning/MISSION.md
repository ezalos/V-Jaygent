# Mission: The V-Jaygent eval system (critic methodology)

## Why
Louis is about to work on **improving the critic** — the agent that
grades every art piece. To change a grading system safely he first
needs to understand exactly what it consumes, what it emits, and how
it decides — at the level of individual probes, grade values, and
verdict routing, grounded in real critiques from this repo.

## Success looks like
- Louis can read any critique YAML tail and explain every key and value in it
- Louis can trace a verdict (e.g. kinetic-energy v1 "needs-tweak") back to the exact probe results and rubric rules that forced it
- Louis can say where the artist/critic loop stops, and why those stop conditions exist
- Louis can name the critic's failure modes (rounding up, stills under-grading motion, self-grading bias) and the calibration rules that counter them
- Louis can propose a critic change and predict which downstream consumers it affects (iterate loop, studio grades view, evidence trail)

## Constraints
- Ground every claim in repo files (taste.md, skills/vjay-iterate/SKILL.md, real critiques) — no abstract pedagogy
- Louis is a strong engineer; depth is welcome, hand-waving is not
- Teaching workspace lives in `learning/` (kept versioned with the repo it explains)

## Out of scope
- Shader/GLSL authoring techniques (separate topic)
- The audio analysis pipeline internals (only its outputs as critic inputs)
