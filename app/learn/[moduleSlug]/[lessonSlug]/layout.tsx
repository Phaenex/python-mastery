import type { Metadata } from "next";
import { getLessonBySlug } from "@/lib/lessons";

// The lesson page is a client component and cannot export metadata itself, so the title
// came from app/learn/layout.tsx and every lesson in the course shared it. Someone
// working through the material with several lessons open saw a row of tabs all reading
// "Lessons", and a screen reader announced the same title on every navigation. A layout
// is a server component, so it can name the actual lesson.
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { moduleSlug, lessonSlug } = await params;
  const lesson = getLessonBySlug(moduleSlug, lessonSlug);
  if (!lesson) return { title: "Lesson not found · python-mastery" };
  return {
    title: `${lesson.title} · ${lesson.module} · python-mastery`,
    description: `Lesson ${lesson.lessonNumber} of the ${lesson.module} module.`,
  };
}

export default function LessonLayout({ children }: LayoutProps) {
  return children;
}
