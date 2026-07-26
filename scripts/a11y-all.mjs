#!/usr/bin/env node
/**
 * Run every accessibility gate against a server this script owns.
 *
 * The gates each need a running site, which is why none of them are in `npm run verify`
 * and why in practice they only got run when someone remembered to run them. This starts
 * the built app on its own port, runs all six, shuts the server down, and returns a
 * single exit code.
 *
 *   npm run check:all              build output must already exist (npm run build)
 *   node scripts/a11y-all.mjs https://damato-python.vercel.app   use a live target instead
 *
 * Passing a URL skips starting a server, so the same command covers production.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { loadRouteInventory } from './a11y-routes.mjs';

const GATES = [
  ['axe-core', 'scripts/a11y-axe.mjs'],
  ['hand-written UX', 'scripts/a11y-verify.mjs'],
  ['keyboard journey', 'scripts/a11y-keyboard.mjs'],
  ['dialog behaviour', 'scripts/a11y-modals.mjs'],
  ['component contracts', 'scripts/a11y-components.mjs'],
  ['tree semantics', 'scripts/a11y-semantics.mjs'],
];

const PORT = process.env.A11Y_PORT || 3011;
const external = process.argv[2];
const BASE = external || `http://localhost:${PORT}`;

let server = null;

async function waitForServer(url, ms = 120000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(1000);
  }
  return false;
}

function run(script, base) {
  return new Promise((resolve) => {
    const child = spawn('node', [script, base], { stdio: 'inherit' });
    child.on('error', () => resolve(2));
    child.on('close', (code) => resolve(code ?? 1));
  });
}

function shutdown() {
  if (server && !server.killed) {
    // SIGTERM so Next can close its handles, rather than orphaning the port.
    server.kill('SIGTERM');
    server = null;
  }
}
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });

if (!external) {
  console.log(`\x1b[1mstarting the built app on port ${PORT}\x1b[0m`);
  server = spawn('npx', ['next', 'start', '-p', String(PORT)], { stdio: 'ignore' });
  const up = await waitForServer(BASE);
  if (!up) {
    console.log(`\n\x1b[31m  BROKEN RUN: server never came up on ${BASE}.\x1b[0m`);
    console.log('  Nothing was measured. Has `npm run build` been run?');
    shutdown();
    process.exit(2);
  }

  // Warm the routes the gates will visit. A cold first request to a dynamic route once
  // took long enough that axe timed out on it and reported the route as never scanned —
  // the guard was right, but the cause was this runner starting the gates the instant
  // the port opened rather than anything wrong with the page.
  for (const route of ['/', '/learn', '/projects', '/stats', '/glossary', '/review',
    '/learn/ai-python/embeddings', '/projects/ai-doc-assistant']) {
    await fetch(BASE + route, { signal: AbortSignal.timeout(60000) }).catch(() => {});
  }
}

let inventory;
try {
  inventory = await loadRouteInventory(BASE);
} catch (error) {
  console.log(`\n\x1b[31m  BROKEN RUN: ${error.message}\x1b[0m`);
  shutdown();
  process.exit(2);
}

console.log(`\x1b[1mrunning ${GATES.length} gates against ${BASE}\x1b[0m\n`);
console.log(
  `catalog: ${inventory.counts.modules} modules · ${inventory.counts.lessons} lessons · ` +
  `${inventory.counts.projects} projects\n`,
);

const results = [];
for (const [name, script] of GATES) {
  console.log(`\x1b[1m── ${name} ──\x1b[0m`);
  const code = await run(script, BASE);
  results.push({ name, code });
  console.log('');
}

shutdown();

console.log('\x1b[1m════ accessibility gates ════\x1b[0m');
for (const { name, code } of results) {
  const label = code === 0 ? '\x1b[32mPASS\x1b[0m' : code === 2 ? '\x1b[33mBROKEN\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  ${label}  ${name}`);
}
// A gate that could not run is reported separately from one that ran and failed: the
// first means nothing was measured, which is the more dangerous of the two because it
// otherwise looks like silence.
const broken = results.filter((r) => r.code === 2);
const failed = results.filter((r) => r.code !== 0 && r.code !== 2);
if (broken.length) console.log(`\n  \x1b[33m${broken.length} gate(s) could not run — that is not a pass.\x1b[0m`);
if (failed.length) console.log(`\n  \x1b[31m${failed.length} gate(s) failed.\x1b[0m`);
if (!broken.length && !failed.length) console.log('\n  \x1b[32mall gates passed\x1b[0m');

process.exit(broken.length || failed.length ? 1 : 0);
