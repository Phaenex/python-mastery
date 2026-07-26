"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ChallengeBlock from "@/components/ChallengeBlock";
import { PyodideProvider, usePyodideRuntime } from "@/components/PyodideProvider";
import { getCompletedLessons } from "@/lib/progress";
import { getDueLessons, markReviewed } from "@/lib/storage";
import { useLearn } from "@/lib/mode";
import { buildReviewSet, type ReviewItem } from "@/lib/review";

function RuntimeStatus() {
  const { isLoading, isReady, error } = usePyodideRuntime();
  return (
    <span className="font-mono text-xs flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          error ? "bg-error" : isLoading || !isReady ? "bg-warning animate-pulse motion-reduce:animate-none" : "bg-success"
        }`}
        aria-hidden="true"
      />
      <span className={error ? "text-error" : isLoading || !isReady ? "text-warning" : "text-success"}>
        {error ? "pyodide: failed" : isLoading || !isReady ? "pyodide: loading…" : "pyodide: ready"}
      </span>
    </span>
  );
}

function ReviewSession() {
  const learn = useLearn();
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!learn || startedRef.current) return;
    startedRef.current = true;
    const completed = [...getCompletedLessons()];
    const due = getDueLessons(completed);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only data, resolve after mount
    setItems(buildReviewSet(completed, due));
  }, [learn]);

  if (!learn) {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        # mixed review is a local learning tool. run the site on localhost to use it.{" "}
        <Link href="/" className="text-accent hover:underline">~ home</Link>
      </p>
    );
  }

  if (items === null) {
    return <p className="font-mono text-xs text-muted-foreground">loading review set…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        # nothing to review yet. finish a lesson first.{" "}
        <Link href="/learn" className="text-accent hover:underline">cd ~/lessons</Link>
      </p>
    );
  }

  if (index >= items.length) {
    return (
      <div className="font-mono text-sm">
        <p className="text-success">exit 0 · review session complete</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {reviewed} lesson{reviewed !== 1 ? "s" : ""} re-solved from memory · their next
          reviews were pushed further out.
        </p>
        <div className="mt-6 flex gap-4 text-xs">
          <Link href="/learn" className="text-accent hover:underline">cd ~/lessons</Link>
          <Link href="/stats" className="text-muted-foreground hover:text-foreground">stats/</Link>
        </div>
      </div>
    );
  }

  const item = items[index];

  const advance = () => setIndex((i) => i + 1);
  const onComplete = () => {
    markReviewed(`${item.moduleSlug}/${item.lessonSlug}`);
    setReviewed((n) => n + 1);
    setTimeout(advance, 900);
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4 font-mono text-xs">
        <p className="text-muted-foreground">
          <span className="text-accent">review {index + 1}</span>/{items.length}
          <span className="ml-3 text-muted">interleaved · from memory</span>
        </p>
        <button
          type="button"
          onClick={advance}
          className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
        >
          skip →
        </button>
      </div>
      <p className="mb-2 font-mono text-[11px] text-muted-foreground">
        {item.moduleSlug}/{item.lessonSlug} · <span className="text-foreground/80">{item.lessonTitle}</span>
      </p>
      <ChallengeBlock
        key={`${item.moduleSlug}/${item.lessonSlug}/${item.challenge.id}`}
        challenge={item.challenge}
        starterCode={item.starterCode}
        challengeNumber={index + 1}
        totalChallenges={items.length}
        reviewMode
        onComplete={onComplete}
      />
    </div>
  );
}

export default function ReviewPage() {
  return (
    <PyodideProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="border-b border-border/60">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between text-xs font-mono">
            <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-accent">$</span> cd ../lessons
            </Link>
            <RuntimeStatus />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
          <h1 className="sr-only">Review — spaced repetition</h1>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1"># mixed review</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-6">
            spaced repetition across modules. solve from memory. each one re-solved
            pushes that lesson&apos;s next review further out.
          </p>
          <ReviewSession />
        </main>
      </div>
    </PyodideProvider>
  );
}
