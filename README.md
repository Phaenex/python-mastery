# Python Mastery

Interactive Python learning platform. Write real Python and pandas code directly in your browser, no installation needed. 111 lessons across 18 modules, plus 6 guided projects.

**Live site:** [damato-python.vercel.app](https://damato-python.vercel.app)

**Stack:** Next.js · TypeScript · Tailwind · Pyodide (Python in the browser)

## What it does

- **Run Python in the browser.** Uses Pyodide so there's no install step. Pandas and numpy come pre-loaded.
- **Instant feedback.** Write code in the editor, click Run, see output. Automatic validation tells you when you got it right.
- **Progress tracking and streaks.** State persists across sessions. Continue where you left off.
- **Built specifically for WCTC coursework.** The Data Manipulation module mirrors what's actually being taught in WCTC's Python Data Manipulation class.

## Curriculum (18 modules, 111 lessons)

| Module | Topic | Lessons |
|---|---|---|
| 01 | Start Here — first run, variables, and how to learn here | 3 |
| 02 | Python Basics — variables, lists, dicts, loops, functions | 5 |
| 03 | Pandas Fundamentals — DataFrames, selecting, filtering, sorting | 5 |
| 04 | Data Cleaning — missing data, type conversion, duplicates | 6 |
| 05 | Grouping & Combining — groupby, merging, pivot tables | 5 |
| 06 | String & File Ops — string methods, regex, file I/O, JSON | 5 |
| 07 | Web & APIs — HTTP requests, JSON parsing, scraping, pipelines | 6 |
| 08 | Building APIs — routing, validation, auth, and handler tests | 5 |
| 09 | Databases from Python — queries, transactions, constraints, pandas | 6 |
| 10 | Functions & Apply — lambda, apply/map, vectorization | 5 |
| 11 | Core Python Deep Dive — generators, decorators, async, collections | 7 |
| 12 | NumPy Foundations — arrays, broadcasting, reshape, vectorization | 5 |
| 13 | AI Engineering — model calls, retrieval, tools, agents, streaming | 13 |
| 14 | Game Dev with Pygame — sprites, collision, physics, sound, state | 11 |
| 15 | Data Manipulation (WCTC) — strings, dates, combining, pivots | 5 |
| 16 | Shipping Python — dependencies, secrets, containers, health | 4 |
| 17 | Object-Oriented Python — classes, inheritance, protocols, patterns | 9 |
| 18 | Tooling & Environments — venv, pytest, debugging, profiling | 6 |

Plus 6 guided projects to apply the skills end to end.

## Why I built it

I'm finishing an AAS in AI Data Specialist at WCTC. Halfway through my Python Data Manipulation course, I realized the assigned learning resources weren't great for actually practicing the pandas patterns the course expected. So I built this. It scratches my own itch, and it's free for anyone else taking the same course or learning pandas from scratch.

The Pygame module came later — I was taking the Python Game Development course and wanted browser-based lessons for that too.

## Local dev

```bash
git clone https://github.com/Phaenex/python-mastery.git
cd python-mastery
npm install
npm run dev
```

Open http://localhost:3000.

## Notable technical bits

- **Pyodide integration.** Loading Python in the browser means a ~10MB initial download but no server costs. Pandas runs entirely client-side.
- **Pygame lessons run locally** (not Pyodide) since Pygame needs a real display. The lessons walk you through running locally with a launcher script.
- **Mobile responsive.** The editor adapts for phones, though obviously a real keyboard helps.
