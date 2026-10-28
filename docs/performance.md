# Performance checks

Open `/hs?perf=1` in a development or production build to show the opt-in
overlay. `&bench=1` starts one benchmark per browser session; the overlay button
can also start it. The benchmark loads `All_Tiles_SVG_Test.json`, times a
scripted camera orbit and synthetic pointer sweep, and prints average/p95 frame
times. `&perfSeconds=N` sets each phase (1–60 seconds, default 2). Run once with
`&perHexLand=1` in development for the per-hex renderer and Medium texture
cases. Copy JSON exports the most recent counters, benchmark and leak results.
The overlay and benchmark JSON include device-pixel ratio, CSS and drawing-buffer
dimensions, and the WebGL renderer string.
The pointer metrics use User Timing measures for the window pointer dispatch,
R3F's pointer handler, the shared app hover handlers, drag-controller listeners,
and the hovered-world-point store write. The overlay derives R3F bookkeeping
from dispatch minus raycast and measured app handlers, and shows remaining
window/event work separately. Compare against `/hs?perf=1&perfNoEvents=1` to
disable the R3F event manager for that run; this is a diagnostic mode and
selection/hover are intentionally unavailable while enabled.
With `?perf=1`, snapshots also count unique backing buffers for scene geometry,
instance matrices/attributes, and texture CPU data; list cached terrain texture
arrays and the serialized manifest size; and report the 15 largest draw-call
sources. The per-mesh render wrapper is installed only while performance
collection is active. Draw sources use each placed piece's inventory ID; the
`Land / other` bucket includes untagged land and scene helpers. Texture/manifest
sizes are CPU-side estimates, not GPU allocation sizes. No arrays are released:
retaining texture data preserves Three.js context-restoration behavior.
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
rAF and replaced hover timeouts are canceled on replacement and unmount.
Per-hex highlight changes are coalesced into bounded update ranges.

Zundo's temporal middleware calls `partialize` and then the configured equality
callback on every store update. Its equality check now compares board references,
so hover-only updates avoid deep comparisons and do not create undo history.
Equal map loads reuse the current board references; the load-only structural
comparisons are not run on transient updates. The laptop's reported late FPS
decay cannot be attributed conclusively to heat or CPU saturation from software
rendering; the measurements rule out resource accumulation in this run, not
thermal throttling on real hardware.

Static shadow maps are requested again for three rendered settling frames after
a shadow-affecting store change. The window is extended while Drei reports
active model loads, covering Suspense-delayed model mounts and per-hex effects.
The GLTF hook also requests a refresh when a model consumer mounts, including
when the GLTF was already cached and the mount therefore did not pass through
the loading manager. In the e2e shadow diagnostics, `data-shadow-triggers`
records application requests, not every internal renderer decision. A lone
shadow render with no new trigger is therefore an observed renderer-side
invalidation (or a request outside the recorded app paths), not evidence of a
store update; the test compares camera-motion renders with an equal idle window
to tolerate the occasional single render.
The browser regression test checks placement and camera-only motion; it passed
in Chromium after installing the Playwright browser in this sandbox.

## Picture-only High quality

The per-hex Graphics controls include an opt-in persisted picture setting. When
enabled, picture capture temporarily selects High and lights/shadows, waits for
the High texture load and three rendered settling frames, captures, then restores
the prior tier and lighting. If High textures fail, the prior settings are
restored before capture and a warning is shown. This is a capture-time quality
trade, not a change to the interactive defaults.

## Performance round-two measurement status

The overlay/benchmark now emits typed-array, instance, texture-array and
per-inventory draw-source counters so the target laptop's next `?perf=1&bench=1`
run can identify the actual heap and draw-call contributors. Those counters do
not by themselves prove which allocation caused the owner's additional ~1 GB;
the browser's reported heap must be compared after a long idle (or forced GC
when exposed). No model batching, lighting-quality trade, DPR/AA default, or
pointer coalescing change is claimed from the software-rendering baseline.

A one-second headless run on the 235-piece benchmark map used a 980×656 drawing
buffer at DPR 1. Its few frame intervals are a smoke measurement, not a stable
comparison:

| Renderer / tier / lights | Camera mean (intervals) | Pointer mean (intervals) | Pointer ms/move | Raycast ms/move | R3F dispatch ms/move |
| --- | ---: | ---: | ---: | ---: | ---: |
| Old / Low / off | 155 ms (10) | 127 ms (14) | 14.6 | 7.1 | 9.5 |
| Per-hex / Low / off | 109 ms (12) | 170 ms (11) | 13.3 | 6.3 | 8.7 |
| Old / Low / on | 385 ms (4) | 852 ms (2) | Inconclusive | 5.6 | 12.8 |
| Per-hex / Low / on | 674 ms (4) | 985 ms (3) | Inconclusive | 5.9 | 9.1 |

Both renderers reported a sampled JS heap of about 190 MiB in this software
browser; the owner's laptop's 463/1,474 MiB result was not reproduced. The
scene's unique typed-array backing stores measured 196.2 MiB Old/Low and
22.1 MiB Per-hex/Low, mostly Old's instance matrices; this does not explain an
extra Per-hex heap gigabyte. Medium's retained decoded texture arrays measured
5.0 MiB and its serialized manifest about 11 KiB, also far below that gap.
This investigation found and removed one avoidable Per-hex allocation: the
parent previously built a complete `LandHexInstanceDatum[]` only to extract
IDs, while `LandHexInstanced` built the same records again. The parent now
builds only the IDs needed to exclude those cells from the legacy renderer.
No heap delta is claimed from this smaller duplicate-object-array removal.

The pointer split is available, and `perfNoEvents=1` provides the disabled-R3F
comparison. The shared hover handler, the drag controller, and the world-point
store action have named User Timing measures. The measurements above are too
short and inconsistent to support a pointer optimization; no moves are
coalesced and hover behavior is unchanged.

In the matched Old/Low/off smoke run, R3F events enabled measured 14.6 ms total
window dispatch per synthetic move (7.1 ms raycast, 9.5 ms R3F dispatch, with
overlapping app/bookkeeping timing). With `perfNoEvents=1`, it measured 0.07 ms
per move and zero raycast/R3F/app-handler time. This isolates the event system
as work on the pointer path, but the software-rendered pointer frame averages
were 127 ms enabled and 124 ms disabled (14 vs 12 intervals): the overloaded
renderer makes that frame-time difference inconclusive.

No model batching/merging or lighting/shadow-quality trade was adopted. The
draw-source counters now average per-render-frame counts, but the highest
piece-family contributors still need to be confirmed on the target device
before changing pickable piece models. The only quality change is the optional,
persisted picture-only High capture; the interactive default is unchanged.

| Part | Software-rendering result / change | Remaining real-laptop check |
| --- | --- | --- |
| 1 — heap | Geometry, instance, texture CPU bytes and manifest estimates added; removed the duplicate per-hex object-array build. Software heap remained ~190 MiB in both renderers; no 1 GB cause identified. | Compare heap after long idle/forced GC, inspect the new byte breakdown, identify any remaining JS-object allocation source. |
| 2 — draw calls | Inventory-ID draw-source counters added; no appearance-affecting batching adopted. | Reconfirm top 2–3 piece families and draw calls/frame, then decide whether batching is worthwhile. |
| 3 — pointer | Added raycast, R3F dispatch, app-handler, drag/store and residual timings plus opt-in `perfNoEvents=1`. | Run normal and disabled-event sweeps on the laptop and compare frame time and split; verify immediate hover. |
| 4 — lit per-hex | No tier/light/shadow change adopted; no quality trade claimed. | Compare receive-shadow, light-count, shadow-map and fluid variants visually/performance-wise at each tier. |
| 5 — leftovers | Late cached-model mounts request shadow refresh; picture-only High restores tier/lights, with load-failure fallback. Unit and e2e coverage added. | Confirm screenshot appearance/restoration and shadow settle behavior on the target laptop. |

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
