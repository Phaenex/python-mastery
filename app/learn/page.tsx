"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ModuleCard } from "@/components/ModuleCard";
import { getAllModules } from "@/lib/lessons";
import { getStreakData } from "@/lib/streak";
import { safeReadNumber, getDueLessons } from "@/lib/storage";
import { getCompletedLessons } from "@/lib/progress";
import { isShowcase } from "@/lib/mode";

export default function LearnDashboard() {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const modules = getAllModules();

  useEffect(() => {
    const completed = getCompletedLessons();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setCompletedLessons(completed);
    if (isShowcase()) return;
    setTotalXP(safeReadNumber(localStorage.getItem("python-mastery-xp"), 0));
    const streakData = getStreakData();
    setStreak(streakData.currentStreak);
    setDueCount(getDueLessons([...completed]).length);
  }, []);

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = completedLessons.size;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between text-xs font-mono">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-accent">$</span> cd ~
          </Link>
          <nav className="flex items-center gap-5">
            <span className="text-foreground">&gt; lessons</span>
            <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">projects</Link>
            <Link href="/stats" className="text-muted-foreground hover:text-foreground transition-colors">stats</Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <h1 className="sr-only">Lessons — all modules</h1>
        <section className="font-mono text-sm">
          <p>
            <span className="text-accent">damato@python</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-muted-foreground">~/lessons$</span>{" "}
            <span>status</span>
            <span className="ml-1 inline-block w-2 h-4 align-text-bottom bg-foreground terminal-cursor" aria-hidden="true" />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount} of {totalLessons} lessons done
            {streak > 0 && <>{" · "}<span className="text-warning">{streak}d streak</span></>}
            {totalXP > 0 && <>{" · "}<span className="text-accent">{totalXP} xp</span></>}
            {dueCount > 0 && (
              <>
                {" · "}
                <Link href="/stats" className="text-amber-400 hover:underline">
                  {dueCount} due for review
                </Link>
              </>
            )}
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono"># modules</p>
            <Link
              href="/start"
              className="font-mono text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              browsing all {modules.length}? pick a track instead →
            </Link>
          </div>
          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const prevModule = index > 0 ? modules[index - 1] : null;
              const prevModuleCompletedCount = prevModule
                ? prevModule.lessons.filter((l) =>
                    completedLessons.has(`${prevModule.slug}/${l.slug}`)
                  ).length
                : 0;
              const prevModuleTotalLessons = prevModule ? prevModule.lessons.length : 0;

              return (
                <ModuleCard
                  key={module.slug}
                  module={module}
                  moduleIndex={index}
                  completedLessons={completedLessons}
                  previousModuleCompletedCount={prevModuleCompletedCount}
                  previousModuleTotalLessons={prevModuleTotalLessons}
                />
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-5 font-mono text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span><span className="text-success">exit 0</span> · personal use · next.js + pyodide</span>
          <Link href="/" className="hover:text-foreground transition-colors">~ home</Link>
        </div>
      </footer>
    </div>
  );
}
