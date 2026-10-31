# 0001 Visual system and method

Purpose: every project of the owner shares one clean interface language in which components stay out of the way until needed, with cool accents used sparingly.

Status: established by default consent unless the owner objects (2026-10-30). Application state: applied in `ui-handbook.html` v0.6; no product uses it yet.

## Decisions

1. **Reproduce first, then generalize.** Rules are extracted from working reproductions of the references, carrying source values. Reason: the previous version paraphrased Story Forge into abstract sentences and lost `#84cc16`, the attention lock and the focus scope.
2. (Revised by 0003: Stellar retired, three pairs now.) **Four schemes in two pairs; one structure.** Pure (light, black and white only) with Neon (dark, black with fixed `#84cc16`); Prism (light, Fintech coloured glass and category colours) with Stellar (dark, category glow). Reason: the owner ruled that Fintech is a coloured scheme, Neon is a fixed single-colour pairing, light is clean and dark is cool. Black with cobalt is excluded because it reads as corporate rather than cool.
3. **Three permitted exceptions over a neutral base.** Signal, Volume, Pattern (see `docs/TERMS.md`). Neon's Volume is graphite with a lime corner glow, because a sample of a full lime glass card looked muddy.
4. **Giving way depends on the relation.** Push, Overlay or Retire, as defined in `docs/TERMS.md`. This corrects the earlier blanket rule "never push", which contradicted Story Forge's context panel and audio lanes.
5. **Focus scope includes the whole component.** History is focusable (`tabindex="-1"`) and the focused style is keyed on `:focus-within` of the component root, so clicking history does not retire the chat.
6. **One page.** The handbook is a single long page, built from `src/` by `src/build.py`. Reason: owner direction, and the Figma UI Design System reference is a long sheet.

## Acceptance

- Clicking chat history leaves the chat focused (browser-checked 2026-10-30: active element `coBody`, width 880px, timeline height 0).
- Clicking outside ends focus; selecting a script line pushes in the 360px panel (browser-checked).
- All four schemes switch the whole page; visual satisfaction is judged by the owner.

## Superseded

`archive/ui-handbook-v0.5-codex.html` and `archive/UI-RULES-v0.5-codex.md`.

## Dated revision

2026-10-30 revision (decision 0008, details audit 35): Decision 5 above records the earlier implementation, not the current focus owner. `UX` owns held component focus through `.ux-focus` and the declared focus scope. DOM `:focus-within` does not hold tools or lists open. Keyboard focus rings remain `:focus-visible`. The history stays inside the chat focus scope.
