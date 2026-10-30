# 0002 Density, language and device views

Purpose: the handbook reads as a tight, deliberate design system in both languages and on both web and phone, and its surfaces, shadows and links look natural.

Status: established on 2026-10-30. Application state: applied to `src/` and `ui-handbook.html`.

## Decisions

1. **Page frame.** Margins come from `.wrap` (`padding-inline:40px`, 14px on phones) and vertical rhythm from `.sec` (`padding-block`), so a section can no longer erase the page margin. Serves: readable frame.
2. **Elevation tokens.** All outer shadows use `--e1` to `--e4`, defined per scheme. Serves: shadows that read as light rather than dirt. Example: `--e3: 0 1px 3px var(--shadow-2), 0 8px 24px var(--shadow)`, with `--shadow` at `rgba(30,30,25,.09)` in Pure.
3. **Opaque selection.** `--sel` and `--mark` are solid colours. Blueprint groups are opaque and tint with `color-mix` over the card colour. Serves: a selected thing looks more present, never see-through.
4. **Hidden means unhittable.** Hidden tools use `visibility:hidden`, whose change is delayed with the opacity transition. Serves: the pointer never turns into a hand over nothing.
5. **Blueprint.** Each group declares its nodes, decisions and edges as data; `route()` draws rounded elbows with arrowheads; cross-group edges are dashed. Serves: a process that can be followed.
6. **Links.** The fan starts at the selected button's edge and ends at a dot beside each label; gradients run source to target; only the selection carries the pulse. Serves: every link says where content comes from.
7. **Colour.** Prism and Stellar categories are muted to equal weight. The role-map core takes the current category colour. Serves: core, link and detail read as one thing.
8. **Bento.** A 12-column grid with uneven spans replaces rows of equal boxes. Serves: priority visible at a glance.
9. **Language.** `src/i18n.json` holds the zh-to-en dictionary and number patterns as data; `src/app4.js` walks text and attributes and an observer translates dynamic text. Typography differs through `html[lang]` variables. Serves: reading comfort in each language.
10. **Devices.** The top bar switches Web and Phone. Phone shows the same page in a 390-wide iframe with `#embed=1`, kept in sync with the parent by `postMessage`. A hash is used because a query string does not survive every way the file is opened. Serves: checking the real responsive layout, not a mock.

## Acceptance

- `.sec` computed left padding is 40px at 1440 wide. Checked.
- English mode has no Chinese left except the `中` language button. Checked by scanning text and attributes.
- No element with `cursor:pointer` sits at opacity below .05 while hittable, once the closed context panel is excluded by `visibility:hidden`. Checked.
- No selected element has a translucent background. Checked.
- Blueprint renders 21 edges, 18 nodes and 3 decisions. Checked.
- At 390 wide the document has no horizontal overflow. Checked.

Reference frames are listed in `references/REFERENCES.md`.
