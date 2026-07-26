#!/usr/bin/env node
/**
 * Component-level keyboard operability.
 *
 * The keyboard gate walks a lesson end to end; this one goes after specific widget
 * contracts across several routes, the kind that are correct in the markup and wrong in
 * the behaviour:
 *
 *   - a control claiming aria-expanded has to actually flip it from the keyboard, and
 *     the thing it claims to control has to exist
 *   - a radiogroup has to move its selection with the arrow keys
 *   - anything that looks clickable has to be reachable by Tab, or it is mouse-only
 *   - the current page has to be marked in navigation, not merely coloured differently
 *
 *   node scripts/a11y-components.mjs                     against production
 *   node scripts/a11y-components.mjs http://localhost:3010
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';

const ROUTES = ['/', '/learn', '/projects', '/stats', '/glossary', '/review',
  '/learn/ai-python/embeddings',
  // The last lesson of a module with a checkpoint, which is the only place a radiogroup
  // renders. Without it the radiogroup check passed by never running.
  '/learn/start-here/how-to-learn-here'];

const failures = [];
const passes = [];
function check(ok, name, detail = '') {
  (ok ? passes : failures).push(detail ? `${name} — ${detail}` : name);
  process.stdout.write(ok ? '\x1b[32m.\x1b[0m' : '\x1b[31mF\x1b[0m');
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
// Returning-user state: the tour is a dialog and belongs to a11y-modals.mjs.
await page.addInitScript(() => localStorage.setItem('python-mastery-onboarding-seen', '1'));

let visited = 0;

for (const route of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
    visited += 1;
  } catch (e) {
    check(false, `[${route}] page loads`, e.message.split('\n')[0].slice(0, 60));
    continue;
  }

  // --- anything that looks clickable must be reachable ---
  // React attaches handlers by delegation, so the DOM cannot be asked "does this have an
  // onClick". cursor:pointer is the honest proxy for "the UI is telling the user this is
  // interactive", and if that element cannot be focused, the keyboard cannot use it.
  const unreachable = await page.evaluate(() => {
    const focusableSel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), label';
    const out = [];
    for (const el of document.querySelectorAll('div, span, li, p, section')) {
      const cs = getComputedStyle(el);
      if (cs.cursor !== 'pointer') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (el.closest(focusableSel)) continue;          // inside something focusable
      if (el.querySelector(focusableSel)) continue;    // wraps something focusable
      if (el.getAttribute('aria-hidden') === 'true') continue;
      out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}: "${(el.textContent || '').trim().slice(0, 30)}"`);
    }
    return out;
  });
  check(unreachable.length === 0, `[${route}] no mouse-only controls`,
    unreachable.length ? `${unreachable.length} pointer-cursor element(s) not keyboard reachable: ${unreachable.slice(0, 2).join(' | ')}` : '');

  // --- disclosures must toggle from the keyboard and control something real ---
  const expandables = await page.locator('[aria-expanded]').all();
  if (expandables.length) {
    let broken = [];
    for (const el of expandables.slice(0, 6)) {
      if (!(await el.isVisible()) || !(await el.isEnabled())) continue;
      const before = await el.getAttribute('aria-expanded');
      await el.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
      const after = await el.getAttribute('aria-expanded');
      if (before === after) {
        const label = (await el.getAttribute('aria-label')) || (await el.innerText()).trim().slice(0, 25);
        broken.push(`"${label}" stayed ${before}`);
      } else {
        await page.keyboard.press('Enter'); // put it back
        await page.waitForTimeout(250);
      }
    }
    check(broken.length === 0, `[${route}] aria-expanded controls toggle by keyboard`,
      broken.length ? broken.join('; ') : `${expandables.length} checked`);

    // aria-controls is optional, but when present it must point at something.
    const danglingControls = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-controls]')]
        .map((el) => el.getAttribute('aria-controls'))
        .filter((id) => id && !document.getElementById(id)));
    check(danglingControls.length === 0, `[${route}] aria-controls point at real elements`,
      danglingControls.length ? `dangling: ${danglingControls.join(', ')}` : '');
  }

  // --- radiogroups must respond to the arrow keys ---
  const groups = await page.locator('[role="radiogroup"]').all();
  for (const [i, group] of groups.slice(0, 2).entries()) {
    if (!(await group.isVisible())) continue;
    const radios = group.locator('input[type="radio"], [role="radio"]');
    const n = await radios.count();
    if (n < 2) continue;
    await radios.first().focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
    const movedTo = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return -1;
      const grp = el.closest('[role="radiogroup"]');
      if (!grp) return -1;
      return [...grp.querySelectorAll('input[type="radio"], [role="radio"]')].indexOf(el);
    });
    check(movedTo === 1, `[${route}] radiogroup ${i + 1} moves with ArrowDown`,
      movedTo === 1 ? '' : `focus went to index ${movedTo}, expected 1 — arrow keys are being swallowed`);
  }

  // --- navigation must say which page you are on ---
  const navMarks = await page.evaluate((r) => {
    const links = [...document.querySelectorAll('nav a[href], header a[href]')];
    const here = links.filter((a) => new URL(a.href, location.origin).pathname === r);
    return { total: links.length, here: here.length, marked: here.filter((a) => a.hasAttribute('aria-current')).length };
  }, route);
  if (navMarks.here > 0) {
    check(navMarks.marked > 0, `[${route}] current page is marked in nav`,
      navMarks.marked > 0 ? '' : 'a nav link points at this page but carries no aria-current, so it reads as just another link');
  }
}

check(visited === ROUTES.length, 'every route was reachable', `${visited}/${ROUTES.length} loaded`);

await browser.close();

console.log(`\n\n\x1b[1mcomponent keyboard contracts · ${passes.length + failures.length} checks\x1b[0m`);
for (const p of passes) console.log(`  \x1b[32m✓\x1b[0m ${p}`);
for (const f of failures) console.log(`  \x1b[31m✗\x1b[0m ${f}`);
console.log(`\n  ${passes.length} passed · ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
