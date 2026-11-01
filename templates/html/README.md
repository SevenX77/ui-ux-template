# HTML template

Purpose: a plain HTML project can render the shared design, and every other stack has an original rendering against which to check fidelity.

`templates/html/` owns handbook composition and HTML-specific state wiring. Tokens, styles, behaviour, language support and reference content come from `core/`. See [the architecture](../../docs/ARCHITECTURE.md) for the full boundary.

## Files

- `src/01-found.html`, `src/02-work.html`, `src/03a-agents.html`, `src/04-more.html` and `src/03-apps.html`: the handbook page fragments, read in that order by the build.
- `src/app1.js` through `src/app4.js`, `src/sf.js` and `src/data.js`: handbook application and sample wiring.
- `src/build.py`: assembles core and these HTML sources into the handbook.
- `ui-handbook.html`: the generated, self-contained reference rendering. Its build inlines core CSS, the dictionary, the behaviour engine and reference images. The build also emits external font stylesheet links.

The starter and parity check are required template deliverables under [decision 0009](../../docs/decisions/0009-design-core-and-stack-templates.md). This guide does not assign them filenames or claim their implementation is complete.

## Build

From the repository root:

```sh
python3 core/build.py
python3 core/build.py --check
python3 -I templates/html/src/build.py
```

The core build writes `core/dist/`, and `--check` verifies those generated outputs. The HTML build reads core sources and core build functions, strips the core modules' final ES export lines, and inlines classic scripts in `templates/html/ui-handbook.html`.

Edit `src/` for HTML composition or the appropriate file in `core/` for design changes, then rebuild. The generated handbook is an output, not a separately maintained source.

## Wiring a plain HTML project

Use a submodule or another path reference rather than pasting repository files into the project. From the consuming project's root:

```sh
git submodule add https://github.com/SevenX77/ui-ux-template.git vendor/ui-ux-template
```

Constructed page example, with that project root served as the web root:

```html
<!doctype html>
<html lang="en" data-scheme="pure">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project</title>
  <link rel="stylesheet" href="/vendor/ui-ux-template/core/dist/tokens.css">
  <link rel="stylesheet" href="/vendor/ui-ux-template/core/styles/base.css">
  <link rel="stylesheet" href="/vendor/ui-ux-template/core/styles/scenes.css">
  <link rel="stylesheet" href="/vendor/ui-ux-template/core/styles/more.css">
  <link rel="stylesheet" href="/vendor/ui-ux-template/core/styles/sf.css">
  <link rel="stylesheet" href="/vendor/ui-ux-template/core/styles/data.css">
</head>
<body>
  <main data-scope="project">
    <article class="card" data-cmp>
      <h1>Tasks</h1>
      <button data-tool>Open</button>
    </article>
  </main>
  <script type="module">
    import {UX} from '/vendor/ui-ux-template/core/behavior/ux.js';
    // Engine import installs shared interaction handling for the declarations.
    // Use UX methods for shared mechanisms such as sortable lists.
  </script>
</body>
</html>
```

`core/dist/tokens.css` supplies theme tokens. The five core stylesheets supply the shared design. `data-scheme` selects `pure`, `neon`, `prism`, `aurora`, `paper` or `ember`; setting it changes the theme without component-specific theme rules. The engine reads `data-scope`, `data-cmp` and `data-tool` and owns interaction state. Use the remaining declarations according to [the behaviour binding guide](../../docs/ARCHITECTURE.md#binding-a-template-to-the-behaviour-engine) and [UI rules](../../core/rules/UI-RULES.md).

Serve the page and referenced files over HTTP so the browser can load the ES module. The absolute URLs above assume the stated web root; adjust only the reference prefix when the project serves a different base path. Reference page and script examples live in `vendor/ui-ux-template/templates/html/src/`; the built handbook is `vendor/ui-ux-template/templates/html/ui-handbook.html`.

A page that uses shared translations imports `LANG`, `tr` and `useDictionary` from `core/i18n/i18n.js` at the same reference prefix and supplies `core/dist/dictionary.json` to `useDictionary(d)`. Shared reference samples read their content from `core/content/`, with the same derived gallery data in `core/dist/gallery.json`.

## Reference and checks

The handbook is the HTML reference for other templates. Its samples include the version-1 React targets: page chrome, `#schemes`, `#shape`, `#controls`, `#dash`, `#work`, `#table` and `#gallery`. [Decision 0009](../../docs/decisions/0009-design-core-and-stack-templates.md#acceptance) defines the full theme, language, viewport, computed-style, screenshot and interaction acceptance.

After a change, rebuild and check the handbook for console errors and preserved hover, dim, lock, theme switch, language switch and kanban drag. Building the file is not proof that these checks passed.
