# V-Jaygent eval system — Resources

## Knowledge (primary sources, all in-repo)

- [taste.md](../taste.md)
  THE rubric. Mesmerizing probes (incl. the two-timescale Prediction
  hard gate at lines ~56–164), claim check (~222), VJ-lens probe
  families (~244–578), dimension anchors (~579–634), decision rules
  (~202). Use for: any question "why did the critic grade X this way".
- [skills/vjay-iterate/SKILL.md](../skills/vjay-iterate/SKILL.md)
  The critic's operating manual: reading list, critique document
  shape, YAML-tail schema (~line 702), shader-verdict rules (~376),
  the five verdicts (~685), loop mechanics and stop conditions.
  Use for: inputs/outputs contracts and loop control flow.
- [skills/vjay-new-piece/SKILL.md](../skills/vjay-new-piece/SKILL.md)
  The full creation flow (brief gates → render → lints → self-critique
  → delegate to iterate). Use for: where the critic sits in the pipeline.
- [brainstorming/critiques/](../brainstorming/critiques/)
  44+ real critiques. Canonical worked examples:
  `kinetic-energy-v1.md` → `kinetic-energy-v2.md` (needs-tweak → fix →
  chef-doeuvre), `we-owe-no-one-v3.md` (every probe family populated),
  `cirrus-v2-i3.md` (prose-era critique + iteration history).
- [brainstorming/critiques/evidence/](../brainstorming/critiques/evidence/)
  Exact frames each critique was graded from (since 2026-06-11).
- [studio/probe-info.json](../studio/probe-info.json)
  Verbatim per-probe rubric excerpts (the grades-view tooltips).
- [VISION.md](../VISION.md)
  The aesthetic constitution (palette rules, unpredictability doctrine).
- Live studio: <https://vjaygent.develle.fr> — press `c` → verdict chip,
  or `v` inside a piece; `Shift+V` for the all-pieces grades list.

## Wisdom (communities)

- None registered yet. This is a single-author system; the "community"
  is Louis + Claude iterating on the rubric itself. If outside
  calibration is ever wanted: shader-art communities (Shadertoy,
  r/creativecoding) for taste benchmarks.

## Gaps

- No formal spec for how `composite` (UI aggregate) should relate to
  verdicts — it is a display-only mean of dimension scores, defined in
  `studio/server.mjs compositeOf()`, not in taste.md.
