# Performance checks

Open `/hs?perf=1` in a development or production build to show the opt-in
overlay. `&bench=1` starts one benchmark per browser session; the overlay button
can also start it. The benchmark loads `All_Tiles_SVG_Test.json`, times a
scripted camera orbit and synthetic pointer sweep, and prints average/p95 frame
times. `&perfSeconds=N` sets each phase (1–60 seconds, default 2). Run once with
`&perHexLand=1` in development for the per-hex renderer and Medium texture
cases. Copy JSON exports the most recent counters, benchmark and leak results.
The 120-second leak sweep is a separate button and samples every five seconds.

## Leak and hover diagnosis

The headless per-hex 120-second sweep produced 23 samples. Scene objects
(4,282), geometries (219), textures (1), programs (11), sampled heap (177 MiB),
and active store subscribers (29,400) stayed flat; pending timers varied
between zero and one and pending rAF callbacks between two and three. The
checker flagged no monotonically growing metric. The high subscriber count is
the current mounted scene's baseline, not a rising count.

Three.js's WebGL attribute uploader merges and clears `updateRanges` after each
buffer upload. With the default always-render loop, the per-hex highlight
ranges were therefore not an accumulating leak in this sweep. The hover-leave
rAF is canceled on replacement and unmount. Hover timeouts do get replaced
without clearing their previous handles, but they fire shortly afterward; this
did not cause monotonic growth in the run.

Zundo's temporal middleware calls `partialize` and then the configured equality
callback on every store update. The existing hover test confirms hover-only
updates do not create undo history, but the equality callback currently deep
compares board arrays on those updates. This is avoidable CPU work, not history
growth. The laptop's reported late FPS decay cannot be attributed conclusively
to heat or CPU saturation from software rendering; the measurements rule out
resource accumulation in this run, not thermal throttling on real hardware.

## Idle rendering

On the five-piece e2e fixture, headless SwiftShader continued rendering while
idle: the last five one-second samples ranged from 111–146 ms/frame, with 702
draw calls, 70,660 triangles, 47 geometries and one pending rAF each. Store
updates, pointer moves and MapDisplay3D React commits were zero in those samples.
These are software-rendered frame costs, not GPU/CPU utilization or power
measurements. The default loop remains `always`; no idle-aware loop was proposed
because the existing demand-loop comment warns of stale-window lockups.

## Initial software-rendering baseline

Collected with headless Chromium/SwiftShader, a 1-second phase length, and the
235-piece map. The software renderer was heavily overloaded: several phases
produced only one to fourteen frame intervals, so these ratios are directional,
not stable estimates of laptop performance. The figures below normalize mean
frame time to the same renderer/tier with lights off; they are not FPS.

| Renderer / tier | Lights | Camera mean / p95 relative (samples) | Pointer mean / p95 relative (samples) |
| --- | --- | ---: | ---: |
| Old / Low | Off | 1.00× / 1.00× (7) | 1.00× / 1.00× (6) |
| Old / Low | On | 3.02× / 1.20× (3) | 2.16× / 1.43× (3) |
| Per-hex / Low | Off | 1.00× / 1.00× (11) | 1.00× / 1.00× (10) |
| Per-hex / Low | On | 3.61× / 1.98× (4) | 10.85× / 3.14× (1) |
| Per-hex / Medium | Off | Inconclusive (3) | Inconclusive (1) |
| Per-hex / Medium | On | Inconclusive (4) | Inconclusive (2) |

The pointer phase also reported 2.26 synthetic moves/s, 8.02 ms mean raycast,
3.61 store updates/s, and 27.10 MapDisplay3D React commits/s for Old/Low with
lights off; Per-hex/Low reported 4.68 moves/s, 4.71 ms mean raycast, 11.44
store updates/s, and 7.28 commits/s. Software rendering makes all of these
comparisons noisy; the one-sample Per-hex/Low lights-on pointer result is
especially inconclusive. No optimization is claimed from these baseline ratios
alone. Real integrated-GPU behavior, idle power use, and thermal throttling
cannot be measured here; the owner should compare the production build on the
target laptop as described in the pull request.
