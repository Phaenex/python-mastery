#!/usr/bin/env node
/**
 * Lesson self-check.
 *
 * Every challenge ships a `solution` and a `validateFn`. Nothing verified that the
 * solution actually satisfies its own validator, so a lesson could ship with a
 * challenge that is impossible to pass and the only way to find out was a learner
 * getting stuck on it.
 *
 * This runs each solution through the local Python interpreter and feeds the real
 * stdout to the real validator. A challenge whose own solution fails is a broken
 * challenge.
 *
 *   node scripts/check-lessons.mjs              all modules
 *   node scripts/check-lessons.mjs moduleAi     one module
 *
 * Caveat worth knowing: the site runs Pyodide in the browser, this runs system
 * python3. For lessons using only stdlib and numpy the two agree. Lessons needing
 * pandas, pygame, or a package this machine lacks are reported as SKIP rather than
 * failed, because "not installed here" is not the same as "broken".
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LESSON_DIR = join(ROOT, 'lib', 'lessons');
const only = process.argv[2];
const TMP = join(process.env.TMPDIR || '/tmp', `lesson-check-${process.pid}.py`);

/**
 * The browser worker seeds every run with `students` and `sales` DataFrames, so lesson
 * solutions reference them as if they were builtins. Without this the checker reports
 * a wall of NameErrors that are purely an artifact of running outside the app.
 * Read from the worker rather than duplicated here, so the two cannot drift.
 */
function starterDataCode() {
  const worker = readFileSync(join(ROOT, 'public', 'pyodide-worker.js'), 'utf8');
  const key = 'const STARTER_DATA_CODE = `';
  const at = worker.indexOf(key);
  if (at === -1) return '';
  const start = at + key.length;
  const end = worker.indexOf('\n`;', start);
  return end === -1 ? '' : worker.slice(start, end);
}
const PRELUDE = starterDataCode();

/**
 * Modules whose challenges never reach the JS validator in the app, so checking them
 * here would report failures that cannot happen to a learner.
 * game-dev-pygame: `isPygame` disables Run entirely (pygame needs a real window), which
 * returns before validation. Its validateFn bodies are Python and inert by design.
 */
const NOT_VALIDATED_IN_APP = new Set(['module8.ts']);

/**
 * Pull `solution` and `validateFn` out of a lesson file.
 *
 * These are TypeScript template literals containing Python and JavaScript, so a real
 * parser is overkill and JSON.parse will not touch them. Walking the backticks and
 * honouring backslash escapes is enough, and it fails loudly rather than silently
 * mismatching if the format ever changes.
 */
function extractChallenges(src) {
  const out = [];
  // The learner has the lesson's starterCode sitting in the editor, so a solution is
  // free to use names it defines. Track the nearest preceding starterCode so a
  // NameError can be retried with the same context the learner actually has.
  const starters = [];
  const startRe = /^\s*starterCode:/gm;
  let sm;
  while ((sm = startRe.exec(src))) {
    starters.push({ at: sm.index, code: readTemplate(src.slice(sm.index), 'starterCode:') || '' });
  }
  const starterFor = (idx) => {
    let found = '';
    for (const s of starters) {
      if (s.at < idx) found = s.code;
      else break;
    }
    return found;
  };
  // Anchored to line start on purpose. An unanchored /id:\s*"/ also matches inside
  // Python string literals in starterCode: print("good row valid:", ...) contains
  // `id:"` as a substring, which silently invented two extra challenges and made the
  // pass count larger than the number of challenges that exist.
  const idRe = /^\s*id:\s*"([^"]+)"/gm;
  let m;
  while ((m = idRe.exec(src))) {
    const id = m[1];
    const after = src.slice(m.index);
    const sol = readTemplate(after, 'solution:');
    const val = readTemplate(after, 'validateFn:');
    if (sol && val) out.push({ id, solution: sol, validateFn: val, starter: starterFor(m.index) });
  }
  return out;
}

function readTemplate(src, key) {
  const at = src.indexOf(key);
  if (at === -1) return null;
  let i = src.indexOf('`', at);
  if (i === -1) return null;
  i += 1;
  let buf = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const next = src[i + 1];
      // A TS template escapes a literal backtick and dollar; Python sees them raw.
      if (next === '`' || next === '$' || next === '\\') {
        buf += next;
        i += 2;
        continue;
      }
      buf += c;
      i += 1;
      continue;
    }
    if (c === '`') return buf;
    buf += c;
    i += 1;
  }
  return null;
}

const MISSING_PKG = /ModuleNotFoundError: No module named '([^']+)'/;

function runPython(code) {
  writeFileSync(TMP, `${PRELUDE}\n${code}`);
  try {
    const stdout = execFileSync('python3', [TMP], {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, out: stdout };
  } catch (err) {
    const stderr = (err.stderr || '').toString();
    const miss = stderr.match(MISSING_PKG);
    return { ok: false, out: (err.stdout || '').toString(), err: stderr, missing: miss?.[1] };
  }
}

function runValidator(body, output) {
  try {
    // Same trust model as the app: bodies come from repo-controlled lesson files.
    const fn = new Function('output', 'locals', body);
    return fn(output, {});
  } catch (err) {
    return { threw: String(err) };
  }
}

const files = readdirSync(LESSON_DIR)
  .filter((f) => f.endsWith('.ts'))
  .filter((f) => !only || f.startsWith(only));

let pass = 0, fail = 0, skip = 0;
const failures = [];

for (const file of files) {
  if (NOT_VALIDATED_IN_APP.has(file)) {
    console.log(`  ${file.padEnd(24)} \x1b[2mskipped (Run is disabled for this module in the app)\x1b[0m`);
    continue;
  }
  const src = readFileSync(join(LESSON_DIR, file), 'utf8');
  const challenges = extractChallenges(src);
  if (!challenges.length) continue;
  const marks = [];
  for (const c of challenges) {
    let res = runPython(c.solution);
    // A NameError usually means the solution leans on its lesson's starterCode, which
    // the learner has in the editor. Retry with that context before calling it broken.
    if (!res.ok && /NameError/.test(res.err || '') && c.starter) {
      res = runPython(`${c.starter}\n${c.solution}`);
    }
    if (!res.ok) {
      // Pyodide allows top-level await; a plain python3 file does not. Not a lesson bug.
      if (/'await' outside function/.test(res.err || '')) {
        skip += 1;
        marks.push(`\x1b[2m~\x1b[0m`);
        continue;
      }
      if (res.missing) {
        skip += 1;
        marks.push(`\x1b[2m~\x1b[0m`);
        continue;
      }
      fail += 1;
      marks.push(`\x1b[31m✗\x1b[0m`);
      failures.push({ file, id: c.id, why: 'solution raised', detail: res.err.trim().split('\n').pop() });
      continue;
    }
    const verdict = runValidator(c.validateFn, res.out);
    if (verdict === true) {
      pass += 1;
      marks.push(`\x1b[32m✓\x1b[0m`);
    } else if (verdict && verdict.threw) {
      fail += 1;
      marks.push(`\x1b[31m!\x1b[0m`);
      failures.push({ file, id: c.id, why: 'validator threw', detail: verdict.threw });
    } else {
      fail += 1;
      marks.push(`\x1b[31m✗\x1b[0m`);
      failures.push({
        file, id: c.id, why: 'solution does not satisfy its own validator',
        detail: `output was: ${JSON.stringify(res.out.slice(0, 120))}`,
      });
    }
  }
  console.log(`  ${file.padEnd(24)} ${marks.join('')}`);
}

try { unlinkSync(TMP); } catch { /* already gone */ }

// ---- project steps ------------------------------------------------------------------------
// Project steps carry a validateFn but no solution, so their answers cannot be executed the way
// lesson solutions can. What is still worth catching automatically is the class of bug found in
// module8: a validator body written in Python, which `new Function` rejects at runtime and which
// the app can only report to the learner as "validator error, please report". Parsing every body
// costs nothing and makes that impossible to ship.
const PROJECT_DIR = join(ROOT, 'lib', 'projects');
let projSteps = 0;
const projBroken = [];
let projectFiles = [];
try { projectFiles = readdirSync(PROJECT_DIR).filter((f) => f.endsWith('.ts')); } catch { /* none */ }
for (const file of projectFiles) {
  const src = readFileSync(join(PROJECT_DIR, file), 'utf8');
  const idRe = /^\s*id:\s*"([^"]+)"/gm;
  let m;
  while ((m = idRe.exec(src))) {
    const body = readTemplate(src.slice(m.index), 'validateFn:');
    if (!body) continue;
    projSteps += 1;
    try {
      new Function('output', 'locals', body);
    } catch (err) {
      projBroken.push({ file, id: m[1], detail: String(err) });
    }
  }
}
if (projSteps) {
  const mark = projBroken.length ? `\x1b[31m${projBroken.length} broken\x1b[0m` : `\x1b[32mall parse\x1b[0m`;
  console.log(`\n  project steps: ${projSteps} validators checked · ${mark}`);
  for (const p of projBroken) console.log(`    ${p.file} ${p.id}: ${p.detail}`);
}

console.log(`\n  ${pass} passed · ${fail} failed · ${skip} skipped (package not installed locally)`);
if (failures.length) {
  console.log('\n  Failures:');
  for (const f of failures) {
    console.log(`    ${f.file} ${f.id}: ${f.why}`);
    console.log(`      ${f.detail}`);
  }
}
process.exit(fail || projBroken.length ? 1 : 0);
