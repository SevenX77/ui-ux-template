# 0017 Port the remaining samples to React

Purpose: a project built on React gets every sample of the handbook, with the same design and behaviour as the HTML handbook, and a change to any sample can be checked on both stacks.

Status: established on 2026-11-01. Application state: applied on 2026-11-03 and accepted by the caller with the named exceptions in the last record entry; nothing is committed.

This extends decision 0009, decision 8, which limited React version 1 to page chrome and seven samples. The other nine navigation entries of the React page currently leave for the HTML handbook through the fallback at `templates/react/src/chrome.tsx:23`. For example, a click on 画布与节点 (gloss: "canvas and nodes") opens `http://localhost:5179/@fs/D:/coding/ui-ux-template/templates/html/ui-handbook.html#canvas`, with nothing to show that the page changed stack and no link back.

## Owner record

2026-11-01: 「为什么http://localhost:5179/ 中好几个样张都是直接跳转到html？」 Gloss: "Why do several samples at http://localhost:5179/ jump straight to HTML?" After the cause and the plan were reported: 「开始移植」 Gloss: "Start the port."

## Decisions

1. **All nine samples are ported, and the React page has every section in the HTML order.** Serves: every sample on React. The order is `#terms`, `#schemes`, `#shape`, `#controls`, `#workspace`, `#dash`, `#canvas`, `#maps`, `#agents`, `#more`, `#work`, `#table`, `#gallery`, `#daily`, `#values`, `#refs`. `#workspace` includes its Story Forge sample, its lights-off layer and the `#motion` cards. When the last section lands, the fallback in `chrome.tsx` and its HTML import are removed, because no navigation entry can reach it.
2. **A port is React components and React state.** Serves: a React project can read and reuse the sample. Mounting the HTML scripts inside a ref, or injecting handbook markup with `dangerouslySetInnerHTML`, gives matching pixels but nothing a React project can use, so neither is a port. Sample application state follows `samples/data.tsx`: React state renders the DOM, and the shared engine is reached through `data-*` declarations and `UX` calls.
3. **Logic with no rendering in it moves to core and both stacks call it.** Serves: one change reaches both stacks. This covers canvas drawing, timeline and playhead arithmetic, graph layout and edge routing, and playback schedules. They go in ES modules under `core/behavior/`, inlined by the HTML build as `ux.js` is. For example, the morph, rings and dots drawing in `templates/html/src/app3.js` takes a context, a size, a time and a colour reader, so it has no stack in it. Code that writes DOM stays with its stack, so `sf.js`'s rendering is written again in React while its arithmetic is shared.
4. **Timing values leave the templates.** Serves: AGENTS rule 2, no timing value in a template. A delay or duration now written in sample scripts, such as the 38ms streaming interval and the 900ms hold in `app3.js`, is read from core by both stacks. Values already in CSS stay there.
5. **Sample content moves to `core/content/` and HTML reads it in the same change.** Serves: AGENTS rule 4, parity compares the same content. Each sample gets a JSON file named for its section: `terms`, `workspace`, `canvas`, `maps`, `agents`, `more`, `daily`, `values`, `refs`. Chinese stays the source string, and English comes from the one dictionary in `core/i18n/`. A string that has no dictionary entry and appears only because of this move gets one in core.
6. **The HTML handbook looks and behaves exactly as before.** Serves: the HTML handbook stays the reference rendering; this port designs nothing. The refactoring of HTML is checked against a copy of the handbook taken before the work began. A defect noticed in the HTML sample is reported and left as it is, and React reproduces it.
7. **The parity check grows with each section.** Serves: "same" stays a measured statement. `SPEC.sections` gains each ported section, ending at 16 sections and 384 section cases (16 × 6 themes × 2 languages × 2 viewports). Interaction checks cover each section's own behaviours. A sample that changes with time, such as a canvas or a playing demo, is captured at a clock fixed on both stacks. Anything that still cannot be compared is named per sample in the report with its reason. Nothing is masked without a name, and a named exception does not count as an equal pair.
8. **Order: Story Forge first, then canvas, maps, agents, more, daily, then terms, values, refs.** Serves: the shared-logic boundary of decision 3 is set by the hardest sample, whose later owner changes also cost most if React lags behind. The last three are mostly static, so they carry the least risk of forcing a change to what came before. Each section passes its own parity run before the next starts.
9. **Documents follow the code.** Serves: later agents read the true boundary. `templates/react/README.md`, `docs/ARCHITECTURE.md` and decision 0009 stop describing these samples as unported. `core/VERSION` follows its existing convention for a core change.

## Acceptance

Each line is checked by a command or script whose output is kept. A section's result is reported as it stands, including a failure.

- A1 (decisions 1, 2): at 1440×1080 every navigation entry of `http://localhost:5179/` scrolls within the React page, and `location.pathname` stays `/`. `dangerouslySetInnerHTML`, and any import of `templates/html`, are absent from `templates/react/src`, except the parity script's reference to the HTML handbook.
- A2 (decision 3): a grep of `templates/html/src` and `templates/react/src` finds each moved function in core only, and both stacks import or inline it.
- A3 (decision 4): a scan of the new React code for `setTimeout`, `setInterval` and duration literals finds only values read from core.
- A4 (decision 5): `python3 core/build.py --check` passes; the rendered text of every new section is the same in both stacks in both languages; no JSON in `core/content/` is duplicated by a template dataset.
- A5 (decision 6): the rebuilt handbook compared with the copy taken before the work, for all 16 sections × 6 themes × 2 languages × 2 viewports, shows zero computed-style and zero DOM-text differences and zero screenshot differences above the same-stack variation the check measures for itself. Scripted interactions for the Story Forge decisions below give the same results.
- A6 (decision 7): `npm run build` and `npm run parity` inside `templates/react` run all 384 section cases, with zero computed-style differences, zero DOM and content differences and every interaction check passing. The screenshot-pair count and each remaining unequal pair are reported by section.
- A7 (Story Forge behaviour): the acceptance lines of decisions 0006, 0008, 0010, 0011, 0012, 0013, 0014, 0015 and 0016 that describe Story Forge are run by real pointer input on both stacks and give the same result. These include the script reading position, click-to-watch, and lights-off on the `.sf-lights` layer.
- A8 (decision 9): the README and architecture list no sample as unported, and the `chrome.tsx` fallback is gone.

## Boundaries

This port adds no design and changes no sample. A real-phone check remains outside this acceptance. The strict pixel question recorded in decision 0009 for gallery and table remains open and is not reinterpreted here.

## Record

2026-11-01: the copy of the handbook for A5 and a snapshot of the uncommitted working tree were taken before work began. Implementation is assigned to a Prime session; results are recorded here when delivered.

2026-11-02 (in progress; not acceptance of the port): Story Forge content and pure model/coordinate/reading/reply logic have been extracted to `core/content/workspace.json` and `core/behavior/story-forge.js`; HTML reads them. A new motion-label interpolation error was found by comparison, repaired locally, and rebuilt. The frozen rebuilt HTML SHA-256 is `bed1ca96f65f36e210a1a0a5c5aa212f8dfa9979fb94619288bdb5d36fdb0333`. No React Story Forge source has been written, and unfinished navigation still uses its existing fallback.

The workspace-only HTML comparison captured all 24 theme/language/viewport cases with zero computed-style and zero DOM-text differences. Four raw screenshot pairs are unequal. The original independent-control-only test failed one case: Ember/Chinese/desktop had 11 one-unit RGB changes beyond that particular control. Every one of those changes is reproduced by two captures of the same unchanged saved-baseline page; this is measured temporal baseline variation, not a new design. The baseline instrument now compares each coordinate/channel with the maximum measured independent-baseline and temporal-baseline difference. It keeps every raw unequal pair and the original failed report; it adds no masks or global tolerance. Nine deterministic fixtures pass, including rejection of a pixel change above both controls. Reanalysis of the immutable full24 captures gives zero excess over both measured baseline controls and 24/24 static passes. This supports only the static workspace portion of A5, not whole-A5 or React acceptance.

Evidence: `templates/react/parity/out/html-baseline-2026-11-02T00-32-04-639Z/results.json` is the original result; `templates/react/parity/out/html-baseline-reviewed-20261102T005013/results.json` is the explicitly derived control review. The baseline entry is `node templates/react/parity/baseline.mjs --baseline <saved-before.html> --sections workspace`. The same pointer runner, `templates/react/parity/story-forge.mjs`, is currently running paired saved/rebuilt default-short and natural-playback matrices at 1440×900, six themes and both languages, with per-navigation document hashes. These results remain pending. No section is accepted and the next section has not started.



2026-11-02 (later in progress): the r7 workspace extraction milestone is accepted only as permission to begin React, not as acceptance of the section or A5/A7 in full. Paired HTML checks retained 2448/2508 default-short and72/84 natural checks per stack, with identical named outcomes and matching reviewed physical reference deviations; motion passed456/456 per stack. A sampler registered before the click observed the first Pure/Chinese reading update at time0,170px above the middle, on both versions. These existing HTML behaviours are left unchanged. Remaining applicable A7 coverage is being added separately.

The first unmounted React component builds. Source review then found remaining shared-boundary omissions: observation fps/snapshot logic, several pure timeline/reading/selection/mention/canvas calculations, render labels and two SVG radius facts. A minimal fps-only patch would leave duplicated non-rendering logic, so one coordinated closure is selected under decisions3-6. All browser launches are paused, the prior HTML/source bytes and raw failures are preserved, and the batch must retain DOM, measurements, native caret, events, application state and lifecycle in each stack. No new design or behaviour is allowed. The rebuilt HTML and mounted React still require fresh preservation/parity evidence; no next section has started.

2026-11-02 (observable repair, workspace verification still in progress): Story Forge is now mounted as React components and state. The numeric CSS reader converts seconds to milliseconds. One coordinated adapter repair separates visible take markers from logical selection and restores the observable room, scroll and animation restart behavior while retaining reading history. It does not require React to copy native DOM-node identity. Core and rebuilt HTML remain frozen at HTML SHA-256 `df98cb6facf236bd98c8c35ae377950d62e8214dabee14cb186199d9a35631e4`; the normal React build passes and its entry is `d70c996eb3d42441bb8be14e6c91fda750a5e33cfc5fe2a0461d892b1614afed`.

Fresh workspace parity covers all24 configurations: zero computed-style and DOM differences,48/48 interactions and864/864 motion checks; no case or cleanup errors. Required automated checks pass, but strict pixel equality does not. Twelve screenshot pairs remain unequal: each of Pure, Neon, Prism, Aurora, Paper and Ember in Chinese and English at1440x1080. All12 phone-width pairs are equal. Raw counts, maxima and named files remain in `templates/react/parity/out/2026-11-02T06-54-57-330Z/results.json`. No unequal pair is relabelled equal. Previously observed board/style preview pairs remain named with the reason "cause unresolved; assets and computed styles identical"; that evidence retains its recorded-style/resource scope and is not a bitwise paint-equivalence claim. Further pixel/internal-node diagnosis is stopped unless an observable design or behavior difference is found.

The fresh Pure Chinese/English main pointer run matches all418 named HTML outcomes:408 pass and10 are the preserved reference failures. Neon Chinese also matches all209 outcomes:204 pass and5 reference failures. Replies now stream (33 characters at the early sample,80 at the end). Pure natural playback has12/14 checks, retaining the two first-element-centering failures. Its frozen comparison records one English sampled-owner-list difference, not a mechanical pass: both full traces visit the same18 owners, but the three-second sample window starts at different playback times. Before/after/restored state and monitor shot order match. This normal sample-window difference is recorded under the caller's observable-equality steering; the raw report and failed comparator result remain unchanged.

Evidence outside the repository is retained under the port-evidence folder recorded by the brief: `workspace-current-bounded-checks.parent-review.r12.json`, `sf-observable-r12-react-main22-comparison.json`, `sf-observable-r12-a7-react-neon-main11-comparison.json` and `sf-observable-r12-react-natural2.phase-review.json`. The applicable A7 supplement scopes, remaining explicit theme conditions and one previously uncovered panel-click/chat-focus flow still need actual results. Workspace and A1-A8 as a whole are not accepted; canvas has not started and unfinished navigation retains its fallback.


2026-11-02 (workspace phase closed; caller steering 2): the rebuilt React workspace retains the recorded 24-case result: zero style/DOM differences, 48/48 interactions, 864/864 motion checks and the same 12 named unequal desktop pairs above. The remaining main/theme, panel-click/chat-focus, caret, picture-selection and natural-playback checks are settled. Six paired chat cases pass 48 checks; React picture selection passes 82 checks and natural pictures pass 12 checks. Raw reference failures, unequal pairs and the reading-window phase difference remain unchanged.

The final original-HTML language-only run completed with 6/7 checks, no action errors and one unverified context. Script rows (13) and audio context rows (11) restore in Chinese/English/Chinese. The failed audio restoration predicate records ten other toolbar/cut/transport rows missing from the final visible set, not changed context text. Film-take rows were not exposed, so film/Explore language coverage remains a driver coverage gap, not a proved HTML wrong-language defect or a pass. Evidence: `sf-observable-r12-c2-original-pure-language.json`, `workspace-a7-language-route.pilot-review.r12.c2.json` and `workspace-a7-caret-image-natural.parent-review.r12.c2.json` in the brief's `port-evidence` directory. All owned test processes and browsers are settled.

Caller steering 2 (`port-steer-2.md`, SHA-256 `49042aedca6d28837933c554f9fcc89d84ac0fa3e281465fc565fca5db04c537`) accepts closure with that gap; no further A7 driver work blocks progress. A7 concerns Story Forge only. Canvas starts now. Remaining sections use one existing parity matrix with their own interactions; independent component/content work may run in parallel, while root owns shared files and the final 384-section-case run. No unequal pair is masked and no new design or HTML repair is authorized. A1-A8 overall remain unfinished until the remaining ports, final matrix and documented finish line are complete.


### 2026-11-02 — Canvas integration under caller steering 2

- Shared `core/content/canvas.json` and pure `core/behavior/canvas.js`; both stacks render their own DOM and use the same geometry. Native HTML and React builds pass.
- `node templates/react/parity/check.mjs --sections canvas`: 24/24 cases, 0 style/DOM/content differences, 0 case/browser errors; 48/48 interaction rows, 432/432 canvas checks, 24/24 paired expanded states. Evidence: `templates/react/parity/out/2026-11-02T13-01-05-665Z/results.json`. Required checks pass; strict screenshot `allChecksPass` remains false.
- Raw and nearest screenshots: 18/24 unequal pairs (raw differing pixels): pure-en-1440x1080-canvas=2876; neon-en-1440x1080-canvas=2874; prism-en-1440x1080-canvas=2877; aurora-en-1440x1080-canvas=2874; paper-en-1440x1080-canvas=2882; ember-en-1440x1080-canvas=2878; pure-zh-390x844-canvas=15; pure-en-390x844-canvas=801; neon-zh-390x844-canvas=15; neon-en-390x844-canvas=801; prism-zh-390x844-canvas=15; prism-en-390x844-canvas=799; aurora-zh-390x844-canvas=15; aurora-en-390x844-canvas=802; paper-zh-390x844-canvas=15; paper-en-390x844-canvas=802; ember-zh-390x844-canvas=15; ember-en-390x844-canvas=803. Named only; no pixel-only diagnosis.
- Preserved phone panel overlap and retained closed details. Fixed the port’s scoped HTML extraction error, React window named-ID compatibility, and full-label translation; earlier failing reports remain archived. Canvas phase closes under steering 2; maps starts next. Original-HTML A5, the final 384-case run, remaining sections and finish-line docs remain open.


### 2026-11-02 — Caller steering 3: remaining-seven batch

After the Canvas record above, caller steering 3 replaces only the remaining sequential integration method: integrate maps, agents, more, daily, terms, values and refs together in decision 0017 order; rebuild HTML/React once; run one 168-case matrix with their own interactions. Fix per-section style/DOM/content/interaction/browser errors and rerun only changed sections. Keep every per-section result and named unequal screenshot pair; do not diagnose pixels alone. The full 16-section finish line, Core ownership, no new design, no Git changes, and the Story Forge/A7 closure remain unchanged. Source: `port-steer-3.md`, SHA-256 `1fbf061cea739b28cc81ffc3ab13f517a2a32e99e72ce9c59dca85a3071f76f7`.


### 2026-11-02 — Steering 3 first seven-section integration run

Both batch builds passed (Core check through the available `python` fallback, HTML build, TypeScript and Vite). The one 168-case run is `templates/react/parity/out/2026-11-02T14-29-40-895Z/results.json`; inputs stayed unchanged, no cancellation, all owned run resources closed. This run is **partially attained**, not all-section acceptance.

| Section | Cases | Style / DOM | Case errors | Own checks passed / observed | Unequal raw / nearest |
| --- | ---: | --- | ---: | ---: | ---: |
| terms | 24 | 0 / 0 | 0 | 72 / 72 | 0 / 0 |
| maps | 24 | 0 / 0 | 0 | 300 / 300 | 24 / 24 |
| agents | 24 | unmeasured (layout prerequisite) | 24 | 180 / 180 | 0 / 0 |
| more | 24 | 0 / 0 | 0 | 390 / 396 | 24 / 24 |
| daily | 24 | 0 / 0 | 0 | 108 / 108 | 2 / 0 |
| values | 24 | 0 / 0 | 0 | 48 / 48 | 0 / 0 |
| refs | 24 | 0 / 0 | 0 | 72 / 72 | 0 / 0 |

The 48 generic interaction rows ran, but none is an overall pass because section-own coverage is incomplete. Phone Maps category changes crashed React (`undefined.left`); later phone own checks are therefore unverified, not separate component failures. Other demonstrated driver faults: desktop hidden `data-tool` tour button needs real parent hover; the Core indicator invalidates a `nth-child(1)` booking selector; the raw phone Effort click hit fixed navigation; an infinite `.ph-tap` transform prevented a real-layout prerequisite from settling. Raw reports and the pre-repair runner are preserved. The repeating marker will be checked by its natural layout box for settling only; it remains in full style/DOM/screenshot comparisons. No thresholds, clocks, random sources or screenshot masks change. Only Maps, Agents, More and Daily require repair/rerun; the final 384-case run also verifies recovery of unaffected static sections.

Named unequal pairs (no pixel-only diagnosis):
- maps: `pure-zh-1440x1080-maps`, `pure-en-1440x1080-maps`, `neon-zh-1440x1080-maps`, `neon-en-1440x1080-maps`, `prism-zh-1440x1080-maps`, `prism-en-1440x1080-maps`, `aurora-zh-1440x1080-maps`, `aurora-en-1440x1080-maps`, `paper-zh-1440x1080-maps`, `paper-en-1440x1080-maps`, `ember-zh-1440x1080-maps`, `ember-en-1440x1080-maps`, `pure-zh-390x844-maps`, `pure-en-390x844-maps`, `neon-zh-390x844-maps`, `neon-en-390x844-maps`, `prism-zh-390x844-maps`, `prism-en-390x844-maps`, `aurora-zh-390x844-maps`, `aurora-en-390x844-maps`, `paper-zh-390x844-maps`, `paper-en-390x844-maps`, `ember-zh-390x844-maps`, `ember-en-390x844-maps`.
- more: `pure-zh-1440x1080-more`, `pure-en-1440x1080-more`, `neon-zh-1440x1080-more`, `neon-en-1440x1080-more`, `prism-zh-1440x1080-more`, `prism-en-1440x1080-more`, `aurora-zh-1440x1080-more`, `aurora-en-1440x1080-more`, `paper-zh-1440x1080-more`, `paper-en-1440x1080-more`, `ember-zh-1440x1080-more`, `ember-en-1440x1080-more`, `pure-zh-390x844-more`, `pure-en-390x844-more`, `neon-zh-390x844-more`, `neon-en-390x844-more`, `prism-zh-390x844-more`, `prism-en-390x844-more`, `aurora-zh-390x844-more`, `aurora-en-390x844-more`, `paper-zh-390x844-more`, `paper-en-390x844-more`, `ember-zh-390x844-more`, `ember-en-390x844-more`.
- daily: `pure-zh-390x844-daily`, `aurora-zh-390x844-daily`.

Full pixel counts/files and exact error traces are retained in `port-evidence/remaining.batch.r14.unequal-pairs.json`, `remaining.batch.r14.review.json`, and `remaining.batch.r14.repair-review.json`. Agents has no usable screenshot count in this run. All16/fallback/docs/A5/full384 remain open.


### 2026-11-02 — Driver qualification, unchanged Agent DOM rule

The repaired Maps component completed all eight bounded HTML/React checks (two languages and two viewports) without browser errors. The Agent layout prerequisite now completes. Initial desktop Agent snapshots then exposed the original live random balance: `$139.17` vs `$132.95` (zh), `$136.08` vs `$134.39` (en), with all other DOM and all styles equal. These raw observations remain in `remaining.batch.r14.driver-validation.json`; they are not relabeled as parity.

A normal visibility fixture avoids changing the comparison rule: fresh Document, briefly reveal the mobile group, then scroll away before the first native 700ms update. All four bounded configurations produced the same fully revealed 130-element default DOM, zero styles/DOM differences, and `$134.10` on both stacks. Returning the mobile view to the viewport produced real different random updates, and all eight displayed balances matched their simultaneously rendered public SVG endpoint. No random source, timer, application state, style or comparison value is replaced. Static capture remains exact; full screenshots remain visible/dynamic/unmasked, and the own suite now checks the live SVG/balance relationship. Evidence: `remaining.batch.r14.native-visibility-fixture.json` and `remaining.batch.r14.native-visibility-adoption.json`. No user-only oracle tradeoff was adopted; the proposed rule-change question is unnecessary under this verified setup. Full 24-configuration verification remains pending.

Hidden tools now receive genuine component hover before clicking. The same declaration caused the remaining desktop Regenerate/Add-note driver faults. A final bounded desktop driver check is running; no further app or comparison-rule change was made.

Final bounded desktop zh/en validation completed: both stacks Agent default style/DOM 0, no browser errors; Agents 24/24, More 44/44 and Daily 40/40 own checks. Source: `remaining.batch.r14.driver-validation-final.json`. This qualifies the instrument repair, not the full section matrix. Rerunning only Maps, Agents, More and Daily (96 cases plus 48 paired interaction rows) under unchanged acceptance.


### 2026-11-02 — Four-section repaired run

`templates/react/parity/out/2026-11-02T17-05-27-869Z/results.json`: all 96 cases present; style differences 0, case/browser/network errors 0; 48/48 interaction rows and 1728/1728 own checks pass. Frozen inputs unchanged; browser/preview/static-server cleanup complete. Overall required/strict flags remain false because Maps has six DOM class differences. No equal-count value is used to excuse those differences.

| Section | Cases | Style / DOM | Own checks | Own rows | Unequal raw / nearest | Scoped judgment |
| --- | ---: | --- | ---: | ---: | --- | --- |
| maps | 24 | 0 / 6 | 432/432 | 48/48 | 21 / 21 | Not attained (DOM) |
| agents | 24 | 0 / 0 | 288/288 | 48/48 | 12 / 12 | Attained under named unequal-pair limits |
| more | 24 | 0 / 0 | 528/528 | 48/48 | 24 / 24 | Attained under named unequal-pair limits |
| daily | 24 | 0 / 0 | 480/480 | 48/48 | 3 / 0 | Attained under named unequal-pair limits |

All six Maps differences are phone zh: native `fan-c`, React `fan-c still`. Adapter inspection found `strip.children[index]` measures the Core-prepended `.seg-ind` rather than the requested category button. Native selects only buttons. The local repair uses that same button selector; no Core/HTML/design/oracle change. Only Maps will be rebuilt/qualified/rerun. All16/fallback/docs/A5/full384 remain open.

Named unequal pairs (no pixel-only diagnosis):
- maps: `pure-en-1440x1080-maps`, `neon-zh-1440x1080-maps`, `neon-en-1440x1080-maps`, `prism-en-1440x1080-maps`, `aurora-en-1440x1080-maps`, `paper-zh-1440x1080-maps`, `paper-en-1440x1080-maps`, `ember-zh-1440x1080-maps`, `ember-en-1440x1080-maps`, `pure-zh-390x844-maps`, `pure-en-390x844-maps`, `neon-zh-390x844-maps`, `neon-en-390x844-maps`, `prism-zh-390x844-maps`, `prism-en-390x844-maps`, `aurora-zh-390x844-maps`, `aurora-en-390x844-maps`, `paper-zh-390x844-maps`, `paper-en-390x844-maps`, `ember-zh-390x844-maps`, `ember-en-390x844-maps`.
- agents: `pure-zh-1440x1080-agents`, `pure-en-1440x1080-agents`, `neon-zh-1440x1080-agents`, `neon-en-1440x1080-agents`, `prism-zh-1440x1080-agents`, `prism-en-1440x1080-agents`, `aurora-zh-1440x1080-agents`, `aurora-en-1440x1080-agents`, `paper-zh-1440x1080-agents`, `paper-en-1440x1080-agents`, `ember-zh-1440x1080-agents`, `ember-en-1440x1080-agents`.
- more: `pure-zh-1440x1080-more`, `pure-en-1440x1080-more`, `neon-zh-1440x1080-more`, `neon-en-1440x1080-more`, `prism-zh-1440x1080-more`, `prism-en-1440x1080-more`, `aurora-zh-1440x1080-more`, `aurora-en-1440x1080-more`, `paper-zh-1440x1080-more`, `paper-en-1440x1080-more`, `ember-zh-1440x1080-more`, `ember-en-1440x1080-more`, `pure-zh-390x844-more`, `pure-en-390x844-more`, `neon-zh-390x844-more`, `neon-en-390x844-more`, `prism-zh-390x844-more`, `prism-en-390x844-more`, `aurora-zh-390x844-more`, `aurora-en-390x844-more`, `paper-zh-390x844-more`, `paper-en-390x844-more`, `ember-zh-390x844-more`, `ember-en-390x844-more`.
- daily: `neon-en-390x844-daily`, `paper-zh-390x844-daily`, `ember-en-390x844-daily`.

Full counts/files: `remaining.changed.r14.unequal-pairs.json`; input/result review: `remaining.changed.r14.review.json`.


### 2026-11-02 — Maps first-load boundary, owner decision needed

Correcting the button selector removed the phone-zh class mismatch in bounded qualification, with all eight Maps own checks passing and no browser errors. An English-phone initial class mismatch remains. Read-only public-rectangle checks show different initial stored origins after fonts are loaded: desktop en native `(-12,94.09375)` vs React `(-12,100.984375)` with actual origin `(-12,100.984375)`; phone en native `(59.234375,-4)` vs React `(58.375,-4)` with actual origin `(61.859375,-4)`. Both stacks match exact paths after real category input. Native first-load measurement is stale; silently redrawing only React on font readiness would improve that quirk rather than reproduce it, so that candidate was not implemented. No class is normalized or forced.

Question to the owner: may the static Maps comparison use a real default-category reset while retaining the initial-load mismatch as a named limitation? This changes first-load coverage, not merely a driver click target. Maps acceptance and the dependent finish line wait for that decision; all validated outputs remain. Evidence: `maps.indicator.r14.validation.json`, `maps.indicator.r14.font-measure.json`, `maps.indicator.r14.startup-coverage.question.json`. All owned probe resources are closed.


### 2026-11-02 — Steering 4 answer

Caller rejected a category reset replacing the first-load comparison. The wait is cleared by that explicit answer, not assumed approval. Keep first-load coverage, identify the actual differing layout input, and reproduce native first-load behavior through React state, including native defects, without changing HTML. Only if exact reproduction requires the excluded non-React DOM mechanics may a measured named exception remain failing in the raw report while proceeding to the finish line; no further Maps question. Public reset is allowed only as an additional post-input check. Source: `port-steer-4.md`, SHA `062cf86d4f7f2fe54c630c4b172f513dfabb61772db4edf1cf1ee7f5bc4d4bac`; goal `react-all-samples`, publication r15/root baseline b4.


### 2026-11-02 — Maps input diagnosis and React locale boot

Read-only measurement trace identified the differing input, not just the final class. HTML first measures Chinese labels/CSS, then applies English. Its initial ResizeObserver sees English text at the initial typography transition metrics: desktop origin remains `(-12,94.09375)`; phone becomes `(59.234375,-4)` and sets `still`. React first measures English directly: `(-12,100.984375)` / `(58.375,-4)`. Fonts finish after these calls. The trace returned all native DOM/observer results unchanged and reproduced earlier uninstrumented outputs; it is diagnosis only.

Selected React-state repair: start the existing LanguageProvider in source locale, then commit the requested saved/hash locale in a layout effect before paint. This matches the actual boot inputs without cloning native markup, spoofing styles, assigning coordinates or adding a delay. The Fan/ResizeObserver/signature policy stays intact. HTML/Core remain unchanged. The provider is shared by all16; existing scoped results remain historical/conditional until final384 integration. Evidence/alternatives: `maps.firstload.r15.locale-boot.adoption.json`. Validate first-load outputs before any public reset; do not assume an exception.

Uninstrumented locale-bootstrap qualification passed: all four language/viewport configurations have identical 143-element style/DOM snapshots, initial SVG paths and `fan-c` classes **before input**. All eight own runs (72 checks) pass, and post-input paths match. React now reproduces the native stale English first-load origin and phone `still` state rather than correcting them. No exception or reset is needed. Evidence: `maps.firstload.r15.locale-validation.json` / `.review.json`; full24 Maps and full16 regression remain pending.


### 2026-11-02 — Maps first-load parity closed

`templates/react/parity/out/2026-11-02T19-16-39-329Z/results.json`: 24/24 cases, style 0, DOM 0, case/browser/network errors 0; 48/48 interaction rows and 432/432 own checks pass. All screenshot pairs equal (raw/nearest unequal 0); both required and strict flags true. Frozen inputs unchanged; owned cleanup complete. First-load comparison retained, native English initialization defect reproduced through React state; no reset, mask or named exception needed. This closes Maps at the scoped bar, not the parent all16 goal. Proceeding to steering3 finish line.


### 2026-11-02 — Finish-line implementation boundary

All16 sections are mounted. Remove only the unreachable `chrome.tsx` HTML fallback/import; its phone iframe already targets the React `index.html`, so keep that wiring and verify it with public input. Update active documents to all16 with final validation pending. Increment Core/package/lock metadata from 1.3.0 to 1.4.0 for the backward-compatible shared sample APIs/content, following the prior minor-version convention; this changes build metadata, not design.

The HTML-preservation runner imports the new successful Agent-readiness records. Its old `!diagnostics.length` would treat `kind:ready` as failure. Retain those records and change only the diagnostic error predicate to reject every non-ready record. Style/DOM/pixel/variation and full384 requirements remain unchanged; preserve the old runner before this local instrument repair.


### 2026-11-02 — Finish-line navigation, source boundary and builds

A1 routing: on production and owner `http://localhost:5179/`, all16 real rail clicks keep the React root and pathname `/`; all16 real device-nav clicks reach the self React `index.html` iframe with all16 sections. An additional real-control check changes Neon to Paper, Chinese to English and dimming in that iframe. No HTML request or browser error; all owned browsers/servers close. Source scan has no HTML import or `dangerouslySetInnerHTML`. Evidence: `finish.r15.navigation.r2.json`, `finish.r15.phone-controls.json`, `finish.r15.navigation.acceptance.json`.

Native defect retained: jumping past the lazily growing gallery can move the Daily target below the viewport even though the click scrolls in the correct page. The initial driver's extra final-intersection assertion failed on both React entries; a real-input HTML control also failed that measure (gallery18→42; Daily top2200.75). Original HTML `goTo` is the same `scrollIntoView` implementation. Raw failed results and positions stay in `finish.r15.navigation.*`; no scroll hack or sample fix was added. A1 verifies routing/scroll response, not stable gallery anchoring.

A2/A3 source review: six shared Core model modules are inlined by HTML and imported by React, without stack DOM globals. Same-name template functions are input/measurement/DOM adapters delegating to Core, not copied pure implementations. Native TypeScript AST scan finds25 timeout/interval/wrapper calls; all delays come from Core content or Core design tokens; no numeric duration string. Evidence: `finish.r15.source-boundary.review.json`, `finish.r15.timing-scan.json`.

Core generation, equivalent `python core/build.py --check`, `python -I templates/html/src/build.py`, and `npm --prefix templates/react run build` exit0. The exact `python3` invocation is unavailable here (exit127, command not found); logs preserve this capability limit. Production and phone output metadata are1.4.0. The owner's already-running Vite plugin still emits1.3.0 metadata; its current source is verified and its process is left untouched.

The original-HTML384 A5 and whole React384 A6 are still required. Neither these source/build checks nor the latest exact Maps24 pass accepts the whole goal.


### 2026-11-02 — Original HTML384 result; stopped before final React384

Goal `react-all-samples`, baseline b4. **Partially attained; not accepted as a complete port.** All16 components and React navigation are implemented. A5 failed its strict screenshot criterion, and the brief requires stopping on an unexplained baseline difference. No A6 whole React384 run was started. No permission to waive A5 is inferred.



## A1–A8

| Criterion | Result and decisive evidence |
|---|---|
| A1 | PASS for routing/scroll response. `node finish.r15.navigation.r2.mjs`: both production and owner5179, 16 rail and16 phone-device clicks stay React; parent pathname `/`. No HTML request/injection/import. `node finish.r15.phone-controls.mjs`: actual Neon→Paper, zh→en and dim changes, phone all16 React. Natural gallery landing shift is retained, not called stable anchoring. |
| A2 | PASS source boundary. `finish.r15.source-boundary.review.json`: six Core models inlined by HTML/imported by React; only DOM/input/measurement/state adapters in templates. Same-name wrappers are not copied algorithms. |
| A3 | PASS. `node finish.r15.timing-scan.mjs`:25 timer/wrapper calls use Core values; zero numeric duration strings, including regex fixture. |
| A4 | NOT FULLY VERIFIED after shared provider integration. `python core/build.py --check` exits0; exact `python3` exits127 (unavailable). Shared JSON source ownership passes. Earlier scoped React text checks pass, but whole current React text/content still requires A6. |
| A5 | FAIL. `node templates/react/parity/baseline.mjs --baseline "C:\Users\test\AppData\Local\Temp\claude\D--coding-ui-ux-template\d9b07a12-8681-417f-b459-fcb66c19488d\scratchpad\port-baseline\ui-handbook.before.html"` exits1 after384/384: style0, DOM0,346 passes,40 raw unequal,64 control unequal,38 above measured variation. No browser/assets/config/cleanup error; frozen inputs unchanged. |
| A6 | NOT RUN / unverified. `npm --prefix templates/react run build` exits0. Final `npm --prefix templates/react run parity` was not started because of the original A5 stop condition. Historical scoped checks do not replace it. |
| A7 | Phase closed by caller steering2, not a universal pass. Retained134/134 qualification,48/48 chat,82/82 details,12/12 natural checks; language6/7 has an unverified Film/Explore driver gap. No reopened A7 work. |
| A8 | PASS implementation/docs. Fallback/import removed; templates/react/README, ARCHITECTURE and0009 list all16 with truthful limits. Core/package/lock1.4.0. Root README is outside allowed scope and untouched. |

Core generation, equivalent Core check, HTML build and React build exit0. Production and iframe metadata1.4.0. Existing owner5179 still has cached Vite-plugin metadata1.3.0 despite current source; no owner restart attempted.

## Original HTML A5 per section

This is **HTML before/after**, not React A6. No scripted interactions are claimed by this static table.

| Section | Cases | Style | DOM | Raw unequal | Above variation | A5 pass |
|---|---:|---:|---:|---:|---:|---:|
| terms | 24 | 0 | 0 | 0 | 0 | 24/24 |
| schemes | 24 | 0 | 0 | 0 | 0 | 24/24 |
| shape | 24 | 0 | 0 | 0 | 0 | 24/24 |
| controls | 24 | 0 | 0 | 0 | 0 | 24/24 |
| workspace | 24 | 0 | 0 | 0 | 0 | 24/24 |
| dash | 24 | 0 | 0 | 0 | 0 | 24/24 |
| canvas | 24 | 0 | 0 | 0 | 0 | 24/24 |
| maps | 24 | 0 | 0 | 0 | 0 | 24/24 |
| agents | 24 | 0 | 0 | 12 | 12 | 12/24 |
| more | 24 | 0 | 0 | 24 | 24 | 0/24 |
| work | 24 | 0 | 0 | 0 | 0 | 24/24 |
| table | 24 | 0 | 0 | 2 | 2 | 22/24 |
| gallery | 24 | 0 | 0 | 2 | 0 | 24/24 |
| daily | 24 | 0 | 0 | 0 | 0 | 24/24 |
| values | 24 | 0 | 0 | 0 | 0 | 24/24 |
| refs | 24 | 0 | 0 | 0 | 0 | 24/24 |

All38 failing pair names, all40 raw unequal pair paths and artifact hashes: `finish.r15.html-baseline.review.json`. Result: `D:/coding/ui-ux-template/templates/react/parity/out/html-baseline-2026-11-02T20-22-54-953Z/results.json`. The excesses are12 desktop Agents, all24 More and Table `neon-en-390x844`, `ember-en-390x844`. Native controls also vary, but that does not explain each excess or waive the criterion. No pixel-only diagnosis was done.

## Earlier scoped React evidence — not final A6

Each is24 cases, not a claimed final all16 regression. Most precede the shared locale-provider change and remain conditional. Each raw unequal pair remains in its report and prior named-pair evidence. Existing seven sections (schemes, shape, controls, dash, work, table, gallery) have no new full-current A6 result; the user's earlier seven-section record is historical only.

| Section | Cases | Style | DOM | Interactions | Raw unequal | Source/condition |
|---|---:|---:|---:|---|---:|---|
| terms | 24 | 0 | 0 | 72/72 own | 0 | 14-29-40-895Z (before shared provider change) |
| workspace | 24 | 0 | 0 | 864/864 motion; scoped A7 below | see earlier record | prior provider; conditional |
| canvas | 24 | 0 | 0 | 432/432 Canvas | 18 | 13-01-05-665Z (before shared provider change) |
| maps | 24 | 0 | 0 | 432/432 own | 0 | 19-16-39-329Z (new locale provider) |
| agents | 24 | 0 | 0 | 288/288 own | 12 | 17-05-27-869Z (before shared provider change) |
| more | 24 | 0 | 0 | 528/528 own | 24 | 17-05-27-869Z (before shared provider change) |
| daily | 24 | 0 | 0 | 480/480 own | 3 | 17-05-27-869Z (before shared provider change) |
| values | 24 | 0 | 0 | 48/48 own | 0 | 14-29-40-895Z (before shared provider change) |
| refs | 24 | 0 | 0 | 72/72 own | 0 | 14-29-40-895Z (before shared provider change) |

Latest Maps report all flags true:48/48 interaction rows,432/432 own, all24 style/DOM/errors0 and raw/nearest0. Canonical Workspace and Canvas/other section raw unequal pairs remain named in their earlier records; none is silently normalized or masked.

## Port files and decisions

Added Core `behavior/{story-forge,canvas,maps,agents,more,daily}.js`: respectively Story Forge timeline/playback/selection and geometry; canvas nodes/routes; role/fan geometry; agent/mobile policies; More filtering/stream/scrub/clock/drawing primitives; Daily message/backup/booking policy. Added nine Core JSON datasets (terms,workspace,canvas,maps,agents,more,daily,values,refs). Both stacks consume them.

Added nine React sample components plus workspace-shell/workspace-views. Changed `main.tsx`, `chrome.tsx`, `samples/dash-work.tsx`, `ui/providers.tsx`; HTML source sections/app1–3/sf/build consume Core and generated HTML is rebuilt. Added/extended parity and reusable Story Forge/motion/reference/baseline scripts. Updated version/package metadata and authorized docs. Exact source delta against the supplied before-work snapshot, with Git text newline normalization, is in `finish.r15.changed-files.json`; earlier owner changes are not attributed to this port. Generated React dist is a build output. Core styles/rules/dictionary and existing owner fixes are preserved.

Technical decisions: genuine two-phase React locale state reproduces HTML first-load layout; no category reset replacement. Fan geometry is versioned with its category, and selectors address real buttons around Core's indicator. Natural Agent visibility establishes default capture and separate live behavior is tested, without RNG/clock hacks. Baseline diagnostic success `kind:ready` no longer falsely blocks; original runner archived and all non-ready diagnostics still fail. No DOM/style/pixel/variation oracle was weakened. Core1.4.0 is metadata-only, following the minor convention.

## Native defects and limits retained

- English Fan Map initially uses source-language typography/transition metrics and stale origin/class until public category/reflow. React reproduces it through genuine state history; first-load comparisons remain, exact Maps24 passes.
- Gallery lazy loading can shift a later navigation target (Daily) below the viewport during smooth scroll. Native real-input control also shows it. Routing stays in the correct page; no anchoring fix was added.
- Daily's existing reversed initial notes, read/unread-removal behavior and backup initial/step/cap quirks are retained, not redesigned.
- Earlier Story Forge/Canvas native quirks and named raw pair limits remain in the preceding record. No new HTML sample defect is inferred solely from A5 pixels.
- Real phones remain outside scope. A7's named language driver gap remains. Exact `python3` is unavailable; equivalent `python` succeeds. A5 is not attained; A4 final integrated text and A6 remain unverified.

## Stop and next decision

All current owned acceptance runs completed with cleanup true; owner5179/8792 and protected earlier processes are untouched. No Git mutation. Completed children are settled separately. Only a relevant user decision may authorize proceeding past this A5 stop. Proposed next action: run final React384 unchanged while keeping A5 failed/unexplained; this is **not** permission to mark A5 or the parent attained.


## 2026-11-03 — A6 completed; A5 controlled follow-up partial; stopped

Goal `react-all-samples`, baseline b5. Caller steering5 explicitly permitted final React384 despite failed A5, keeping its screenshots unchanged and app source frozen. Steering6 then required the12 Pure original/current fixed-clock/seeded cases, record/report and stop. This dated update replaces only the preceding pending/not-run status for A6/current integrated content. It does not rewrite the earlier stop, failures or A7 limits.

### Final React A6

`npm --prefix templates/react run parity` completed384 section cases and72 chrome cases. Build exits0; parity exits1 because strict pixels remain unequal. Style/DOM/meaningfulDOM/case errors/network/non-ready diagnostics:0. All48/48 interaction sets,1992/1992 own checks,432/432 Canvas checks and864/864 Workspace motion checks pass. `staticChecksPass`/`requiredAutomatedChecksPass`:true; `allChecksPass`:false. Chrome has no unequal pair. App199/full-runtime305 input hashes unchanged; owned cleanup true.

| Section | Cases | Style | DOM | Raw unequal | Nearest unequal |
|---|---:|---:|---:|---:|---:|
| terms | 24 | 0 | 0 | 0 | 0 |
| schemes | 24 | 0 | 0 | 0 | 0 |
| shape | 24 | 0 | 0 | 12 | 12 |
| controls | 24 | 0 | 0 | 0 | 0 |
| workspace | 24 | 0 | 0 | 7 | 5 |
| dash | 24 | 0 | 0 | 0 | 0 |
| canvas | 24 | 0 | 0 | 18 | 18 |
| maps | 24 | 0 | 0 | 0 | 0 |
| agents | 24 | 0 | 0 | 12 | 12 |
| more | 24 | 0 | 0 | 24 | 24 |
| work | 24 | 0 | 0 | 0 | 0 |
| table | 24 | 0 | 0 | 3 | 0 |
| gallery | 24 | 0 | 0 | 2 | 2 |
| daily | 24 | 0 | 0 | 0 | 0 |
| values | 24 | 0 | 0 | 0 | 0 |
| refs | 24 | 0 | 0 | 0 | 0 |
| **Total** | **384** | **0** | **0** | **78** | **73** |

Every section has errors0. Latest own checks: Terms96/96, Maps432/432, Agents288/288, More528/528, Daily480/480, Values72/72, Refs96/96. Canvas432/432 and Workspace864/864 motion are separate fields. Common interaction sets all pass. No dedicated own branch is implied for the other rows. Raw A6 JSON: `templates/react/parity/out/2026-11-02T22-50-23-497Z/results.json`. Every unequal name by section and image links: [finish report](../../templates/react/parity/out/controlled-html-2026-11-03/report.md). No pixel-only diagnosis outside the three prescribed follow-up sections was done.

### A5 — prescribed controlled original/current HTML follow-up

**Raw A5 stays failed**:384/style0/DOM0,40 raw unequal,38 above measured variation. Its3072 stored artifact hashes are unchanged. Caller’s moving/random-region review is attributed, not established as the cause.

Pre-script fixed virtual Date/performance origin, canonical RAF timestamps and seeded Math.random were applied before app scripts. Both languages, Pure,1440×1080/390×844; exact RGBA, no tolerance/masks/nearest sampling/content removal/app edits. Real public visibility visits exercised all3 nonempty More canvases and Agent history/alert after7 seeded ticks. Sources and runtime inputs remained frozen.

**12 attempted;11 PNG pairs;10 pairs qualified on review;4 exact-zero Table pairs,6 unequal pairs,2 unverified desktop More cases. Expected all12 zero is not established.**

| Case | Different pixels | Scope |
|---|---:|---|
| pure-zh-1440x1080-agents | 9445 | qualified |
| pure-zh-1440x1080-more | 27046 | UNVERIFIED |
| pure-zh-1440x1080-table | 0 | qualified |
| pure-en-1440x1080-agents | 191 | qualified |
| pure-en-1440x1080-more | no capture | UNVERIFIED |
| pure-en-1440x1080-table | 0 | qualified |
| pure-zh-390x844-agents | 39148 | qualified |
| pure-zh-390x844-more | 2213 | qualified |
| pure-zh-390x844-table | 0 | qualified |
| pure-en-390x844-agents | 33686 | qualified |
| pure-en-390x844-more | 26744 | qualified |
| pure-en-390x844-table | 0 | qualified |

Raw validator flags Table assets because independently created Blob URLs differ. Exact99 packed images/46 Table WebPs, table markup/code/CSS and Blob loader match; all8 actual images decoded at matching dimensions. The4 observed zero-pixel pairs are admitted on that content evidence, not by rewriting the raw validator or pixels.

Desktop More zh has unmatched performance4272/4288 and663/666 canvas draws; its27046 pixels are not a valid fixed-phase result. Desktop More en fails clock installation (`controller` undefined), with no PNG pair. Installed Playwright’s page clock is context-owned; the harness incorrectly initialized/advanced it concurrently per page in a shared context. These are harness configuration/ownership failures, not verified app defects. No cancellation/timeout was reported. No rerun was made after the prescribed12.

Residual PNG bounds/DOM regions, every raw image/diff, frozen method, control failures and code review are in [the report](../../templates/react/parity/out/controlled-html-2026-11-03/report.md) and adjacent `review.json`/`pixel-locations.json`. Qualified residuals include Agent status/lower-volume regions and phone/live-history regions; More phone radar/pack/download/odometer/blur-text regions. Region attribution is approximate at fractional edges; exact PNG bounding coordinates are retained. No mask/subtraction was applied.

Independent source review: More/Agents text changes through Core extraction; inspected formulas, initialization, palette, draw order, SVG rounding and timer/random rules match for identical full inputs/state/history. Rings advances per frame; morph converges per frame, so timestamps alone are insufficient. Table drawing/thumbnail code, CSS/loader and bytes are unchanged. Lowercase mobile SVG attribute spelling is a recorded source-review runtime limit. Source equivalence does not prove a residual’s cause. Same-source controls also have residual pixels. **This partial follow-up does not prove all38 historical A5 pairs temporal; no waiver.**

### Scoped acceptance and stop

A1 routing/phone, A2 shared Core boundary, A3 Core-only delays and A8 no-fallback/all16/docs remain supported at unchanged inputs. A4 current integrated DOM/text now has full A6 support; equivalent `python` Core/HTML builds and React builds pass. Exact `python3` remains unavailable (127), not claimed run. A6 required checks are attained; strict screenshots remain false. A7 stays closed with its named Film/Explore language-driver gap. A5 is not attained and A5T is partial. **Parent remains partially attained, not complete.**

All owned browsers/pages/servers and the read-only review child are settled. Owner5179/8792 and protected prior processes are untouched; no Git mutation, app-source change or root README edit. No real-phone claim. **Reported and stopped; caller retains A5 disposition and any further authorization.**


## Caller acceptance (2026-11-03)

The caller reviewed the delivery against A1-A8 and ran the following checks personally on the delivered tree.

- `python core/build.py --check` printed `core/dist is current` and exited 0. `python -I templates/html/src/build.py` exited 0 and produced `templates/html/ui-handbook.html` with SHA-256 `1a29bcb9539a77847a17184c582cefcbc9d646682aa0a400d8e49a0e16a4d254`, the `html` input recorded by both final runs (`out/html-baseline-2026-11-02T20-22-54-953Z` and `out/2026-11-02T22-50-23-497Z`). `npm run build` in `templates/react` exited 0 and produced `dist/index.html` with SHA-256 `448a02d0…a9a6c`, the run's `reactEntry`. The final parity results therefore describe the delivered bytes; `npm run parity` was not repeated.
- A1: a grep of `templates/react/src` for `dangerouslySetInnerHTML`, `templates/html`, `../html/` and `ui-handbook.html` finds nothing. On the dev server at 1440×1080, real clicks on the canvas, schemes and refs navigation entries scrolled within the page, `location.pathname` stayed `/` for all sixteen entries, and refs ended at the page bottom.
- A3: every `setTimeout` and `setInterval` in `templates/react/src` takes its delay from a core value (`c.timing.*`, `chrome.toast.*`, `T.*`, `G.*`) or a parameter.

**A5 disposition: accepted with named exceptions.** All 384 cases have zero computed-style and zero DOM-text differences. The 38 screenshot pairs above the measured variation lie only in moving or live content: the More point-cloud and ring-sphere canvases and its other animated widgets, the Agents phone board's sliding alert and live history, and one Table thumbnail. Under the fixed clock and seeded randomness, Table gave zero pixels. The caller inspected the qualified phone Agents and More pairs. Their residuals are the page's fixed floating toolbar and section pill, which full-page capture left at different scroll positions, plus small rasterization differences; the section content is the same. The source review found the moved drawing formulas equivalent. The decision's purpose, that the HTML handbook looks and behaves as before, is judged met. The strict pixel clause of A5 is not met, for these named regions only, and the raw failure stays recorded. Reopen this if anyone sees a visible difference in these samples.

**A6:** all required checks pass (384 section and 72 chrome cases; style, DOM and errors zero; all interaction, own, canvas and motion checks). The 78 raw unequal pairs listed in the report above are named exceptions under decision 7; the strict pixel question of decision 0009 remains open as before.

**A7:** closed with the named Film/Explore language-driver gap.

**HTML defects that React reproduces** (decision 6): on first play the reading position does not centre the first element; the stale initial Fan Map geometry; the shift of the Daily landing position while the gallery loads; the English first-load Maps behaviour, now reproduced by React's two-phase locale start.
