"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";
import { CopyButton } from "./CopyButton";
import { usePyodideRuntime } from "./PyodideProvider";
import { createValidator } from "@/lib/validator";
import { isShowcase } from "@/lib/mode";
import { safeJsonParse } from "@/lib/storage";
import type { ProjectChallenge } from "@/lib/types";

interface ProjectChallengeBlockProps {
  projectChallenge: ProjectChallenge;
  moduleSlug: string;
  lessonSlug: string;
  isPygame?: boolean;
  onActiveCodeChange?: (code: string) => void;
}

const SOLUTION_GATE = 3;

export default function ProjectChallengeBlock({
  projectChallenge,
  moduleSlug,
  lessonSlug,
  isPygame = false,
  onActiveCodeChange,
}: ProjectChallengeBlockProps) {
  const { isReady, runCode } = usePyodideRuntime();
  const [code, setCode] = useState(projectChallenge.starterCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const xpAwardedRef = useRef(false);

  const codeKey = `python-mastery-project-${moduleSlug}-${lessonSlug}`;
  const lessonId = `${moduleSlug}/${lessonSlug}`;

  useEffect(() => {
    const saved = localStorage.getItem(codeKey);
    setCode(saved || projectChallenge.starterCode);
    setOutput("");
    setError(null);
    setExecutionTime(0);
    setAttempts(0);
    xpAwardedRef.current = false;
    const done = new Set(
      safeJsonParse<string[]>(
        localStorage.getItem("python-mastery-project-completed"),
        [],
      ),
    );
    setCompleted(done.has(lessonId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-init only when the lesson changes
  }, [codeKey]);

  useEffect(() => {
    if (code !== projectChallenge.starterCode) localStorage.setItem(codeKey, code);
    onActiveCodeChange?.(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- starterCode stable per project
  }, [code]);

  const handleRun = useCallback(async () => {
    if (!isReady || isPygame) return;
    setIsRunning(true);
    setError(null);

    const result = await runCode(code);
    setOutput(result.output);
    setError(result.error);
    setExecutionTime(result.executionTime);

    if (!result.error) {
      try {
        const validate = createValidator(projectChallenge.validateFn);
        const ok = validate(result.output, result.locals);
        if (ok && !completed && !xpAwardedRef.current) {
          xpAwardedRef.current = true;
          setCompleted(true);
          // Showcase is frozen, never mutate XP/progress for portfolio visitors.
          if (!isShowcase()) {
            const xp =
              parseInt(localStorage.getItem("python-mastery-xp") || "0", 10) || 0;
            const next = xp + projectChallenge.xpReward;
            localStorage.setItem("python-mastery-xp", String(next));
            window.dispatchEvent(new Event("xp-updated"));
            const done = new Set(
              safeJsonParse<string[]>(
                localStorage.getItem("python-mastery-project-completed"),
                [],
              ),
            );
            done.add(lessonId);
            localStorage.setItem(
              "python-mastery-project-completed",
              JSON.stringify([...done]),
            );
          }
          setOutput(
            (p) => p + `\n\n# project validated · exit 0 · +${projectChallenge.xpReward} xp`,
          );
        } else if (!ok) {
          setAttempts((n) => n + 1);
          setOutput((p) => p + "\n\n# validation failed · check the output and try again");
        }
      } catch (err) {
        console.warn("[ProjectChallengeBlock] validateFn threw:", err);
        setAttempts((n) => n + 1);
        setOutput(
          (p) =>
            p +
            "\n\n# validator error in this project challenge. open devtools to see the cause and please report.",
        );
      }
    } else {
      setAttempts((n) => n + 1);
    }

    setIsRunning(false);
  }, [isReady, isPygame, runCode, code, projectChallenge, completed, lessonId]);

  const handleReset = useCallback(() => {
    setCode(projectChallenge.starterCode);
    setOutput("");
    setError(null);
    setExecutionTime(0);
  }, [projectChallenge.starterCode]);

  return (
    <div className="rounded border border-warning/40 bg-warning/5">
      <div className="px-4 py-3 border-b border-warning/20 font-mono text-xs flex items-center justify-between gap-3">
        <div>
          <p className="text-warning"># project-challenge</p>
          <p className="mt-1 text-muted-foreground">
            thread: {projectChallenge.threadTitle} · reward: {projectChallenge.xpReward} xp
          </p>
        </div>
        {completed && <span className="text-success">✓ done</span>}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            # brief
          </p>
          <p className="text-sm text-foreground leading-relaxed">{projectChallenge.context}</p>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            # task
          </p>
          <h4 className="font-medium text-foreground">{projectChallenge.taskTitle}</h4>
        </div>

        <div className="font-mono text-xs">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-warning hover:text-warning/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            {showHint ? "▼" : "▶"} hint
          </button>
          {showHint && (
            <p className="mt-2 text-muted-foreground border-l-2 border-warning/40 pl-3">
              <span className="text-warning">!</span> {projectChallenge.hint}
            </p>
          )}
        </div>

        <div className="rounded border border-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border font-mono text-xs">
            <span className="text-muted-foreground"># your code</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                reset
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={!isReady || isRunning || isPygame}
                className="px-2 py-1 rounded border border-warning text-warning hover:bg-warning/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isRunning ? "running…" : "run & check"}
              </button>
            </div>
          </div>
          <div style={{ height: 240 }}>
            <CodeEditor
              code={code}
              onChange={setCode}
              onRun={handleRun}
              disabled={!isReady || isPygame}
              label="project challenge code editor"
            />
          </div>
          {(output || error || isRunning) && (
            <div className="h-40 border-t border-border">
              <OutputPanel
                output={output}
                error={error}
                isRunning={isRunning}
                executionTime={executionTime}
              />
            </div>
          )}
        </div>

        {isPygame && (
          <p className="font-mono text-[11px] text-warning">
            pygame needs a real window. Run this locally.
          </p>
        )}

        {attempts >= SOLUTION_GATE && !completed && (
          <div className="font-mono text-xs">
            <button
              type="button"
              onClick={() => setShowSolution(!showSolution)}
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {showSolution ? "▼" : "▶"} solution
            </button>
            {showSolution && (
              <div className="mt-3 rounded border border-border bg-[#0f0f12]">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-muted-foreground"># solution</span>
                  <CopyButton text={projectChallenge.solution} />
                </div>
                <pre className="p-3 text-xs text-foreground font-mono overflow-x-auto" tabIndex={0} role="group" aria-label="Code block, scrollable">
                  {projectChallenge.solution}
                </pre>
              </div>
            )}
          </div>
        )}
        {attempts > 0 && attempts < SOLUTION_GATE && !completed && (
          <p className="font-mono text-xs text-muted-foreground">
            {SOLUTION_GATE - attempts} more attempt
            {SOLUTION_GATE - attempts !== 1 ? "s" : ""} until solution unlocks
          </p>
        )}

        {completed && (
          <p className="font-mono text-xs text-success">
            <span className="text-success">exit 0</span> · +{projectChallenge.xpReward} xp ·{" "}
            {projectChallenge.threadTitle}
          </p>
        )}
      </div>
    </div>
  );
}
