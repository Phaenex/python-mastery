"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { MobileModuleNav } from "@/components/MobileModuleNav";
import { InterfaceOnboarding } from "@/components/InterfaceOnboarding";
import { TutorChat, type TutorChatHandle } from "@/components/TutorChat";
import { TheoryContent } from "@/components/TheoryContent";
import ExampleBlock from "@/components/ExampleBlock";
import ChallengeBlock from "@/components/ChallengeBlock";
import ProjectChallengeBlock from "@/components/ProjectChallengeBlock";
import { LessonAnchorNav, type AnchorSection } from "@/components/LessonAnchorNav";
import { NextLessonCard } from "@/components/NextLessonCard";
import ModuleCheckpoint from "@/components/ModuleCheckpoint";
import { hasCheckpoint } from "@/lib/checkpoints";
import YourTurn from "@/components/YourTurn";
import LessonToolDock, { type DockTool } from "@/components/LessonToolDock";
import PythonCheatSheet from "@/components/PythonCheatSheet";
import { PyodideProvider, usePyodideRuntime } from "@/components/PyodideProvider";
import {
  getAllModules,
  getLessonBySlug,
  getNextLesson,
  getPreviousLesson,
} from "@/lib/lessons";
import { updateStreak } from "@/lib/streak";
import { markReviewed, isDue, safeReadNumber, safeSetItem } from "@/lib/storage";
import { getCompletedLessons, markLessonComplete } from "@/lib/progress";
import { isShowcase } from "@/lib/mode";

interface LessonPageProps {
  params: Promise<{ moduleSlug: string; lessonSlug: string }>;
}

function RuntimeStatus() {
  const { isLoading, isReady, error } = usePyodideRuntime();
  return (
    <span className="font-mono text-xs flex items-center gap-2">
      {error ? (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-error" aria-hidden="true" />
          <span className="text-error">pyodide: failed · refresh to retry</span>
        </>
      ) : isLoading || !isReady ? (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-warning">pyodide: loading…</span>
        </>
      ) : (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-success" aria-hidden="true" />
          <span className="text-success">pyodide: ready</span>
        </>
      )}
    </span>
  );
}

export default function LessonPage({ params }: LessonPageProps) {
  const { moduleSlug, lessonSlug } = use(params);

  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState<DockTool | null>(null);
  const [tutorCode, setTutorCode] = useState("");
  const [tutorError, setTutorError] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  // Recall-gated SRS: a due+completed lesson opened in learn mode is a
  // review session. The box only advances on a real re-solve (see
  // handleChallengeComplete), never just by opening.
  const [reviewSession, setReviewSession] = useState(false);
  const [reviewRecorded, setReviewRecorded] = useState(false);
  const tutorRef = useRef<TutorChatHandle | null>(null);
  const completeFiredRef = useRef(false);
  const reviewMarkedRef = useRef(false);

  const modules = getAllModules();
  const currentModule = modules.find((m) => m.slug === moduleSlug);
  const lesson = getLessonBySlug(moduleSlug, lessonSlug);
  const nextLesson = lesson ? getNextLesson(moduleSlug, lessonSlug) : null;
  const prevLesson = lesson ? getPreviousLesson(moduleSlug, lessonSlug) : null;
  const lessonKey = `${moduleSlug}/${lessonSlug}`;
  const isAlreadyComplete = completedLessons.has(lessonKey);
  const isPygame = moduleSlug === "game-dev-pygame";

  useEffect(() => {
    const set = getCompletedLessons();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setCompletedLessons(set);
    // Opening a due+completed lesson does NOT advance the SRS box; that
    // only happens on a real re-solve. Here we just flag the review session.
    setReviewSession(!isShowcase() && set.has(lessonKey) && isDue(lessonKey));
  }, [lessonKey]);

  const fireComplete = useCallback(() => {
    if (isShowcase() || completeFiredRef.current) return;
    completeFiredRef.current = true;
    const added = markLessonComplete(lessonKey);
    setCompletedLessons((prev) => new Set(prev).add(lessonKey));
    if (added) {
      updateStreak();
      // Regular lessons must move XP too, or the rank ladder is unreachable
      // through normal study. Project challenges award their own XP separately.
      const LESSON_XP = 50;
      const cur = safeReadNumber(localStorage.getItem("python-mastery-xp"), 0);
      safeSetItem("python-mastery-xp", String(cur + LESSON_XP));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      // Let the pop-quiz listener consider a surprise recall check.
      if (typeof window !== "undefined") window.dispatchEvent(new Event("lesson-completed"));
    }
  }, [lessonKey]);

  const handleChallengeComplete = useCallback(
    (challengeId: string) => {
      if (!lesson) return;
      // Active-recall review: re-solving one challenge from memory in a due
      // review session is enough to record the review and push the box out.
      if (reviewSession && !reviewMarkedRef.current && !isShowcase()) {
        reviewMarkedRef.current = true;
        markReviewed(lessonKey);
        setReviewRecorded(true);
      }
      setCompletedChallengeIds((prev) => {
        if (prev.has(challengeId)) return prev;
        const next = new Set(prev).add(challengeId);
        const allDone =
          lesson.challenges.length > 0 &&
          lesson.challenges.every((c) => next.has(c.id));
        if (allDone) fireComplete();
        return next;
      });
    },
    [lesson, fireComplete, reviewSession, lessonKey],
  );

  const handleAskTutor = useCallback((prompt: string) => {
    setDockOpen(null);
    tutorRef.current?.openWithPrompt(prompt);
  }, []);

  const handleDockOpen = useCallback((tool: DockTool | null) => {
    if (tool === "tutor") {
      setDockOpen(null);
      tutorRef.current?.openWithPrompt("");
      return;
    }
    setDockOpen(tool);
  }, []);

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-start justify-center bg-background text-foreground font-mono text-sm px-6 max-w-2xl mx-auto">
        <p>
          <span className="text-accent">damato@python</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-muted-foreground">~$</span> cat /learn/{moduleSlug}/{lessonSlug}
        </p>
        <p className="mt-2 text-error">cat: no such lesson</p>
        <Link
          href="/learn"
          className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded border border-border hover:border-accent hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-accent">→</span> back to ~/lessons
        </Link>
      </div>
    );
  }

  const hasChallenges = lesson.challenges.length > 0;
  const totalChallenges = lesson.challenges.length;

  const anchorSections: AnchorSection[] = (() => {
    const s: AnchorSection[] = [{ id: "theory", label: "theory" }];
    if (lesson.examples.length > 0)
      s.push({ id: "examples", label: "examples", badge: String(lesson.examples.length) });
    if (hasChallenges)
      s.push({
        id: "challenges",
        label: "challenges",
        badge: `${completedChallengeIds.size}/${totalChallenges}`,
      });
    if (lesson.projectChallenge) s.push({ id: "project", label: "project" });
    return s;
  })();

  const allChallengesDone =
    hasChallenges && completedChallengeIds.size === totalChallenges;
  const showNextLessonCard = allChallengesDone || isAlreadyComplete;

  return (
    <PyodideProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="open module nav"
              >
                ☰
              </button>
              <Link
                href="/learn"
                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                <span className="text-accent">$</span> cd ../lessons
              </Link>
            </div>
            <RuntimeStatus />
          </div>
        </header>

        {currentModule && (
          <MobileModuleNav
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            module={currentModule}
            completedLessons={completedLessons}
          />
        )}

        <div className="border-b border-border/60 bg-card/20">
          <div className="max-w-7xl mx-auto px-6 py-2 font-mono text-xs text-muted-foreground">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 truncate">
              <Link href="/" className="hover:text-foreground transition-colors rounded">
                ~
              </Link>
              <span>/</span>
              <Link href="/learn" className="hover:text-foreground transition-colors rounded">
                lessons
              </Link>
              <span>/</span>
              <span className="text-foreground/80 truncate">{moduleSlug}</span>
              <span>/</span>
              <span className="text-foreground truncate">{lessonSlug}</span>
            </nav>
          </div>
        </div>

        {showToast && (
          <div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down motion-reduce:animate-none font-mono text-sm"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-baseline gap-2 px-4 py-2 rounded border border-success bg-background/95 backdrop-blur">
              <span className="text-success">exit 0</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground">lesson complete</span>
            </div>
          </div>
        )}

        <div className="flex items-start">
          {currentModule && (
            <div className="hidden lg:block lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto shrink-0">
              <Sidebar module={currentModule} completedLessons={completedLessons} />
            </div>
          )}

          <main id="main" tabIndex={-1} className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full min-w-0">
            <section className="mb-4">
              <p className="font-mono text-xs text-muted-foreground">
                <span className="text-accent">[{lesson.badge}]</span>
                <span className="ml-2 text-muted-foreground">{lesson.module}</span>
                {isAlreadyComplete && <span className="ml-2 text-success">· done</span>}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">{lesson.title}</h1>
            </section>

            {reviewSession && (
              <div
                className="mb-6 rounded border border-warning/40 bg-warning/[0.06] px-4 py-3 font-mono text-xs"
                role="status"
              >
                {reviewRecorded ? (
                  <span className="text-success">
                    ✓ review recorded · next review pushed further out
                  </span>
                ) : (
                  <>
                    <span className="text-warning">review · due now</span>
                    <span className="ml-2 text-muted-foreground">
                      re-solve a challenge from memory (editor starts blank) to
                      record the review and widen the next interval
                    </span>
                  </>
                )}
              </div>
            )}

            <LessonAnchorNav sections={anchorSections} />

            <div className="space-y-10 mt-6">
              <section id="theory" className="scroll-mt-32">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  # theory
                </p>
                <TheoryContent content={lesson.theory} />
              </section>

              {lesson.examples.length > 0 && (
                <section id="examples" className="scroll-mt-32">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    # examples <span className="text-muted">[{lesson.examples.length}]</span>
                  </p>
                  <div className="space-y-6">
                    {lesson.examples.map((example, idx) => (
                      <ExampleBlock
                        key={idx}
                        example={example}
                        index={idx}
                        isPygame={isPygame}
                        onActiveCodeChange={setTutorCode}
                      />
                    ))}
                  </div>
                </section>
              )}

              <YourTurn moduleSlug={moduleSlug} lessonSlug={lessonSlug} />

              {hasChallenges && (
                <section id="challenges" className="scroll-mt-32">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    # challenges <span className="text-muted">[{totalChallenges}]</span>
                  </p>
                  <div className="space-y-6">
                    {lesson.challenges.map((challenge, idx) => (
                      <ChallengeBlock
                        key={challenge.id}
                        challenge={challenge}
                        starterCode={lesson.starterCode}
                        challengeNumber={idx + 1}
                        totalChallenges={totalChallenges}
                        isPygame={isPygame}
                        reviewMode={reviewSession}
                        onComplete={() => handleChallengeComplete(challenge.id)}
                        onAskTutor={handleAskTutor}
                        onActiveCodeChange={setTutorCode}
                        onActiveErrorChange={setTutorError}
                      />
                    ))}
                  </div>
                </section>
              )}

              {lesson.projectChallenge && (
                <section id="project" className="scroll-mt-32">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    # project
                  </p>
                  <ProjectChallengeBlock
                    projectChallenge={lesson.projectChallenge}
                    moduleSlug={moduleSlug}
                    lessonSlug={lessonSlug}
                    isPygame={isPygame}
                    onActiveCodeChange={setTutorCode}
                  />
                </section>
              )}

              {currentModule &&
                currentModule.lessons.length > 0 &&
                currentModule.lessons[currentModule.lessons.length - 1]?.slug === lessonSlug &&
                hasCheckpoint(moduleSlug) && <ModuleCheckpoint moduleSlug={moduleSlug} />}

              {showNextLessonCard && (
                <NextLessonCard
                  nextLesson={
                    nextLesson
                      ? {
                          slug: nextLesson.slug,
                          moduleSlug: nextLesson.moduleSlug,
                          title: nextLesson.title,
                        }
                      : null
                  }
                />
              )}
            </div>

            <nav
              className="mt-12 pt-6 border-t border-border font-mono text-xs flex items-center justify-between gap-3"
              aria-label="Lesson navigation"
            >
              {prevLesson ? (
                <Link
                  href={`/learn/${prevLesson.moduleSlug}/${prevLesson.slug}`}
                  className="flex items-baseline gap-2 px-3 py-2 rounded border border-border hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-0"
                >
                  <span className="text-muted-foreground">← prev:</span>
                  <span className="text-foreground truncate max-w-[220px]">{prevLesson.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link
                  href={`/learn/${nextLesson.moduleSlug}/${nextLesson.slug}`}
                  className="flex items-baseline gap-2 px-3 py-2 rounded border border-accent text-accent hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-0"
                >
                  <span className="text-muted-foreground">next:</span>
                  <span className="truncate max-w-[220px]">{nextLesson.title}</span>
                  <span>→</span>
                </Link>
              ) : (
                <Link
                  href="/learn"
                  className="flex items-baseline gap-2 px-3 py-2 rounded border border-success text-success hover:bg-success/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span>exit 0</span>
                  <span className="text-muted-foreground">·</span>
                  <span>back to ~/lessons</span>
                </Link>
              )}
            </nav>
          </main>
        </div>

        <LessonToolDock tools={["reference", "tutor"]} open={dockOpen} onOpen={handleDockOpen}>
          <PythonCheatSheet
            moduleSlug={moduleSlug}
            open={dockOpen === "reference"}
            onClose={() => setDockOpen(null)}
          />
        </LessonToolDock>

        <TutorChat
          ref={tutorRef}
          lessonTitle={lesson.title}
          moduleSlug={moduleSlug}
          currentCode={tutorCode}
          errorMessage={tutorError}
        />
        <InterfaceOnboarding />
      </div>
    </PyodideProvider>
  );
}
