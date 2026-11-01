# Story Forge and handbook correction — final report

Technical outcome: **attained for the authorized local handbook sample and the bounded acceptance checks below**. All36 details-audit corrections and15 production corrections are implemented. This is not a claim of a production backend, motion footage, universal accessibility, or filmmaker-user approval.

Goal `handbook-production-fix`, baseline `b1`. The original outcomes and boundaries are unchanged. The owner resume confirms final54-gallery inputs and owner port8792; these replace only the earlier input uncertainty, not the goal.

## Authority and boundaries

Sources: original `prime-fix.md`, decision0008, both enumerated audits, `UI-RULES.md`, `TERMS.md`, and `prime-resume.source.md`. Branch remains `interaction-polish`; HEAD remains `b59b0534a3b10351185ab61925db4b4ae6199eec`. No commit, push, branch switch, asset edit by this work, `CLAUDE.md` edit, new section/theme, redesign, or weakened rule. Owner/pre-existing edits are retained, including the four explicitly named source files. `UI-RULES.md`, decision0006 and `.claude/launch.json` were not edited by this work. Generated HTML was never read from disk; browser HTTP only.

The gallery uses the owner’s final54 images: 插画24, 影像10, 动画9, 设计11. No images were generated. The owner’s8792 server remains running and returns HTTP200 for this repository’s README. The root-owned8793 test server was stopped after all browser work. No child workers remain.

## Per-file changes

| File | Change |
|---|---|
| `src/sf.js` | Canonical12-shot model; derived nested units/cuts/times/tracks; lined script and selection context; ordered Explore; truthful still previews/studies/chat; resize/focus/menu fixes and read-only SF_DATA. |
| `src/sf.css` | Unfiltered image content; still/audio/member-panel styles; 230px chat room; role-based radii/elevation. Menu animations exclude semantic visibility; reduced motion has zero transition duration/delay. |
| `src/data.js` | Safe names/notes; localized sorting; real CSV/preview/copy; keyboard columns menu. Correct complete filtering/counts. Preserve owner’s final54-gallery/category edits. |
| `src/data.css` | Hidden unmatched/favourite states; opaque captions; tiered radii; phone sticky detail/pager/action widths and scroll fades. |
| `src/ux.js` | Touch tap focus instead of flick pointerdown; drag-click suppression; shared fan/slot indicators. |
| `src/base.css` | Specific keyboard rings survive all:unset; token depth/radii; stationary tactile press; no mouse-state danger outline. Reduced motion does not invent inherited-visibility transitions. |
| `src/scenes.css` | Bounded/cancellable node drag surfaces; elevation selections; hidden bulk controls; native control styling; token depth/radii. |
| `src/more.css` | UX-only command display; touch parameter values; stationary hover/press; neutral slice and token depth/radii. |
| `src/app1.js` | Focus-managed shared scrim; native phone links; cooperative accessible menu including keyboard opening; honest tools preview. |
| `src/app2.js` | Real local chart/export/ledger/task/message/file/booking actions; safe filenames; bounded/cancellable node drag and cleared wires; percentage-based, edge-aware chart tooltips. Preserve owner art-index edits. |
| `src/app3.js` | Correct minute timer; honest voice/stream demos; UX-owned commands; guarded clipboard success; pointer-cancel and focus-return fixes. |
| `src/app4.js` | Restore original Chinese for connected and cached detached text nodes. |
| `src/01-found.html` | 16-section count; real Tab guidance/labels; noninteractive style-only samples; honest preview text and task trigger. |
| `src/02-work.html` | Correct workspace zoom order; real export/ledger hooks; no unsupported invoice; live chart declaration, fades and accurate230px text. |
| `src/03-apps.html` | Native file chooser, held upload/bulk/delete and real export hooks; Values fades; booking hook; tiered radii. Preserve owner’s home-art change. |
| `src/03a-agents.html` | Remove nonexistent v-green class. |
| `src/04-more.html` | Honest command/voice/stream-demo labels; next-demo action instead of pretend generation; tiered radii. |
| `src/themes.json` | Retain all six themes; token-based Volume depth; remove unused tokens. Final whitespace cleanup changes no JSON value. |
| `src/i18n.json` | Add interface keys/computed patterns before the attention-lock key; preserve story English and owner categories. Separate Approve/Pass; remove81 obsolete keys while retaining19 runtime-composed entries. |
| `src/build.py` | Blank inline favicon removes real localhost404; existing assembly/inlining behavior retained. |
| `docs/TERMS.md` | Correct chat scroll-room example to230px. |
| `docs/decisions/0001-visual-system.md` | Dated correction: focus is UX-owned, not :focus-within. |
| `docs/decisions/0003-one-ux-layer-themes-as-data.md` | Dated correction: current hover/dim and grid-push model. |
| `docs/decisions/0007-data-table-and-gallery.md` | Dated fixed-height table/detail correction and final54-gallery acceptance note; preserve owner decision7 and historical42 count as history. |
| `docs/decisions/0008-story-forge-production-logic.md` | Application state set to “applied, not committed”. |
| `docs/sf-parity.md` | Replace stale prototype/data/parity claims with current mapping and disclosed still-only limits; old text archived in evidence. |
| `ui-handbook.html` | Rebuilt only through python -I src/build.py; never opened/read as a file. |
| `.claude/verification-story-forge/` | Throwaway oracles, browser scripts, source identities, original/failed evidence, worker reports and full acceptance report. |

## Data assertion output

`data-assertions.final.cjs` reads the actual HTTP-loaded `SF_DATA`; `production-oracle.cjs` independently encodes the authoritative shot table.

```text
PASS: 12 stable shots; total 45s; durations and on-screen cast match decision 0008.
PASS: record-in seconds 0,4,9,12,16,20,23,25,29,34,38,42; 24fps; 16:9.
PASS: Film/Act/Scene/Beat/Shot partitions: 1/2/3/6/12.
PASS: Acts 29/16s; Scenes 4/25/16s; Beats 4/12/9/4/9/7s.
PASS: cuts A45s (12), B38s (10), C15s (4), D11s (3), E45s (12, deliverable of A).
PASS: every unit sums and partitions its cut; scenes and beats nest; all track segments stay in range.
PASS: Donna line -> Shot 8; every script element has coverage; each still study has one selected source.
PASS: black Shot 12 has no image; sb-01–sb-12 are member panels.
Assertions: 459
```

## Parent goal → necessary results

| Necessary result | Actual result and decisive evidence | Judgment / limits |
|---|---|---|
| Production-correct Story Forge | 459 assertions;12 stable shots/45s; all15 layer×zoom pairs; real Explore pan/modifier-wheel zoom/drag; Shot3 empty cast; Donna→Shot8; shared-axis cues; five cut menus; newly sent complete Cut C reply | Attained as a local static-asset sample; `sf-browser.accepted.json`, `sf-extra-browser.final-stable.json`, assertion output |
| Correct table and final gallery | Native localized sort/cache/paging/filter/empty/range/density, inline rename/note/preview, actual CSV and archive; final gallery favourite/preview/arrows/Tab trap/Escape return; 60 phone geometry states | Attained for tested paths; `final-ui-flows.json`, `final-csv-evidence.json`, `gallery54-browser.json` |
| Rule-consistent shared UX | Real keyboard rings across30 global all:unset families plus SF scoped canvas/script/clip/context controls; all three menus work in normal and reduced motion; real local actions and native touch-emulated tap/flick checks | Attained in the tested Chromium paths plus source/static checks; not a screen-reader or physical-device certification |
| Integrated build/documentation | Final build and syntax checks pass; dated docs and applied/not-committed state; unmodified-network6 themes×2 languages,16 sections each, no console/request failure; fonts ready | Attained; `network-final-acceptance.json`, `final-served-identity.json`, `final-diffcheck-execution.json` |

- Full-network final artifact: HTTP200,7,994,962 bytes, SHA-256 `ec39ed64e506890e77c4a7d37c15c016b49a7b2e542db553eef6ffcf690517e4`. All16 section heights were549.64–1859.94px across the12 states. A final rebuild after two whitespace-only JSON fixes is byte-identical to that tested artifact.
- Phone gallery:375/390 × EN/zh ×3 sizes ×5 filters =60 states; exact independent category counts, no overlap/overflow or stale hidden geometry. All99 inlined art tokens decode. These checks preceded only the motion-rule repair; gallery data/layout/image values are unchanged. Native final gallery flows passed after that repair. Applicability is recorded in `final-tested-source-inputs.json` and `final-source-hygiene.json`.
- Phone table:375/390 × EN/zh; sticky detail and pager contained; native horizontal wheel reveals complete Rename/Approve actions; fades present; no overflow/errors (`phone-table-final-final-stable.json`). Stateful chart/gallery375 regression also passes after the tooltip repair (`chart-resize-browser.json`).
- Final actual `media-library.csv` download independently parses as47 rows including header,46 records,7 fields. The hostile-looking renamed text stays literal and correctly quoted.
- Newly sent reply: `Trailer C: Shot 1, Shot 5, Shot 7, Shot 9; 15 seconds. Timed still preview only.`
- Menu repair: a tiny global reduced-motion duration unintentionally transitioned inherited visibility on items. Zero transition duration/delay fixes reduced motion. SF dropdown/item transitions now name only intended visual properties. Natural normal/reduced keyboard entry, arrows/Home/End, Cut C selection, focus return, Tab exit, Escape and peer closure all pass. No delayed blind-focus retry was used as acceptance.

## Details audit — all36 findings

“Fixed” means the stated correction is implemented and supported by the cited source/static or natural evidence. It does not claim that every possible DOM instance, state sequence, device or accessibility criterion was tested. Evidence filenames are under `.claude/verification-story-forge/`; `src/` and `docs/` paths are repository-relative.

| # | Finding | Status / correction | Evidence |
|---|---|---|---|
| 1 | Keyboard focus rings | Fixed — Specific ring rule; real Tab-based keyboard-entry evidence for30 global families plus SF scoped controls | `keyboard-coverage.json; sf-reset-keyboard.json; menus-keyboard-{normal,reduced}-after.json` |
| 2 | Favourite at rest | Fixed — Desktop favourite hidden at rest; natural hover, selected persistence and keyboard entry work | `final-ui-flows.json; focus-only-browser.json` |
| 3 | Cached-row language | Fixed — Detached cached originals are restored; actual EN page2→zh→page1 has no English UI residues | `final-ui-flows.json` |
| 4 | Touch focus | Fixed — Focus on tap, not touch pointerdown/flick | `ui-browser/results.json: touch-flick-tap-parameters-node-cancel` |
| 5 | Filtered geometry | Fixed — Unmatched figures display:none; final54 geometry has no overlap or page overflow in60 states | `gallery54-browser.json` |
| 6 | Filtered loading/counts | Fixed — All filtered matches load; correct counts24/10/9/11 and All54 | `gallery54-browser.json; final-ui-flows.json` |
| 7 | Run wires | Fixed — Clear lit state and redraw on completion | `ui-browser/controls-results.json` |
| 8 | Node drag | Fixed — Primary-button check, bounds/gutter, capture/cancel cleanup | `ui-browser/controls-results.json; touch group` |
| 9 | Menu lifetime | Fixed — Peer/outside/Escape/rest closure plus native keyboard opening, arrows and focus return | `menus-keyboard-{normal,reduced}-after.json; sf-extra-browser.final-stable.json` |
| 10 | Panel Escape | Fixed — Context Escape closes when no preview owns Escape | `sf-extra-browser.final-stable.json` |
| 11 | Chat focus owner | Fixed — Blank chat chrome clears both UX owner and real caret | `sf-extra-browser.final-stable.json` |
| 12 | Upload lifetime/choose | Fixed — Conditional hold; outside/Escape dismiss; real native file chooser | `ui-browser/controls-results.json` |
| 13 | Hidden bulk controls | Fixed — Visibility hidden; empty actions disabled/guarded | `ui-browser/controls-results.json` |
| 14 | Canvas resize | Fixed — Deliberate Explore pan/zoom survives resizing; auto-fit is limited to untouched width changes | `sf-browser.accepted.json; sf-browser.second.json` |
| 15 | User text escaping | Fixed — Names, notes, attributes and filenames stay literal; rename/note/preview/CSV checked naturally | `final-ui-flows.json; final-csv-evidence.json; ui-browser/controls-results.json` |
| 16 | Content overlays/filters | Fixed — Remove gradient-era image overlays and brightness/saturation/grayscale filters | `sf-extra-browser.final-stable.json; src/sf.js; src/sf.css` |
| 17 | Caption legibility | Fixed — Opaque neutral card/ink strip replaces art-dependent scrim | `src/data.css; six-theme rendering (not numeric contrast measurement)` |
| 18 | Missing translations | Fixed — Separate translated category node and missing role/export/interface keys; final languages render correctly | `final-ui-flows.json; network-final-acceptance.json; src/i18n.json` |
| 19 | Localized sorting | Fixed — Compare translated values in the current locale; ascending status starts Approved | `final-ui-flows.json` |
| 20 | Action/interface wording | Fixed — Approve has its own key; workspace flashes use text/pattern translations | `src/i18n.json; src/sf.js; table fixture + layer/zoom checks` |
| 21 | Dead dictionary | Fixed — Remove81 obsolete entries; preserve19 known runtime-composed entries | `dictionary-pruning-final.json` |
| 22 | Sliding selectors | Fixed — Fan/time-slot controls share moving indicator; reserve selected weight | `src/ux.js; src/scenes.css; handbook-ui-static-output.txt` |
| 23 | Live dim declaration | Fixed — d-out declares data-live | `src/02-work.html; handbook-ui-static-output.txt` |
| 24 | Hover movement | Fixed — Remove audited download/heat/topbar geometry transforms | `src/base.css; src/more.css; static checks` |
| 25 | Tactile press | Fixed — Shadow changes, hit box does not move | `ui-browser/messages-tactile-results.json` |
| 26 | Touch parameters | Fixed — Values visible under hover:none | `ui-browser/results.json: touch group` |
| 27 | Shadow tokens | Fixed — Replace stacked/off-token depth with elevation tokens in all six themes | `src/themes.json/base.css/scenes.css/more.css; static output` |
| 28 | Mouse outlines | Fixed — Opaque elevation/Signal selection, no added border; keyboard ring retained | `src/base.css/scenes.css/sf.css; node computed style` |
| 29 | Radius tiers | Fixed — Control9/card16/panel22/pill999/row0, including menus | `radius-source-observations.json; worker static checks` |
| 30 | Command owner | Fixed — Only UX focus owns width/list; input focus requests that owner | `src/app3.js; src/more.css; keyboard entry checks` |
| 31 | Competing Volumes | Fixed — Slice uses neutral surfaces; odometer keeps Volume role | `src/more.css; handbook-ui-static-output.txt` |
| 32 | False/dead controls | Fixed — Real local messages/charts/previews/files/downloads/minute timer/booking; unsupported actions removed or explicitly local demos | `final-ui-flows.json; ui-browser/actual-actions-results.json; ui-browser/messages-tactile-results.json; stream-demo-observed-pass.json` |
| 33 | Phone containment | Fixed — Phone detail/pager/actions/fades contained; native wheel reaches complete actions; stateful chart-tooltip overflow repaired | `phone-table-final-final-stable.json; chart-resize-browser.json` |
| 34 | Keyboard/accessibility | Fixed — Native buttons/labels/links; menu keyboard in normal/reduced motion; scrim trap/restore; SF keyboard entries | `menus-keyboard-{normal,reduced}-after.json; sf-reset-keyboard.json; final-ui-flows.json` |
| 35 | Stale docs/examples | Fixed — Dated decision notes;16 sections/.2s/4px/230px/zoom order; final54 acceptance; applied state | `docs/decisions/0001,0003,0007,0008; docs/TERMS.md; docs/sf-parity.md` |
| 36 | Dead code/tokens | Fixed — Remove named SF/data/UI dead state, callbacks, CSS and tokens | `sf-worker-report.md; data-worker-report.md; ui-worker-report.md` |

## Production audit — all15 findings

| # | Finding | Status / correction | Evidence |
|---|---|---|---|
| 1 | Story shots only | Fixed — 12 story shots; paperwork stays in Explore; black12 | `data-assertions.final.json; sf.js` |
| 2 | Derived durations | Fixed — 45s; unit/cut totals derive from member shots | `459 data assertions` |
| 3 | Nested hierarchy | Fixed — Film/Act/Scene/Beat/Shot 1/2/3/6/12 with correct partitions | `459 data assertions; layers-zooms` |
| 4 | Stable cut joins | Fixed — Cuts and all views look up stable shot IDs | `459 data assertions; cut frame counts` |
| 5 | Real cue lanes | Fixed — Dialogue/VO/hum/impact/static/cloth/breath/music/noise/graphics/subtitles; audio owns its details | `459 assertions; sf-browser.accepted.json tracks group` |
| 6 | One time axis | Fixed — Picture and lane x/width use record time×27.5px/s | `observed-track-axis-check.json + source` |
| 7 | Meaningful labels | Fixed — Shot number plus24fps record-in timecode | `data assertions; sf-browser layer checks` |
| 8 | Correct cast | Fixed — Shot3 none; Shot5 Pete; Shot8 Pete/Donna | `459 assertions; natural Shot3 and Donna checks` |
| 9 | Lined script | Fixed — Coverage links select actual shots; Donna→Shot8/exact line | `459 assertions; sf-browser.accepted.json donna-line` |
| 10 | Layer×zoom semantics | Fixed — All15 combinations; timed still-cut play/pause/seek; actual same-source framing studies | `sf-browser.accepted.json; sf-extra-browser.final-stable.json (no motion footage)` |
| 11 | Coherent cuts | Fixed — A45/B38/C15/D11/E45; E is A deliverable | `459 assertions; natural cut menus` |
| 12 | Truthful chat | Fixed — New complete Cut C reply matches1,5,7,9/15s; no fake generation | `sf-browser.accepted.json: cuts-and-c-chat; complete new reply` |
| 13 | Selection context | Fixed — Per-shot/scene set/cast/props/size/lens/move/16:9/look target and member panels | `459 assertions; natural panels` |
| 14 | Explore order | Fixed — Every card/note phased from seed through Master QC, ordered; script derived | `459 assertions; Explore pointer checks` |
| 15 | Film terms | Fixed — Correct cut/master/look-target/VFX wording; no reel/GT/gate/soft-lock claims | `sf-worker-report.md; src/sf.js; docs/sf-parity.md` |

## Implementation decisions and verification gaps

- With only the supplied still assets and no generation/backend service, the playable cut is a truthful **timed still preview**. Alternates are labelled **same-source framing studies**, not new rendered takes. Audio lanes are real timing/cue records with their own details, not rendered audio. Unsupported actions were removed or clearly labelled as local demos. These are implementation choices within the owner’s resume authorization, not new production-service claims.
- Touch used native input in real Chromium with touch emulation, not physical hardware. Clipboard success used granted read/write permission. Denial, insecure contexts and every OS clipboard/dialog path were not exercised. A real file-chooser event with a supplied local test file was verified, not every desktop file-dialog interaction.
- No numeric contrast-ratio study, screen-reader audit, cross-browser/OS matrix, long soak test or filmmaker-user evaluation was run. Caption correction uses an opaque neutral card/ink strip and rendering checks; it is not a measured all-state contrast verdict.
- Sliding-indicator wiring, hover geometry removals, global depth/radius tiers, Volume count and dead-code cleanup have source/static evidence and rendering smoke. There is no exhaustive animated-geometry or whole-DOM computed-style census.
- Some older long-sequence table-selector/message-visibility waits remain unexplained in their original contexts. Fresh actual flows passed, but those earlier causes were not proved to be either caller errors or target defects. Original logs remain. No universal availability claim is made.
- Proven caller errors are distinguished from target defects. The final UI probe initially expected a prompt, but Rename is an inline editor; the corrected native input+Enter flow passes without application changes. The SF reset probe initially omitted the audio-track setup; after selecting that real track, clip keyboard entry passes. Earlier malformed fixtures, modal interference and cancelled retests are retained as history, not accepted behavior evidence.
- Real parent-discovered defects were repaired rather than hidden by passing fixtures: incomplete Explore phases/false study claims, stateful375 tooltip overflow, and keyboard entry while menu items were still visibility-hidden. Earlier rAF-only and popup-only focus attempts failed; those failures and the replacement reasoning remain saved.

## Evidence and resource handoff

Final result files: `data-assertions.final.json`, `data-assertions-final-output.txt`, `sf-browser.accepted.json`, `sf-extra-browser.final-stable.json`, `final-ui-flows.json`, `gallery54-browser.json`, `asset99-browser-decode.json`, `phone-table-final-final-stable.json`, `network-final-acceptance.json`, `keyboard-coverage.json`, `final-source-identities.json`, and `owned-resource-settlement.json`.

Earlier source-worker reports and valid completed UI-browser groups remain scoped to unchanged functions. `ui-browser/ui-browser-report.md` is a historical partial handoff: its stateful-overflow gap was subsequently reproduced/fixed by the parent, and its phone-table/menu gaps are covered by the final parent evidence above. It does not independently grant parent acceptance. No historical report was rewritten to erase a failure.

Technical review: prime-fix-root. Final product/owner approval remains with the requester. The `goal-contract/v1` publication binds parent and necessary-result evidence; its read-only checker is mechanical only, not proof of behavior. No commit or next-phase authorization is implied by delivery.
