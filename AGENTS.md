# Coding agent instructions

Purpose: changes to this repository preserve the same design and behaviour across the owner's projects, whatever stack renders them.

Before editing, read [the architecture](docs/ARCHITECTURE.md), [UI rules](core/rules/UI-RULES.md), [terms](core/rules/TERMS.md) and the applicable [decisions](docs/decisions/). Then apply these rules:

1. **Locate the change's layer.** Design tokens, styles, behaviour, language support and shared reference content belong in `core/`; stack rendering, application-state wiring and builds belong in `templates/<stack>/`. Reason: each design fact has one owner.
2. **Add design in core first.** Add its working handbook sample and its rule, then render it in each template. Never add colour, size, radius, shadow, easing, duration, spacing or interaction-timing values in a template. Reason: stack ports must not create different designs.
3. **Read core; do not copy it.** Template imports or builds read `core/`, and core never reads a template. Bind behaviour through `core/behavior/ux.js` and its `data-*` declarations; do not reimplement the engine. Reason: one core change must reach every stack.
4. **Share sample content.** When a second template first renders a sample, move its data into JSON in `core/content/` and switch HTML to read it in the same change. Reason: parity must compare the same content.
5. **Record structural decisions first.** Write decisions in `docs/decisions/NNNN-*.md` before structural work starts. Reason: later agents need the boundary and acceptance, not an unavailable chat.
6. **Run the checks for affected outputs.** From the root run `python3 core/build.py --check` and rebuild HTML with `python3 -I templates/html/src/build.py`. For React changes, run `npm run build` and `npm run parity` inside `templates/react`. Regenerate stale core outputs with `python3 core/build.py`. Report any check that cannot run. Reason: a build alone does not establish design or behaviour parity.

[Decision 0009](docs/decisions/0009-design-core-and-stack-templates.md) records implementation progress and the React version-1 boundary. Follow the full change and parity procedures in `docs/ARCHITECTURE.md`.
