"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";
import { CopyButton } from "./CopyButton";
import { usePyodideRuntime } from "./PyodideProvider";
import { createValidator } from "@/lib/validator";
import { useLearn } from "@/lib/mode";
import type { Challenge } from "@/lib/types";

function firstLine(s: string): string {
  return s.split("\n").find((l) => l.trim().length > 0)?.trim() ?? "";
}

interface ChallengeBlockProps {
  challenge: Challenge;
  starterCode: string;
  onComplete: () => void;
  challengeNumber: number;
  totalChallenges: number;
  isPygame?: boolean;
  /** Active-recall review: start blank (ignore saved code) and don't persist,
   *  so re-solving is genuine recall and the real saved solution is untouched. */
  reviewMode?: boolean;
  onAskTutor?: (prompt: string) => void;
  onActiveCodeChange?: (code: string) => void;
  onActiveErrorChange?: (error: string | undefined) => void;
}

const SOLUTION_GATE = 3;

function seedFor(challenge: Challenge, starterCode: string): string {
  return `${starterCode}\n\n# ${challenge.prompt}\n# Your code here:\n`;
}

export default function ChallengeBlock({
  challenge,
  starterCode,
  onComplete,
  challengeNumber,
  totalChallenges,
  isPygame = false,
  reviewMode = false,
  onAskTutor,
  onActiveCodeChange,
  onActiveErrorChange,
}: ChallengeBlockProps) {
  const { isReady, runCode } = usePyodideRuntime();
  const learn = useLearn();
  const seed = seedFor(challenge, starterCode);

  const [code, setCode] = useState(seed);
  const [why, setWhy] = useState("");
  const [showWhy, setShowWhy] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [validatorBroken, setValidatorBroken] = useState(false);
  const [editorHeight, setEditorHeight] = useState(220);
  const [expanded, setExpanded] = useState(false);
  const dragOriginRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const hasFiredCompleteRef = useRef(false);
  const expandTriggerRef = useRef<HTMLButtonElement | null>(null);
  const collapseBtnRef = useRef<HTMLButtonElement | null>(null);

  const codeKey = `python-mastery-code-${challenge.id}`;
  const heightKey = `python-mastery-editor-h-${challenge.id}`;
  const whyKey = `python-mastery-why-${challenge.id}`;

  useEffect(() => {
    const savedCode = reviewMode ? null : localStorage.getItem(codeKey);
    setCode(savedCode || seed);
    const savedH = localStorage.getItem(heightKey);
    if (savedH) {
      const n = parseInt(savedH, 10);
      if (Number.isFinite(n) && n >= 120 && n <= 800) setEditorHeight(n);
    }
    setOutput("");
    setError(null);
    setExecutionTime(0);
    setAttempts(0);
    setIsCorrect(false);
    setWhy(localStorage.getItem(whyKey) || "");
    setShowWhy(false);
    hasFiredCompleteRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed when the challenge changes or a review session starts
  }, [challenge.id, reviewMode]);

  useEffect(() => {
    if (!reviewMode && code !== seed) localStorage.setItem(codeKey, code);
    onActiveCodeChange?.(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed identity is stable per challenge
  }, [code]);

  useEffect(() => {
    try {
      localStorage.setItem(heightKey, String(editorHeight));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorHeight]);

  useEffect(() => {
    if (!expanded) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    const trigger = expandTriggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog so keyboard/screen-reader users land inside it.
    const focusTimer = setTimeout(() => collapseBtnRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(focusTimer);
      (trigger ?? prevFocused)?.focus?.();
    };
  }, [expanded]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture?.(e.pointerId);
      dragOriginRef.current = { startY: e.clientY, startHeight: editorHeight };
      const onMove = (ev: PointerEvent) => {
        if (!dragOriginRef.current) return;
        const delta = ev.clientY - dragOriginRef.current.startY;
        setEditorHeight(
          Math.max(120, Math.min(800, dragOriginRef.current.startHeight + delta)),
        );
      };
      const onUp = () => {
        dragOriginRef.current = null;
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
      };
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [editorHeight],
  );

  const onResizeKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 40 : 20;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setEditorHeight((h) => Math.min(800, h + step));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEditorHeight((h) => Math.max(120, h - step));
    }
  }, []);

  const handleRun = useCallback(async () => {
    if (!isReady || isPygame) return;
    setIsRunning(true);
    setError(null);

    const result = await runCode(code);
    setOutput(result.output);
    setError(result.error);
    setExecutionTime(result.executionTime);
    onActiveErrorChange?.(result.error ?? undefined);

    if (!result.error) {
      try {
        const validate = createValidator(challenge.validateFn);
        const ok = validate(result.output, result.locals);
        if (ok) {
          setIsCorrect(true);
          setOutput((p) => p + "\n\n# challenge validated · exit 0");
          if (!hasFiredCompleteRef.current) {
            hasFiredCompleteRef.current = true;
            onComplete();
          }
        } else {
          setAttempts((n) => n + 1);
        }
      } catch (err) {
        console.warn(`[ChallengeBlock] validateFn threw for ${challenge.id}:`, err);
        setValidatorBroken(true);
      }
    } else {
      setAttempts((n) => n + 1);
    }

    setIsRunning(false);
  }, [isReady, isPygame, runCode, code, challenge.validateFn, challenge.id, onComplete, onActiveErrorChange]);

  const handleReset = useCallback(() => {
    // In a review session the saved solution must survive a reset; only clear
    // the on-disk code during normal study.
    if (!reviewMode) {
      try {
        localStorage.removeItem(codeKey);
      } catch {
        // ignore
      }
    }
    setCode(seed);
    setOutput("");
    setError(null);
    setExecutionTime(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed stable per challenge
  }, [codeKey, reviewMode]);

  const status = isCorrect
    ? "✓ done"
    : attempts > 0
    ? `${attempts} attempt${attempts !== 1 ? "s" : ""}`
    : "todo";
  const statusClass = isCorrect
    ? "text-success"
    : attempts > 0
    ? "text-warning"
    : "text-muted-foreground";

  const editor = (
    <CodeEditor
      code={code}
      onChange={setCode}
      onRun={handleRun}
      disabled={!isReady || isPygame}
      label={`code editor for challenge ${challengeNumber}`}
    />
  );

  return (
    <div className="rounded border border-border bg-card">
      <div className="px-4 py-3 border-b border-border font-mono text-xs flex items-center justify-between">
        <span className="text-muted-foreground">
          <span className="text-accent"># challenge</span>
          <span className="text-muted-foreground">
            {" "}
            {String(challengeNumber).padStart(2, "0")}/{String(totalChallenges).padStart(2, "0")}
          </span>
        </span>
        <span className={statusClass}>{status}</span>
      </div>

      <div className="px-4 py-4 text-sm text-foreground leading-relaxed border-b border-border/60">
        {challenge.prompt}
      </div>

      {isPygame && (
        <div className="px-4 py-2 border-b border-warning/30 bg-warning/[0.05] font-mono text-[11px] text-warning space-y-1">
          <p>pygame needs a real window. copy this into a .py file and run it locally.</p>
          {/*
            Said out loud because the UI otherwise looks identical to a checkable
            challenge: same editor, same layout, but Run is disabled and no validator
            ever fires. Leaving that implicit means a learner waits for feedback that
            is never coming and assumes they did something wrong.
          */}
          <p className="text-warning">
            that also means this one cannot be auto-checked here. work through it on your
            machine and compare against the solution when you are done.
          </p>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div data-tour-target="editor" className="relative">
          <div style={{ height: editorHeight }} className="rounded border border-border overflow-hidden">
            {editor}
          </div>
          <div className="flex items-center justify-between -mt-px border-x border-b border-border bg-card rounded-b">
            <button
              ref={expandTriggerRef}
              type="button"
              onClick={() => setExpanded(true)}
              className="px-3 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="expand editor"
            >
              [ expand ]
            </button>
            <button
              type="button"
              onPointerDown={onResizePointerDown}
              onKeyDown={onResizeKeyDown}
              role="slider"
              aria-orientation="vertical"
              aria-label="editor height"
              aria-valuemin={120}
              aria-valuemax={800}
              aria-valuenow={editorHeight}
              aria-valuetext={`${editorHeight} pixels`}
              className="px-3 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-ns-resize select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              title="drag, or use arrow keys to resize"
            >
              ─ drag to resize ─
            </button>
            <div className="flex items-center gap-2 px-3 py-1">
              <button
                type="button"
                onClick={handleReset}
                className="font-mono text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                reset
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={!isReady || isRunning || isPygame}
                className="px-2 py-0.5 rounded border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isRunning ? "running…" : "run"}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="expanded editor"
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur p-4 sm:p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 font-mono text-xs">
              <span className="text-muted-foreground"># editor · esc to close</span>
              <button
                ref={collapseBtnRef}
                type="button"
                onClick={() => setExpanded(false)}
                className="px-3 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                collapse
              </button>
            </div>
            <div className="flex-1 min-h-0 rounded border border-border overflow-hidden">
              {editor}
            </div>
          </div>
        )}

        {(output || error || isRunning) && (
          <div className="h-48 rounded border border-border overflow-hidden">
            <OutputPanel
              output={output}
              error={error}
              isRunning={isRunning}
              executionTime={executionTime}
              activeChallenge={{ hint: challenge.hint, prompt: challenge.prompt }}
            />
          </div>
        )}

        {(output || error) && (
          <p className={`font-mono text-xs ${isCorrect ? "text-success" : "text-warning"}`}>
            {isCorrect
              ? "exit 0 · challenge validated"
              : error
                ? `# error · ${firstLine(error).slice(0, 90)}`
                : output.trim()
                  ? `# not there yet · your output: "${firstLine(output).slice(0, 70)}${
                      firstLine(output).length > 70 ? "…" : ""
                    }" · re-read the prompt`
                  : "# not there yet · your code produced no output (the challenge expects some)"}
          </p>
        )}

        {isCorrect && learn && (
          <div className="font-mono text-xs">
            {!showWhy ? (
              <button
                type="button"
                onClick={() => setShowWhy(true)}
                className="text-muted-foreground hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                + explain: in one sentence, why does this work?
              </button>
            ) : (
              <div className="space-y-1">
                <label className="text-muted-foreground" htmlFor={`why-${challenge.id}`}>
                  why does this work? <span className="text-muted">(for you, saved locally, never sent)</span>
                </label>
                <textarea
                  id={`why-${challenge.id}`}
                  value={why}
                  onChange={(e) => {
                    setWhy(e.target.value);
                    try {
                      localStorage.setItem(whyKey, e.target.value);
                    } catch {
                      /* private mode / quota */
                    }
                  }}
                  rows={2}
                  className="w-full resize-none rounded border border-border bg-card/40 px-2 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
                  placeholder="in your own words…"
                />
              </div>
            )}
          </div>
        )}

        {validatorBroken && (
          <p className="font-mono text-xs text-error border-l-2 border-error pl-3">
            <span className="font-semibold">!</span> validator error in this challenge. open
            devtools to see the cause and please report.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-border/60 font-mono text-xs">
          {challenge.hint && !showHint && !isCorrect && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="px-2 py-1 rounded border border-border text-warning hover:bg-warning/10 hover:border-warning/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              show hint
            </button>
          )}
          {onAskTutor && !isCorrect && (
            <button
              type="button"
              onClick={() => onAskTutor(`I'm stuck on this challenge: ${challenge.prompt}`)}
              className="text-muted-foreground hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              &gt; stuck? ask the tutor
            </button>
          )}
          {attempts >= SOLUTION_GATE && !isCorrect && !showSolution && (
            <button
              type="button"
              onClick={() => setShowSolution(true)}
              className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              show solution
            </button>
          )}
          {attempts > 0 && attempts < SOLUTION_GATE && !isCorrect && (
            <span className="ml-auto text-muted-foreground">
              {SOLUTION_GATE - attempts} more attempt
              {SOLUTION_GATE - attempts !== 1 ? "s" : ""} until solution unlocks
            </span>
          )}
        </div>

        {showHint && challenge.hint && (
          <p className="font-mono text-xs text-foreground border-l-2 border-warning/40 pl-3">
            <span className="text-warning">!</span> hint: {challenge.hint}
          </p>
        )}

        {showSolution && (
          <div className="rounded border border-border bg-[#0f0f12]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border font-mono text-xs">
              <span className="text-muted-foreground"># solution</span>
              <CopyButton text={challenge.solution} />
            </div>
            <pre className="p-3 text-xs text-foreground font-mono overflow-x-auto" tabIndex={0} role="group" aria-label="Code block, scrollable">
              {challenge.solution}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
