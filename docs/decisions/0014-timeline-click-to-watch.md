# 0014 The monitor enlarges when the timeline is clicked, not hovered

Purpose: someone moving the mouse across the Story Forge timeline can look at it and use its tools without the workspace rearranging, and enlarges the monitor only by choosing to.

Status: established on 2026-10-31. Application state: applied to Story Forge in the HTML template and to `core/rules/UI-RULES.md` rule 6 on 2026-10-31.

This amends decision 0010, decision 14, and its acceptance A11. A pointer passing over the timeline used to be enough to enlarge the monitor and push the side panel away.

## Owner record

2026-11-01: 「只有点时间线才会切换到观影模式，点其他的工具不会切换」 Gloss: "Only clicking the timeline switches to watching mode; clicking other tools does not switch." Decisions 2 and 5 and acceptance A6 and A8 were revised for this.

2026-10-31: 「时间线的行为这样改：hover的时候监视器不要放大；点击之后，timeline进入聚焦状态，timeline的组件不会消失，监视器放大」 and 「暂停的图标也太奇怪了」 Gloss: "Change the timeline's behaviour like this: the monitor does not enlarge on hover; after a click the timeline enters the focus state, the timeline's components do not disappear, and the monitor enlarges." "The pause icon is really strange."

## Decisions

1. **Hover only shows the timeline's tools and raises it.** Serves: looking changes nothing else. The monitor, the side panel and the secondary area keep their size and position while the pointer moves over the timeline. The magnifier still follows the pointer.
2. **A click on the filmstrip holds focus.** Serves: a deliberate, stable watching mode, with tools that can be used without changing it. Pressing the filmstrip enters the focus state. Pressing a tool in the toolbar neither enters it nor ends it; the play button starts playback, which watches by decision 3 only while it runs. It lasts until a click outside it or Esc, and the toolbar stays visible after the pointer leaves. The timeline carries `data-hold`.
3. **Watching follows that focus.** Serves: one source of truth. `.is-watching` holds while the timeline has focus, while the playhead is being dragged, or while playback runs. The hover flag, the separate keyboard flag and the 200ms grace token are removed, because nothing bounces once hover no longer changes the layout.
4. **The enlarged monitor belongs to the focus scope.** Serves: clicking the picture being watched does not shrink it. The monitor carries `data-keep`. So does the media preview, so closing a preview returns to watching. Clicking the chat, the navigation or the empty browser margin ends focus and restores the earlier layout. Esc ends focus and restores the side panel; a further Esc closes the panel as before.
5. **Keyboard reaches the same state.** Serves: the mode is not mouse-only. Tabbing onto the timeline itself focuses it, tabbing to one of its tools does not, and tabbing out of it, or Esc, ends focus.
6. **A click while the chat is focused still picks material.** Serves: decision 0010, decision 21, which this does not change. With the chat focused, clicking a shot inserts a chip and focus stays in the chat, so the monitor does not enlarge. A click after the chat has lost focus enters the timeline's focus.
7. **Pause is drawn, not typed.** Serves: an icon that looks the same on every system. The transport button showed the character `Ⅱ`, a Roman numeral with serifs. `.ic-pause` in `core/styles/base.css` draws two equal bars in the text colour. The role map's and crew's pause buttons use it too, replacing the font-dependent `❚❚`.

## Acceptance

Checked with real pointer input at 1440x900 in pure and neon.

- A1: with the side panel open, hovering and sweeping across the timeline leaves the monitor's size and the panel's width unchanged, and the toolbar visible.
- A2: a click on the strip enlarges the monitor and collapses the panel. Moving the pointer away keeps the monitor enlarged, the toolbar visible and the state `focus`.
- A3: clicking the monitor keeps it enlarged. Clicking outside restores the monitor and panel, as does Esc.
- A4: Tab into the timeline enlarges the monitor; Esc restores it.
- A5: with the chat focused, clicking a shot adds a chip, keeps chat focus and does not enlarge the monitor.
- A6: playback started with the play button enlarges the monitor. Pausing restores it unless the filmstrip was clicked first, in which case it stays enlarged.
- A8: with the timeline unfocused, clicking the layer, zoom, track and name tools leaves the monitor and panel unchanged. With the timeline focused, clicking them leaves it focused.
- A7: the pause button in the transport, role map and crew shows two equal bars, with no `Ⅱ` or `❚` left in the sources.
