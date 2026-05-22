# watershed — references

This piece is the application half of the 2swap study (2026-05-22).
Its research is not duplicated here — it lives in:

- `brainstorming/inspirations/2swap-refs.md` — the artist study:
  2swap's catalog, the *Gravity Basins* video, the chaos vein, the
  aesthetic, and what does / doesn't translate to a VJ piece.
- `brainstorming/techniques/basins-of-attraction.md` — the technique:
  basin-of-attraction coloring, Recipe 1 (the gravity-basin GLSL this
  piece implements), the warm-palette translation, the OKLAB note.
- `brainstorming/techniques/strange-attractors.md` — the cousin
  technique (attractors plotted directly), for contrast.

Direct anchor: 2swap, *Gravity Basins* —
<https://www.youtube.com/watch?v=LavXSS5Xtbg>.

One reference 2swap's video doesn't supply, worth naming here: the
**Wada property** of basin boundaries (Kennedy & Yorke, 1991) — with
≥3 attractors, every boundary point borders all basins at once. It is
the formal reason the filigree never resolves into a clean edge, and
the reason `watershed` keeps ≥3 orbiting wells on screen at all times.
