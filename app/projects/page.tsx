"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { getAllProjects } from "@/lib/projects";
import { safeJsonParse } from "@/lib/storage";

const STORAGE_KEY = "python-mastery-project-progress";

export default function ProjectsPage() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const projects = getAllProjects();

  useEffect(() => {
    const list = safeJsonParse<string[]>(localStorage.getItem(STORAGE_KEY), []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setCompletedSteps(new Set(list));
  }, []);

  const totalSteps = projects.reduce((sum, p) => sum + p.steps.length, 0);
  const completedCount = completedSteps.size;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between text-xs font-mono">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            <span className="text-accent">$</span> cd ~
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href="/learn"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              lessons
            </Link>
            <span className="text-foreground">&gt; projects</span>
            <Link
              href="/stats"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              stats
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <h1 className="sr-only">Projects</h1>
        <section className="font-mono text-sm">
          <p>
            <span className="text-accent">damato@python</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-muted-foreground">~/projects$</span>{" "}
            <span>ls</span>
            <span className="ml-1 inline-block w-2 h-4 align-text-bottom bg-foreground terminal-cursor" aria-hidden="true" />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount} of {totalSteps} steps done across {projects.length} projects
          </p>
        </section>

        <section className="mt-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono"># projects</p>
          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                completedSteps={completedSteps}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 font-mono text-xs text-muted-foreground space-y-1">
          <p># notes</p>
          <p>each project runs from real datasets embedded in the page (no downloads).</p>
          <p>steps validate on run. solutions unlock after a couple of failed attempts.</p>
          <p>longer-form than lessons, useful when i want to apply what a module covers.</p>
        </section>
      </main>

      <footer className="border-t border-border/50 py-5 font-mono text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span><span className="text-success">exit 0</span> · personal use · next.js + pyodide</span>
          <Link
            href="/"
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            ~ home
          </Link>
        </div>
      </footer>
    </div>
  );
}
