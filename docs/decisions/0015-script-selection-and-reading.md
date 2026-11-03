# 0015 The script shows selection in grey and reading in the mark colour

Purpose: someone working in the Story Forge script can always tell what they have selected from what is being read, and while the playhead moves can follow the words at one fixed place on screen, like reading a page that moves past their eyes.

Status: established on 2026-11-01. Application state: applied to Story Forge in the HTML template and to `core/rules/UI-RULES.md` rule 6 on 2026-11-01.

This amends decision 0010, decision 13, and its acceptance A11. There, every script element covering the current shot carried `--mark`, whether or not anything had been selected or was playing. At Shot 4 of Picture Lock A, the announcer (covering Shots 1 to 6), the Scene 2 heading (Shots 2 to 8) and Joe's line (Shot 4) were all lit, and a clicked element showed a grey block on top of the green one.

## Owner record

2026-11-01: 「上面announcer和场景头高亮的逻辑是什么？」 「选中就是灰色，不要下面还有一个主色」 「时间线头走起来的时候，才出现主色高亮，隐藏选中的灰色高亮， 被读到的剧本永远固定在中间位置，纸张往上走」 Gloss: "What is the logic of the announcer and scene heading highlight above?" "Selected is simply grey, with no primary colour underneath." "Only when the playhead moves does the primary highlight appear, hiding the grey selection highlight; the script being read stays fixed at the middle and the paper moves up."

## Decisions

1. **Each script element is read in one place in time.** Serves: one reading position. An element belongs to the first shot of the cut that covers it, so the announcer belongs to Shot 1 and the Scene 2 heading to Shot 2. A shot with several elements divides its time among them by text length. A shot with no element of its own holds the previous element until the next one starts. `SCRIPT` still records every covering shot, and the coverage labels and the selection of a clicked element's shots do not change.
2. **Grey means selected, and nothing else.** Serves: telling selection apart. A clicked element is grey as a whole, cue included, with no second colour under it and no second block inside it. A shot, unit or clip picked from the timeline makes grey the elements that belong to its shots under decision 1. With nothing selected, the script at rest has no highlight, because a resting playhead has not been selected by anyone.
3. **The mark colour means being read, and appears only while the playhead moves.** Serves: the same distinction. During playback, or a playhead drag past the pick distance, exactly one element carries `--mark`, and grey selection and hover are hidden. A plain click on the strip is not movement. When the movement ends, the mark goes and the selection's grey returns unchanged.
4. **The reading position stays at the vertical middle of the view and the paper moves up.** Serves: following the words without moving the eyes. The point being read goes from the top of the current element to the top of the next during the current element's time, and the scroll position keeps that point at the middle on every frame, so the paper moves continuously rather than in hops. The wheel does not override this while the playhead moves.
5. **The paper has room to centre its first and last lines.** Serves: decision 4 at both ends. When reading first starts in a rendered script, half the view's height of padding is added above and below, and the scroll position is corrected in the same frame so that nothing visibly jumps. The room stays afterwards, so pausing never moves the paper. Rendering the script again removes it.
6. **Starting to read glides.** Serves: no jolt when reading starts far from the current scroll position. The difference between the paper and its reading position decays over `--sf-script-catchup`. Under reduced motion it snaps.
7. **Every scheme has a mark colour.** Serves: decision 3 in every scheme. Pure and Prism had no `--mark` and fell back to `--sel`, which would make reading look like selection. Prism gets a tint of its blue. Pure has no hue, so its mark is a deeper neutral than its `--sel`. The fallback is removed.

## Acceptance

Checked with real pointer input at 1440x900.

- A1: at rest with nothing selected, no script element carries a highlight in the script layer.
- A2: clicking an action element and a dialogue element each gives one grey block covering the whole element, with computed `--mark` absent and the inner paragraph transparent.
- A3: picking Shot 4 from the timeline makes only Joe's line grey, not the announcer or the Scene 2 heading.
- A4: during playback exactly one element carries the mark colour, and no element shows grey, including a selected or hovered one.
- A5: during playback the point being read stays within 2 pixels of the view's middle on sampled frames, once the glide has ended, and the scroll position only increases.
- A6: the first and last elements of the cut each reach the middle.
- A7: pausing removes the mark, restores the selection's grey and leaves the scroll position unchanged.
- A8: dragging the playhead reads in the same way, forwards and backwards, and a plain click on the strip shows no mark colour.
- A9: every scheme has a `--mark` that differs from its `--sel`.
