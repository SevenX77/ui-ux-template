# Architecture

Purpose: the owner's projects present the same design and behaviour on different technology stacks, and each stack's result can be checked against the original rendering.

The governing design is [decision 0009](decisions/0009-design-core-and-stack-templates.md). Its status separates the established architecture from work still being applied. This page states the standing architecture, not a claim that every template already passes parity.

## Two layers

The **design core** is the stack-neutral source of how an interface looks and behaves. A **template** is one stack's rendering of that core, including its state wiring and build.

```text
core/
  tokens/themes.json              theme definitions and tokens
  styles/
    base.css scenes.css more.css sf.css data.css
  behavior/ux.js                  shared behaviour engine
  i18n/i18n.js i18n.json           language mechanism and dictionary
  content/                        shared reference-sample JSON
    assets/gallery/ and sf/       reference-sample images and source data
  rules/UI-RULES.md TERMS.md      design rules and vocabulary
  build.py                        stack-neutral generation
  dist/
    tokens.css dictionary.json gallery.json
templates/
  html/
    src/                          handbook pages, scripts and HTML build
    ui-handbook.html              generated reference rendering
  react/                          React 18 + TypeScript + Vite template
docs/decisions/
references/
archive/
```

All entries in this tree are relative to the repository root; `templates/`, `docs/`, `references/` and `archive/` are peers of `core/`. The React template, shared reference content and parity check are applied; decision 0009 records the parity result.

`core/styles/` includes pattern styles as well as base styles. A data table needs `data.css` in HTML and React alike. Scenes and Story Forge styles belong to core for the same reason. `templates/html/src/` owns the handbook's page composition, not its visual values.

## Dependency direction

Dependencies point from `templates/<stack>/` to `core/`. A template imports core files or reads them during its build. Core has no dependency on a template.

For example, `templates/html/src/build.py` reads `core/styles/base.css`, `core/behavior/ux.js` and the functions in `core/build.py`. It assembles `templates/html/ui-handbook.html`. Inlining core into that generated artifact is a build result, not a second maintained core source.

`core/dist/` contains generated outputs. Commit these outputs with core source. `core/build.py` generates theme CSS from `core/tokens/themes.json`, merges theme dictionary entries with `core/i18n/i18n.json`, and derives gallery data from `core/content/assets/gallery/manifest.json`.

## Changes to core

Core has two kinds of change, with different acceptance conditions:

1. **Stack-neutral adaptation** changes how a stack can use core while preserving existing appearance and behaviour. The ES module exports in `core/behavior/ux.js` and `core/i18n/i18n.js` are examples. The HTML build strips each final export line when it inlines a classic script; other stacks import the module. `useDictionary(d)` supplies the dictionary. `UX.paint` reasserts `ux-hover`, `ux-focus` and `ux-dim` on every paint. `revealAll(sel)` receives the page's selector rather than storing handbook selectors in core.
2. **Design development** adds a look or behaviour to core, with a working handbook sample and a rule in `core/rules/UI-RULES.md`, then renders it through each template. A new theme, for example, starts in `core/tokens/themes.json` and uses the core build, not template-local colour definitions.

For the React integration, the shared engine gains a `UX.sortable` option `commit(order)`: a drop restores the original Document Object Model (DOM) order and passes the new order to framework state. The whole-page language cross-fade and first-visible-element pinning move from `templates/html/src/app4.js` into a single core function called by both templates. These are required integration results, not permission to create React-only behaviour.

A template defines no colour, size, radius, shadow, easing, duration, spacing or interaction-timing value. Template styling reads core tokens through `var(--…)`. A missing design value or mechanism belongs in core before any template uses it.

## Binding a template to the behaviour engine

Every template uses `core/behavior/ux.js` for intent delay, dimming, attention lock, focus, tools, drag and the selector indicator. A template supplies markup and application state; the engine owns interaction-state classes and timings.

The engine declarations are:

| Declaration | Meaning |
| --- | --- |
| `data-scope` | A surface whose components share attention. |
| `data-cmp` | A component whose state is written to `data-state`. |
| `data-tool` | A component's tool, hidden at rest and shown on hover or focus. |
| `data-hold` | Expanded content keeps focus and peer dimming after pointer leave, until an outside click or Esc. |
| `data-lock` | Components claim the whole surface; the next waits for the shared attention-lock release. |
| `data-live` | A component without a control still changes on pointer entry or click. |
| `data-dim="none"` | This surface opts out of peer dimming. |
| `data-keep` | A press remains inside the component's focus scope. |
| `data-nofocus` | The component responds to hover but does not take focus. |
| `data-passive` | The component receives peer dimming without taking hover or focus. |

Constructed HTML example, after loading core styles and the module:

```html
<section data-scope="dashboard">
  <article class="card" data-cmp>
    <h2>Tasks</h2>
    <button data-tool>Open</button>
  </article>
  <article class="card" data-cmp data-nofocus>
    <h2>Summary</h2>
  </article>
</section>
```

The button makes the first card interactive. After the shared intent delay, the engine gives that card `ux-hover`, shows its tool and dims its peer. The second card is display-only: its hover adds depth without dimming the first card or taking focus. `data-hold` is reserved for a component whose click actually expands content or occupies space. See [UI rules 6–8](../core/rules/UI-RULES.md) for the state and lock conditions.

Template code calls shared functions, such as `UX.sortable` for a sortable list, rather than reproducing the mechanism in framework handlers.

## Shared reference content

Reference samples show the same texts, rows, cards and gallery items in every template. Their data lives as JSON in `core/content/`. A template reads that content instead of keeping a stack-specific dataset.

When a second template first renders a sample, move that sample's embedded HTML-script data into `core/content/`, and switch the HTML template to the shared data in the same change. This is the migration condition, not a permanent exception for duplicate datasets. The gallery's existing source is `core/content/assets/gallery/manifest.json`; `core/build.py` exposes its derived data as `core/dist/gallery.json`.

## Consuming the template in a project

A project references this repository through a git submodule or another path reference. Updating the reference is how the project receives a design change. Publishing packages later changes delivery, not design ownership.

For the submodule example below, run this exact command from the consuming project's root:

```sh
git submodule add https://github.com/SevenX77/ui-ux-template.git vendor/ui-ux-template
```

The consuming project then reads these locations:

| Consumer | Referenced paths under the project root |
| --- | --- |
| Plain HTML | `vendor/ui-ux-template/core/dist/tokens.css`, the five `vendor/ui-ux-template/core/styles/*.css` files, and `vendor/ui-ux-template/core/behavior/ux.js`; rendering examples are in `vendor/ui-ux-template/templates/html/`. |
| React | The same core CSS and `vendor/ui-ux-template/core/behavior/ux.js` as an ES module; the React rendering source is under `vendor/ui-ux-template/templates/react/`. |
| Coding agents | `vendor/ui-ux-template/AGENTS.md`, `docs/ARCHITECTURE.md` and `core/rules/` within that reference. |

For example, with the consuming project's root served as the web root, HTML loads tokens from `/vendor/ui-ux-template/core/dist/tokens.css` and imports the engine from `/vendor/ui-ux-template/core/behavior/ux.js`. [The HTML guide](../templates/html/README.md) shows the complete wiring.

Constructed React-side imports from a consuming project's `src/ui-core.ts`:

```ts
import '../vendor/ui-ux-template/core/dist/tokens.css';
import '../vendor/ui-ux-template/core/styles/base.css';
import '../vendor/ui-ux-template/core/styles/scenes.css';
import '../vendor/ui-ux-template/core/styles/more.css';
import '../vendor/ui-ux-template/core/styles/sf.css';
import '../vendor/ui-ux-template/core/styles/data.css';
import {UX} from '../vendor/ui-ux-template/core/behavior/ux.js';
```

These paths identify the referenced core, not a new React component API. The React template's README supplies its component entry points and starter usage. The project build must be configured to read the referenced files; the relative imports above are not a promise about every project's TypeScript or bundler configuration.

A project's code uses tokens, styles and behaviour. Its agents read the rules. A claude.ai design system is needed only for mockups made on claude.ai, not for using these files. If added, that mockup system is generated from `core/tokens/themes.json` rather than maintained separately.

## Adding a design element

1. Define the element's tokens, styles or behaviour in `core/`, according to what the element changes. This keeps design ownership shared. For example, a theme belongs in `core/tokens/themes.json`.
2. Add its working reference sample to the HTML handbook source in `templates/html/src/`. This makes the design observable.
3. State its design rule in `core/rules/UI-RULES.md`, using the vocabulary in `core/rules/TERMS.md`. Every rule has a working sample.
4. Render the element in each stack template using that same core. Shared sample data goes into `core/content/` under the extraction condition above.
5. Run the core, template and applicable parity checks below. A core change is checked against all affected templates, not only the stack that motivated it.

Record a structural decision in `docs/decisions/NNNN-*.md` before structural work starts, so the intended boundary and acceptance can be read before implementation.

## Adding a stack template

Create `templates/<stack>/` as a reader of core. Ship all four required results:

1. **README:** installation and use, rendered reference samples, and samples not yet ported.
2. **Starter:** the smallest working page that loads core and declares its components correctly.
3. **Reference samples:** the same content and design as the corresponding HTML samples.
4. **Parity check:** a script comparing those samples with `templates/html/ui-handbook.html`.

A parity check fixes theme, language and viewport on both renderings. It checks computed styles, section screenshots and interaction timings. Decision 0009's acceptance specifies all six themes, both languages, 1440×1080 and 390×844, size tolerance within 1px, per-section pixel-difference reporting and the required interaction checks. A successful build alone is not parity evidence.

The templates are HTML and React 18 + TypeScript + Vite. The current React handbook renders page chrome and all 16 sections, in the HTML order. Navigation and phone embedding stay in React; no HTML fallback remains. Decision 0017 extends the historical seven-section version-1 boundary in decision 0009. Its dated record separates implementation from the actual full384 parity, HTML-preservation results and remaining limits. A real-phone check remains outside acceptance.

Pure sample policies, arithmetic, geometry and stack-neutral drawing live in `core/behavior/` (`story-forge.js`, `canvas.js`, `maps.js`, `agents.js`, `more.js`, `daily.js`). Both stacks read these and `core/content/`. Adapters own DOM/input, React state or HTML rendering, measurements, canvas/RAF/interval lifetimes and cleanup, using timings from core. The React locale bootstrap preserves the source-language first layout before committing the requested locale; it does not normalize native quirks.

## Build and check commands

From the repository root:

```sh
python3 core/build.py
python3 core/build.py --check
python3 -I templates/html/src/build.py
```

The first command writes `core/dist/`; the second checks that the generated files match their sources; the third rebuilds `templates/html/ui-handbook.html` from core and HTML source. Keep source edits in the owning layer, then regenerate outputs.

Inside `templates/react`, the React template provides:

```sh
npm install
npm run dev
npm run build
npm run parity
```

These React commands are the required template interface. `npm run parity` writes `templates/react/parity/report.md`.

## Protected rules and prohibited changes

Each prohibition protects the positive rule immediately before it.

- **Read core by reference.** A template's build or imports read `core/`. **Prohibited:** copying a core source into `templates/`, pasting repository files into a consuming project, or making `core/` import from a template.
- **Keep design facts in core.** Add missing design to core, its handbook sample and its rule before rendering it in templates. **Prohibited:** template-local colour, size, radius, shadow, easing, duration, spacing or interaction-timing values.
- **Use one behaviour engine.** Declare components and call `core/behavior/ux.js`. **Prohibited:** another implementation of intent delay, dimming, lock, focus, drag or the selector indicator in a template.
- **Compare shared content.** Move a sample's data into `core/content/` when its second template is introduced and switch HTML in that same change. **Prohibited:** independently maintained sample datasets after that extraction point.
- **Generate derived files from their owners.** Edit token and dictionary sources, then run `python3 core/build.py`; edit handbook sources, then run its build. **Prohibited:** maintaining `core/dist/` or `templates/html/ui-handbook.html` by hand instead of regenerating them.
- **Keep shared agent instructions in `AGENTS.md`.** `CLAUDE.md` imports that file and holds only Claude Code-specific setup. **Prohibited:** a second copy of shared agent rules in `CLAUDE.md` or a conflicting template-specific architecture.
