# Design core

Purpose: every stack and consuming project uses the same interface design and behaviour.

`core/` owns design facts. Stack templates read these files; core does not import template code. See [the architecture](../docs/ARCHITECTURE.md) for change conditions and [decision 0009](../docs/decisions/0009-design-core-and-stack-templates.md) for application progress.

`core/VERSION` is the one version number. The HTML build writes it into `<meta name="ui-template-version">`; the React build writes the same meta tag and fails if `templates/react/package.json` differs.

## Files

| Path | Contents |
| --- | --- |
| `tokens/themes.json` | Six themes and their tokens: Pure/Neon, Prism/Aurora and Paper/Ember. |
| `styles/base.css` | Shared base styles and design tokens common to themes. |
| `styles/scenes.css`, `styles/more.css`, `styles/sf.css`, `styles/data.css` | Shared sample and pattern styles, including Story Forge and data views. These are design, not stack adapters. |
| `behavior/ux.js` | The shared UX engine and its ES module exports, including `UX`, `whenSeen`, `countUp` and `revealAll`. |
| `i18n/i18n.js` | Language state and translation functions; `useDictionary(d)` supplies its dictionary. |
| `i18n/i18n.json` | The source language dictionary. |
| `content/` | Shared reference-sample JSON, extracted when a second template first renders the sample. |
| `content/assets/gallery/`, `content/assets/sf/` | Reference images and their source data. |
| `rules/UI-RULES.md`, `rules/TERMS.md` | Design rules and the vocabulary used by the owner and agents. |
| `build.py` | Stack-neutral generation of the outputs below. |

## Generated outputs

Generate `dist/` with `build.py` and commit the resulting files with core source:

- `dist/tokens.css`: a `[data-scheme=<id>]` rule per theme, generated from `tokens/themes.json`.
- `dist/dictionary.json`: `i18n/i18n.json` plus each theme's translated name and note.
- `dist/gallery.json`: gallery items derived from `content/assets/gallery/manifest.json`, including their title, category, height/width ratio and file.

Run from the repository root:

```sh
python3 core/build.py
python3 core/build.py --check
```

The first command writes the outputs. The second exits with an error when an output is missing or stale. Edit the source files and regenerate; generated outputs are not separately maintained design sources.

## Using core

A template or consuming project reads core by reference. Plain HTML loads `dist/tokens.css`, the five stylesheets in `styles/`, and `behavior/ux.js` as a module, with `data-scheme` on `<html>`. [The HTML guide](../templates/html/README.md) gives a complete path example. Other stacks import the same files; the HTML handbook build instead reads and inlines them from core.

For language support, import `LANG`, `tr` and `useDictionary` from `i18n/i18n.js`, and supply `dist/dictionary.json` to `useDictionary(d)`. The template renders content and sets the current language through the shared language mechanism. The shared cross-fade and scroll-pinning transition is a React-integration requirement recorded in decision 0009.

Add a new design element here first, then its working handbook sample, its rule and each template rendering. A stack-neutral adaptation preserves existing behaviour; a design addition follows [the architecture's design-element procedure](../docs/ARCHITECTURE.md#adding-a-design-element).
