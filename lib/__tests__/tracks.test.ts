import { describe, it, expect } from "vitest";
import { TRACKS, getTrack, tracksForModule, tracksForProject, trackProgress } from "../tracks";
import { getAllModules } from "../lessons";
import { getAllProjects } from "../projects";
import type { Module } from "../types";

const modules = getAllModules();
const projects = getAllProjects();
const moduleSlugs = new Set(modules.map((m) => m.slug));
const projectSlugs = new Set(projects.map((p) => p.slug));

describe("track integrity", () => {
  // The failure this guards against actually happened: the AI capstone was written,
  // shipped, and left unreferenced by any track, so finishing the track never led to it.
  it("every module slug named by a track exists", () => {
    for (const track of TRACKS) {
      for (const slug of track.modules) {
        expect(moduleSlugs, `${track.slug} names a module that does not exist: ${slug}`).toContain(
          slug,
        );
      }
    }
  });

  it("every project slug named by a track exists", () => {
    for (const track of TRACKS) {
      for (const slug of track.projects ?? []) {
        expect(projectSlugs, `${track.slug} names a project that does not exist: ${slug}`).toContain(
          slug,
        );
      }
    }
  });

  it("every module belongs to at least one track", () => {
    const orphans = modules
      .filter((m) => m.lessons.length > 0)
      .filter((m) => tracksForModule(m.slug).length === 0)
      .map((m) => m.slug);
    expect(orphans, `modules unreachable from any track: ${orphans.join(", ")}`).toEqual([]);
  });

  it("every project belongs to at least one track", () => {
    const orphans = projects
      .filter((p) => tracksForProject(p.slug).length === 0)
      .map((p) => p.slug);
    expect(orphans, `projects unreachable from any track: ${orphans.join(", ")}`).toEqual([]);
  });

  it("every required track exists", () => {
    for (const track of TRACKS) {
      for (const req of track.requires ?? []) {
        expect(getTrack(req), `${track.slug} requires unknown track ${req}`).toBeDefined();
      }
    }
  });

  it("no track is empty", () => {
    for (const track of TRACKS) {
      const { total } = trackProgress(track, modules, new Set());
      expect(total, `${track.slug} has no lessons`).toBeGreaterThan(0);
    }
  });
});

describe("trackProgress", () => {
  const ai = getTrack("ai-engineering")!;

  it("starts at zero and points to the first lesson of the first module", () => {
    const p = trackProgress(ai, modules, new Set());
    expect(p.done).toBe(0);
    expect(p.next).not.toBeNull();
    expect(p.next!.moduleSlug).toBe(ai.modules[0]);
  });

  it("counts completions and advances next past them", () => {
    const first = modules.find((m) => m.slug === ai.modules[0])!;
    const completed = new Set([`${first.slug}/${first.lessons[0].slug}`]);
    const p = trackProgress(ai, modules, completed);
    expect(p.done).toBe(1);
    expect(p.next!.lessonSlug).not.toBe(first.lessons[0].slug);
  });

  it("reports next as null once every lesson is done", () => {
    const all = new Set<string>();
    for (const slug of ai.modules) {
      const mod = modules.find((m) => m.slug === slug);
      mod?.lessons.forEach((l) => all.add(`${mod.slug}/${l.slug}`));
    }
    const p = trackProgress(ai, modules, all);
    expect(p.done).toBe(p.total);
    expect(p.next).toBeNull();
  });

  it("follows track order, not module-index order", () => {
    // A track lists modules in its own sequence. Progress must walk that sequence,
    // otherwise "continue" sends you to a lesson from a different part of the site.
    const p = trackProgress(ai, modules, new Set());
    expect(p.next!.moduleSlug).toBe("numpy-foundations");
  });

  it("ignores a module a track names but that has no lessons yet", () => {
    const ghost = { ...ai, modules: [...ai.modules, "not-written-yet"] };
    const p = trackProgress(ghost, modules as Module[], new Set());
    expect(p.total).toBe(trackProgress(ai, modules, new Set()).total);
  });
});
