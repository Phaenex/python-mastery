<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes; APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# python-mastery maintainer notes

**Stack:** Next.js 16 · TypeScript · Tailwind v4 · Pyodide (v0.27, in-browser Python + pandas + numpy) · Monaco editor

**Key conventions:**
- Tailwind v4 uses `@tailwindcss/postcss`, not v3's config file
- Theme uses CSS custom properties (`bg-background`, `text-foreground`, `text-accent`, `text-error`, `text-success`) defined in `app/globals.css`. Not slate/indigo (that's sql-mastery).
- Lesson state lives in localStorage. Keys: `python-mastery-xp`, `python-mastery-streak`, `python-mastery-max-streak`, `python-mastery-last-active`, `python-mastery-completed`, `python-mastery-project-progress`, `python-mastery-project-completed`, `python-mastery-code-{module}-{slug}`, `python-mastery-project-{module}-{slug}`.
- `lib/storage.ts` exports `safeJsonParse` and `safeReadNumber` for guarded reads. Use these instead of raw `JSON.parse(localStorage.getItem(...))`.
- Pyodide code execution has a 10s watchdog timeout in `lib/pyodide.ts`. UI unfreezes after timeout but the Python keeps running until tab reload. Real kill-switch requires moving Pyodide into a Web Worker.
- Lesson content lives in `lib/lessons/module*.ts`. Theory markdown supports inline callouts via `💡 Key:`, `⚠️ Warning:`, `✨ Tip:`, `📝 Note:` paragraph prefixes; rendered terminal-style by `components/TheoryContent.tsx`.

**Env vars:** none currently required. Template at `.env.example`.

**Routes:**
- `/` — homepage with interactive shell prompt + module list
- `/learn` — module index
- `/learn/[moduleSlug]/[lessonSlug]` — lesson view (theory / examples / challenges / cheatsheet tabs + Monaco editor + Pyodide)
- `/projects` — project index
- `/projects/[slug]` — guided multi-step project
- `/stats` — XP, rank ladder, streak with max, per-module breakdown

**Build checks before shipping:**
```bash
npm run verify         # lessons, vitest, lint, tsc, build
```

**Accessibility gates** (need a running server; pass a URL or they hit production):
```bash
npm run check:a11y     -- http://localhost:3010   # axe-core, every route × 2 schemes × 2 widths
npm run check:ux       -- http://localhost:3010   # 45 hand-written UX checks
npm run check:keyboard -- http://localhost:3010   # keyboard-only journey through a lesson
```
`check:keyboard` exists because axe cannot press a key. It caught a WCAG 2.1.2 trap that
59 clean axe scans could not see: the editor swallowed every Tab and Shift+Tab, so a
keyboard user who reached it had to reload the page to escape. Escape now arms
"Tab moves focus" for one keypress. Editor key handling lives in `lib/editor-keys.ts` as
a pure function precisely so it can be unit tested; do not move it back into the
component.

`check:a11y` fails on skipped routes and on duplicate `<title>`s, not only on axe
violations — a route that times out used to print one yellow dot and still report
"no violations".

**Deployment:** Vercel auto-deploys main branch. Live at https://damato-python.vercel.app.

**Related local projects:** sql-mastery (same shell pattern, different runtime). The portfolio site `damato-portfolio` analytics tracker is NOT installed here on purpose; self-traffic was polluting the dashboard.
