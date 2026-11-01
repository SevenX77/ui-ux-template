# 0013 A switch for dimming the components around the focused one

Purpose: someone looking at the handbook can compare, on any sample, the two ways of drawing attention to one component: fading what surrounds it, or only raising it.

Status: established on 2026-10-31. Application state: applied to `core/behavior/ux.js`, `core/styles`, rule 27 and the top bars of both templates on 2026-10-31.

## Owner record

2026-10-31: 「补充，顶部工具栏再加一个隐藏周围组件的开关，关掉的时候，聚焦一个组件，不会让周围组件半透明，只会让聚焦组件浮起」 Gloss: "In addition, add a switch to the top toolbar for hiding the surrounding components. When it is off, focusing a component does not make the surrounding components translucent; it only makes the focused component rise."

## Decisions

1. **The switch governs fading that exists to draw attention to another component.** Serves: "off" means nothing around the component fades, whichever sample is looked at. It covers the engine's dim state (every `data-scope` surface and Story Forge), the blueprint's unrelated steps (`.off`), the crew members around the one playing, and the page behind the open navigation rail or phone navigation.
2. **Fading that reports something else stays.** Serves: the switch changes attention only, and information stays visible. Columns that are not a drop target during a kanban drag, gallery items that do not match a filter and disabled controls still fade.
3. **The engine owns the state.** Serves: rule 3 of `AGENTS.md`, one core change reaches every stack. `UX.dimOthers()` reads the state and `UX.dimOthers(on)` writes it, stores it under the `dimOthers` key, sets `data-attention="raise"` on the root element when off, and repaints every surface. With the switch off a component never enters the `dim` state, so state labels and every style keyed on that state agree.
4. **Raising is unchanged in both positions.** Serves: the focused component looks the same either way, so the comparison isolates the fading.
5. **On is the default.** Serves: rule 6's attention behaviour stays what a new visitor sees. The choice persists per browser and reaches the phone preview by message.
6. **The button reads 隐藏周围 / Dim others and sits beside 标注 / States.** Serves: both are view switches for the handbook, and like 标注 it does not appear inside the phone preview's own bar.

## Acceptance

- A1: with the switch on, hovering a live card still leaves its neighbours in the `dim` state at opacity .3.
- A2: with the switch off, in pure and neon, hovering a card, selecting a node and selecting a blueprint group leave every other component in the `rest` state at opacity 1, blueprint steps at opacity 1, and the page at opacity 1 with the rail open.
- A3: the focused component's shadow is the same in both positions and differs from its resting shadow.
- A4: the choice survives a reload, and switching back restores dimming.
- A5: the button exists and works in both templates, and the kanban drag still fades non-target columns.
