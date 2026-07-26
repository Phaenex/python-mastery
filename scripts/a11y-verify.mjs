#!/usr/bin/env node
/**
 * Live UI/UX and accessibility verification.
 *
 * Every check observes the rendered page. None of it infers from source, because the
 * failures worth finding (a panel that reflows off-screen at 400%, a focus ring the
 * theme quietly removed, a traceback rendered as decoration with no accessible name)
 * are invisible in the CSS and obvious in the browser.
 *
 *   node scripts/a11y-verify.mjs                     against production
 *   node scripts/a11y-verify.mjs http://localhost:3010
 *
 * Exits non-zero when any check fails, so it can gate a release.
 *
 * This site has two states pheme's version of this script had no equivalent for, and
 * they are the ones most likely to be wrong: Pyodide takes seconds to boot, and running
 * code is expected to fail. Both are exercised for real below rather than described.
 */
import { chromium } from 'playwright';
import { gateExitCode } from './a11y-result.mjs';

const BASE = process.argv[2] || 'https://damato-python.vercel.app';
const LESSON = '/learn/ai-python/embeddings';
const ROUTES = ['/', '/start', '/learn', '/projects', '/stats', '/glossary', LESSON];

const results = [];
function record(item, route, pass, detail) {
  results.push({ item, route, pass, detail });
  const tag = pass === true ? '\x1b[32mPASS\x1b[0m' : pass === false ? '\x1b[31mFAIL\x1b[0m' : '\x1b[33mWARN\x1b[0m';
  console.log(`  ${tag}  ${item.padEnd(18)} ${route.padEnd(30)} ${detail}`);
}

const browser = await chromium.launch();
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  return { ctx, page: await ctx.newPage() };
};

// ---- 1. Zoom reflow (WCAG 1.4.10) --------------------------------------------------
// 400% zoom on a 1280px viewport is equivalent to 320 CSS px.
console.log('\n\x1b[1m1. Zoom reflow — 320px equivalent (400% zoom)\x1b[0m');
{
  const { ctx, page } = await newPage({ viewport: { width: 320, height: 780 } });
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(900);
      const m = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        offenders: [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            // An element allowed to scroll itself is not a page-level reflow failure.
            const scroller = el.closest('[style*="overflow"],.overflow-x-auto,pre,table');
            return r.width > 0 && r.right > window.innerWidth + 2 && !scroller;
          })
          .slice(0, 4)
          .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`),
      }));
      const ok = m.scrollW <= m.innerW + 1;
      record('zoom-reflow', route, ok,
        ok ? `${m.scrollW}px fits ${m.innerW}px` : `${m.scrollW}>${m.innerW}: ${m.offenders.join(', ')}`);
    } catch (e) {
      record('zoom-reflow', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
  await ctx.close();
}

// ---- 2. Text spacing (WCAG 1.4.12) -------------------------------------------------
console.log('\n\x1b[1m2. Text-spacing override\x1b[0m');
{
  // Differential, for the same reason forced-colors is. A line-clamp truncates by design
  // and clips at default spacing too; counting it as a spacing failure blames the
  // override for a decision the design already made. Only text that starts unclipped and
  // ends clipped is caused by the spacing.
  const clipProbe = `(${(() => {
    return [...document.querySelectorAll('h1,h2,h3,p,button,a,li')]
      .filter((el) => {
        if (el.closest('.sr-only,[hidden],pre,code,.monaco-editor')) return false;
        const cs = getComputedStyle(el);
        if (cs.overflow !== 'hidden') return false;
        if (cs.textOverflow === 'ellipsis') return false;
        if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') return false;
        return el.scrollHeight > el.clientHeight + 2;
      })
      .map((el) => `${el.tagName.toLowerCase()}:${(el.textContent || '').trim().slice(0, 22)}`);
  }).toString()})()`;

  const { ctx, page } = await newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(500);
      const before = await page.evaluate(clipProbe);
      await page.addStyleTag({
        content: `*:not(pre):not(code):not(.monaco-editor *) {
                    line-height: 1.5 !important; letter-spacing: 0.12em !important;
                    word-spacing: 0.16em !important; }
                  p { margin-bottom: 2em !important; }`,
      });
      await page.waitForTimeout(700);
      const m = await page.evaluate(`({ after: ${clipProbe}, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })`);
      const caused = m.after.filter((x) => !before.includes(x)).slice(0, 4);
      const ok = caused.length === 0 && m.scrollW <= m.innerW + 1;
      record('text-spacing', route, ok,
        ok ? 'no spacing-caused clipping, no overflow' : `clipped by spacing: ${caused.join(' | ')}`);
    } catch (e) {
      record('text-spacing', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
  await ctx.close();
}

// ---- 3. Forced colors --------------------------------------------------------------
// Differential on purpose. An absolute count of hidden elements flags everything the
// page hides by design and reports failures that are not failures.
console.log('\n\x1b[1m3. Forced colors (High Contrast)\x1b[0m');
{
  const probe = `(${(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05 && r.width > 0;
    };
    const hidden = (sel) =>
      [...document.querySelectorAll(sel)]
        .map((el, i) => (vis(el) ? null : `${el.tagName.toLowerCase()}#${el.id || i}`))
        .filter(Boolean);
    return {
      nav: hidden('nav a, header a'),
      heads: hidden('h1,h2'),
      text: (document.body.innerText || '').trim().length,
    };
  }).toString()})()`;

  for (const route of ROUTES) {
    try {
      const shots = [];
      for (const forced of [false, true]) {
        const { ctx, page } = await newPage({ forcedColors: forced ? 'active' : 'none' });
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(900);
        shots.push(await page.evaluate(probe));
        await ctx.close();
      }
      const [off, on] = shots;
      const newNav = on.nav.filter((x) => !off.nav.includes(x));
      const newHead = on.heads.filter((x) => !off.heads.includes(x));
      const textLoss = off.text > 0 ? 1 - on.text / off.text : 0;
      const ok = newNav.length === 0 && newHead.length === 0 && textLoss < 0.1;
      record('forced-colors', route, ok,
        ok ? 'nothing newly hidden' : `newly hidden ${newNav.length} nav, ${newHead.length} headings, ${(textLoss * 100).toFixed(0)}% text lost`);
    } catch (e) {
      record('forced-colors', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
}

// ---- 4. Heading order --------------------------------------------------------------
console.log('\n\x1b[1m4. Heading order\x1b[0m');
{
  const { ctx, page } = await newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => {
        const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .filter((h) => {
            const cs = getComputedStyle(h);
            return cs.display !== 'none' && cs.visibility !== 'hidden';
          })
          .map((h) => ({ level: Number(h.tagName[1]), text: (h.textContent || '').trim().slice(0, 28) }));
        const skips = [];
        for (let i = 1; i < hs.length; i++) {
          if (hs[i].level - hs[i - 1].level > 1) skips.push(`h${hs[i - 1].level}->h${hs[i].level} at "${hs[i].text}"`);
        }
        return { h1: hs.filter((h) => h.level === 1).length, count: hs.length, skips };
      });
      const ok = m.h1 === 1 && m.skips.length === 0;
      record('heading-order', route, ok,
        ok ? `1 h1, ${m.count} headings, no skips` : `h1 count ${m.h1}; ${m.skips.join('; ') || 'no skips'}`);
    } catch (e) {
      record('heading-order', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
  await ctx.close();
}

// ---- 5. Focus visibility -----------------------------------------------------------
console.log('\n\x1b[1m5. Focus visibility\x1b[0m');
{
  const { ctx, page } = await newPage();
  for (const route of ROUTES.slice(0, 5)) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(800);
      let invisible = 0, checked = 0;
      const missing = [];
      for (let i = 0; i < 16; i++) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const ring =
            (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
            cs.boxShadow !== 'none' ||
            cs.borderColor !== cs.backgroundColor;
          return { ring, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 18) };
        });
        if (!f) continue;
        checked++;
        if (!f.ring) { invisible++; if (missing.length < 3) missing.push(`${f.tag}:${f.text}`); }
      }
      const ok = checked > 0 && invisible === 0;
      record('focus-visible', route, ok,
        ok ? `${checked} stops, all have a ring` : `${invisible}/${checked} without a ring: ${missing.join(', ')}`);
    } catch (e) {
      record('focus-visible', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
  await ctx.close();
}

// ---- 6. Runtime states: loading, error, empty ---------------------------------------
// The states unique to this site. Pyodide boots for seconds on first load, and running
// code is expected to fail — both need to be announced, not just drawn.
console.log('\n\x1b[1m6. Loading / error / empty states\x1b[0m');
{
  const { ctx, page } = await newPage();
  try {
    await page.goto(BASE + LESSON, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Loading: before Pyodide is ready the Run control must be disabled and the wait
    // must be communicated, not just implied by a control that silently does nothing.
    const early = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const run = btns.find((b) => /^run$/i.test(b.textContent.trim()));
      const body = (document.body.innerText || '').toLowerCase();
      return {
        runFound: !!run,
        runDisabled: run ? run.disabled : null,
        saysLoading: /loading|starting|booting|preparing|pyodide/.test(body),
        live: document.querySelectorAll('[aria-live],[role="status"]').length,
      };
    });
    const loadOk = early.runFound && (early.runDisabled === true || early.saysLoading);
    record('loading-state', LESSON, loadOk,
      `run ${early.runFound ? (early.runDisabled ? 'disabled' : 'ENABLED') : 'missing'}, ` +
      `${early.saysLoading ? 'says loading' : 'no loading text'}, ${early.live} live regions`);

    // Wait for readiness, then force a real Python error.
    const run = page.locator('button').filter({ hasText: /^run$/i }).first();
    await run.waitFor({ state: 'visible', timeout: 120000 });
    for (let i = 0; i < 60; i++) { if (await run.isEnabled()) break; await page.waitForTimeout(2000); }

    const ta = page.locator('textarea').first();
    await ta.fill('print(undefined_name_xyz)');
    await run.click();
    let errText = '';
    for (let i = 0; i < 30; i++) {
      errText = await page.evaluate(() => document.body.innerText);
      if (/NameError|Traceback|error/i.test(errText)) break;
      await page.waitForTimeout(1200);
    }
    const errState = await page.evaluate(() => {
      const live = [...document.querySelectorAll('[aria-live],[role="status"],[role="alert"]')];
      const text = (document.body.innerText || '');
      return {
        shown: /NameError/i.test(text),
        inLiveRegion: live.some((el) => /NameError/i.test(el.innerText || '')),
        liveCount: live.length,
      };
    });
    record('error-state', LESSON, errState.shown && errState.inLiveRegion,
      `NameError ${errState.shown ? 'shown' : 'NOT shown'}, ` +
      `${errState.inLiveRegion ? 'announced in a live region' : 'NOT in any live region'} (${errState.liveCount} regions)`);
  } catch (e) {
    record('loading-state', LESSON, null, `could not exercise: ${e.message.slice(0, 50)}`);
  }
  await ctx.close();
}
{
  // Empty: a fresh visitor with no saved progress must still get a usable page.
  const { ctx, page } = await newPage();
  for (const route of ['/stats', '/start']) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const m = await page.evaluate(() => {
        // Match a rendered *value*, not the word. A plain substring search flagged the
        // data-cleaning module's own description ("NaN handling, type coercion") as a
        // broken empty state. Only a leaf element whose entire text is the token, or a
        // token glued to a unit, is actually a computation that failed.
        const leaves = [...document.querySelectorAll('*')].filter((el) => !el.children.length);
        const bad = leaves.filter((el) => {
          const t = (el.textContent || '').trim();
          return /^(NaN|undefined|Infinity|-?Infinity)$/.test(t) || /\b(NaN|Infinity)\s*(%|xp|\/)/.test(t);
        });
        return {
          text: (document.body.innerText || '').trim().length,
          nan: bad.length > 0,
          nanSample: bad.slice(0, 2).map((el) => (el.textContent || '').trim().slice(0, 24)),
          links: document.querySelectorAll('a').length,
        };
      });
      const ok = m.text > 100 && !m.nan && m.links > 0;
      record('empty-state', route, ok,
        `${m.text} chars, ${m.links} links${m.nan ? `, RENDERS ${m.nanSample.join('/')}` : ', no NaN/undefined values'}`);
    } catch (e) {
      record('empty-state', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
  await ctx.close();
}

// ---- 7. Mobile + 404 ---------------------------------------------------------------
console.log('\n\x1b[1m7. Mobile and 404\x1b[0m');
{
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 } });
  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(900);
      const m = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        tiny: [...document.querySelectorAll('button,a,select,input,textarea')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.height < 24;
          }).length,
        smallText: [...document.querySelectorAll('p,li,td')]
          .filter((el) => !el.closest('pre,code') && parseFloat(getComputedStyle(el).fontSize) < 12).length,
      }));
      const ok = !m.overflow && m.smallText === 0;
      record('mobile-390', route, ok,
        `${m.overflow ? 'H-OVERFLOW' : 'no overflow'}, ${m.tiny} sub-24px controls, ${m.smallText} sub-12px text`);
    } catch (e) {
      record('mobile-390', route, null, `could not load: ${e.message.slice(0, 40)}`);
    }
  }
  await ctx.close();
}
{
  const { ctx, page } = await newPage();
  try {
    const res = await page.goto(BASE + '/definitely-not-a-real-page', { waitUntil: 'networkidle', timeout: 60000 });
    const m = await page.evaluate(() => ({
      text: (document.body.innerText || '').trim().length,
      links: document.querySelectorAll('a').length,
      h1: document.querySelectorAll('h1').length,
    }));
    record('404-state', '/definitely-not-a-real-page', m.text > 40 && m.links > 0,
      `HTTP ${res?.status()}, ${m.text} chars, ${m.links} links back, ${m.h1} h1`);
  } catch (e) {
    record('404-state', '/404', null, `could not load: ${e.message.slice(0, 40)}`);
  }
  await ctx.close();
}

await browser.close();

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const warn = results.filter((r) => r.pass === null).length;
console.log(`\n\x1b[1m${pass} PASS · ${fail} FAIL · ${warn} inconclusive\x1b[0m`);
if (fail) {
  console.log('\nFailures:');
  for (const r of results.filter((x) => x.pass === false)) console.log(`  ${r.item} ${r.route}: ${r.detail}`);
}
if (warn) {
  console.log('\nIncomplete checks:');
  for (const r of results.filter((x) => x.pass === null)) console.log(`  ${r.item} ${r.route}: ${r.detail}`);
  console.log('  A check that could not run is a broken run, not a pass.');
}
process.exit(gateExitCode({ failures: fail, incomplete: warn }));
