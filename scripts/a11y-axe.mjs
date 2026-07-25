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
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(600);
        const n = await scan(page, `${route} [${scheme}/${vp.tag}]`);
        if (n) process.stdout.write('\x1b[31m.\x1b[0m');
        else process.stdout.write('\x1b[32m.\x1b[0m');
      } catch {
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
process.exit(blocking ? 1 : 0);
