#!/usr/bin/env node
/**
 * Tiered axe audit across the whole page catalog.
 *
 * Every lesson and guided project receives a dark/desktop baseline scan. A smaller set
 * spanning distinct page families keeps the expensive light/dark × desktop/phone matrix.
 * Runtime-only lesson states are scanned separately after Pyodide is ready.
 *
 *   node scripts/a11y-axe.mjs
 *   node scripts/a11y-axe.mjs http://localhost:3010
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import {
  MATRIX_CONTENT_ROUTES,
  NOT_FOUND_ROUTE,
  STATIC_PAGE_ROUTES,
  loadRouteInventory,
  prepareStaticAuditPage,
} from './a11y-routes.mjs';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const LESSON = '/learn/ai-python/embeddings';

let inventory;
try {
  inventory = await loadRouteInventory(BASE);
} catch (error) {
  console.error(`\n\x1b[31mBROKEN RUN: ${error.message}\x1b[0m`);
  process.exit(2);
}

const MATRIX_ROUTES = [
  ...STATIC_PAGE_ROUTES,
  ...MATRIX_CONTENT_ROUTES,
  NOT_FOUND_ROUTE,
];
const matrixSet = new Set(MATRIX_CONTENT_ROUTES);
const BASELINE_ROUTES = inventory.contentRoutes.filter((route) => !matrixSet.has(route));

const findings = new Map();
const skipped = [];
const expectedLabels = new Set();
const completedLabels = new Set();
const scannedRoutes = new Set();
const titles = new Map();
const animatedText = new Map();
let scans = 0;

async function scan(page, label, route) {
  const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const violation of res.violations) {
    if (!findings.has(violation.id)) {
      findings.set(violation.id, {
        impact: violation.impact,
        help: violation.help,
        nodes: new Set(),
        routes: new Set(),
        helpUrl: violation.helpUrl,
      });
    }
    const finding = findings.get(violation.id);
    finding.routes.add(label);
    for (const node of violation.nodes.slice(0, 4)) {
      finding.nodes.add(node.target.join(' '));
    }
  }

  // axe can only catch fading text by happening to sample mid-animation. Inspect the
  // CSS keyframes on every baseline route so content-specific wrappers cannot hide it.
  const offenders = await page.evaluate(() => {
    const fading = new Set();
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of rules) {
        if (rule.type !== CSSRule.KEYFRAMES_RULE) continue;
        for (const frame of rule.cssRules) {
          if (frame.style?.getPropertyValue('opacity')) fading.add(rule.name);
        }
      }
    }
    const fadesOpacity = (names) =>
      names.split(',').map((name) => name.trim()).some((name) => fading.has(name));

    return [...document.querySelectorAll('*')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.animationName === 'none' || !fadesOpacity(style.animationName)) return false;
        if (element.getAttribute('aria-hidden') === 'true') return false;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent?.trim()) continue;
          const holder = node.parentElement;
          if (!holder || holder.closest('[aria-hidden="true"]')) continue;
          const holderStyle = getComputedStyle(holder);
          if (holderStyle.display === 'none' || holderStyle.visibility === 'hidden') continue;
          return true;
        }
        return false;
      })
      .map((element) =>
        `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]} ` +
        `"${element.textContent.trim().slice(0, 25)}"`,
      );
  });

  if (offenders.length) {
    const existing = animatedText.get(route) || new Set();
    for (const offender of offenders) existing.add(offender);
    animatedText.set(route, existing);
  }

  scans += 1;
  completedLabels.add(label);
  scannedRoutes.add(route);
  titles.set(route, await page.title());
  process.stdout.write(res.violations.length ? '\x1b[31m.\x1b[0m' : '\x1b[32m.\x1b[0m');
}

async function auditRoute(page, route, label) {
  expectedLabels.add(label);
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(400);
    await scan(page, label, route);
  } catch (error) {
    skipped.push({ label, why: error.message.split('\n')[0].slice(0, 100) });
    process.stdout.write('\x1b[33m?\x1b[0m');
  }
}

const browser = await chromium.launch();

// Deep environmental matrix on representative routes and every static page.
for (const scheme of ['dark', 'light']) {
  for (const viewport of [
    { width: 1280, height: 900, tag: 'desktop' },
    { width: 390, height: 844, tag: 'phone' },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: scheme,
    });
    const page = await context.newPage();
    await prepareStaticAuditPage(page);
    for (const route of MATRIX_ROUTES) {
      await auditRoute(page, route, `${route} [${scheme}/${viewport.tag}]`);
    }
    await context.close();
  }
}

// One complete baseline pass over every remaining lesson and project.
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await prepareStaticAuditPage(page);
  for (const route of BASELINE_ROUTES) {
    await auditRoute(page, route, `${route} [baseline dark/desktop]`);
  }
  await context.close();
}
console.log('');

// Runtime states that no initial page scan can inspect.
{
  const runtimeLabels = [
    `${LESSON} [pyodide ready]`,
    `${LESSON} [after error]`,
    `${LESSON} [hint open]`,
  ];
  for (const label of runtimeLabels) expectedLabels.add(label);

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem('python-mastery-onboarding-seen', '1'));
  try {
    await page.goto(BASE + LESSON, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const run = page.locator('button').filter({ hasText: /^run$/i }).first();
    await run.waitFor({ state: 'visible', timeout: 120000 });
    let ready = false;
    for (let i = 0; i < 90; i++) {
      if (await run.isEnabled()) {
        ready = true;
        break;
      }
      await page.waitForTimeout(2000);
    }
    if (!ready) throw new Error('Pyodide never became ready');
    await scan(page, runtimeLabels[0], LESSON);

    await page.locator('textarea').first().fill('print(nope_xyz)');
    await run.click();
    let sawError = false;
    for (let i = 0; i < 25; i++) {
      if (/NameError/i.test(await page.evaluate(() => document.body.innerText))) {
        sawError = true;
        break;
      }
      await page.waitForTimeout(1200);
    }
    if (!sawError) throw new Error('the deliberate NameError never rendered');
    await scan(page, runtimeLabels[1], LESSON);

    const hint = page.locator('button').filter({ hasText: /hint/i }).first();
    if (!(await hint.count())) throw new Error('the expected hint disclosure was absent');
    await hint.click();
    await page.waitForTimeout(500);
    await scan(page, runtimeLabels[2], LESSON);
  } catch (error) {
    for (const label of runtimeLabels.filter((item) => !completedLabels.has(item))) {
      skipped.push({ label, why: error.message.split('\n')[0].slice(0, 100) });
    }
  }
  await context.close();
}

await browser.close();

const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const sorted = [...findings.entries()].sort(
  (a, b) => (order[a[1].impact] ?? 9) - (order[b[1].impact] ?? 9),
);

console.log(
  `\n\x1b[1maxe-core · ${scans} scans · ` +
  `${inventory.counts.modules} modules · ${inventory.counts.lessons} lessons · ` +
  `${inventory.counts.projects} projects\x1b[0m`,
);
if (!sorted.length) {
  console.log('\x1b[32m  no violations\x1b[0m');
} else {
  for (const [id, finding] of sorted) {
    console.log(`\n  \x1b[31m${(finding.impact || 'n/a').toUpperCase()}\x1b[0m  ${id}`);
    console.log(`    ${finding.help}`);
    console.log(
      `    routes (${finding.routes.size}): ` +
      `${[...finding.routes].slice(0, 3).join(', ')}${finding.routes.size > 3 ? ' …' : ''}`,
    );
    console.log(`    nodes: ${[...finding.nodes].slice(0, 3).join(' | ')}`);
  }
}

const byTitle = new Map();
for (const [route, title] of titles) {
  if (!byTitle.has(title)) byTitle.set(title, []);
  byTitle.get(title).push(route);
}
const duplicateTitles = [...byTitle.entries()].filter(([, routes]) => routes.length > 1);
if (duplicateTitles.length) {
  console.log(`\n\x1b[31m  DUPLICATE TITLES:\x1b[0m`);
  for (const [title, routes] of duplicateTitles) {
    console.log(`    "${title}" — ${routes.join(', ')}`);
  }
}

if (animatedText.size) {
  console.log(`\n\x1b[31m  TEXT ANIMATING ITS OWN OPACITY:\x1b[0m`);
  for (const [route, offenders] of animatedText) {
    console.log(`    ${route}: ${[...offenders].join(', ')}`);
  }
}

const missingLabels = [...expectedLabels].filter((label) => !completedLabels.has(label));
const neverScanned = inventory.allPageRoutes.filter((route) => !scannedRoutes.has(route));
if (skipped.length || missingLabels.length || neverScanned.length || scans !== expectedLabels.size) {
  console.log(`\n\x1b[33m  BROKEN RUN: not everything was measured.\x1b[0m`);
  for (const item of skipped.slice(0, 12)) console.log(`    ${item.label} — ${item.why}`);
  if (skipped.length > 12) console.log(`    …and ${skipped.length - 12} more incomplete scans`);
  if (neverScanned.length) console.log(`    routes never scanned: ${neverScanned.join(', ')}`);
  console.log(`    completed ${completedLabels.size}/${expectedLabels.size} expected scans`);
  process.exit(2);
}

console.log(
  `  \x1b[32mcoverage: ${inventory.counts.lessons}/${inventory.counts.lessons} lessons · ` +
  `${inventory.counts.projects}/${inventory.counts.projects} projects · 0 skipped\x1b[0m`,
);
process.exit(sorted.length || duplicateTitles.length || animatedText.size ? 1 : 0);
