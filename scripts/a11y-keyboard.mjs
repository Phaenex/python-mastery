#!/usr/bin/env node
/**
 * Keyboard-only journey: can someone finish a lesson without ever touching a mouse?
 *
 * axe cannot answer this. It inspects a rendered snapshot, so it never presses a key,
 * never discovers that a control swallows Tab, and never finds out that the way out of
 * a text editor does not exist. The trap this script was written for was invisible to
 * 59 clean axe scans: the challenge editor called preventDefault() on every Tab and
 * every Shift+Tab, so a keyboard user who reached it could not leave it by any means
 * and had to reload the page. That is WCAG 2.1.2, Level A, and only a real key press
 * finds it.
 *
 *   node scripts/a11y-keyboard.mjs                     against production
 *   node scripts/a11y-keyboard.mjs http://localhost:3010
 *
 * Everything here is driven by keyboard.press(). The one click in the file is the tab
 * switch that sets up the challenge view, and it is marked.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';
const LESSON = '/learn/ai-python/embeddings';

const failures = [];
const passes = [];
function check(ok, name, detail = '') {
  (ok ? passes : failures).push(detail ? `${name} — ${detail}` : name);
  process.stdout.write(ok ? '\x1b[32m.\x1b[0m' : '\x1b[31mF\x1b[0m');
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const active = () => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'BODY', name: '(body)', id: '' };
  const name =
    el.getAttribute('aria-label') ||
    (el.innerText || '').trim().slice(0, 40) ||
    '(no name)';
  return { tag: el.tagName, name: String(name).replace(/\s+/g, ' '), id: el.id || '' };
});

await page.goto(BASE + LESSON, { waitUntil: 'networkidle', timeout: 90000 });

// Pyodide gates the editor: while it loads the textarea is disabled and therefore not
// in the tab order at all, so testing before it is ready would test nothing.
const run = page.locator('button').filter({ hasText: /^run$/i }).first();
await run.waitFor({ state: 'visible', timeout: 120000 });
let ready = false;
for (let i = 0; i < 90; i++) {
  if (await run.isEnabled()) { ready = true; break; }
  await page.waitForTimeout(2000);
}
check(ready, 'Pyodide becomes ready', ready ? '' : 'run button never enabled; nothing below was measured');
if (!ready) {
  console.log('\n\x1b[31m  BROKEN RUN: Pyodide never loaded, so no keyboard journey ran.\x1b[0m');
  await browser.close();
  process.exit(2);
}

// The only pointer event in this file: reach the challenge view. Everything the journey
// actually asserts happens by key press below.
await page.locator('a,button').filter({ hasText: /challenges/i }).first().click();
await page.waitForTimeout(800);

/**
 * The editor must be escapable in both directions, and must say so.
 *
 * Run against every surface that mounts CodeEditor rather than one of them: the fix is
 * shared, but "shared" is a claim about the source, not evidence about the page, and a
 * wrapper can re-break it by handling keys above the textarea.
 */
async function checkEditorEscapes(where) {
  const editor = page.locator('textarea').first();
  if (!(await editor.count())) {
    check(false, `[${where}] editor is present`, 'no textarea found on this surface');
    return;
  }
  await editor.focus();

  await page.keyboard.press('Tab');
  const stillIn = await active();
  check(stillIn.tag === 'TEXTAREA', `[${where}] Tab still indents inside the editor`,
    stillIn.tag === 'TEXTAREA' ? '' : 'Tab left the editor, so indenting is broken');

  await editor.focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  const out = await active();
  check(out.tag !== 'TEXTAREA', `[${where}] Escape then Tab moves focus forward out`,
    out.tag !== 'TEXTAREA' ? `landed on ${out.tag} "${out.name}"` : 'KEYBOARD TRAP: focus never left');

  await editor.focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+Tab');
  const back = await active();
  check(back.tag !== 'TEXTAREA', `[${where}] Escape then Shift+Tab moves focus backward out`,
    back.tag !== 'TEXTAREA' ? `landed on ${back.tag} "${back.name}"` : 'KEYBOARD TRAP: focus never left backward');

  // The way out is useless if it is a secret. WCAG 2.1.2 requires the user be told.
  const described = await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    const id = ta?.getAttribute('aria-describedby');
    if (!id) return null;
    return document.getElementById(id)?.textContent?.trim() || null;
  });
  check(
    !!described && /escape/i.test(described),
    `[${where}] editor advertises the escape hatch to assistive tech`,
    described ? `describedby: "${described}"` : 'textarea has no aria-describedby explaining how to leave',
  );
}

await checkEditorEscapes('lesson challenge');

const editor = page.locator('textarea').first();

// --- run code with the keyboard only, and confirm the result is announced ---
// Select-all is Meta+A on macOS; Control+A there is "move to start of line", which
// silently inserts at position 0 instead of replacing and produced a SyntaxError.
const SELECT_ALL = process.platform === 'darwin' ? 'Meta+a' : 'Control+a';
await editor.focus();
await page.keyboard.press(SELECT_ALL);
// The editor auto-closes brackets and quotes and restores the caret in a setTimeout,
// so instant synthetic typing outruns it and scrambles the text. A human types slower
// than this delay; it exists to stop the test lying, not to paper over a user-facing bug.
await page.keyboard.type('print("keyboard only")', { delay: 30 });
await page.keyboard.press('Control+Enter');

// Assert against the output panel, never document.body: the syntax-highlight overlay
// renders the typed code as page text, so a body-wide search matches the code the test
// just typed and passes without Python having run at all.
let sawOutput = false;
for (let i = 0; i < 40; i++) {
  const panel = await page.evaluate(() => document.querySelector('.output-content')?.innerText || '');
  if (/keyboard only/.test(panel)) { sawOutput = true; break; }
  await page.waitForTimeout(1000);
}
const finalPanel = await page.evaluate(() => (document.querySelector('.output-content')?.innerText || '').slice(0, 120).replace(/\s+/g, ' '));
check(sawOutput, 'Code runs via Ctrl+Enter without a pointer',
  sawOutput ? '' : `output panel never showed the result — panel read: "${finalPanel}"`);

// A result a screen reader is never told about is a result the user does not have.
const liveOk = await page.evaluate(() => {
  const el = document.querySelector('.output-content');
  if (!el) return { found: false };
  return {
    found: true,
    live: el.getAttribute('aria-live'),
    role: el.getAttribute('role'),
    focusable: el.tabIndex >= 0,
  };
});
check(liveOk.found && (liveOk.live === 'polite' || liveOk.role === 'status'),
  'Output panel is a live region', liveOk.found ? `role=${liveOk.role} aria-live=${liveOk.live}` : 'output panel not found');
check(liveOk.found && liveOk.focusable,
  'Output panel is keyboard reachable so it can be scrolled', liveOk.focusable ? '' : 'not focusable');

// The in-progress state has to be announced too, or Run is silent for several seconds.
const runningAnnounced = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter((s) => /Running/i.test(s.textContent || ''));
  const host = spans[0]?.closest('[role="status"], [aria-live]');
  // Nothing is running right now, so assert the container that *would* hold it is a
  // persistent live region rather than one conjured at announce time.
  const header = document.querySelector('.output-panel [role="status"], .output-panel [aria-live]');
  return { hasHostWhenRunning: !!host, hasPersistentRegion: !!header };
});
check(runningAnnounced.hasPersistentRegion,
  'Run-in-progress status sits in a persistent live region',
  runningAnnounced.hasPersistentRegion ? '' : '"Running..." is outside any live region; screen readers stay silent during execution');

// --- every focus stop must be visible and named ---
await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
const stops = [];
for (let i = 0; i < 30; i++) {
  await page.keyboard.press('Tab');
  const d = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const name =
      el.getAttribute('aria-label') ||
      (el.innerText || '').trim() ||
      el.getAttribute('title') || '';
    // A focus ring can come from outline or from a ring/box-shadow, and it is legitimate
    // for it to sit on a wrapper rather than the focused node itself — the code editor
    // draws it on the container so it encloses the line-number gutter too. So walk up a
    // few levels before calling focus invisible.
    const visible = (node) => {
      const s = getComputedStyle(node);
      return s.outlineStyle !== 'none' || (s.boxShadow !== 'none' && s.boxShadow !== '');
    };
    let ring = visible(el);
    let hop = el.parentElement;
    for (let d = 0; d < 3 && hop && !ring; d++, hop = hop.parentElement) ring = visible(hop);

    return { tag: el.tagName, named: !!name.trim(), ring };
  });
  if (!d) break;
  stops.push(d);
  if (d.tag === 'TEXTAREA') { await page.keyboard.press('Escape'); }
}
const unnamed = stops.filter((s) => !s.named);
const unringed = stops.filter((s) => !s.ring);
check(stops.length > 5, 'Tab reaches a real sequence of controls', `${stops.length} stops`);
check(unnamed.length === 0, 'Every focus stop has an accessible name',
  unnamed.length ? `${unnamed.length} unnamed (${unnamed.map((u) => u.tag).join(', ')})` : '');
check(unringed.length === 0, 'Every focus stop shows a focus indicator',
  unringed.length ? `${unringed.length} without a visible ring (${unringed.map((u) => u.tag).join(', ')})` : '');

// --- the other surface that mounts the same editor ---
// ProjectView/ProjectChallengeBlock render CodeEditor through a different wrapper, so a
// pass on the lesson page is evidence about the lesson page and nothing else.
try {
  await page.goto(BASE + '/projects/ai-doc-assistant', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  // The project surface labels its button "run & check", not "run".
  const projRun = page.locator('button').filter({ hasText: /^run\b/i }).first();
  await projRun.waitFor({ state: 'visible', timeout: 120000 });
  let projReady = false;
  for (let i = 0; i < 90; i++) {
    if (await projRun.isEnabled()) { projReady = true; break; }
    await page.waitForTimeout(2000);
  }
  check(projReady, '[project] Pyodide becomes ready',
    projReady ? '' : 'run button never enabled; the project editor checks did not run');
  if (projReady) await checkEditorEscapes('project');
} catch (e) {
  check(false, '[project] page reachable for keyboard checks', e.message.split('\n')[0].slice(0, 70));
}

await browser.close();

console.log(`\n\n\x1b[1mkeyboard-only journey · ${passes.length + failures.length} checks\x1b[0m`);
for (const p of passes) console.log(`  \x1b[32m✓\x1b[0m ${p}`);
for (const f of failures) console.log(`  \x1b[31m✗\x1b[0m ${f}`);
console.log(`\n  ${passes.length} passed · ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
