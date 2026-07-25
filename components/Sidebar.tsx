"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Module } from "@/lib/types";
import { DownloadNotesButton } from "@/components/DownloadNotesButton";

interface SidebarProps {
  module: Module;
  completedLessons: Set<string>;
}

// Lesson-page module nav: shows only the CURRENT module's lessons (mirrors
// sql-mastery's LessonNav). completedLessons is the mode-aware set from the
// page (getCompletedLessons), so showcase shows every lesson complete and
// learn shows real per-browser progress, no direct localStorage reads here.
export function Sidebar({ module, completedLessons }: SidebarProps) {
  const pathname = usePathname();
  const completedCount = module.lessons.filter((l) =>
    completedLessons.has(`${module.slug}/${l.slug}`),
  ).length;

  return (
    <nav
      className="w-72 h-full overflow-y-auto p-4 font-mono text-sm"
      aria-label="Module lessons"
    >
      <div className="rounded border border-border bg-card/40 p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            # {module.slug}
          </p>
          <span className="text-[10px] text-accent">
            {completedCount}/{module.lessons.length}
          </span>
        </div>

        <ul className="mt-1 space-y-0.5">
          {module.lessons.map((lesson, idx) => {
            const lessonPath = `/learn/${module.slug}/${lesson.slug}`;
            const isActive = pathname === lessonPath;
            const isCompleted = completedLessons.has(`${module.slug}/${lesson.slug}`);
            const marker = isCompleted ? "✓" : isActive ? ">" : " ";
            const markerClass = isCompleted
              ? "text-success"
              : isActive
                ? "text-accent"
                : "text-muted-foreground";

            return (
              <li key={lesson.slug}>
                <Link
                  href={lessonPath}
                  className={`flex items-baseline gap-2 px-2 py-1.5 min-h-6 rounded text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span aria-hidden="true" className={`w-3 ${markerClass}`}>
                    {marker}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{lesson.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <DownloadNotesButton module={module} />

      <Link
        href="/learn"
        className="mt-1 block px-2 py-1 min-h-6 text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        ← cd ~/lessons
      </Link>
    </nav>
  );
}
