import { getAllModules } from "./lessons";
import { getAllProjects } from "./projects";

export const A11Y_ROUTE_INVENTORY_VERSION = 1 as const;

export interface A11yRouteInventory {
  version: typeof A11Y_ROUTE_INVENTORY_VERSION;
  counts: {
    modules: number;
    lessons: number;
    projects: number;
  };
  lessonRoutes: string[];
  projectRoutes: string[];
}

/**
 * The canonical page inventory consumed by the external accessibility gates.
 *
 * Keep this derived from the same collections that render /learn and /projects. A
 * hand-maintained list would make adding a lesson and adding accessibility coverage two
 * separate jobs, which is how most of the curriculum went unmeasured in the first place.
 */
export function getA11yRouteInventory(): A11yRouteInventory {
  const modules = getAllModules();
  const lessonRoutes = modules.flatMap((module) =>
    module.lessons.map(
      (lesson) => `/learn/${module.slug}/${lesson.slug}`,
    ),
  );
  const projectRoutes = getAllProjects().map(
    (project) => `/projects/${project.slug}`,
  );

  return {
    version: A11Y_ROUTE_INVENTORY_VERSION,
    counts: {
      modules: modules.length,
      lessons: lessonRoutes.length,
      projects: projectRoutes.length,
    },
    lessonRoutes,
    projectRoutes,
  };
}
