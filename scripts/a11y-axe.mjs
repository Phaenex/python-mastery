#!/usr/bin/env node
/**
 * Deep accessibility audit: axe-core across every route, in every mode and state.
 *
 * The hand-rolled checks in a11y-verify.mjs only find what someone thought to look for.
 * This runs the standard ruleset instead, which covers whole categories that script does
 * not touch at all: text colour contrast, accessible names, ARIA validity, form labels,
 * landmarks, duplicate ids, and language. axe finds a well-studied fraction of real
 * issues rather than all of them, so this complements manual checks and does not replace
 * them, but it is a far wider net than a list I wrote from memory.
 *
 *   node scripts/a11y-axe.mjs                     against production
 *   node scripts/a11y-axe.mjs http://localhost:3010
 *
 * Every route is scanned in dark and light, at desktop and phone width, and the lesson
 * page is additionally scanned after Pyodide is ready and after a deliberate error, since
 * those states render markup the initial paint never shows.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';

const ROUTES = [
  '/', '/start', '/learn', '/projects', '/stats', '/glossary', '/next-steps', '/review',
  '/learn/start-here/how-this-works',
  '/learn/ai-python/embeddings',
  '/learn/databases-python/sql-injection',
  '/learn/game-dev-pygame/pygame-basics',
  '/projects/ai-doc-assistant',
  '/definitely-not-a-real-page',
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const findings = new Map(); // ruleId -> { impact, help, nodes:Set, routes:Set }
const skipped = []; // { label, why } for scans that never ran
const scannedRoutes = new Set();
const titles = new Map(); // route -> document.title
const animatedText = []; // text that fades its own opacity, found by rule not by luck
let scans = 0;

async function scan(page, label) {
  scans += 1;
  const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of res.violations) {
    if (!findings.has(v.id)) {
      findings.set(v.id, { impact: v.impact, help: v.help, nodes: new Set(), routes: new Set(), helpUrl: v.helpUrl });
    }
    const f = findings.get(v.id);
    f.routes.add(label);
    for (const n of v.nodes.slice(0, 4)) f.nodes.add(n.target.join(' '));
  }
  return res.violations.length;
}

const browser = await chromium.launch();

for (const scheme of ['dark', 'light']) {
  for (const vp of [{ width: 1280, height: 900, tag: 'desktop' }, { width: 390, height: 844, tag: 'phone' }]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: scheme,
    });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      const label = `${route} [${scheme}/${vp.tag}]`;
      try {
        // Not networkidle: /projects/[slug] keeps a connection busy long enough that
        // networkidle never fired, so that route timed out and was silently skipped in
        // all four contexts while the run still printed "no violations". Load, then give
        // the network a chance to settle, but never let settling be a hard requirement.
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(600);
        const n = await scan(page, label);
        scannedRoutes.add(route);
        titles.set(route, await page.title());
        if (n) process.stdout.write('\x1b[31m.\x1b[0m');
        else process.stdout.write('\x1b[32m.\x1b[0m');
      } catch (e) {
        skipped.push({ label, why: e.message.split('\n')[0].slice(0, 80) });
        process.stdout.write('\x1b[33m?\x1b[0m');
      }
    }
    await ctx.close();
  }
}
console.log('');

// Runtime states the initial paint never shows: Pyodide ready, and a real traceback.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  try {
    const lesson = '/learn/ai-python/embeddings';
    await page.goto(BASE + lesson, { waitUntil: 'networkidle', timeout: 60000 });
    const run = page.locator('button').filter({ hasText: /^run$/i }).first();
    await run.waitFor({ state: 'visible', timeout: 120000 });
    for (let i = 0; i < 60; i++) { if (await run.isEnabled()) break; await page.waitForTimeout(2000); }
    await scan(page, `${lesson} [pyodide ready]`);

    await page.locator('textarea').first().fill('print(nope_xyz)');
    await run.click();
    for (let i = 0; i < 25; i++) {
      if (/NameError/i.test(await page.evaluate(() => document.body.innerText))) break;
      await page.waitForTimeout(1200);
    }
    await scan(page, `${lesson} [after error]`);

    // Expanded disclosure: hints and solutions are markup that only exists once opened.
    const hint = page.locator('button').filter({ hasText: /hint/i }).first();
    if (await hint.count()) {
      await hint.click();
      await page.waitForTimeout(500);
      await scan(page, `${lesson} [hint open]`);
    }
  } catch (e) {
    console.log(`  (runtime-state scan incomplete: ${e.message.slice(0, 50)})`);
  }
  await ctx.close();
}


// Nothing that carries text may animate its opacity. axe can only catch that by
// happening to sample mid-fade — it found the tool dock's label on 1 of 59 scans, and
// the same bug in the output panel's "Running..." not at all. This finds it by reading
// the rule rather than by getting lucky with timing.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  for (const route of ['/', '/learn', '/learn/ai-python/embeddings', '/review']) {
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(800);
      const offenders = await page.evaluate(() => {
        // Walk the CSSOM once and record which @keyframes touch opacity. Names can
        // repeat across sheets, so any definition that fades counts.
        const fading = new Set();
        for (const sheet of document.styleSheets) {
          let rules;
          try {
            rules = sheet.cssRules;
          } catch {
            continue; // cross-origin sheet, not ours
          }
          for (const rule of rules) {
            if (rule.type !== CSSRule.KEYFRAMES_RULE) continue;
            for (const frame of rule.cssRules) {
              if (frame.style && frame.style.getPropertyValue('opacity')) {
                fading.add(rule.name);
              }
            }
          }
        }
        const fadesOpacity = (names) =>
          names.split(',').map((n) => n.trim()).some((n) => fading.has(n));

        return [...document.querySelectorAll('*')]
          .filter((el) => {
            const cs = getComputedStyle(el);
            if (cs.animationName === 'none') return false;
            // Ask the keyframes what the animation actually changes rather than guessing
            // from its name: the fix for this very bug is called "ring-pulse" and animates
            // box-shadow, and a name-matching check flagged it as the thing it fixed.
            if (!fadesOpacity(cs.animationName)) return false;
            if (el.getAttribute('aria-hidden') === 'true') return false;
            // The animating element is usually a container and the text is a descendant
            // — the tool dock animates the whole panel while "tools" sits two levels
            // down — so checking only this element's own text nodes finds nothing.
            // Opacity composites down the whole subtree, so the subtree is what matters.
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (!node.textContent.trim()) continue;
              const holder = node.parentElement;
              if (!holder || holder.closest('[aria-hidden="true"]')) continue;
              const hs = getComputedStyle(holder);
              if (hs.display === 'none' || hs.visibility === 'hidden') continue;
              return true;
            }
            return false;
          })
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 25)}"`);
      });
      if (offenders.length) {
        animatedText.push(`${route}: ${offenders.join(', ')}`);
      }
    } catch {
      // covered by the route scans above
    }
  }
  await ctx.close();
}

await browser.close();

const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const sorted = [...findings.entries()].sort(
  (a, b) => (order[a[1].impact] ?? 9) - (order[b[1].impact] ?? 9),
);

console.log(`\n\x1b[1maxe-core · ${scans} scans across ${ROUTES.length} routes, 2 colour schemes, 2 widths\x1b[0m`);
if (!sorted.length) {
  console.log('\x1b[32m  no violations\x1b[0m');
} else {
  for (const [id, f] of sorted) {
    const colour = f.impact === 'critical' || f.impact === 'serious' ? '\x1b[31m' : '\x1b[33m';
    console.log(`\n  ${colour}${(f.impact || 'n/a').toUpperCase()}\x1b[0m  ${id}`);
    console.log(`    ${f.help}`);
    console.log(`    routes (${f.routes.size}): ${[...f.routes].slice(0, 3).join(', ')}${f.routes.size > 3 ? ' …' : ''}`);
    console.log(`    nodes: ${[...f.nodes].slice(0, 3).join(' | ')}`);
  }
}
const blocking = sorted.filter(([, f]) => f.impact === 'critical' || f.impact === 'serious').length;
console.log(`\n  ${sorted.length} distinct rule(s) violated · ${blocking} critical/serious`);

// A scan that never ran is not a scan that passed. These used to show up as one yellow
// character in a wall of green dots and never appear again, so a run that quietly missed
// a whole route still read as a clean sweep.
// WCAG 2.4.2: axe checks that a title exists, never that it says anything. Every lesson
// shared "Lessons · python-mastery" and every project shared "Projects · python-mastery",
// so a row of open tabs was unreadable and each navigation announced the same words.
const byTitle = new Map();
for (const [route, title] of titles) {
  if (!byTitle.has(title)) byTitle.set(title, []);
  byTitle.get(title).push(route);
}
const duplicateTitles = [...byTitle.entries()].filter(([, routes]) => routes.length > 1);
if (duplicateTitles.length) {
  console.log(`\n\x1b[31m  DUPLICATE TITLES: ${duplicateTitles.length} title(s) shared by more than one route:\x1b[0m`);
  for (const [title, routes] of duplicateTitles) console.log(`    "${title}" — ${routes.join(', ')}`);
}

if (animatedText.length) {
  console.log(`\n\x1b[31m  TEXT ANIMATING ITS OWN OPACITY: ${animatedText.length} place(s):\x1b[0m`);
  for (const a of animatedText) console.log(`    ${a}`);
  console.log('  Contrast is only measurable at rest; put the animation on a decorative');
  console.log('  sibling and leave the text at full opacity.');
}

const neverScanned = ROUTES.filter((r) => !scannedRoutes.has(r));
if (skipped.length) {
  console.log(`\n\x1b[33m  ${skipped.length} scan(s) did not run:\x1b[0m`);
  for (const s of skipped.slice(0, 10)) console.log(`    ${s.label} — ${s.why}`);
  if (skipped.length > 10) console.log(`    …and ${skipped.length - 10} more`);
}
if (neverScanned.length) {
  console.log(`\n\x1b[31m  NOT COVERED: ${neverScanned.length} route(s) were never scanned in any context:\x1b[0m`);
  for (const r of neverScanned) console.log(`    ${r}`);
  console.log('  "no violations" says nothing about these.');
}

// A run that scanned nothing reported "no violations" and exited 0 while the server was
// down. An empty result is not a pass; it is a broken run, and it must be louder than a
// real failure because it looks like success.
const EXPECTED_MIN_SCANS = ROUTES.length;
if (scans < EXPECTED_MIN_SCANS) {
  console.log(
    `\n\x1b[31m  BROKEN RUN: only ${scans} scan(s) completed, expected at least ${EXPECTED_MIN_SCANS}.\x1b[0m`,
  );
  console.log('  "no violations" here means nothing was measured. Is the server up?');
  process.exit(2);
}
process.exit(blocking || neverScanned.length || duplicateTitles.length || animatedText.length ? 1 : 0);
