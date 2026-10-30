# 0003 One UX layer, themes as data

Purpose: every sample in the handbook behaves by the same interaction rules, and a project can change its whole look without touching components.

Status: established on 2026-10-30. Application state: applied to `src/` and `ui-handbook.html`.

## Decisions

1. **One UX layer.** `src/ux.js` owns intent delay, attention lock, focus, dimming and tools. Story Forge's workspace moved onto it, so the rules have one implementation. Serves: rules that exist everywhere, not in one sample. Example: `<div class="card" data-cmp>` inside `<div data-scope="dash">` gains all four states; `<span data-tool>` inside it stays hidden until hover.
2. **Dimming depends on the surface.** `data-dim` is `focus` by default, because boards are read across and a hover only previews. `hover` is used where a hover claims the whole surface, such as the blueprint. `none` is used where one component fills the surface. Serves: dimming that helps reading instead of flickering.
3. **Lock between components only.** Rows, roles and calendar days inside one component use the .15s intent delay without the 500ms lock. Serves: scanning a list without waiting.
4. **Give-way in every sample.** Details push in only when asked: node settings, blueprint rollup, role detail and fan detail start at width 0. Dashboard focus grows a card through `flex-grow`. The command list overlays. Serves: clean at rest.
5. **Themes as data.** `src/themes.json` holds each theme; the build generates its CSS, switcher and dictionary entries. Serves: changing a theme by editing one entry.
6. **Stellar retired.** Its navy ground and pastel colours came from no reference. Replaced by Aurora, the dark pair of Prism sharing its glass (recent.design Voice and Thanks card), and by a new pair: Paper (Harness boot) and Ember (Obsidian creator panel). Serves: every theme traceable to a reference the owner chose.
7. **Navigation works however the file is opened.** Rail and phone capsule scroll by script rather than through a fragment navigation, which the preview pane blocks. Serves: navigation that never fails.
8. **State labels.** The `标注` button shows each component's current state. Serves: rules can be checked by eye.

## Acceptance

For each of the scopes dash, node, bp, work, daily, ai and tiles, checked by script on 2026-10-30: no hover at 60ms; hover by 220ms; a second component stays at rest during the 500ms lock and is admitted after it; focus dims the other component where the component can take focus; a click outside returns to rest. No `data-tool` element is visible at rest. Fan label centre equals its dot centre. Rail click reaches the section.

Not checked: a real phone, and every section in every theme.
