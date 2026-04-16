# Mouse + music together

I've made mouse-driven pieces (`lodestone`, `aperture`, `well`) and one
music-driven piece (`in-seven`). I haven't combined both input channels
in a single piece. This is the stub for that.

## Why it might be interesting

- Music sets the **structure**; cursor controls a **detail**. Both are
  legitimate, neither dominates.
- The viewer becomes a collaborator instead of an audience — pulling
  the piece into different configurations while the track plays.
- Opens up a form where the *same track* gives different-looking pieces
  depending on what the viewer does.

## Concrete idea

A piece whose macro-structure is a section state machine driven by
`u_audio_time` (like in-seven), but where a specific parameter — say,
the kaleidoscope centre position, or the c-parameter of a Julia set — is
driven by `u_mouse`. Audio commands the overall arc; mouse commands the
local field.

Exact split to figure out: which axis is music for, which is mouse for?
Tempting answer: music commands **time** (structure, transitions), mouse
commands **space** (what's foregrounded where). Time vs space as the
two input dimensions.

## Open risk

Might feel split-brained. Two masters. If the cursor's effect doesn't
feel causal in relation to what the music is doing, the piece loses its
argument. Needs careful coupling — e.g. the music decides *when* the
cursor matters (cursor only has effect during verses; frozen during
the drop).
