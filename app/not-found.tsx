import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundTerminal } from "@/components/NotFoundTerminal";

// A server component so it can carry its own title; the path readout that needs the
// client lives in NotFoundTerminal.
export const metadata: Metadata = {
  title: "Page not found · python-mastery",
};

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="min-h-screen flex flex-col bg-background text-foreground font-mono text-sm">
      <section className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        {/* The page states the error as shell output by design, so the heading is for
            assistive tech only. Without it the 404 had no h1 and announced nothing. */}
        <h1 className="sr-only">Page not found</h1>
        <NotFoundTerminal />

        <p className="mt-8">
          <span className="text-accent">damato@python</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-muted-foreground">~$</span>{" "}
          <span>cd ~</span>
          <span className="ml-1 inline-block w-2 h-4 align-text-bottom bg-foreground terminal-cursor" aria-hidden="true" />
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-3 py-2 rounded border border-border hover:border-accent hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-accent">→</span> back to ~/lessons
        </Link>
      </section>

      <footer className="border-t border-border/60 py-5 font-mono text-xs">
        <div className="max-w-3xl mx-auto px-6 text-muted-foreground">
          <span className="text-error">exit 1</span> · path not found
        </div>
      </footer>
    </main>
  );
}
