import type { Metadata } from "next";

// The page itself is a client component and so cannot export metadata. Without this
// every route shared the root title and tabs were indistinguishable.
export const metadata: Metadata = {
  title: "Your stats · python-mastery",
  description: "XP, streak, and per-module progress.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
