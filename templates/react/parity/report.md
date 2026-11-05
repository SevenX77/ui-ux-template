# HTML / React parity report

Run: 2026-11-02T22-50-23-497Z
Script SHA-256: `a2dd453ae0c93bbef79c6977bd15178a6163f162d9ecfe18eb94262ee458283f`

Automated style/DOM-meaning/interaction phase: **attained for the stated finite conditions**. Parent fidelity acceptance still requires review of the reported visual differences.

Strict verdict: allChecksPass=false. A screenshot pair passes when its pixels are equal, or equal once images are drawn by nearest-neighbour sampling.

## Fixed method

- 16 selected sections × six themes × two languages × two viewports = 384 section cases. Mode: full; static-only does not establish interactions.
- Viewports: 1440×1080 and 390×844. CSS-pixel scale is 1. Normal motion stays enabled.
- Every section element is paired by child-index DOM path. All listed computed properties match exactly, except width/height tolerate at most 1px. Background images compare presence, not stack-specific URLs.
- Screenshots are unmasked. Every unequal RGBA pixel is counted (channel tolerance 0).
- Each section is captured with its siblings removed, so it sits at the same document position on both sides. React omits unported sections; otherwise neighbours and document coordinates change the raster. Same-stack control runs show those effects vanish within one stack.
- Infinite loops are held at time 0 for the capture on both sides; their keyframes still show. Sections repeat until two frames agree.
- A pair with unequal pixels is captured again with images drawn by nearest-neighbour sampling. Its raw count stays reported; only a nonzero second count fails it.
- Class attributes compare as token sets: empty and absent select the same CSS rules.
- Fixed chrome is clipped from the viewport with #dash behind the top bar, because a locator screenshot of the bar scrolled the page 540px into differing sections.
- Real pointer actions check the actual ux-hover class at 60/220ms. Target-local native forwarding wrappers bracket real class writes; native ux:hover/rest events and MutationRecords corroborate them. Exact descriptors are restored and the same target must stay connected. The old scheduled samples and actual callback times remain diagnostics. Any late write or unsupported/disagreeing trace stops execution for review.
- Other checks retain peer opacity .3, outside-click rest, a held kanban drag with live counts, theme indicator movement plus <=1px alignment after its actual RAF layout settles, and language pin within 2px. A fixed 900ms observation is not a new theme deadline.
- Readiness waits for font loading, background images, actual geometry and finite animations. Sections are visited by scrolling. The gallery category control then All materializes the full shared dataset if lazy scrolling has not loaded it. This is setup, not evidence of natural lazy-load completeness.
- Each configuration requires a new Document response and asserts source-derived initial kanban counts [3, 2, 1, 2]. Each side is brought to the foreground. Fixed chrome is not scrolled by measurement. Ancestor and relevant pseudo-element finite animations finish naturally.
- Theme/language switches use real mouse coordinates on visible, hit-tested controls. This avoids the verified locator auto-scroll artifact on the sticky top bar.
- Page chrome keeps .bar/.rail/.pnav as its computed-style/DOM roots. Visible topbar screenshots target its nonempty .bar-in descendant. Real pointer leave/Esc setup and natural RAF indicator settlement precede capture; no indicator state is forced. Historical zero-height .bar skipped records remain untouched. Targeted reuse adds 24 fresh visible-topbar pairs below, rather than rewriting those old records.
- No real phone, touch hardware or unported samples are claimed.

## Section results

| Section | Cases | Style mismatches | DOM/content differences | Max pixel ratio | Max channel delta | Interaction results | Errors |
|---|---:|---:|---:|---:|---:|---|---:|
| #terms | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |
| #schemes | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |
| #shape | 24/24 | 0 | 0 | 0.1713% | 242 | Not applicable | 0 |
| #controls | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |
| #workspace | 24/24 | 0 | 0 | 0.0064% | 1 | motion 864/864; Story Forge A7 separate raw/reference reports, not inferred | 0 |
| #dash | 24/24 | 0 | 0 | 0.0000% | 0 | 48/48 scope checks pass | 0 |
| #canvas | 24/24 | 0 | 0 | 0.1776% | 65 | Not applicable | 0 |
| #maps | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |
| #agents | 24/24 | 0 | 0 | 2.1762% | 239 | Not applicable | 0 |
| #more | 24/24 | 0 | 0 | 1.6744% | 239 | Not applicable | 0 |
| #work | 24/24 | 0 | 0 | 0.0000% | 0 | 48/48 scope checks pass; drag 48/48 | 0 |
| #table | 24/24 | 0 | 0 | 0.2443% | 68 | Not applicable | 0 |
| #gallery | 24/24 | 0 | 0 | 0.9474% | 9 | Not applicable | 0 |
| #daily | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |
| #values | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |
| #refs | 24/24 | 0 | 0 | 0.0000% | 0 | Not applicable | 0 |

## Chrome and interactions

Chrome: 72/72 cases; 0 style differences; 0 DOM/content differences.
Interactions: 48/48 complete configuration/side checks pass (48 expected).
Theme indicator: 48/48. Language pin: 48/48.


## Remaining differences and explanations

No observed computed-style differences in completed cases. Incomplete cases are not passes.

78 screenshot pair(s) contain unequal raw pixels; 73 stay unequal under nearest-neighbour sampling. Each pair has HTML, React and difference images.

## Instrument history and qualification

- Visible chrome correction: the original full2 .bar root had zero height but visible .bar-in children. Its 24 skipped image records remain historical. The replacement reuse plan adds only 24 fresh descendant captures, with the same raw algorithm; default full runs also capture .bar-in while retaining .bar style/DOM paths.
- [Qualified timeline controls](out/timeline-controls-2026-10-31T09-34-05Z/results.json): all ten frozen expected verdicts matched, including planted early/late activation, delayed observer, early write with delayed event, unwrapped write, disagreement and target detachment. This establishes bounded instrument discrimination, not application parity.
- [Actual-entry pilot](out/timeline-pilot-2026-10-31T09-35-47Z/results.json): one pure/zh/1440×1080 configuration on both stacks showed actual class admission intervals 154.6–160.4ms and matching native/MO state; indicators naturally settled and aligned. This alone is not the full interaction matrix.
- [First full run](out/2026-10-31T08-04-50-225Z/results.json): all 168 section comparisons had zero listed style mismatches, but later configurations shared DOM state because hash-only navigation did not reload. Its interaction timing also sampled background pages. It is historical evidence of those observed states, not clean-state matrix acceptance. Exact old script/report are retained beside the raw results.
- First-run DOM differences were exhaustively classified: 864 missing gallery data-state=rest attributes, 412 absent-to-empty class attributes, and 378 empty-to-absent class attributes. Empty class versus absent class changes no CSS class membership. There were no tag or direct-text differences. The 51 style differences were rail widths while active tick pseudo-elements could still change; their cause was not established by the first run.
- [Second-full section geometry diagnostic](out/second-full-relative-geometry.recompute.json), independently recomputed from all 44,160 paired element boxes across 168 cases: maximum differences x=0.046875px, y=0.734375px, width=0.046875px, height=0px; none exceeds 1px. Schemes/controls are exact. This rules out a missed large relative-layout difference within those observations; it does not establish one universal raster cause or erase unequal pixels.
- Gallery pixel-origin diagnosis (table-gallery worker evidence, read and hash-verified by parity worker; pure/zh/1440×1080 only): all 54 source/HTML-inline/React-built image bytes match, and all tile order, relative geometry and CSS geometry match. The section document origins differ by a fractional 0.46875px because React omits upstream sections. This supports crop/raster-origin sampling as the explanation for the first gallery raw 66.1113% difference, not a different image set or masonry layout. It does not explain every sample or every theme/viewport.
- Diagnostic only: a +1 vertical-pixel comparison of the archived gallery pair lowered unequal pixels to 5.7203% and mean absolute RGB-channel delta from 6.7683 to 0.2681. The unshifted raw metric remains the acceptance evidence; no mask, shift or normalized score replaces it. [Asset identity](out/2026-10-31T08-04-50-225Z/table-gallery.gallery-asset-identity.json), [geometry](out/2026-10-31T08-04-50-225Z/table-gallery.gallery-geometry.json), [archived shift diagnosis](out/2026-10-31T08-04-50-225Z/table-gallery.gallery-pixel-shift-diagnosis.json).
- [Initial language probe](out/2026-10-31T08-35-08-949Z/probe-language.json) retained an overbroad whole-body settle error for HTML. This was an instrument scope error, not an HTML defect.
- [Corrected sequencing probe](out/2026-10-31T08-37-00-881Z/probe-language.json): locator clicks moved the viewport before language changed. Genuine mouse clicks kept the same anchor within 0.109375px (HTML) and 0.4375px (React), both isolated and after other interactions. Built artifacts were unchanged; owned resources closed. No core change or acceptance tolerance change was needed.

## Resource and loading evidence

Browser/request/console diagnostics: 0. Readiness/configuration errors: 0. Font statuses and successful readiness observations are retained separately. Errors may limit resource-loading claims even when both renderings agree.
Owned-resource cleanup: `{"browserClosed":true,"previewEnded":true,"staticServerClosed":true,"errors":[]}`.

## Evidence

- [Full results and all mismatches](out/2026-11-02T22-50-23-497Z/results.json)
- [Run environment and exact artifact hashes](out/2026-11-02T22-50-23-497Z/results.json#artifacts)
- [Preview output](out/2026-11-02T22-50-23-497Z/preview.log)
- Per-case raw JSON and screenshot paths are listed in the full results.

A complete command or generated report is not proof of parity. Any unresolved difference, failed interaction or incomplete case blocks an unconditional parity claim.
