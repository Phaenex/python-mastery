"use client";

import Link from "next/link";
import { useState } from "react";
import type { Module, Project } from "@/lib/types";
import { type Track, trackProgress } from "@/lib/tracks";

const ACCENT: Record<Track["accent"], { text: string; border: string; bar: string }> = {
  accent: { text: "text-accent", border: "border-accent/40", bar: "bg-accent" },
  success: { text: "text-success", border: "border-success/40", bar: "bg-success" },
  warning: { text: "text-warning", border: "border-warning/40", bar: "bg-warning" },
};

export function TrackCard({
  track,
  modules,
  projects,
  completed,
  requiresTitle,
}: {
  track: Track;
  modules: Module[];
  /** All projects; the card picks out the ones this track ends with. */
  projects: Project[];
  completed: Set<string>;
  /** Title of the track this one builds on, when it has one. */
  requiresTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const { total, done, next } = trackProgress(track, modules, completed);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const tone = ACCENT[track.accent];
  const started = done > 0;
  const trackProjects = (track.projects ?? [])
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p));

  return (
    <section className={`border ${tone.border} rounded-md p-5 font-mono`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className={`text-base font-semibold ${tone.text}`}>{track.title}</h2>
        <p className="text-xs text-muted-foreground">
          {done}/{total} lessons
          {requiresTitle && (
            <>
              {" · "}
              <span>after {requiresTitle}</span>
            </>
          )}
        </p>
      </div>

      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{track.goal}</p>

      <div
        className="mt-4 h-1.5 rounded-full bg-border/60 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${track.title} progress`}
      >
        <div className={`h-full ${tone.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        {next ? (
          <Link
            href={`/learn/${next.moduleSlug}/${next.lessonSlug}`}
            className={`px-3 py-2 rounded border ${tone.border} ${tone.text} hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
          >
            {started ? "continue" : "start"} · {next.title}
          </Link>
        ) : (
          <span className="px-3 py-2 rounded border border-success/40 text-success">
            track complete
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          {open ? "hide" : "show"} the {track.modules.length} modules
          {trackProjects.length > 0 && ` + ${trackProjects.length} project${trackProjects.length > 1 ? "s" : ""}`}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{track.rationale}</p>
          <ol className="mt-3 space-y-1.5">
            {track.modules.map((slug, i) => {
              const mod = modules.find((m) => m.slug === slug);
              if (!mod) return null;
              const modDone = mod.lessons.filter((l) =>
                completed.has(`${mod.slug}/${l.slug}`),
              ).length;
              const allDone = modDone === mod.lessons.length && mod.lessons.length > 0;
              return (
                <li key={slug} className="flex items-baseline gap-3 text-xs">
                  <span className="text-muted-foreground w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/learn/${mod.slug}/${mod.lessons[0]?.slug ?? ""}`}
                    className="text-foreground hover:underline flex-1 min-w-0"
                  >
                    {mod.title}
                  </Link>
                  <span className={allDone ? "text-success" : "text-muted-foreground"}>
                    {modDone}/{mod.lessons.length}
                  </span>
                </li>
              );
            })}
          </ol>

          {trackProjects.length > 0 && (
            <>
              <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
                then build it
              </p>
              <ul className="mt-2 space-y-1.5">
                {trackProjects.map((p) => (
                  <li key={p.slug} className="flex items-baseline gap-3 text-xs">
                    <span className="text-muted-foreground w-6 shrink-0" aria-hidden="true">
                      ▸
                    </span>
                    <Link
                      href={`/projects/${p.slug}`}
                      className={`${tone.text} hover:underline flex-1 min-w-0`}
                    >
                      {p.title}
                    </Link>
                    <span className="text-muted-foreground">{p.steps.length} steps</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
