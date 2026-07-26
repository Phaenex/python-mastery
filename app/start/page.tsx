"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrackCard } from "@/components/TrackCard";
import { getAllModules } from "@/lib/lessons";
import { getAllProjects } from "@/lib/projects";
import { TRACKS, getTrack } from "@/lib/tracks";
import { getCompletedLessons } from "@/lib/progress";

// Replaces the old static "the path" page. That version described a single numbered
// route through the material in prose, which stopped being true once the catalog
// reached 91 lessons across 15 modules serving more than one goal. This asks the only
// question worth asking on arrival: what are you here for.
export default function StartPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const modules = getAllModules();
  const projects = getAllProjects();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setCompleted(getCompletedLessons());
  }, []);

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-mono text-sm">
      <header className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <span className="text-accent">$</span> cd ~
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/learn"
              className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              lessons
            </Link>
            <Link
              href="/glossary"
              className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              glossary
            </Link>
            <Link
              href="/next-steps"
              className="text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              next steps
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-semibold">Start here</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          You learn Python here by writing it, in your browser, with nothing to install.
          If you have never coded before that is fine: the first module in Foundations
          assumes you know nothing and has you running real code in about a minute.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          There are {totalLessons} lessons, which is too many to take in order without a
          reason. Pick the track that matches what you actually want. Modules repeat
          across tracks on purpose, because Foundations really is a prerequisite for the
          rest.
        </p>

        <section className="mt-10 space-y-5">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># tracks</h2>
          {TRACKS.map((track) => (
            <TrackCard
              key={track.slug}
              track={track}
              modules={modules}
              projects={projects}
              completed={completed}
              requiresTitle={
                track.requires
                  ?.map((r) => getTrack(r)?.title)
                  .filter(Boolean)
                  .join(", ") || undefined
              }
            />
          ))}
        </section>

        <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
          Prefer to browse?{" "}
          <Link href="/learn" className="text-accent hover:underline">
            Every module
          </Link>{" "}
          is still listed flat, and nothing stops you jumping straight into a lesson.
        </p>
      </main>

      <footer className="border-t border-border/60 py-5 text-xs">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span>
            <span className="text-success">exit 0</span> · personal use · next.js + pyodide
          </span>
          <Link href="/" className="hover:text-foreground transition-colors">
            ~ home
          </Link>
        </div>
      </footer>
    </div>
  );
}
