import type { Metadata } from "next";
import { getProjectBySlug } from "@/lib/projects";

// Same reason as the lesson layout: the project page is a client component, so without
// this every project shared the "Projects" title from app/projects/layout.tsx.
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found · python-mastery" };
  return {
    title: `${project.title} · python-mastery`,
    description: project.description,
  };
}

export default function ProjectLayout({ children }: LayoutProps) {
  return children;
}
