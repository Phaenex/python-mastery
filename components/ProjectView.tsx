"use client";

import { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";
import { usePyodide } from "@/lib/pyodide";
import { createValidator } from "@/lib/validator";
import type { Project } from "@/lib/types";

interface ProjectViewProps {
  project: Project;
  completedSteps: Set<string>;
  onStepComplete: (stepId: string) => void;
}

export function ProjectView({
  project,
  completedSteps,
  onStepComplete,
}: ProjectViewProps) {
  const { isLoading, isReady, error: pyodideError, runCode } = usePyodide();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [showHints, setShowHints] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);

  const currentStep = project.steps[currentStepIndex];

  // Initialize code when step changes
  useEffect(() => {
    if (currentStep) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(currentStep.starterCode);
      setOutput("");
      setError(null);
      setExecutionTime(0);
      setShowHints(false);
    }
  }, [currentStep]);

  const handleRun = useCallback(async () => {
    if (!isReady || !currentStep) return;

    setIsRunning(true);
    setError(null);

    const result = await runCode(code);

    setOutput(result.output);
    setError(result.error);
    setExecutionTime(result.executionTime);

    // Validate the step
    if (!result.error && currentStep) {
      try {
        const validateFn = createValidator(currentStep.validateFn);
        const isValid = validateFn(result.output, result.locals);
        if (isValid) {
          onStepComplete(currentStep.id);
          setOutput((prev) => prev + "\n\n# step validated · exit 0");
        }
      } catch (err) {
        console.warn(`[ProjectView] validateFn threw for step ${currentStep.id}:`, err);
        setOutput(
          (prev) =>
            prev +
            "\n\n# validator error in this step. open devtools to see the cause and please report.",
        );
      }
    }

    setIsRunning(false);
  }, [isReady, runCode, code, currentStep, onStepComplete]);

  const handleReset = useCallback(() => {
    if (currentStep) {
      setCode(currentStep.starterCode);
      setOutput("");
      setError(null);
      setExecutionTime(0);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < project.steps.length) {
        setCurrentStepIndex(index);
      }
    },
    [project.steps.length]
  );

  // Generate data preview (first 5 lines of dataset)
  const dataPreviewLines = project.dataset.split("\n").slice(0, 6);
  const headers = dataPreviewLines[0]?.split(
    project.dataset.includes("|") ? "|" : ","
  );
  const previewRows = dataPreviewLines.slice(1, 6).map((line) =>
    line.split(project.dataset.includes("|") ? "|" : ",")
  );

  const completedTotal = project.steps.filter((s) => completedSteps.has(s.id)).length;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside aria-label="Project steps" className="w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto font-mono text-sm">
        <div className="p-4 border-b border-border">
          <Link
            href="/projects"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            <span className="text-accent">$</span> cd ../projects
          </Link>
        </div>
        <div className="p-4 border-b border-border">
          <p className="text-foreground">projects/{project.slug}/</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completedTotal} of {project.steps.length} steps done
          </p>
        </div>
        <div className="p-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"># steps</p>
          <ul className="mt-1 space-y-0.5">
            {project.steps.map((step, index) => {
              const isComplete = completedSteps.has(step.id);
              const isCurrent = index === currentStepIndex;
              const marker = isComplete ? "✓" : isCurrent ? ">" : " ";
              const markerClass = isComplete
                ? "text-success"
                : isCurrent
                ? "text-accent"
                : "text-muted-foreground";

              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`w-full text-left flex items-baseline gap-2 px-2 py-1.5 rounded text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isCurrent
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                    }`}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <span aria-hidden="true" className={`w-3 ${markerClass}`}>{marker}</span>
                    <span className="text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <span className="truncate">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-border text-xs">
          <button
            type="button"
            onClick={() => setShowDataPreview(!showDataPreview)}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            {showDataPreview ? "▼" : "▶"} cat dataset.head()
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header aria-label="Project progress" className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-card font-mono text-xs">
          <span className="text-muted-foreground">
            <span className="text-accent">step</span> {String(currentStepIndex + 1).padStart(2, "0")}/{String(project.steps.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(currentStepIndex - 1)}
              disabled={currentStepIndex === 0}
              className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              ← prev
            </button>
            <button
              type="button"
              onClick={() => goToStep(currentStepIndex + 1)}
              disabled={currentStepIndex === project.steps.length - 1}
              className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              next →
            </button>
          </div>
        </header>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Instructions */}
          <main id="main" tabIndex={-1} aria-label="Step instructions" className="w-1/2 flex flex-col border-r border-border overflow-hidden">
            {/* Scrolls independently; the landmark is the column itself. */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2"># brief</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h1 className="text-xl font-semibold text-foreground">
                  {currentStep.title}
                </h1>
                {completedSteps.has(currentStep.id) && (
                  <span className="font-mono text-xs text-success">✓ done</span>
                )}
              </div>

              <div className="prose prose-invert max-w-none mb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentStep.description}
                </ReactMarkdown>
              </div>

              <div className="mt-6 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowHints(!showHints)}
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                >
                  {showHints ? "▼" : "▶"} hints ({currentStep.hints.length})
                </button>
                {showHints && (
                  <ul className="mt-3 space-y-2 text-muted-foreground border-l-2 border-accent/30 pl-3">
                    {currentStep.hints.map((hint, index) => (
                      <li key={index} className="text-xs leading-relaxed">
                        <span className="text-accent">!</span> {hint}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {showDataPreview && (
                <div className="mt-6 font-mono text-xs">
                  <p className="text-muted-foreground mb-2"># {project.datasetName}.head()</p>
                  {/* Scrollable by pointer, so it needs to be reachable by keyboard too. */}
                  <div
                    className="overflow-x-auto border border-border rounded"
                    tabIndex={0}
                    role="group"
                    aria-label="Dataset preview, scrollable"
                  >
                    <table className="text-[11px]">
                      <thead className="bg-background">
                        <tr>
                          {headers?.map((h, i) => (
                            <th
                              key={i}
                              className="px-2 py-1 text-left text-accent border-b border-border"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="px-2 py-1 text-muted-foreground border-b border-border/50"
                              >
                                {cell.length > 20 ? cell.slice(0, 17) + "..." : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {project.datasetDescription}
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Right Panel - Editor & Output */}
          <aside aria-label="Editor and output" className="w-1/2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card font-mono text-xs">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
                    <span className="text-warning">pyodide: loading…</span>
                  </>
                ) : pyodideError ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-error" aria-hidden="true" />
                    <span className="text-error">pyodide: {pyodideError}</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                    <span className="text-success">pyodide: ready</span>
                  </>
                )}
              </div>
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
                  disabled={!isReady || isRunning}
                  className="px-2 py-1 rounded border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {isRunning ? "running…" : "run & check"}
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0 p-4 pb-2">
              <CodeEditor
                code={code}
                onChange={setCode}
                onRun={handleRun}
                disabled={!isReady}
                label="project code editor"
              />
            </div>

            {/* Output */}
            <div className="h-48 p-4 pt-2">
              <OutputPanel output={output} error={error} isRunning={isRunning} executionTime={executionTime} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
