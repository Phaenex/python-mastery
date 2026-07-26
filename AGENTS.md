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

**Accessibility gates:**
```bash
npm run check:all      # builds nothing: boots the built app, runs all 5 gates, tears down
npm run check:all -- https://damato-python.vercel.app   # or point at a live target
```
Individually (each needs a running server; pass a URL or they hit production):
```bash
npm run check:a11y       -- http://localhost:3010   # axe-core, every route × 2 schemes × 2 widths
npm run check:ux         -- http://localhost:3010   # 45 hand-written UX checks
npm run check:keyboard   -- http://localhost:3010   # keyboard-only journey, both editor surfaces
npm run check:modals     -- http://localhost:3010   # dialog focus trap / Escape / restore
npm run check:components -- http://localhost:3010   # disclosure, radiogroup, mouse-only controls
npm run check:semantics  -- http://localhost:3010   # heading outline, landmarks, live announcements
```

Each gate exists because axe structurally cannot see the thing it checks:

- **keyboard** — axe never presses a key. It caught a WCAG 2.1.2 trap 59 clean axe scans
  could not: the editor swallowed every Tab and Shift+Tab, so a keyboard user who reached
  it had to reload the page. Escape now arms "Tab moves focus" for one keypress. Key
  handling lives in `lib/editor-keys.ts` as a pure function so it can be unit tested; do
  not move it back into the component.
- **modals** — a focus trap is the one place trapping is correct. Checks focus enters,
  Tab stays in, Escape closes, focus returns. Address dialogs by `aria-label`: three of
  them share `[role="dialog"][aria-modal="true"]` and the tour renders unprompted, so a
  generic selector measures the wrong one.
- **components** — `aria-controls` pointing at nothing, radiogroups that ignore arrow
  keys, and pointer-cursor elements that Tab cannot reach.
- **semantics** — heading outline and whether results are announced. Every section title
  used to be a styled `<p>`, so heading navigation reached the page title and stopped.

`check:a11y` also fails on skipped routes, duplicate `<title>`s, and text that animates
its own opacity — all three used to pass silently. The opacity rule reads the `@keyframes`
from the CSSOM rather than matching the animation's name, because the fix for that bug is
called `ring-pulse` and a name check flagged the fix as the bug.

**Anything that carries text must not animate its opacity.** Tailwind's `animate-pulse`
fades to 50%, which drops text below contrast while it moves. Put the animation on a
decorative `aria-hidden` sibling — see `.attention-ring` in `globals.css`.

**Deployment:** Vercel auto-deploys main branch. Live at https://damato-python.vercel.app.

**Related local projects:** sql-mastery (same shell pattern, different runtime). The portfolio site `damato-portfolio` analytics tracker is NOT installed here on purpose; self-traffic was polluting the dashboard.
