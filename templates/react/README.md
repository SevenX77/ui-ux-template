# React template

React 18, TypeScript and Vite render the original design core. This directory owns rendering and application state. Tokens, the five stylesheets, the interaction engine, dictionary, assets and sample content remain in `../../core`. Do not copy them into a project or add design values here.

## Run

```sh
cd templates/react
npm install
npm run dev -- --port 5179 --strictPort --host 127.0.0.1
npm run build
npm run preview
```

Open `/` for the handbook and `/starter.html` for the smallest page. Both `dev` and `build` first check that `core/dist` is current. If it is stale, run `python3 core/build.py` from the repository root, then review the generated changes.

The starter has one light/dark theme-pair switch and one scope with two cards. `templates/html/starter.html` is the plain HTML equivalent.

## Use from another project

Keep a path reference, for example a git submodule:

```sh
git submodule add https://github.com/SevenX77/ui-ux-template.git vendor/ui-ux-template
npm install react@18 react-dom@18
```

Import the public binding from the referenced source, not copied files. For a project whose component is `src/App.tsx`:

```tsx
import {
  UIProvider, Scope, Component, useTheme, useLanguage,
} from '../vendor/ui-ux-template/templates/react/src/ui';

function Page() {
  const {togglePair} = useTheme();
  const {t} = useLanguage();
  return <Scope name="project">
    <Component className="card">
      <button className="btn" onClick={togglePair}>{t('主题')}</button>
    </Component>
  </Scope>;
}

export default function App() {
  return <UIProvider><Page /></UIProvider>;
}
```

Configure the consuming Vite project so `@core` resolves to `vendor/ui-ux-template/core`. Allow that repository path in `server.fs.allow`. Its TypeScript configuration must also map `@core/*` to that core path, enable JSON imports and allow the JavaScript core modules. Use this template's `vite.config.ts` and `tsconfig.json` as the reference. Run the referenced `core/build.py --check` before your own dev/build commands.

Importing `src/ui` loads the generated tokens, all five original stylesheets and the asset URL variables. `UIProvider` installs theme pairs and Chinese-source-string translation through the core dictionary. The public entry also exports `Segmented`, `Tool`, `useSortable`, `useIntent`, `useIndicators`, `toast`, `openModal`, `closeModal`, `ModalHost`, and `ToastHost`. Mount the two hosts if your project uses those overlays.

`Segmented` renders its own first `.seg-ind`. It accepts either `options`/`value`/`onChange`, or native div props with button children. The core engine, not React code, moves the indicator.

`useSortable(ref, options, dependencies)` binds the one core sorter. With `commit(order)`, the engine restores React's original DOM before returning an array of `{zone, items}`. Convert the element identities to your model IDs and update state. `on()` can update live preview counts during a drag. The hook cleans up when its effect unmounts.

Chinese source strings go through `useLanguage().t()`. Do not maintain a second English dictionary. New design or behavior belongs in core first and must keep the HTML reference working. Follow `core/rules/UI-RULES.md` and decision 0009.

## Reference samples

All 16 handbook sections render in React, in HTML order: `#terms`, `#schemes`, `#shape`, `#controls`, `#workspace` (Story Forge and motion cards), `#dash`, `#canvas`, `#maps`, `#agents`, `#more`, `#work`, `#table`, `#gallery`, `#daily`, `#values`, and `#refs`. Page chrome (`.bar`, `.rail`, `.pnav`) navigates within React. There is no HTML fallback; phone view embeds this React entry.

React owns component/application state, input, DOM measurements and drawing lifetimes. Both stacks read the same `core/content/*.json` and pure policies/geometry/drawing in `core/behavior/`. Gallery items come from `core/dist/gallery.json`. The language provider first commits the source language, then the requested locale before paint, preserving the HTML first-layout behavior.

Implementation is complete; final whole-handbook acceptance is recorded separately in [decision 0017](../../docs/decisions/0017-port-remaining-samples-to-react.md). Do not infer a full parity pass from this sample list.

## Check parity

Install Google Chrome in its normal system location. Do not download a Playwright browser.

```sh
npm run parity
```

The command builds React, then starts a repository-root static server and Vite preview. It uses `playwright-core` with the system Chrome executable. It compares all 16 sections (384 cases) under six themes, Chinese/English, and desktop/phone viewports. It pairs every element by DOM path, compares the specified computed styles (size tolerance: one pixel), saves section screenshots, reports pixel differences, and checks hover/dim/outside-click, live kanban drag, selector movement and language scroll pinning.

Read `parity/report.md` first. Zero style mismatches is the target. A reported exception is not an equivalent pass: read its explanation and effect. Screenshot differences and interaction failures are separate evidence. Raw results and screenshots are under `parity/out/` and are gitignored. A passing build alone does not establish parity. These checks do not cover a real phone. Section-own results, raw unequal pairs and remaining limits are recorded in decision 0017.
