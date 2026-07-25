import type { Metadata } from "next";

// The page itself is a client component and so cannot export metadata. Without this
// every route shared the root title and tabs were indistinguishable.
export const metadata: Metadata = {
  title: "Projects · python-mastery",
  description: "Guided multi-step builds, including the AI capstone.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
