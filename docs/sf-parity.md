# Story Forge workspace parity

Authority: decisions [0006](decisions/0006-full-story-forge-workspace.md) and [0008](decisions/0008-story-forge-production-logic.md), and `UI-RULES.md`.

## 2026-10-30 production revision

Decision 0008 deliberately replaces the prototype's film data. Prototype AST equality is no longer an acceptance oracle for the model or any view derived from it. The old v5 inventory and its observations are historical, not evidence for this revision. Its exact original text is retained at `.claude/verification-story-forge/original-sf-parity.md` (repository root-relative).

The workspace remains in `src/02-work.html`, `src/sf.js` and `src/sf.css`. The shared UX layer still owns hover, focus, dimming and the attention lock. No iframe, backend generation, new theme or asset generation is introduced.

### Current mapping (replaces affected v5 parity rows)

| Old source/data or behavior | Current disposition under decision 0008 |
| --- | --- |
| `_A`, `_pick` | Replaced by a single `SHOT_LIST`, stable IDs and `BY_ID`; no production board is a film shot. |
| `SHOTS`, `VKEYS`, `VNAME` | Cuts are named stable-ID lists in `CUTS`; shot views look up that model. A/B/C/D/E contain 12/10/4/3/12 shots and run 45/38/15/11/45 seconds. E is a deliverable of A. |
| `VGRAD` | Removed as unused, not retained for historical AST parity. |
| `ZOOM_FRAMES`, `curArr` | Cut-aware units are derived, not fixed duplicated labels. Film > Act > Scene > Beat > Shot has 1/2/3/6/12 units in A. Each unit sums its member durations. |
| `SHOT_CHARS`, `SCENE_DESIGN`, `CHAR_DB`, `STYLE_REF` | Cast, camera look target, set and props resolve from the selected stable shot/scene. Empty cast remains empty. Announcer is an off-screen character. Declared format is 16:9. |
| `sbArt`, `sbBig`, `storyboardThumb` | Use each member's `sb-01`–`sb-12` panel. Unit storyboard views include their member panels, not a paperwork thumbnail. |
| `isDial`, `laneClip`, `laneBg`, `buildLanes` | No odd-index dialogue fallback. Picture and audio/graphics use one seconds axis; dialogue and subtitle speech, sound cues and graphics come from model records. |
| `pickClip`, `clipPreviewClick`, audio preview | Selected audio shows its own cue metadata, not a shot's generation prompt. Audio is a cue record; no rendered audio file is claimed. |
| `picHTML`, `buildStrip`, `layoutStrip`, `scrollToShot`, `pickShot`, `updateHero` | Adapted for derived units and time-axis widths. Frame labels show shot number and record-in timecode at 24fps; old 8A/16A labels are retired. |
| `setLayer`, `setZoom`, `renderView` | Script/Storyboard/Footage × five zooms have different data-aware views. Film script is the logline; Film footage is a playable timed-still preview. |
| `scriptHTML`, old `S`, `selScript` | One lined-script record source; headings follow locations and shot order. Every element declares covered IDs. Donna's line covers Shot 8. Script units show only applicable content. |
| `selShot`, `selUnit`, `syncActiveSel`, `shotAll`, `unitAll`, `updateCtx`, `promptFor` | Selection joins by shot ID, never a cut array position mistaken for a master index. Context describes the selected shot or unit. |
| `BOOK_TITLE`, `currentBook`, `cpBook`, `cpFilter`, `cpMode` | Removed source-inert book/filter state and controls. |
| `figureSVG`, `sceneSketch`, `mediaPreview`, `.ci-grain`, frame filter | Gradient-era content overlays and content brightness/saturation filters are removed. Generated images retain their own colour. |
| `setReelLabel`, `reelTo`, `pickTl`, `buildTlMenu`, `addTimeline` | Current `setCutLabel` and `cutTo` replace the reel-named helpers. Visible terms describe cuts, not reels. Menu closes on peer menu, outside click, Escape and rest. The misleading add/edit-cut action is removed rather than claiming an editorial operation. |
| `send`, `CHAT`, `renderChat`, `pushChat` | Replies describe the actual active cut and selection; C is the 15-second trailer. No fictional makeup-board refresh, generated alternate footage or backend action is claimed. |
| `adjustHeights`, `clearLogTimeouts`, `handleTypingLog` | Empty helpers removed rather than kept as apparent functionality. |
| `_cbar` click, chat/history scope | Shared held UX focus is the only attention owner. A dismissing blank click clears UX focus as well as the caret. Chat focus still retires the timeline. |
| `CV_ITEMS`, `CV_TAGN`, Explore notes | Ordered by production from seed/script through breakdown, bible, casting, locations, lookbook/colour, storyboard, shot list, props, VFX breakdown, takes, edit, lock, VFX finals, sound, grade and master QC. Planning/QC boards stay in Explore. |
| `cvMakeEl`, `cvFocus`, `cvBindItem`, preview material | Existing canvas interactions are preserved; content is honest about generated stills and documents. |
| resize / `cvFit` | A user-modified canvas view must survive height-only resizes; automatic refit is limited to an untouched view with changed width. |
| frame/take preview | Existing stills support a timed storyboard-style cut and alternate framing studies from the same source image. These are explicitly not alternate motion footage. |
| copied nested callbacks and event listeners | Historical callback AST rows are not current assertions. A callback deriving from changed film data inherits this decision's adaptation; acceptance is current behavior, not source byte parity. |

## Verification and limits

Current-run source checks, independent data assertions, Chromium pointer/keyboard observations and any failures are retained under `.claude/verification-story-forge/`. The acceptance report there is the evidence index; a completed build is not behavioral proof. Historical E2–E9 logs from the earlier v5 port do not establish this revision.

The prototype's chat-focused timeline retirement remains intentional. Since the retired timeline has no natural hit target, a real frame click while it is retired cannot be claimed as verified. Mock chat streams local text. Timed still playback is not motion-video playback, and framing studies are not new generated takes. Hardware touch, non-Chromium engines, real AI generation and rendered audio are outside this run's evidence.
