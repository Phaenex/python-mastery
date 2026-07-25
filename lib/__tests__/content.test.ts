import { describe, it, expect } from "vitest";
import { getAllModules, getLessonBySlug, getNextLesson, getPreviousLesson } from "../lessons";
import { getAllProjects, getProjectBySlug, getProjectStepIndex } from "../projects";
import { MODULE_METADATA } from "../modules";

const modules = getAllModules();
const lessons = modules.flatMap((m) => m.lessons);
const projects = getAllProjects();

describe("catalog shape", () => {
  it("every module in metadata has at least one lesson", () => {
    const empty = modules.filter((m) => m.lessons.length === 0).map((m) => m.slug);
    expect(empty, `modules declared but with no lessons: ${empty.join(", ")}`).toEqual([]);
  });

  it("every lesson points at a module that exists", () => {
    const known = new Set(MODULE_METADATA.map((m) => m.slug));
    for (const l of lessons) {
      expect(known, `lesson ${l.slug} has unknown moduleSlug ${l.moduleSlug}`).toContain(
        l.moduleSlug,
      );
    }
  });

  it("lesson slugs are unique within a module", () => {
    for (const m of modules) {
      const slugs = m.lessons.map((l) => l.slug);
      expect(new Set(slugs).size, `duplicate lesson slug in ${m.slug}`).toBe(slugs.length);
    }
  });

  it("challenge ids are unique across the whole site", () => {
    // Progress and completion are keyed on these, so a collision silently marks an
    // unrelated challenge complete.
    const ids = lessons.flatMap((l) => l.challenges.map((c) => c.id));
    const seen = new Set<string>();
    const dupes = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
    expect(dupes, `duplicate challenge ids: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
  });

  it("every challenge has a prompt, a validator and a solution", () => {
    for (const l of lessons) {
      for (const c of l.challenges) {
        expect(c.prompt.trim().length, `${c.id} has an empty prompt`).toBeGreaterThan(0);
        expect(c.validateFn.trim().length, `${c.id} has an empty validateFn`).toBeGreaterThan(0);
        expect(c.solution.trim().length, `${c.id} has an empty solution`).toBeGreaterThan(0);
      }
    }
  });

  it("every lesson has theory and at least one challenge", () => {
    for (const l of lessons) {
      expect(l.theory.trim().length, `${l.slug} has no theory`).toBeGreaterThan(50);
      expect(l.challenges.length, `${l.slug} has no challenges`).toBeGreaterThan(0);
    }
  });
});

describe("lesson navigation", () => {
  it("finds a lesson by module and slug", () => {
    const l = getLessonBySlug("ai-python", "embeddings");
    expect(l?.title).toBe("Embeddings and Similarity");
  });

  it("returns undefined for a slug that does not exist", () => {
    expect(getLessonBySlug("ai-python", "nope")).toBeUndefined();
  });

  it("next and previous are inverses in the middle of the list", () => {
    const first = lessons[0];
    const second = getNextLesson(first.moduleSlug, first.slug);
    expect(second).toBeDefined();
    const back = getPreviousLesson(second!.moduleSlug, second!.slug);
    expect(back?.slug).toBe(first.slug);
  });

  it("has no next past the final lesson and no previous before the first", () => {
    const last = lessons[lessons.length - 1];
    expect(getNextLesson(last.moduleSlug, last.slug)).toBeUndefined();
    expect(getPreviousLesson(lessons[0].moduleSlug, lessons[0].slug)).toBeUndefined();
  });
});

describe("projects", () => {
  it("project slugs are unique", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every project has steps, and every step has a validator", () => {
    for (const p of projects) {
      expect(p.steps.length, `${p.slug} has no steps`).toBeGreaterThan(0);
      for (const s of p.steps) {
        expect(s.validateFn.trim().length, `${p.slug}/${s.id} has no validateFn`).toBeGreaterThan(0);
      }
    }
  });

  it("every project step validator is valid JavaScript", () => {
    // module8 shipped 28 validators written in Python, which the app can only surface
    // to a learner as "validator error, please report". Cheap to make impossible.
    for (const p of projects) {
      for (const s of p.steps) {
        expect(
          () => new Function("output", "locals", s.validateFn),
          `${p.slug}/${s.id} validateFn does not parse as JavaScript`,
        ).not.toThrow();
      }
    }
  });

  it("resolves a step index and reports -1 for an unknown project", () => {
    const p = projects[0];
    expect(getProjectStepIndex(p.slug, p.steps[0].id)).toBe(0);
    expect(getProjectStepIndex("nope", "nope")).toBe(-1);
    expect(getProjectBySlug("nope")).toBeUndefined();
  });
});
