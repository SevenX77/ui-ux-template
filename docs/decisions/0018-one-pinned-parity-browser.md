# 0018 One pinned browser for every parity script

Purpose: two parity runs on any machine can be compared with each other, because both measured HTML and React in the same browser build.

Status: established on 2026-11-05. Application state: applied and accepted on 2026-11-05 (B1–B3); see the record.

The parity scripts under `templates/react/parity/` drive a browser through `playwright-core`, which ships no browser, so each script must be told where one is. Before this decision two browsers were written into the code as file paths, each valid on one machine only:

- `check.mjs`, `motion.mjs` and `baseline.mjs` defaulted to the Mac's installed Google Chrome, `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. On Windows, without `CHROME_EXECUTABLE`, `npm run parity` failed at once with `ENOENT`.
- `story-forge.mjs`, `story-forge-supplement.mjs`, `story-forge-panel-chat-focus.mjs` and `story-forge-first-line.mjs` defaulted to `C:/Users/test/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe`, a Playwright Chromium build on one Windows account; `story-forge-material-diagnostic.mjs` required the path as an argument.

The consequence was measured on 2026-11-05. The committed report of run `2026-11-02T22-50-23-497Z` used Chromium 147.0.7727.15 (`chromium-1217`); a rerun with `CHROME_EXECUTABLE` set to installed Google Chrome used 156.0.8078.80. Its unequal screenshot pairs went from 78 to 80 and the largest `#gallery` pixel ratio from 0.9474% to 2.1459%, and nothing could tell whether the code or the browser caused the change.

## Owner record

2026-11-05: 「parity 检查脚本 为什么要写Chrome路径？」 Gloss: "Why does the parity check script write a Chrome path?" After the cause and this plan were reported: 「go」.

## Decisions

1. **Every parity script measures with Playwright's own Chromium build.** Serves: comparable runs. That build is fixed by the `playwright-core` version in `templates/react/package-lock.json`, so it is the same build on the Mac and on Windows, and it changes only through a dependency change that git records. Installed Google Chrome updates itself and would move the pixel baseline silently. On 2026-11-05 `playwright-core` 1.64.1 names revision `chromium-1248`, Chromium 156.0.8078.4.
2. **The browser is resolved in one module, and no script holds a path.** Serves: one policy for every script. `templates/react/parity/browser.mjs` resolves the browser in this order: a script's own `--chrome` option where the script has one, then `CHROME_EXECUTABLE`, then `chromium.executablePath()` from `playwright-core`. Every script calls it. A missing browser stops the run with the install command, `npx playwright-core install chromium` inside `templates/react`; there is no fallback to another machine's path.
3. **The full Chromium binary runs headless, as before.** Serves: the new baseline differs from the old one only by the browser build. Scripts keep passing an explicit executable, so Playwright does not substitute its separate headless shell.
4. **One install per machine replaces the no-download rule.** Serves: decision 1. The first line of `check.mjs` said "No browser download is used"; that rule is replaced by the one-time install of decision 2, and the comment says so.
5. **Every run records the browser it used, and the committed report is rerun on the pinned build.** Serves: a reader can see which browser a number came from. The results already record `chromeExecutable` and `browserVersion`; the report committed with this decision is a run on `chromium-1248` and becomes the new pixel baseline.

## Acceptance

- B1 (decision 2): `grep -rn "Applications/Google Chrome\|ms-playwright/chromium-" templates/react/parity/*.mjs` finds nothing.
- B2 (decisions 1, 5): `npm run parity` inside `templates/react`, with `CHROME_EXECUTABLE` unset, runs all 384 section cases and 72 chrome cases, and its `results.json` names `chromium-1248` and 156.0.8078.4.
- B3: that run shows zero computed-style and zero DOM or content differences and passes every interaction set, as the run of 2026-11-02 did; its pixel counts are recorded below as the new baseline.

## Boundaries

This decision changes how the parity scripts find a browser and nothing they measure. Fonts still differ between operating systems, so a pixel baseline is comparable on one operating system; a cross-system pixel comparison is outside this decision.

## Record

2026-11-05, applied. `parity/browser.mjs` resolves the browser for `check.mjs`, `baseline.mjs`, `motion.mjs` (through `check.mjs`), `story-forge.mjs`, `story-forge-supplement.mjs`, `story-forge-panel-chat-focus.mjs`, `story-forge-first-line.mjs` and `story-forge-material-diagnostic.mjs`, whose Chrome argument is now optional. B1: the grep finds nothing. `npx playwright-core install chromium` installed `chromium-1248` and removed the unused `chromium-1217` from this machine.

B2 and B3: run `2026-11-05T11-08-57-571Z`, with `CHROME_EXECUTABLE` unset, used `C:\Users\test\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`, 156.0.8078.4. It ran 384 section cases and 72 chrome cases with 0 computed-style, 0 structure and 0 meaningful DOM differences, 0 case errors, and 48 of 48 interaction sets, 432 of 432 canvas checks and 864 of 864 workspace motion checks. New pixel baseline: 79 screenshot pairs have unequal raw pixels and 77 stay unequal under nearest-neighbour sampling; the per-section figures are in `templates/react/parity/report.md`. `allChecksPass` stays false on strict pixels, as in decision 0017.

Comparison of the three runs: Chromium 147.0.7727.15 (2026-11-02) gave 78 and 73 unequal pairs and a largest `#gallery` ratio of 0.9474%; Chromium 156.0.8078.4 gives 79, 77 and 0.9481%; installed Google Chrome 156.0.8078.80 gave 80, 80 and 2.1459%. The installed Chrome moved the gallery figure most, although it shares a major version with the pinned build, which is the drift decision 1 removes.
