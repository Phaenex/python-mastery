import type { Module, Lesson } from "./types";
import { MODULE_METADATA } from "./modules";
import { lessonsModuleStartHere } from "./lessons/moduleStartHere";
import { lessonsModule1 } from "./lessons/module1";
import { lessonsModuleCore } from "./lessons/moduleCore";
import { lessonsModule2 } from "./lessons/module2";
import { lessonsModule3 } from "./lessons/module3";
import { lessonsModule4 } from "./lessons/module4";
import { lessonsModule5 } from "./lessons/module5";
import { lessonsModule6 } from "./lessons/module6";
import { lessonsModule7 } from "./lessons/module7";
import { lessonsModuleNumpy } from "./lessons/moduleNumpy";
import { lessonsModuleAi } from "./lessons/moduleAi";
import { lessonsModuleDatabases } from "./lessons/moduleDatabases";
import { lessonsModuleApis } from "./lessons/moduleApis";
import { lessonsModuleShipping } from "./lessons/moduleShipping";
import { lessonsModule8 } from "./lessons/module8";
import { lessonsModule9 } from "./lessons/module9";
import { lessonsModuleOop } from "./lessons/moduleOop";
import { lessonsModuleTooling } from "./lessons/moduleTooling";

const ALL_LESSONS: Lesson[] = [
  ...lessonsModuleStartHere,
  ...lessonsModule1,
  ...lessonsModule2,
  ...lessonsModule3,
  ...lessonsModule4,
  ...lessonsModule5,
  ...lessonsModule6,
  ...lessonsModule7,
  ...lessonsModuleApis,
  ...lessonsModuleDatabases,
  ...lessonsModuleCore,
  ...lessonsModuleNumpy,
  ...lessonsModuleAi,
  ...lessonsModule8,
  ...lessonsModule9,
  ...lessonsModuleOop,
  ...lessonsModuleShipping,
  ...lessonsModuleTooling,
];

export function getAllModules(): Module[] {
  return MODULE_METADATA.map((meta) => ({
    ...meta,
    lessons: ALL_LESSONS.filter((l) => l.moduleSlug === meta.slug),
  }));
}

export function getLessonBySlug(
  moduleSlug: string,
  lessonSlug: string
): Lesson | undefined {
  return ALL_LESSONS.find(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug
  );
}

export function getNextLesson(
  moduleSlug: string,
  lessonSlug: string
): Lesson | undefined {
  const currentIndex = ALL_LESSONS.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug
  );
  if (currentIndex === -1 || currentIndex === ALL_LESSONS.length - 1) {
    return undefined;
  }
  return ALL_LESSONS[currentIndex + 1];
}

export function getPreviousLesson(
  moduleSlug: string,
  lessonSlug: string
): Lesson | undefined {
  const currentIndex = ALL_LESSONS.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug
  );
  if (currentIndex <= 0) {
    return undefined;
  }
  return ALL_LESSONS[currentIndex - 1];
}
