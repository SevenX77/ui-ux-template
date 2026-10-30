# UI rules v0.8

Purpose: an agent building any of the owner's interfaces produces a clean surface whose components stay out of the way until needed, with cool accents used sparingly.

Words follow `docs/TERMS.md`. Values come from section 13 of `ui-handbook.html`, and a value outside that table is not used. Every rule has a working sample in the handbook.

1. **Choose a theme pair first.** Pure/Neon, Prism/Aurora or Paper/Ember. The light/dark switch moves within the pair. Never pair black with cobalt. A theme is one entry in `src/themes.json`; components read tokens and never name a theme.
2. **Keep the base neutral.** Only Signal, Volume and Pattern carry colour or material: one Signal per region, at most one Volume per screen, colour on Pattern only for data. In Neon, `#84cc16` is the only colour. Category colours appear in the coloured themes only.
3. **Use the radius tiers by role.** Control 9, card 16, panel 22, capsule 999, joined 0.
4. **Draw no border by default.** Lines appear only for keyboard focus, active or invalid input, drop targets and a divider between same-coloured regions. Never outline a card with colour or a hand-drawn line.
5. **Depth states a level.** Flat, lifted (hover), float, recess, raised, volume. Depth never decorates. Shadows come only from the four elevation tokens `--e1` to `--e4`: at most two layers, blur at most 48px. A shadow is never cut by its container: give the clipping parent room or do not clip.
   A selected or hovered surface is always opaque. Translucency belongs only to glass overlays.
6. **Give each component a core and four states, through the UX layer.** Rest shows only the core; hover previews after .15s without expanding content; focus responds at once and expands; another component's activity dims it to .3. Every sample declares this with `data-scope`, `data-cmp` and `data-tool` and runs on `src/ux.js`; no sample writes its own version. `data-dim` says when others dim: `focus` by default, `hover` where a hover already takes the whole surface, `none` where one component fills the surface.
7. **Define the focus scope.** Everything belonging to the component (input, send, history, menus) keeps it focused. Only a click outside or Esc ends focus.
8. **Apply the attention lock between components.** One component in hover at a time; the next is admitted 500ms after the previous leaves. Items inside one component (rows, roles, days) use the .15s intent delay only.
9. **Choose how to give way by the relation.** Push when both are read together, Overlay when the view is temporary (add scroll room so content can clear it), Retire when both claim the same place. A change never disturbs a component it has no relation to.
10. **Animate with the table.** Main easing `cubic-bezier(.16,1,.3,1)`. Lift .35s, tools .25s, input expansion .5s, push .52s. Respect reduced motion.
11. **Lay out by what is read first.** Pick one of hero, bands, main with aside, full-bleed with floats, kanban, swimlanes. Large numbers stand apart; small labels sit tight.
12. **Give touch an equal path.** Hover does not exist on touch: tools stay visible and focus comes from a tap.
13. **Hide fully or not at all.** A hidden tool also leaves hit-testing (`visibility:hidden`), and it becomes hittable only when it becomes visible, so the pointer never changes over nothing.
14. **Draw links as a system.** A link starts at the edge of the thing that owns it and ends at a visible end point. Weight 1.3 to 2px, round caps, a gradient from source to target. Business flows use rounded elbows with arrowheads, and cross-group flows are dashed. Only the links of the current selection are coloured and carry the moving pulse.
15. **Colour relates.** A core, its link and its detail share the current category colour. Coloured themes use muted category colours of equal weight.
16. **Lay out with density and stagger.** Body 13, card padding 12/14, card gap 10, section gap 44. Spans differ on a 12-column bento so priority is visible; never a row of equal boxes when one matters more.
17. **Set each language on its own terms.** Chinese: line height 1.62, tracking +.01em, headings at weight 600, labels in natural case. English: line height 1.45, headings at weight 680 with -.022em tracking, labels uppercase and tracked. Numerals use Inter in both. Text lives in a dictionary file, never in layout code.
18. **Every screen has a phone form.** Check at 390 wide. The arrangement may change; the language may not.
