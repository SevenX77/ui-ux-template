# 0006 The full Story Forge workspace in the handbook

Purpose: the handbook's workspace sample does everything the Story Forge v5 workspace does, in every theme and in both languages, so that any project can take the whole interaction from this template.

Status: established on 2026-10-30. Application state: applied on branch `interaction-polish`, not yet merged to `main`.

The source is `D:/coding/story-forge-master/prototype/sfm_ui_draft_v5.html` (1754 lines: stylesheet to line 595, markup to line 690, script from line 692). The sample it replaces is about 23 KB and holds only part of it.

## Decisions

1. **Copy the code; do not re-derive it.** Serves: nothing lost. The prototype's behaviour was tuned by hand, and a re-implementation drops details nobody listed, which is how the current sample lost most of it. Every function in the prototype's script and its data constants move across. A function is changed only as decisions 2 to 8 require.
2. **Port into the page, with no iframe.** Serves: every theme and language. An iframe would isolate tokens, the language switch and the attention layer, so the sample would stop following the handbook.
3. **Isolate by file and scope.** Serves: no collision with other samples. Styles go in `src/sf.css`, scoped under `.sf`; the handbook's global `.seg`, `.hero` and `.frames` must not leak in either direction. Script goes in `src/sf.js` as one closure, with inline `onclick` handlers replaced by listeners or one `SF` namespace. The old sample's markup, styles and script are removed, not left beside it.
4. **Colours come from tokens.** Serves: rule 1, a theme is data. Each prototype variable and literal colour maps to a handbook token, and the prototype's own light/dark toggle is dropped because the top bar's theme pair does that job. Film stock and image art may keep their own values only where the prototype's meaning requires it, and they must still read correctly in all six themes.
5. **One attention layer.** Serves: rule 6, no sample writes its own version. The prototype's `activateHover`, `deactivateHover`, `triggerCurrentHover` and the timeline hit-area code (lines 1336 to 1460) express the same rules as `src/ux.js`. Behaviour follows the prototype; the mechanism lives in `src/ux.js`. Where the layer lacks a general capability the prototype needs, such as a hit area made of a component's visible bodies, it is added to `src/ux.js` as a declared capability, without changing other samples.
6. **The owner's later rulings win over the prototype.** Serves: the feel the owner has since set. Where they differ, `UI-RULES.md` decides: a hovered component never moves (rule 10; the prototype's 1px lift goes), nothing is lost to an animation (20), nothing is cut hard (22), a state ends with what started it (24), hovering never moves the page (25), and a selector has one sliding indicator (19).
7. **Images become theme art.** Serves: a self-contained handbook. The prototype's `assets/static_workflow/` folder is empty in this repository, so `bg(name)` maps each of the 26 names to theme-following art built from `--pic-a`, `--pic-b` and `--pic-c`, deterministically by name.
8. **It lives in a section, not a viewport.** Serves: a sample on a long page. `.sf` replaces the prototype's `.app`, with height `min(860px, 100vh - 96px)`. The wheel over the film and canvas acts on them as in the prototype and otherwise scrolls the page. Lightboxes cover `.sf`. Text follows language by the existing dictionary: Chinese strings get entries in `src/i18n.json`, and the prototype's English story content stays English in both languages. The phone form must work at 375 wide with no page overflow, and touch has an equal path (rules 12 and 18).

## Acceptance

The whole feature list lives in `docs/sf-parity.md`: one row for every function and data constant in the prototype's script, stating where it went and how it was checked, or why it was dropped under the decisions above. Each flow below is checked against the prototype itself, side by side.

- **Explore:** drag to pan, wheel to pan, modifier-wheel to zoom, fit on entry; drag a card; click selects and tags the chat with a pill; click empty space deselects and removes the pill; focus lightbox opens and closes; the left rail appears on hover and its five filters work.
- **Create, browser:** Script, Storyboard and Footage layers; Film, Act, Beat, Scene and Shot zoom, driving both the film and the browser; script elements select by type and open the context panel bound to them; panel thumbnails open the media preview; clicking empty space closes the panel; clicking the panel does not take focus from the chat.
- **Create, timeline:** centred hero frame follows film scrolling; the wheel scrolls the film sideways; clicking a frame navigates and tags the chat when the timeline is showing, and focusing the chat retires the timeline as in the prototype, so a frame cannot be clicked while the chat holds focus; graphics, video and audio tracks, with stacked lanes, waveforms and clip selection that grows the lane and shows the material; five named timelines, adding one, and the reel change.
- **Chat:** editable input with pill and placeholder, caret placed at the end on a blank click, send with a streamed reply (an addition: the prototype appends whole replies, and the acceptance asks for streaming), history glass, focus widening, and retiring the timeline as in the prototype.
- **Attention:** timeline and chat dim each other with the 500ms lock; the hit area matches the prototype's.
- **Handbook:** all six themes, both languages with the language switch, 375 wide with no overflow, no console errors, and every other section unchanged.

## Owner record

2026-10-30: 「把工作台 story forge的功能 copy 完整」 Gloss: "Copy the Story Forge features of the workspace in full." The quotation records the direction; the decisions above are the operative statement.
