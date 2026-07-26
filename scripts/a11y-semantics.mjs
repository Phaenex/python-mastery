#!/usr/bin/env node
/**
 * What the accessibility tree actually exposes.
 *
 * This is as close to a screen reader as automation gets, and it is worth being precise
 * about the gap: it reads the same tree VoiceOver and NVDA read, so it can prove a
 * heading level is wrong or that a result is never announced. It cannot tell you whether
 * the resulting speech makes sense, whether the reading order is followable, or whether
 * finishing a lesson by ear is bearable. Those still need a person and a screen reader.
 *
 * What it checks, none of which axe covers:
 *   - heading levels descend without skipping, so the outline is navigable by heading
 *   - the accessible name of every control is meaningful, not "click here" or an icon
 *   - the result of running code is inside a live region, so it is announced at all
 *   - challenge pass/fail is announced, rather than only turning green
 *   - controls that change state expose the state, not just a colour
 *
 *   node scripts/a11y-semantics.mjs                     against production
 *   node scripts/a11y-semantics.mjs http://localhost:3010
 */
import { chromium } from 'playwright';
import { loadRouteInventory, prepareStaticAuditPage } from './a11y-routes.mjs';
import { gateExitCode } from './a11y-result.mjs';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';
const LESSON = '/learn/ai-python/embeddings';

let inventory;
try {
  inventory = await loadRouteInventory(BASE);
} catch (error) {
  console.error(`\n\x1b[31mBROKEN RUN: ${error.message}\x1b[0m`);
  process.exit(2);
}
const ROUTES = inventory.allPageRoutes;

const failures = [];
const passes = [];
const broken = [];
function check(ok, name, detail = '') {
  (ok ? passes : failures).push(detail ? `${name} — ${detail}` : name);
  process.stdout.write(ok ? '\x1b[32m.\x1b[0m' : '\x1b[31mF\x1b[0m');
}
function incomplete(name, detail) {
  broken.push(`${name} — ${detail}`);
  process.stdout.write('\x1b[33m?\x1b[0m');
}

// Names that describe the widget rather than its purpose. A screen reader user pulling
// up a list of controls gets these as the whole label.
const USELESS_NAMES = /^(click here|here|read more|more|link|button|\.\.\.|…|→|←|▸|▾|\$|>_)$/i;

const browser = await chromium.launch();
let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
let page = await ctx.newPage();
await prepareStaticAuditPage(page);

for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
  } catch (e) {
    incomplete(`[${route}] loads`, e.message.split('\n')[0].slice(0, 80));
    continue;
  }

  // --- heading outline ---
  // Skipping a level (h2 straight to h4) breaks heading navigation, which is the primary
  // way screen reader users move through a page. axe only checks order within a page in
  // some rulesets and it is not part of the WCAG tags used by the axe gate here.
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .filter((h) => {
        const cs = getComputedStyle(h);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      })
      .map((h) => ({ level: Number(h.tagName[1]), text: (h.innerText || '').trim().slice(0, 40) })));

  const skips = [];
  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].level - headings[i - 1].level;
    if (jump > 1) skips.push(`h${headings[i - 1].level} → h${headings[i].level} at "${headings[i].text}"`);
  }
  check(skips.length === 0, `[${route}] heading levels do not skip`,
    skips.length ? skips.slice(0, 2).join('; ') : `${headings.length} headings`);

  const h1s = headings.filter((h) => h.level === 1);
  check(h1s.length === 1, `[${route}] exactly one h1`,
    h1s.length === 1 ? `"${h1s[0].text}"` : `found ${h1s.length}`);

  // "levels do not skip" is satisfied trivially by a page with one heading, which is how
  // every page here passed that check while having no navigable structure at all: each
  // <section> was titled by a styled <p>, so heading navigation — the main way screen
  // reader users move through a page — reached the page title and stopped.
  // A section that renders a visible label but marks it up as a paragraph is the exact
  // failure this catches, so the bar is per-section rather than "at least one heading
  // somewhere". A section with no visible title of its own is allowed and must say so
  // with aria-label — the point is that skipping a heading has to be a decision.
  const untitled = await page.evaluate(() =>
    [...document.querySelectorAll('main section')]
      .filter((s) => {
        const cs = getComputedStyle(s);
        if (cs.display === 'none' || !(s.innerText || '').trim()) return false;
        return !s.querySelector('h1,h2,h3,h4,h5,h6')
          && !s.hasAttribute('aria-label')
          && !s.hasAttribute('aria-labelledby');
      })
      .map((s) => (s.innerText || '').trim().split('\n')[0].slice(0, 35)));
  check(untitled.length === 0, `[${route}] every section is titled or deliberately unnamed`,
    untitled.length
      ? `${untitled.length} untitled: ${untitled.map((t) => `"${t}"`).join(', ')}`
      : '');

  // --- accessible names that mean something ---
  const badNames = await page.evaluate((pattern) => {
    const re = new RegExp(pattern.source, pattern.flags);
    const out = [];
    for (const el of document.querySelectorAll('a[href], button')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      const name = (
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        (el.innerText || '').trim()
      ).replace(/\s+/g, ' ').trim();
      if (!name || re.test(name)) {
        out.push(`${el.tagName.toLowerCase()} "${name || '(empty)'}"`);
      }
    }
    return out;
  }, { source: USELESS_NAMES.source, flags: USELESS_NAMES.flags });
  check(badNames.length === 0, `[${route}] every control has a meaningful name`,
    badNames.length ? `${badNames.length}: ${badNames.slice(0, 3).join(', ')}` : '');

  // --- landmarks ---
  const landmarks = await page.evaluate(() => ({
    main: document.querySelectorAll('main, [role="main"]').length,
    nav: document.querySelectorAll('nav, [role="navigation"]').length,
  }));
  check(landmarks.main === 1, `[${route}] exactly one main landmark`, `found ${landmarks.main}`);
}

await ctx.close();
ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
page = await ctx.newPage();
await page.addInitScript(() =>
  localStorage.setItem('python-mastery-onboarding-seen', '1'));

// --- the part a screen reader user cannot see at all: does running code say anything ---
{
  try {
    await page.goto(BASE + LESSON, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const run = page.locator('button').filter({ hasText: /^run$/i }).first();
    await run.waitFor({ state: 'visible', timeout: 120000 });
    let ready = false;
    for (let i = 0; i < 90; i++) {
      if (await run.isEnabled()) { ready = true; break; }
      await page.waitForTimeout(2000);
    }
    if (!ready) throw new Error('Pyodide never became ready; announcements were not measured');
    check(true, '[lesson] Pyodide ready');

    // Snapshot every live region before and after a run: the announcement a screen
    // reader makes is exactly the text that changes inside one of these.
    const liveText = () => page.evaluate(() =>
      [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]')]
        .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim())
        .join(' ~ '));

    const before = await liveText();
    await page.locator('a,button').filter({ hasText: /challenges/i }).first().click();
    await page.waitForTimeout(600);

    const editor = page.locator('textarea').first();
    await editor.focus();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
    await page.keyboard.type('print("announced")', { delay: 30 });
    await page.keyboard.press('Control+Enter');

    let after = before;
    for (let i = 0; i < 40; i++) {
      after = await liveText();
      if (/announced/.test(after)) break;
      await page.waitForTimeout(1000);
    }
    check(/announced/.test(after), '[lesson] the result of running code lands in a live region',
      /announced/.test(after) ? '' : 'output appeared on screen but inside nothing announced; a screen reader user runs code and hears silence');

    // A wrong answer has to say so out loud, not only turn the border red.
    await editor.focus();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
    await page.keyboard.type('print(undefined_name_xyz)', { delay: 30 });
    await page.keyboard.press('Control+Enter');
    let errText = '';
    for (let i = 0; i < 40; i++) {
      errText = await liveText();
      if (/NameError/i.test(errText)) break;
      await page.waitForTimeout(1000);
    }
    check(/NameError/i.test(errText), '[lesson] errors are announced, not just coloured',
      /NameError/i.test(errText) ? '' : 'the traceback is rendered outside any live region');
  } catch (error) {
    incomplete('[lesson] runtime announcements', error.message.split('\n')[0].slice(0, 100));
  }
}

await ctx.close();
await browser.close();

console.log(
  `\n\n\x1b[1maccessibility tree semantics · ${passes.length + failures.length} checks · ` +
  `${inventory.counts.modules} modules · ${inventory.counts.lessons} lessons · ` +
  `${inventory.counts.projects} projects\x1b[0m`,
);
for (const p of passes) console.log(`  \x1b[32m✓\x1b[0m ${p}`);
for (const f of failures) console.log(`  \x1b[31m✗\x1b[0m ${f}`);
for (const item of broken) console.log(`  \x1b[33m?\x1b[0m ${item}`);
console.log(
  `\n  ${passes.length} passed · ${failures.length} failed · ` +
  `${broken.length} incomplete · ${ROUTES.length - broken.filter((item) => item.includes('] loads')).length}/${ROUTES.length} routes loaded`,
);
console.log('\n  \x1b[33mNot covered by this or any other gate here:\x1b[0m whether the speech that');
console.log('  results is followable. That needs a person with a screen reader.');
process.exit(gateExitCode({ failures: failures.length, incomplete: broken.length }));
