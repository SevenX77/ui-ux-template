/** The one browser every parity script measures with (decision 0018).
 * Policy: Playwright's own Chromium build, fixed by the playwright-core version in
 * package-lock.json. A script's --chrome option or CHROME_EXECUTABLE overrides it for one run;
 * each run records the path and version it used. */
import {stat} from 'node:fs/promises';
import {chromium} from 'playwright-core';

export function browserPath(override) {
  return override || process.env.CHROME_EXECUTABLE || chromium.executablePath();
}

export async function requireBrowser(override) {
  const file = browserPath(override);
  try { await stat(file); }
  catch { throw new Error(`Parity browser not found at ${file}. Inside templates/react run: npx playwright-core install chromium`); }
  return file;
}
