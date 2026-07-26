#!/usr/bin/env node
/**
 * Dialog keyboard behaviour: open, trap, dismiss, restore.
 *
 * A dialog is the one place a focus trap is correct rather than a bug. aria-modal="true"
 * tells assistive tech the rest of the page is inert, so if Tab still walks out into the
 * page behind it, the markup is lying: a keyboard user ends up interacting with content
 * a screen reader user has been told does not exist. Four things have to hold, and axe
 * checks none of them because all four are behaviours, not attributes:
 *
 *   1. focus moves into the dialog when it opens
 *   2. Tab and Shift+Tab stay inside it
 *   3. Escape closes it
 *   4. focus returns to whatever opened it
 *
 *   node scripts/a11y-modals.mjs                     against production
 *   node scripts/a11y-modals.mjs http://localhost:3010
 */
import { chromium } from 'playwright';
import { gateExitCode } from './a11y-result.mjs';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';
const LESSON = '/learn/ai-python/embeddings';

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

const browser = await chromium.launch();

/** Is focus currently inside the given dialog? */
const focusInside = (page, selector) =>
  page.evaluate((sel) => {
    const dialog = document.querySelector(sel);
    return !!dialog && !!document.activeElement && dialog.contains(document.activeElement);
  }, selector);

const activeName = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return '(body)';
    return (
      el.getAttribute('aria-label') ||
      (el.innerText || '').trim().slice(0, 30) ||
      el.tagName
    ).replace(/\s+/g, ' ');
  });

/**
 * Run the four dialog rules against one dialog.
 *
 * @param open Opens the dialog using the keyboard, and returns a label for the control
 *   that opened it so focus restoration can be checked.
 */
async function auditDialog(page, { name, selector, open, expectEscape = true }) {
  const opener = await open();
  await page.waitForTimeout(600);

  const present = await page.locator(selector).count();
  check(present > 0, `[${name}] opens by keyboard`, present ? '' : 'dialog never appeared');
  if (!present) return;

  check(await focusInside(page, selector), `[${name}] moves focus into the dialog`,
    await focusInside(page, selector) ? '' : `focus stayed on "${await activeName(page)}" outside the dialog`);

  // Walk forward far enough to leave a small dialog several times over.
  let escapedAt = -1;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    if (!(await focusInside(page, selector))) { escapedAt = i + 1; break; }
  }
  check(escapedAt === -1, `[${name}] Tab stays inside the dialog`,
    escapedAt === -1 ? '' : `focus left the dialog after ${escapedAt} Tab(s), onto "${await activeName(page)}"`);

  let backEscapedAt = -1;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Shift+Tab');
    if (!(await focusInside(page, selector))) { backEscapedAt = i + 1; break; }
  }
  check(backEscapedAt === -1, `[${name}] Shift+Tab stays inside the dialog`,
    backEscapedAt === -1 ? '' : `focus left backward after ${backEscapedAt}, onto "${await activeName(page)}"`);

  if (expectEscape) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const stillOpen = await page.locator(selector).count();
    check(stillOpen === 0, `[${name}] Escape closes the dialog`,
      stillOpen === 0 ? '' : 'dialog still open after Escape, so there is no keyboard dismissal');

    if (stillOpen === 0 && opener) {
      const now = await activeName(page);
      check(now === opener, `[${name}] focus returns to the control that opened it`,
        now === opener ? '' : `focus went to "${now}", expected "${opener}"`);
    }
  }
}

// --- CommandPalette, opened by the global Cmd/Ctrl+K shortcut ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/learn', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  await auditDialog(page, {
    name: 'command palette',
    // Address each dialog by its label. Three of them carry
    // [role="dialog"][aria-modal="true"], and the interface tour renders unprompted on a
    // fresh visit, so the generic selector silently measured the tour instead.
    selector: '[role="dialog"][aria-label="Command menu"]',
    open: async () => {
      const trigger = page.locator('button[aria-label*="command" i]').first();
      await trigger.focus();
      const label = await activeName(page);
      await page.keyboard.press('Enter');
      return label;
    },
  });
  await ctx.close();
}

// --- TutorChat, opened from a lesson ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  // Mark the tour seen before the lesson loads, so it is not sitting on top of the page
  // while the tutor dialog is under test.
  await page.addInitScript(() => localStorage.setItem('python-mastery-onboarding-seen', '1'));
  await page.goto(BASE + LESSON, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  await auditDialog(page, {
    name: 'tutor chat',
    selector: '[role="dialog"][aria-label="AI tutor chat"]',
    open: async () => {
      const trigger = page.locator('button').filter({ hasText: /ask the tutor/i }).first();
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      const label = await activeName(page);
      await page.keyboard.press('Enter');
      return label;
    },
  });
  await ctx.close();
}

// --- InterfaceOnboarding, which appears unprompted on a first visit ---
{
  // A fresh context has no localStorage, which is what makes the tour show at all.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + LESSON, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const tour = page.locator('[role="dialog"][aria-label*="tour" i]');
  if (await tour.count()) {
    // It opens on its own, so there is no opener to restore focus to; the rest applies.
    check(await focusInside(page, '[role="dialog"][aria-label*="tour" i]'),
      '[interface tour] moves focus into the dialog',
      await focusInside(page, '[role="dialog"][aria-label*="tour" i]')
        ? '' : `focus stayed on "${await activeName(page)}"; a dialog nobody is focused into is one a screen reader user never learns about`);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    check(await tour.count() === 0, '[interface tour] Escape dismisses it',
      await tour.count() === 0 ? '' : 'no keyboard dismissal: Escape does nothing');
  } else {
    incomplete(
      '[interface tour] opens on a first visit',
      'tour did not appear, so its focus and dismissal behaviour were not measured',
    );
  }
  await ctx.close();
}

await browser.close();

console.log(`\n\n\x1b[1mdialog keyboard behaviour · ${passes.length + failures.length} checks\x1b[0m`);
for (const p of passes) console.log(`  \x1b[32m✓\x1b[0m ${p}`);
for (const f of failures) console.log(`  \x1b[31m✗\x1b[0m ${f}`);
for (const item of broken) console.log(`  \x1b[33m?\x1b[0m ${item}`);
console.log(`\n  ${passes.length} passed · ${failures.length} failed · ${broken.length} incomplete`);
process.exit(gateExitCode({ failures: failures.length, incomplete: broken.length }));
