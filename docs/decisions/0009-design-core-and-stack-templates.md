# 0009 One design core, separate stack templates

Purpose: the owner's interfaces keep the same look and behaviour across future projects, whatever technology stack each project uses. Every stack's rendering can be checked against the same design.

Status: established on 2026-10-31. Application state: applied on 2026-10-31. Core layout, core module changes (including `UX.sortable` `commit(order)`, cleanup returns and the shared `transitionLanguage`), HTML rewiring, shared content in `core/content/`, the React version-1 template and its parity check are in the repository. Parity result: see the dated records below; the strict pixel verdict remains open on the gallery and table pairs named in the 2026-11-01 record.

## Definitions

- **Design core** (`core/`): the stack-neutral tokens, styles, behaviour, language support, reference content and rules that define the interface. It is the only source of design facts.
- **Template** (`templates/<stack>/`): one stack's rendering of the design core, including its pages or components, application-state wiring, build, starter and reference samples. A template owns rendering, not design facts.
- **Reference samples**: the handbook's demonstrations, such as themes, shape, controls, dashboard, workspace, table and gallery. Templates render the same sample content so their results can be compared screen by screen.
- **Parity check**: a script that opens a template's reference samples and the HTML handbook under the same theme, language and viewport, then compares corresponding computed styles, screenshots and interaction timings.

## Decisions

1. **Two layers, with dependencies towards core.** `core/` owns the design. Each `templates/<stack>/` reads core through imports or its build; core never reads a template. Core files remain in core rather than being copied into templates. Styles for patterns, including scenes, Story Forge and data tables, belong to core because the same pattern needs the same design in every stack.

   Serves: one design edit reaches every stack.

   Example: the HTML build reads `core/styles/data.css`; a React data table reads that same stylesheet.

   ```text
   core/
     tokens/themes.json
     styles/base.css scenes.css more.css sf.css data.css
     behavior/ux.js
     i18n/i18n.js i18n.json
     content/assets/gallery/ and sf/
     rules/UI-RULES.md TERMS.md
     build.py
     dist/tokens.css dictionary.json gallery.json
   templates/
     html/src/
     html/ui-handbook.html
     react/
   docs/decisions/
   references/
   archive/
   ```

   Keep the generated outputs in `core/dist/` committed with core source. `python3 core/build.py --check` fails when its outputs are stale. `docs/decisions/`, `references/` and `archive/` retain their locations. The React directory is the target location for the first React template.

2. **Stack-neutral adaptation preserves behaviour.** A change that makes core usable by another stack keeps the existing appearance and behaviour identical. The core modules expose ES module exports; the HTML build removes the final export line when inlining a classic script. The dictionary is supplied through `useDictionary(d)`. `UX.paint` reasserts `ux-hover`, `ux-focus` and `ux-dim` on every paint so a framework's `className` update does not discard engine state. `revealAll(sel)` receives the page's container selector instead of owning handbook selectors.

   The React integration adds `commit(order)` to `UX.sortable` for stacks that own the Document Object Model (DOM): dropping restores the original DOM order and passes the new order to the stack's state. The language-switch transition moves from `templates/html/src/app4.js` into one core function called by both templates. It keeps the whole-page cross-fade and pins the first visible element at its screen position, as rule 17 requires.

   Serves: different rendering systems use one core without changing the experience.

   Example: `import {UX} from './core/behavior/ux.js';` reads the same engine that the HTML handbook inlines.

3. **Design additions begin in core.** A new look or behaviour is defined in core first, with a working handbook sample and its rule in `core/rules/UI-RULES.md`, then rendered by each template. Templates add no colour, size, radius, shadow, easing, duration, spacing or interaction-timing values of their own.

   Serves: design cannot drift between stacks.

   Example: a new theme is an entry in `core/tokens/themes.json`, not a colour literal in `templates/react/`.

4. **The behaviour engine has one implementation.** Templates bind to `core/behavior/ux.js` through its functions and declarations: `data-scope`, `data-cmp`, `data-tool`, `data-hold`, `data-lock`, `data-live`, `data-dim`, `data-keep`, `data-nofocus` and `data-passive`. Templates do not reimplement intent delay, dimming, lock, focus, drag or the selector indicator.

   Serves: rules 6–8, 19, 23 and 24 behave the same in every stack.

   Example: `<section data-scope="dashboard"><article class="card" data-cmp><button data-tool>Open</button></article></section>` declares an interactive component and its tool to the shared engine.

5. **Reference content is shared.** Sample texts, table rows, cards and gallery items live as JSON in `core/content/`, and every template reads that data. When a second template first renders a sample whose content is still embedded in HTML scripts, that sample's data moves to `core/content/` and the HTML template changes to read it in the same change.

   Serves: parity checks compare the same content rather than two independently maintained datasets.

   Example: `core/content/assets/gallery/manifest.json` is the gallery source read by `core/build.py`, which generates `core/dist/gallery.json`.

6. **Projects consume this repository by reference.** A project uses a git submodule or another path reference and imports core plus its stack's template from that reference. It does not paste repository files into its own tree. Later package publication changes delivery, not the two-layer architecture. Project code consumes tokens, styles and the behaviour engine; project agents consume the rule text. A claude.ai design system is optional for mockups made there; if added, it is generated from `core/tokens/themes.json` rather than maintained by hand.

   Serves: updating one reference brings a design change to a consuming project.

   Example, run from a consuming project's root:

   ```sh
   git submodule add https://github.com/SevenX77/ui-ux-template.git vendor/ui-ux-template
   ```

7. **Every template ships four things.** Each `templates/<stack>/` contains a README explaining installation, use, rendered samples and samples not yet ported; a starter showing the smallest page that wires core correctly; its reference samples; and a parity check against the HTML handbook. The HTML handbook is the reference rendering because it is the original design rendering.

   Serves: a template can be adopted and its fidelity can be checked.

   Example: `templates/html/ui-handbook.html` is the reference used by a new template's parity check.

8. **HTML and React are the first two templates.** `templates/html/` contains the existing handbook rewired to core and a starter page. `templates/react/` uses React 18, TypeScript and Vite. React version 1 renders page chrome (the top bar with theme and language switches, and the navigation rail), `#schemes`, `#shape`, `#controls`, `#dash`, `#work`, `#table` and `#gallery`. These exercise rules 1–6, 9, 10, 12, 13, 16, 17, 19 and 21–25.

   That is the historical version-1 boundary. Decision 0017 extends the current React handbook to all 16 sections, including Story Forge/motion, Canvas, Maps, Agents, More, Daily and the shared Terms/Values/Refs. The current README lists every rendered section; no navigation or phone view falls back to HTML.
   Serves: version-1 evidence keeps its original scope, while current implementation and full-handbook acceptance are recorded truthfully under decision 0017.

   Example: `npm run parity` inside `templates/react` compares the ported reference samples with the HTML handbook.

9. **Repository files carry the agent rules.** `docs/ARCHITECTURE.md` states the layers, dependency direction, change conditions, and procedures for adding a template or design element. Root `AGENTS.md` gives every coding agent the operative instruction and links to that architecture and `core/rules/UI-RULES.md`. Root `CLAUDE.md` imports `AGENTS.md` using Claude Code's import syntax, so the shared agent rules have one location.

   Serves: later development preserves the architecture regardless of which agent makes the edit.

   Example: the first line of `CLAUDE.md` is `@AGENTS.md`.

## Dated application record

2026-10-31: files were moved with `git mv`, preserving history. `src/themes.json` moved to `core/tokens/themes.json`; `src/*.css` to `core/styles/`; `src/ux.js` to `core/behavior/ux.js`; `src/i18n.*` to `core/i18n/`; `assets/` to `core/content/assets/`; root `UI-RULES.md` to `core/rules/UI-RULES.md`; and `docs/TERMS.md` to `core/rules/TERMS.md`. Handbook pages, application scripts and their build moved from `src/` to `templates/html/src/`; root `ui-handbook.html` moved to `templates/html/ui-handbook.html`.

The module exports, dictionary injection, paint-state reassertion and page-supplied reveal selectors were applied on that date. The design source records a diff check showing that the rebuilt handbook changed only in those lines. `UX.sortable`'s state-commit option and the shared language transition are work assigned to the React integration. This record is not a claim that the parity acceptance below has passed.

2026-10-31, React version 1 applied. `templates/react/parity/report.md` records: 168 section cases and 72 page-chrome cases with zero computed-style differences; 48 of 48 interaction sets pass (hover admitted at 151.8–172.3ms, peers dim to .3, outside click rests, kanban drag shows slot and live counts, theme indicator settles, language switch keeps the first visible element within 0.44px); 24 top-bar screenshot pairs identical to the pixel. 174 section screenshot pairs still differ in raw pixels. Paired element boxes differ by at most 0.73px, and the gallery case is explained by a fractional section origin (React renders fewer sections above it, so the same layout is rasterised 0.47px lower); a one-pixel shift drops that pair from 66% to 5.7% unequal pixels. Side-by-side review in the browser on 2026-10-31 (Paper theme, `#dash` at rest, hovered and expanded; `#gallery`) showed no visible difference. Open: the parity script still exits 1 on raw pixel inequality, and the remaining per-section pixel causes are not individually established.

2026-11-01, parity instrument corrected. Run `2026-11-01T20-34-53-057Z`: 0 computed-style differences (276 before), 0 DOM or content differences (480 before), 48 of 48 interaction sets. Of 216 screenshot pairs actually taken (12 rail and 12 capsule pairs have no visible box at one width each), 37 still have unequal raw pixels (211 before): 24 gallery, 12 table and 1 dashboard pair; all page-chrome pairs are identical. The strict verdict `allChecksPass` stays false.

The earlier differences had these verified causes:

- A locator screenshot of the top bar scrolled both pages by 540px. The two pages then rested in different sections, because React omits unported ones, and the rail, the capsule and the blur behind the bar all differed. Chrome is now clipped from the viewport with `#dash` behind it.
- The same section sat at a different document position on each side, which changed text, gradient and image raster; neighbours' shadows also fell inside captures. Each section is now captured with its siblings removed and its composited layers rebuilt. A control comparing one stack against itself gave zero difference in 54 of 56 pairs, so this effect is not noise.
- Infinite loops such as the skeleton shimmer were at different phases. They are now held at time 0 for the capture; their keyframes still show.
- Empty and absent `class` attributes select the same rules, so `class` now compares as a token set.
- One real React difference: the table's status button rendered its label and the following space as two text nodes, which made it 1/64px wider and shifted later buttons. `templates/react/src/samples/data.tsx` now renders one text node, as HTML does.

The remaining pairs, and what is and is not established about them:

- **Gallery, 24 pairs.** All 54 images have equal bytes and dimensions on both stacks, and tile boxes and classes are equal. Differences are inside image tiles, at most 2 channel levels in most 1440px pairs and up to 76 at 390px. Inside the full run, the nearest-neighbour recapture still differs. In a fresh page that visits only the gallery, the nearest-neighbour capture is identical (pure/en/1440 and pure/zh/390). The inferred cause is Chromium raster state left by the page's earlier history; the mechanism itself is not established.
- **Table, 12 pairs.** Six English 1440px pairs differ only inside thumbnails and become identical under nearest-neighbour sampling. Six Chinese 390px pairs also show one thumbnail, row "Score cue 25", drawn 1px apart, with an equal computed box and the same image. Its cause is not established.
- **Dashboard, 1 pair.** Six pixels at one channel level in neon/en/1440; absent from the preceding run, so it is treated as run-to-run variation.

Side-by-side review of the worst pure/zh/390 gallery area on 2026-11-01 showed the same images, crops and captions. Real touch devices and the samples outside version 1 remain unchecked.

## Acceptance

- **Structure:** the two-layer tree exists. A search of `templates/` finds no independent colour, size, radius, shadow, easing or duration values: template styling reads core through `var(--…)`. No template file duplicates a core file.
- **Build:** `python3 core/build.py --check` passes; `python3 -I templates/html/src/build.py` rebuilds the handbook; `npm run build` inside `templates/react` builds the React template.
- **HTML preservation:** the handbook opens without console errors and behaves as before. Spot checks cover hover, dim and lock on `#dash`, theme switching, language switching and kanban drag.
- **React parity:** check every ported sample under all six themes, both languages, and viewports 1440×1080 and 390×844. Corresponding elements have equal computed font, colour, background, radius, shadow and padding, with size differences within 1px. Report screenshot pixel differences per section; fix or explain every visible difference. Hover reaches `ux-hover` by 220ms and not at 60ms; peer components dim to .3; a click outside returns to rest; a dragged kanban card leaves a slot and counts update before release; the theme-switch indicator slides; and a language switch keeps the first visible element in place.
- **Limits:** these criteria do not check a real phone. Historical version-1 results cover their original seven sections; decision 0017 requires the current all16/full384 result and records its limits.

## Owner record

2026-10-31, in chat:

> 1. 我想把他做成通用的UI模版,为我以后的众多项目服务
> 2. 所以我需要多套技术栈模版, 而不是一个. 设计核心不能变, 技术栈导出的模版分开,清晰
> 3. 先做一版html 和 react的, 我需要看react的效果是否与原来的设计一致,你得帮我先检查
> 4. 把项目的这些规范写进文档和项目的claude.md 和 agents.md, 让以后的开发不要破坏架构,按照规范继续

Gloss: "1. I want to make it a general UI template serving my many future projects. 2. So I need several technology-stack templates, not one. The design core must not change; the templates exported per stack are separate and clear. 3. First make an HTML and a React version; I need to see whether React's result matches the original design, and you must check it for me first. 4. Write these project norms into the documents and the project's CLAUDE.md and AGENTS.md, so that later development does not break the architecture and continues by the norms."


2026-11-02, decision 0017 implementation: all16 sections are rendered as React components/state with shared Core content/policies. The HTML fallback import is removed; phone view uses React. Core/output metadata is 1.4.0. Section-scoped results and native defects are in decision 0017; final full384/HTML-preservation checks are pending, not implied by the expanded implementation. Earlier dated version-1 and unequal-pixel records remain historical evidence.


2026-11-02, finish-line stop: original-HTML384 has style0/DOM0, but38 screenshot pairs above measured variation (Agents12, More24, Table2), so A5 fails. Final React384 is not run under the brief's stop condition. Navigation/phone use all16 React sections; builds pass; this is not whole-port acceptance. Decision0017 contains the per-section record and next user decision.


2026-11-03, authorized finish-line continuation: caller steering5/6 permitted final React384 despite retained failed A5, followed by only12 controlled original/current HTML cases and report/stop. React run `2026-11-02T22-50-23-497Z` completed384 sections +72 chrome: style/DOM/errors0,48/48 interaction sets,1992/1992 own,432/432 Canvas and864/864 Workspace motion checks pass. Strict pixels remain false:78 raw unequal,73 nearest unequal; all names/per-section counts remain in the finish report. The command exits1, not a universal pass.

The prescribed A5 follow-up attempted12 cases, produced11 PNG pairs and qualified10 on review:4 Table pairs exact0;6 Agent/More-phone pairs unequal;2 More-desktop cases unverified due harness clock setup/ownership errors. A Table Blob-URL identity predicate was an invalid proxy; exact image/source/decoded-size evidence is recorded without changing raw metrics. More/Agents source review finds Core-extracted drawing rules equivalent for matching full state/history; Table thumbnail code and bytes are unchanged. This does not establish all38 historical excess pairs as temporal. Raw A5 remains failed and its3072 artifacts unchanged. No app changes/reruns followed. Decision0017 and `templates/react/parity/out/controlled-html-2026-11-03/report.md` contain the full record. Parent acceptance remains partial; A7’s named gap and exact `python3` capability limit remain. All owned resources closed; owner processes/Git/root README untouched. Reported and stopped.
