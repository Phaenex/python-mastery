import type { Project } from "./types";
import { logAnalyzerProject } from "./projects/log-analyzer";
import { textAnalyzerProject } from "./projects/text-analyzer";
import { buildingPermitsProject } from "./projects/building-permits";
import { surveyExplorerProject } from "./projects/survey-explorer";
import { salesDashboardProject } from "./projects/sales-dashboard";
import { aiDocAssistantProject } from "./projects/ai-doc-assistant";

const ALL_PROJECTS: Project[] = [
  logAnalyzerProject,
  textAnalyzerProject,
  buildingPermitsProject,
  surveyExplorerProject,
  salesDashboardProject,
  aiDocAssistantProject,
];

export function getAllProjects(): Project[] {
  return ALL_PROJECTS;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return ALL_PROJECTS.find((p) => p.slug === slug);
}

export function getProjectStepIndex(slug: string, stepId: string): number {
  const project = getProjectBySlug(slug);
  if (!project) return -1;
  return project.steps.findIndex((s) => s.id === stepId);
}
