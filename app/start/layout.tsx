import type { Metadata } from "next";

// The page is a client component and cannot export metadata, so without this it fell
// back to the root title and was indistinguishable from five other routes in a tab strip.
export const metadata: Metadata = {
  title: "Start here · python-mastery",
  description: "Pick a track and take the first lesson.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
