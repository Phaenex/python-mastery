import type { Module } from "./types";

// Tracks are a view over the modules, not a second copy of them.
//
// At 91 lessons across 15 modules the module index is a wall: nothing on it answers
// "which of these do I need, in what order, to get to X". A track names a goal and
// lists the module slugs that serve it, in dependency order. Modules appear in more
// than one track on purpose, because Foundations really is a prerequisite for the
// rest and duplicating that fact is cheaper than making people infer it.
//
// Adding a module to a track is a one-line change here. Nothing else needs to know.

export interface Track {
  slug: string;
  title: string;
  /** One line, concrete, no marketing. What you can do at the end. */
  goal: string;
  /** Why this order, in the author's voice. Shown when the track is expanded. */
  rationale: string;
  /** Module slugs, in the order they should be taken. */
  modules: string[];
  /**
   * Project slugs that belong at the end of this track, once the modules are done.
   *
   * Without this a track ends at its last lesson and the capstone is only reachable by
   * browsing to /projects, which meant someone could finish all twelve AI lessons and
   * never learn the capstone existed.
   */
  projects?: string[];
  /** Tracks whose modules should be finished first. */
  requires?: string[];
  accent: "accent" | "success" | "warning";
}

export const TRACKS: Track[] = [
  {
    slug: "foundations",
    title: "Foundations",
    goal: "Read and write Python confidently, and model a problem with objects instead of a pile of functions.",
    rationale:
      "Everything else assumes this. Core Python is where comprehensions, generators, decorators, and context managers stop being other people's code and start being yours. Object-oriented work comes next because tool dispatch, dataclasses, and most library APIs expect you to think in objects.",
    modules: [
      "start-here",
      "python-basics",
      "core-python",
      "oop-tooling",
      "tooling-environments",
    ],
    projects: ["log-analyzer", "text-analyzer"],
    accent: "accent",
  },
  {
    slug: "ai-engineering",
    title: "AI Engineering",
    goal: "Build things on top of language models: structured output, retrieval, tool use, and code you can actually test.",
    rationale:
      "The order is a real dependency chain, not a preference. Embeddings and similarity are numpy, so numpy comes first. Structured output is parsing, so the string and file work comes before it. Tool dispatch is a dictionary of callables, which is why object-oriented Python sits in Foundations rather than here.",
    modules: [
      "numpy-foundations",
      "string-file-ops",
      "web-apis",
      "ai-python",
    ],
    projects: ["ai-doc-assistant"],
    requires: ["foundations"],
    accent: "success",
  },
  {
    slug: "data",
    title: "Working With Data",
    goal: "Load messy real-world data, clean it, group it, reshape it, and trust the result.",
    rationale:
      "Pandas first for the shape of a DataFrame, then cleaning because real data is never ready, then grouping and combining once you have something worth aggregating. The practice module at the end is applied repetition rather than new concepts.",
    modules: [
      "pandas-fundamentals",
      "data-cleaning",
      "grouping-combining",
      "functions-apply",
      "data-manipulation-school",
      "databases-python",
    ],
    projects: ["building-permits", "survey-explorer", "sales-dashboard"],
    requires: ["foundations"],
    accent: "accent",
  },
  {
    slug: "games",
    title: "Games With Pygame",
    goal: "Build a real game loop: movement, sprites, collision, state, and a finished Brick Breakaway clone.",
    rationale:
      "Standalone on purpose. Nothing else depends on it and it depends on nothing past the basics, so it is the one track you can take out of order. Pygame needs a real window, so these lessons are written to run on your machine rather than in the browser.",
    modules: ["game-dev-pygame"],
    requires: ["foundations"],
    accent: "warning",
  },
];

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}

/** Every track a module belongs to. A module can serve more than one goal. */
export function tracksForModule(moduleSlug: string): Track[] {
  return TRACKS.filter((t) => t.modules.includes(moduleSlug));
}

export interface TrackProgress {
  total: number;
  done: number;
  /** Next unfinished lesson in track order, or null when the track is complete. */
  next: { moduleSlug: string; lessonSlug: string; title: string } | null;
}

/** Every track a project closes out. Used to link a project back to its track. */
export function tracksForProject(projectSlug: string): Track[] {
  return TRACKS.filter((t) => t.projects?.includes(projectSlug));
}

/**
 * Progress through a track in its own order, which is not the module index order.
 * `completed` holds "moduleSlug/lessonSlug" keys, matching lib/progress.
 */
export function trackProgress(
  track: Track,
  modules: Module[],
  completed: Set<string>,
): TrackProgress {
  let total = 0;
  let done = 0;
  let next: TrackProgress["next"] = null;

  for (const slug of track.modules) {
    const mod = modules.find((m) => m.slug === slug);
    if (!mod) continue; // a track may name a module that has not been written yet
    for (const lesson of mod.lessons) {
      total += 1;
      if (completed.has(`${mod.slug}/${lesson.slug}`)) {
        done += 1;
      } else if (!next) {
        next = { moduleSlug: mod.slug, lessonSlug: lesson.slug, title: lesson.title };
      }
    }
  }

  return { total, done, next };
}
