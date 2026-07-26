"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HomeTerminal from "@/components/HomeTerminal";
import ModeToggle from "@/components/ModeToggle";
import { DownloadNotesButton } from "@/components/DownloadNotesButton";
import { getAllModules } from "@/lib/lessons";
import { getCompletedLessons } from "@/lib/progress";

const fullModules = getAllModules();
const modules = fullModules.map((m, i) => ({
  num: String(i + 1).padStart(2, "0"),
  slug: m.slug,
  firstLesson: m.lessons[0]?.slug ?? "",
  title: m.slug,
  desc: m.description,
  lessons: m.lessons.length,
}));

export default function Home() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setCompleted(getCompletedLessons());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-mono text-sm">
      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 sm:py-16">
        {/* The page leads with a terminal prompt by design, so the h1 is for assistive
            tech only. Without it this page had no h1 at all and screen-reader users got
            no page heading. */}
        <h1 className="sr-only">python-mastery — learn Python by writing it</h1>
        <section className="flex flex-wrap items-baseline justify-between gap-3" aria-label="shell prompt">
          <div className="flex-1 min-w-0">
            <HomeTerminal modules={modules} />
          </div>
          <p className="text-xs text-muted-foreground">
            {'// type '}
            <span className="text-foreground/80">help</span>
            {' · ↑↓ history · tab completes'}
          </p>
        </section>

        <section className="mt-6 space-y-4" aria-label="mode and progress notice">
          <ModeToggle />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-accent text-accent hover:bg-accent/10 transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              new here? start here →
            </Link>
            <Link href="/glossary" className="text-xs text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">glossary</Link>
            <Link href="/next-steps" className="text-xs text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">where to go next</Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># modules</h2>
          <ul className="mt-3 border-y border-border/60 divide-y divide-border/40">
            {modules.map((m, idx) => {
              const doneCount = (() => {
                try {
                  return Array.from(completed).filter((k) => k.startsWith(`${m.slug}/`)).length;
                } catch { return 0; }
              })();
              const status = doneCount === 0
                ? "─"
                : doneCount === m.lessons
                ? "✓ complete"
                : `${doneCount}/${m.lessons}`;
              const statusClass = doneCount === m.lessons
                ? "text-success"
                : doneCount > 0
                ? "text-accent"
                : "text-muted-foreground";
              return (
                <li key={m.slug} className="flex items-center gap-1">
                  <Link
                    href={`/learn/${m.slug}/${m.firstLesson}`}
                    // The five fixed columns total ~296px of track plus gaps, which cannot
                    // fit a 320px viewport (400% zoom), so the row pushed the page into
                    // horizontal scroll. Below sm the lesson count and status drop out of
                    // the grid and ride under the title instead; both are still present in
                    // the accessible name and reappear from sm up.
                    className="group grid flex-1 grid-cols-[2rem_minmax(0,1fr)_1rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_5rem_7rem_1rem] gap-2 sm:gap-3 items-center py-2 px-2 -ml-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Open module ${m.title}`}
                  >
                    <span className="text-muted-foreground">{m.num}</span>
                    <span className="min-w-0 truncate">
                      <span className="text-foreground">modules/{m.title}/</span>
                      <span className="text-muted-foreground hidden md:inline">  {m.desc}</span>
                      <span className="block sm:hidden text-xs text-muted-foreground">
                        {m.lessons} lessons · <span className={statusClass}>{status}</span>
                      </span>
                    </span>
                    <span className="hidden sm:block text-muted-foreground text-xs">{m.lessons} lessons</span>
                    <span className={`hidden sm:block text-xs ${statusClass}`}>{status}</span>
                    <span className="text-muted-foreground group-hover:text-accent transition-colors">→</span>
                  </Link>
                  <DownloadNotesButton module={fullModules[idx]} compact />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10 grid sm:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># projects</h2>
            <Link
              href="/projects"
              className="mt-3 block py-2 px-2 -mx-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-foreground">projects/</span>
              <span className="ml-3 text-muted-foreground">→</span>
            </Link>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># stats</h2>
            <Link
              href="/stats"
              className="mt-3 block py-2 px-2 -mx-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-foreground">stats/</span>
              <span className="ml-3 text-muted-foreground">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-5 font-mono text-xs">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span>
            <span className="text-success">exit 0</span> · personal use · next.js + pyodide
          </span>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/start" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">start</Link>
            <Link href="/glossary" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">glossary</Link>
            <Link href="/next-steps" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">next steps</Link>
            <Link href="/projects" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">projects/</Link>
            <a href="https://damato-sql.vercel.app" className="hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">learn sql →</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
