# HTML treemap comparison

Run `python3 -m http.server 5176 --directory public --bind 127.0.0.1` from the repository, then open http://localhost:5176/treemap-prototype/.

The bottom-right HTML / SVG buttons switch renderers and retain the selected category/project. Press C to hide/show the comparison controls. Both variants use the same fixed random seed: production randomises weights on every load, which would otherwise make visual comparison impossible.

This standalone experiment uses a snapshot of the public lenart.pl project JSON, original CSS, original lightbox, and adapted original navigation. Fonts and images still load from their existing remote hosts; internet access is required. No analytics runs here. No CMS/database is required and the unfinished Next.js source is untouched.

HTML uses the same D3 squarify coordinates, rounding, colours, stacking order and 600ms exponential zoom. The revised renderer uses one named D3 transition for all tile geometry, retaining actual painted coordinates on interruption. Native object-fit cover/contain and overflow clipping replace manual natural-size transforms and animated clip paths. Geometry writes are batched without per-frame layout reads; cells use layout containment. Image upgrades are decoded before swapping, with stale-request protection. CSS hover transitions are not cancelled. Offscreen culling considers the swept rectangle, not just endpoints.

The previous WAAPI experiment was reported less smooth by the user. It generated 121 keyframes per animated property per tile, estimated interrupted animation state, cancelled CSS transitions and could use stale image dimensions. It has been removed. The new implementation animates width/height, so it does incur layout/paint work; it makes no claim of compositor-only animation or proven speed advantage over SVG.

Run `node scripts/test-treemap-prototype.mjs` from the repository for animation interruption, image loading race and visibility regression checks. These use mocked DOM objects and do not replace visual/performance testing in a browser.

SVG is the live implementation adapted for local data/asset URLs, seeded weights and hash navigation. Both variants have a breadcrumb rebinding fix. HTML also supports keyboard activation and reduced motion. This is a comparison of these concrete implementations, not a controlled benchmark of HTML versus SVG in general.

Check desktop/mobile overview, hover labels, category/project zoom, interrupted transitions, breadcrumbs, back/forward, resize, information toggle, and lightbox. Compare both at the same viewport and hash; allow fonts/images to finish loading. Pixel fidelity and frame-rate improvement require browser verification. No automated browser or screenshot comparison was available during implementation.

Known scope: no CMS integration, no autoplay (disabled in live source too), no publish/deploy changes. The shared info panel retains its original width/left CSS transition. D3's original layout topology is retained on resize, with viewport scaling, as on the live site.


## Comparison with supplied CodePen JavaScript

The user supplied the source of figle/yLNWzZO after CodePen blocked HTTP access. It is already an HTML treemap (`div` cells), using D3 style transitions on left/top/width/height. Its image background code is commented out, so the supplied JS does not exercise image decoding or cover/contain cropping.

Differences from the live site:
- Custom tile: `treemapBinary` in a fixed viewport-sized coordinate system, remapped into each parent rectangle. The live site uses ordinary `treemapSquarify`.
- Equal leaf weights and original order, rather than random weights and height/value sorting.
- 800ms `easeCubicOut`, rather than 600ms `easeExpInOut`.
- No explicit rectangle gutter in the JS; CSS was not supplied.

The CodePen timing experiment was removed at the user’s request. Both renderers always use the live 600ms exponential-in-out timing; any old motion query parameter is ignored. The binary layout is not adopted because it would alter the composition.

The pen also has resize issues we did not copy: it replaces its configured treemap with a default one, does not update scale ranges, and does not reapply zoom domains after layout. Its single precreated transition is also not the lifecycle used here; the prototype creates a fresh transition for each zoom.


## Safari follow-up

The user reports HTML remains choppier than SVG on Safari for Mac. The prototype is not demonstrated to be faster. HTML width/height changes still require layout/paint for nested clipping and object-fit boxes; using a transform for position does not eliminate that work. No Safari rendering trace has been captured, so no particular WebKit bottleneck is confirmed.

HTML now defers full-size image upgrades until zoom ends, restores thumbnails on leaving a project, contains each tile’s painting, and hides fully faded ancestors after the transition. This changes image-resolution timing, not tile geometry/easing. These are workload reductions to evaluate, not a claimed fix for Safari frame pacing. SVG remains the proven smoother implementation in the user’s testing.
