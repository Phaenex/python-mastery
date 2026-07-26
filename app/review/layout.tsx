import type { Metadata } from "next";

// Same reason as app/start/layout.tsx: the review page is a client component.
export const metadata: Metadata = {
  title: "Review · python-mastery",
  description: "Lessons that are due for another pass.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
