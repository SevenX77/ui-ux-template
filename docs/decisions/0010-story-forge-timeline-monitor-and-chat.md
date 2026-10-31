# 0010 Story Forge timeline, monitor and chat behave like an editing tool

Purpose: someone cutting a film in the Story Forge sample can scrub, watch and talk to the AI without the interface shaking, hiding material or making them guess which track is which, and an agent copying the sample inherits that behaviour.

Status: established on 2026-10-31. Application state: applied and verified for A1–A15 in the bounded Chromium checks on 2026-10-31; see `.claude/verification-story-forge/0009/delivery-report.md` for measurements, departures, reused evidence and limits.

This amends decision 0006 (copied behaviour) and decision 0008 (script scope). Later owner rulings win over the prototype, as 0006 decision 6 already states. Every decision below names the owner's feedback item it answers (F1 to F16; the list is at the end).

## Decisions

### Timeline geometry

1. **One slot per shot, at every level** (F6, F12). Serves: a timeline whose picture never rearranges under the editor. Each shot owns a slot `SLOT_W = 110px` wide and 62px tall (16:9), regardless of its duration. A unit at Film, Act, Scene or Beat level is one block covering its members' slots: `members.length * 110px` wide, with its members' pictures joined edge to edge in order and no empty cell. Changing level never moves a shot on the x axis; it only merges or splits blocks. Example, cut A at Beat level: Wake 110px with shot 1; Broadcast 330px with shots 2, 3, 4; Morph / Hammer 330px with shots 5, 6, 7; False relief 110px with shot 8. `.panel-mosaic` with `repeat(4,1fr)` is removed.
2. **The block has one surface in all three layers** (F9). Serves: readable script blocks. A block's rounded corners and 1px side inset belong to the block; inner joins are square. In the script layer the block is a full-height dark surface holding its text, top-aligned and clamped, with the label on the same surface. There is no shorter text plate above a loose label.
3. **The strip is black in every theme** (F3). Serves: film reads as film. New theme tokens, present in all six themes in `core/tokens/themes.json`: `strip` (`#000`), `strip-block`, `strip-ink`, `strip-ink2`, `strip-hole`, `strip-head`. Everything inside `.filmstrip` and `.lane-heads`, and the hover magnifier, uses them, so a light theme never paints a light chip or light text in the strip. `strip-head` must be visible on black: white in pure and aurora, lime in neon, the theme's orange in paper and ember, `#fff` in prism.
4. **Scroll snap is gone** (F2). Serves: no shaking. `scroll-snap-type` is removed, because `mandatory` snap fights both wheel scrolling and smooth scrolling. Scrolling the strip moves the view and nothing else: it no longer changes the current shot.
5. **Edge fades are fixed widths** (F12). Serves: nothing hidden at rest. The strip wrap's mask is 24px at each side, not a percentage. Pad before the first slot is 24px on the video track and the lane gutter width plus 12px on lane tracks, and there is the same pad after the last slot.

### Playhead

6. **The playhead is the current position** (F10). Serves: one answer to "where am I". State: `playback.time` in seconds. Current shot and current unit are derived from it; `sel` becomes that derived index. Two pure functions map time to x: on the video track, piecewise linear with each shot's duration filling its 110px slot; on lane tracks, linear at `PX_PER_SEC`. Example, cut A, video track, t = 10.5 falls in shot 3 (start 9, duration 3): x = pad + 2*110 + (1.5/3)*110 = pad + 275. Switching track keeps the time and scrolls it into view.
7. **Press anywhere on the strip to move it** (F10). Pointer down on the strip sets the time from the pointer's x and captures the pointer. Moving while held follows the pointer. Holding within 72px of the strip's left or right edge scrolls the strip in that direction, each frame, at a speed proportional to how far into that band the pointer is (up to 14px per frame), and the playhead keeps following; time is clamped to the cut. Release ends the drag. A press and release with under 4px of movement is also a pick (tag in the chat, decision 21), and it does not re-centre the strip. The playhead is a 2px line with a small head at the top in `strip-head`; it is inside the scrolled track, above blocks and clips, below the magnifier. Pointer down on a lane clip behaves the same, and a click still picks that clip.
8. **Transport lives in the timeline's own toolbar** (F10, F11). A play/pause button sits in the centre tool group. Space toggles it while focus is on the timeline. Playing advances `playback.time` by real time, the strip scrolls to keep the playhead inside the middle 70% of the view, and at the end of the cut playback stops. The old `cut-player`, `playerHTML` and `togglePlayback` player inside the browser view are removed; the monitor replaces them.

### Hover magnifier

9. **It magnifies the block under the mouse, by scale** (F7). Serves: seeing what you point at. The fixed-size centred hero is replaced. Only on the video track, only while not playing and not dragging: the block under the pointer is shown at scale 100/62 about its own centre, so a 110px shot shows at 177x100 and a 330px beat at 532x100, containing the same joined pictures, or the same text in the script layer. It stays inside the strip wrap's horizontal bounds. A scaled block wider than the wrap (Film, large Act) shows at wrap width as a loupe whose content shifts with the pointer's position inside the block. Moving between blocks moves it without a fade cycle. It hides when the pointer leaves the strip. It is vertically centred on the strip so it never reaches the toolbar. Its caption stays on one line.

### Toolbar

10. **Three tool groups in one row, on one baseline** (F13, F2). Serves: the middle group stops touching the strip. `.tlhead` moves into `.tlctl`; the row is a grid `1fr auto 1fr` with bottoms aligned and a fixed gap above the strip. The row always holds its height, so the strip and browser do not move when it appears. The negative `--tl-overlap` margin is removed. The row only fades (opacity), with no transform and no transition delay. Under the container width where it no longer fits, it wraps to two rows, centre group first. The cut menu is anchored to `.tlhead`.
11. **Labels** (F5). Layer: 剧本, 故事板, 影片. Level: 全片, 幕, 场, 节拍, 镜头. The flash message and the section intro use the same words, and English in `core/i18n/i18n.json` follows (Script, Storyboard, Film / Full film, Act, Scene, Beat, Shot; 全片 becomes "Full" if both would otherwise read "Film").

### Monitor and attention

12. **A fixed monitor heads the storyboard and film layers at every level** (F11). Serves: a constant place to watch. `.monitor` sits at the top of the browser column and does not scroll: a 16:9 picture, and below it one info line: timecode at the playhead with total (`00:00:12:00 / 00:00:45:00`), the shot's name and description, duration, and the honest note that this is a timed still preview. Below that, in a scrolling area, is the level's secondary content: the take list at Shot level on the film layer, the unit grid at unit levels and Film, or the clip detail when a clip is picked. The picture follows the playhead by changing only its background: the storyboard panel on 故事板, the still on 影片, black on shot 12. It never re-renders, so nothing reflows while scrubbing. Secondary content re-renders only when the current unit changes, debounced 160ms, and not at all while watching.
13. **The script layer has no monitor and always shows the whole cut's script, with the current lines highlighted** (F11). Serves: reading in context. Lines whose shots include the current shot (Shot level) or the current unit's shots (other levels) carry a highlight using `--mark`, falling back to `--sel`, and the view scrolls to keep them in view. Moving the playhead only toggles classes. Film level adds the logline above the script. This replaces the per-level script scope of 0008; the coverage labels stay.
14. **Watching is a state** (F11). `.sf.is-watching` holds while any of these holds: the timeline has hover attention, the timeline has keyboard focus, a playhead drag is in progress, playback is running. Leaving hover has a 200ms grace so overshoot does not bounce. While watching: the side panel is pushed away and the monitor grows to the largest 16:9 that fits the browser area with its info line, the secondary area collapses to zero height, `--mid-max` no longer limits the column, and the script column widens. The browser and monitor are never dimmed. State is restored by removing one class: `panel-open`, `activeSel`, the secondary area's scroll position and the picked block stay untouched, which is how the earlier state is remembered. Only size properties transition, with `--ease`, so growth is monotonic. On touch, watching comes from playback and drags only.

### Lanes

15. **Lane rows align with their labels** (F1, F8). Row height 24px. Voice and sound have two rows, music one; subtitles two, graphics one. Heights are computed once from this data and written to both the lane and its head, so they cannot drift; the strip's height is set to fit (about 136px audio, 80px text), with a height transition, and picking a clip no longer grows a lane. Label classes are renamed `lh-voice` and so on, because `.voice` is a global card style in `core/styles/more.css` and was painting the white box.
16. **Lanes are visibly separated** (F8). A gutter holds the labels on the strip's black, outside the fade mask; a 1px `strip-line` runs between lane categories; alternate categories have a faint band. The footage behind runs at opacity .5 so it reads as picture.
17. **Clip text is never falsely cut** (F8). Clips fill their row height with the text vertically centred and no vertical clipping. A fade mask applies only to a clip whose text actually overflows, decided by measurement, not to every clip.
18. **Each track type has its own colour in every theme** (F16). New tokens `trk-voice`, `trk-sound`, `trk-music`, `trk-sub`, `trk-gfx`, `trk-on`, in all six themes. They replace `--c1..c5` here, which are nearly grey in monochrome themes. Monochrome themes get muted, distinguishable hues that suit them: pure uses slate, sand, sage, mauve, clay; neon keeps lime and adds mint, amber, cyan and a warm white. A lane's label text, its dot and its clips are the same colour. Each colour reaches 4.5:1 on black, and `trk-on` reaches 4.5:1 on each.

### Lightbox

19. **Media preview copies the prototype's cinema backdrop** (F4). In `.cv-focus.media`, in all themes: `background: rgba(8,8,10,.84); backdrop-filter: blur(3px)`; caption and close button are light on dark. The stage's width limit is removed for media: the picture is 16:9, as large as fits in 80% of the workspace's width and 72% of its height, reserving the chat bar below. It is larger than any monitor at rest and is not full-screen. The text-document preview keeps `--scrim`.

### Chat

20. **Activating the chat changes only the chat** (F14, F15). The rule that collapses the timeline and adds 230px bottom padding to the browser is removed. Focus widens the bar, raises its shadow and shows send. The history stays closed. The timeline stays. The bar grows with its text in normal flow, so a taller bar pushes the timeline upward and a one-line bar moves nothing. `.bfade` and masks stay the same in both states.
21. **The component is exactly its visible bodies, and mentions are chips at the caret** (F14). `.copilot` has `pointer-events:none`; `.cbar`, the history and its toggle have `auto`. A click beside the bar is outside the component and ends focus. A click on the bar's own blank area keeps focus and moves the caret to the end. Chips: `span.selpill[contenteditable=false]`, any number, inline, wrapping with the text, with a maximum width and no fade from the input's mask. The caret is tracked through `selectionchange`. Picking material while the chat is focused inserts a committed chip at the last caret, and the same material is not inserted twice. Picking while the chat is not focused sets one tentative chip at the end, which the next pick replaces and a deselect removes; focusing the chat commits it. Typing `@` opens a small menu at the caret listing shots, characters and locations, filtered by what follows; Enter or a click inserts the chip, and Esc closes it. Backspace deletes a chip as one character using the browser's native behaviour; the old 70-line handler is removed. Sending includes chips as `@name` in the text. The input's fade mask applies only when its content actually overflows.
22. **History has three states: closed, peek, pinned** (F15). A chevron button sits above the bar in a permanent gap of about 26px between strip and bar, and it appears only when the chat is focused or pinned, so nothing touches the strip. Hovering the button opens a peek: glass overlay above the bar, over the timeline; leaving button and history for 200ms closes it. Clicking pins it: the history enters normal flow above the bar, the timeline collapses, the browser takes the remaining height; clicking again unpins and the timeline returns. Pinned survives chat blur. Sending while closed opens a peek so the reply is seen, and it closes when the chat loses focus.

## Rejected

- Duration-proportional shot blocks at Shot level, because the owner ruled 16:9 (F6). Lane tracks stay time-proportional, because a sound cue's length is its meaning.
- Keeping the watching state while the pointer is on the monitor, because that traps the panel behind a region covering most of the browser; the play button lives in the toolbar so nobody has to reach for the monitor.
- Scoped script views with highlighting, because a highlight in a one-line view shows nothing.

## Acceptance

Checked with real pointer input in a browser at 1440x900, in pure and neon, and for F3, F16 and F19 in all six themes.

- A1 (F1) Audio track: each label's vertical centre is within 1px of its lane's; no white box.
- A2 (F2) Sample `getBoundingClientRect` of the tool groups, strip, monitor picture and magnifier each animation frame for 2s while: hovering in and out of the timeline, sweeping the mouse across the strip, and wheel scrolling. Tool groups and strip: no position change at all. Monitor: width changes monotonically in each transition, never reversing. Magnifier: top constant.
- A3 (F3) Computed strip background is black in six themes, with no light surface inside it.
- A4 (F4) Lightbox picture is wider than the monitor at rest, narrower than the workspace; backdrop colour is `rgba(8,8,10,.84)` in pure.
- A5 (F5) Exact labels in the DOM; grep of `core/` and `templates/html/src/` finds no 镜头级, 幕级, 场景级, 影片素材 in the workspace; English switch shows sensible labels.
- A6 (F6, F12) At each level, block widths equal `members * 110`; each shot's x is identical across levels; no empty cell at Beat level.
- A7 (F7) Hover shot and beat blocks: magnifier size equals block size times 100/62, centred on the block, clamped at the edges. While playing or dragging, none appears. Film level shows the loupe.
- A8 (F8, F16) No clip text faded unless it overflows; separators and gutter present; footage opacity .5; label, dot and clip colour are equal per lane; contrast computed for six themes.
- A9 (F9) Script block is one surface, full height.
- A10 (F10) Press moves the playhead to the pointer within 1px; dragging follows; holding at the edge auto-scrolls and time keeps changing; release stops.
- A11 (F11) Monitor present in 故事板 and 影片 at all five levels; absent in 剧本, where the current lines are highlighted and change with the playhead. With the panel open, hovering the timeline hides it and enlarges the monitor; leaving restores the panel, its content and `activeSel`. Playing with the pointer elsewhere also watches and restores at the end. Storyboard playback shows each panel in turn.
- A12 (F13) Bottoms of the three tool groups equal within 1px; gap to strip at least 6px.
- A13 (F14) Clicking left and right beside the bar ends focus; clicking inside does not. Two materials picked with the caret mid-text give two chips at the caret; `@` menu works; browser and timeline pixel layout are the same with the chat focused and not.
- A14 (F15) Focus: history closed, timeline visible at the same position with one line. Four lines of text push the strip up. Hover opens; click pins and hides the timeline; click again restores.
- A15 No console errors. `data-assertions.final.cjs` updated for the deliberate changes (script scope, player) and passing; Explore, narrow container and phone widths still work; `prefers-reduced-motion` respected.

## Owner's feedback, 2026-10-31 (record)

Quoted verbatim as provenance; the decisions above are the operative text.

1. 「音效轨道的左边没有对齐」 Gloss: the left side of the audio track is misaligned.
2. 「时间线上面的小工具按钮动画抖动非常严重；上方的素材展示也抖动的非常严重」 Gloss: the small tool buttons above the timeline shake badly when animating; the material display above also shakes badly.
3. 「哪怕是亮色背景，时间线也不应该是白色的，应该是黑色」 Gloss: even on a light background the timeline should be black, not white.
4. 「图片放大，视频放大预览：第一要大，现在还没放大前的大，但也别给我放全屏，搞什么呢；第二背景要黑色半透明的，这是模仿影院观影效果，照原样抄！」 Gloss: enlarged preview must be big (it is smaller than before enlarging) but not full-screen; the backdrop must be translucent black, imitating a cinema; copy the original.
5. 「不要翻译成"镜头级"，就翻译成"幕"、"场"、"节拍"、"镜头"；"影片素材"也改成"影片"，"分镜"改成"故事板"」 Gloss: the label wording.
6. 「切换到镜头级时，时间线上的镜头块全部16：9，不要根据时间来调整宽度；」 Gloss: at shot level all blocks are 16:9, not width by time.
7. 「时间线上放大的原则：1. 未播放时，跟随鼠标放大，播放时，不放大；2. 根据块的大小放大，而不是固定16：9的大小；」 Gloss: magnify following the mouse when not playing, not while playing; scale by block size, not a fixed 16:9.
8. 「音效里面的块都被裁切了；轨道分类之间加一点元素让他划分的更加清晰；后面的画面可以再明显一点，不然等于没加」 Gloss: clips are cut; add elements between track categories; make the picture behind more visible.
9. 「剧本，时间线上文字底下的块太奇怪了」 Gloss: in the script layer the block under the text looks strange.
10. 「加一个播放针头，按下鼠标枕头就跟随到鼠标的位置，按住不放可以拖动，左右拖到一定的位置，timeline跟着鼠标滑动。」 Gloss: add a playhead that jumps to the mouse on press, drags while held, and scrolls the timeline at the edges.
11. 「除了剧本，分镜和影片都需要一个固定的监看视窗，就是最上方那个大的框，下方有timecode等信息。当注意力聚焦在timeline（播放时也算）时，这个监看视窗要主动放大（分镜播放时就把当前镜头那张播放，剧本模式时，就把当前剧本文字高亮），将旁边的元素挤小，侧边栏挤走，这时候时专注观看的时候。当注意力从timeline移走时，恢复到之前的状态，如果有侧边栏就恢复侧边栏，所以需要记住原来的状态。」 Gloss: a fixed monitor with timecode for storyboard and film; it enlarges when attention is on the timeline or playing, highlights script text in script mode, squeezes neighbours, pushes the side panel away; restores the earlier state afterwards.
12. 「镜头之外的时间线显式逻辑不对，为什么有那么多空白，应该是把所有的镜头按顺序拼成一个块，而不是放大。其实就是把镜头级的块按照分级融合成一个块。」 Gloss: above shot level, shot blocks merge into one block in order; no blanks.
13. 「时间线正上方的这个工具栏位置不对，下方和旁边两个工具栏对齐，不然碰到timeline了。」 Gloss: align the middle toolbar's bottom with its neighbours.
14. 「对话框的问题，第一，激活时下方的模糊影响到了中间的内容，和未激活的时候不一致。第二，组件范围不精确，点击输入框左右两边的外侧，都不会算作空白，退出聚焦状态。第三，@某个素材，不应该是只有固定再输入的最一开始，而是出现再输入光标的位置，应该可以@多个素材，而不仅仅是一个。」 Gloss: activation must not change the content; clicking beside the box must end focus; @ mentions appear at the caret and can be multiple.
15. 「激活对话框时，不要默认打开聊天记录，也不要让时间线消失，而是把时间线挤到对话框的上方（如果本来就不影响，就不动）。对话框上方出现一个向上的按钮，hover打开聊天记录；点击固定聊天记录，隐藏时间线。」 Gloss: history closed by default on activation; timeline pushed up, not hidden; an up button whose hover opens and click pins the history, hiding the timeline.
16. 「字幕和声音时间线上面的块的颜色，不能只有一种颜色，哪怕主题是单色的，这样无法分辨，每个主题必须有几个能分辨的颜色，和主题风格适配；左侧的轨道类型颜色标识要和轨道上的素材块颜色一致，不然无法辨认。」 Gloss: distinguishable clip colours in every theme; the left label colour matches its clips.
