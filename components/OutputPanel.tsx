"use client";

import { useMemo } from "react";

interface ChallengeContext {
  hint: string;
  prompt: string;
}

interface OutputPanelProps {
  output: string;
  error: string | null;
  isRunning: boolean;
  executionTime?: number;
  activeChallenge?: ChallengeContext | null;
}

interface DataFrameInfo {
  html: string;
  rows: number;
  cols: number;
  truncated: boolean;
}

interface OutputPart {
  type: "text" | "dataframe";
  content: string;
  dataframeInfo?: DataFrameInfo;
}

// Common error causes for different error types
const ERROR_CAUSES: Record<string, string[]> = {
  NameError: [
    "Variable or function name is misspelled",
    "Variable was used before it was defined",
    "Forgot to import a module (e.g., import pandas as pd)",
  ],
  SyntaxError: [
    "Missing colon after if/for/def/class statement",
    "Unmatched parentheses, brackets, or quotes",
    "Invalid indentation or mixing tabs and spaces",
  ],
  TypeError: [
    "Wrong argument type passed to a function",
    "Trying to use an operator on incompatible types",
    "Calling a non-callable object (like a list or int)",
  ],
  KeyError: [
    "Column name doesn't exist in the DataFrame",
    "Dictionary key doesn't exist",
    "Check for typos in column/key names",
  ],
  IndexError: [
    "List index is out of range",
    "Trying to access an element that doesn't exist",
    "Remember: Python uses 0-based indexing",
  ],
  ValueError: [
    "Invalid value passed to a function",
    "Data format doesn't match expected format",
    "Trying to convert incompatible data types",
  ],
  AttributeError: [
    "Method or attribute doesn't exist on this object",
    "Check if the object is the expected type",
    "Maybe the object is None when you expected a value",
  ],
  ImportError: [
    "Module is not installed",
    "Module name is misspelled",
    "Trying to import something that doesn't exist in the module",
  ],
  FileNotFoundError: [
    "File path is incorrect",
    "File doesn't exist at the specified location",
    "Check for typos in the file path",
  ],
};

function parseDataFrameShape(html: string): { rows: number; cols: number; truncated: boolean } {
  let rows = 0;
  let cols = 0;
  let truncated = false;

  const rowMatches = html.match(/<tr>/gi);
  if (rowMatches) {
    rows = rowMatches.length - 1;
  }

  const headerMatch = html.match(/<th[^>]*>/gi);
  if (headerMatch) {
    cols = headerMatch.length - 1;
  }

  if (html.includes("...") || html.includes("&hellip;")) {
    truncated = true;
  }

  return { rows, cols, truncated };
}

function parseOutput(output: string): OutputPart[] {
  if (!output) return [];

  const parts: OutputPart[] = [];
  const dfRegex = /<!--DATAFRAME_HTML-->([\s\S]*?)<!--\/DATAFRAME_HTML-->/g;
  let lastIndex = 0;
  let match;

  while ((match = dfRegex.exec(output)) !== null) {
    if (match.index > lastIndex) {
      const text = output.slice(lastIndex, match.index).trim();
      if (text) {
        parts.push({ type: "text", content: text });
      }
    }

    const html = match[1];
    const shape = parseDataFrameShape(html);
    parts.push({
      type: "dataframe",
      content: html,
      dataframeInfo: {
        html,
        rows: shape.rows,
        cols: shape.cols,
        truncated: shape.truncated,
      },
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < output.length) {
    const text = output.slice(lastIndex).trim();
    if (text) {
      parts.push({ type: "text", content: text });
    }
  }

  return parts;
}

function formatExecutionTime(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function parseError(error: string): { type: string; message: string; details: string[]; lineInfo: string | null } {
  const lines = error.split("\n").filter(Boolean);

  let lineInfo: string | null = null;
  const lineMatch = error.match(/line (\d+)/i);
  if (lineMatch) {
    lineInfo = `Line ${lineMatch[1]}`;
  }

  const errorLine = lines.find(
    (line) =>
      line.includes("Error:") ||
      line.includes("Exception:") ||
      line.match(/^[A-Z][a-zA-Z]*Error/)
  );

  if (errorLine) {
    const match = errorLine.match(/^([A-Za-z]+(?:Error|Exception)):\s*(.+)$/);
    if (match) {
      return {
        type: match[1],
        message: match[2],
        details: lines.filter((l) => l !== errorLine && !l.startsWith("Traceback")),
        lineInfo,
      };
    }
  }

  return {
    type: "Error",
    message: lines[lines.length - 1] || error,
    details: lines.slice(0, -1).filter((l) => !l.startsWith("Traceback")),
    lineInfo,
  };
}

function EmptyState({ activeChallenge }: { activeChallenge?: ChallengeContext | null }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="w-12 h-12 rounded-xl bg-card-hover flex items-center justify-center mb-3">
        <span className="text-2xl opacity-50">▶</span>
      </div>
      <p className="text-muted-foreground text-sm mb-1">No output yet</p>
      <p className="text-muted text-xs mb-3">
        Press <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-xs">Cmd/Ctrl+Enter</kbd> or click <span className="text-accent">Run</span> to execute
      </p>

      {activeChallenge && (
        <div className="w-full max-w-md mt-2 p-3 rounded-lg bg-accent/5 border border-accent/20 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent">🎯</span>
            <span className="text-xs font-medium text-accent">Active Challenge</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{activeChallenge.prompt}</p>
          <div className="flex items-start gap-1.5 pt-2 border-t border-accent/10">
            <span className="text-amber-400 text-xs">💡</span>
            <p className="text-xs text-muted-foreground">{activeChallenge.hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NoOutputHint() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-3">
      <span className="text-amber-400">💡</span>
      <div className="text-sm">
        <p className="text-amber-400 font-medium mb-1">No visible output?</p>
        <p className="text-muted-foreground">
          Try adding <code className="px-1 py-0.5 rounded bg-card text-xs">print()</code> to see your results, or end your code with just a variable name to display it.
        </p>
      </div>
    </div>
  );
}

function DataFrameDisplay({ info }: { info: DataFrameInfo }) {
  return (
    <div className="dataframe-wrapper rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-accent/5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-accent text-sm">📊</span>
          <span className="text-sm font-medium text-foreground">DataFrame</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{info.rows} rows</span>
          <span className="text-border">×</span>
          <span>{info.cols} columns</span>
          {info.truncated && (
            <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning text-[10px]">
              truncated
            </span>
          )}
        </div>
      </div>
      <div
        className="dataframe-container overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: info.html }}
      />
    </div>
  );
}

// Generate a friendly explanation for common errors
function getFriendlyExplanation(errorType: string, message: string): string | null {
  const messageLower = message.toLowerCase();

  if (errorType === "NameError") {
    const match = message.match(/name '([^']+)' is not defined/);
    if (match) {
      const name = match[1];
      if (name === "pd") return "You need to import pandas first. Add: import pandas as pd";
      if (name === "np") return "You need to import numpy first. Add: import numpy as np";
      return `Python doesn't recognize '${name}'. Check spelling or make sure it's defined before use.`;
    }
  }

  if (errorType === "SyntaxError") {
    if (messageLower.includes("unterminated string")) {
      return "You have an unclosed quote. Make sure every string starts and ends with matching quotes.";
    }
    if (messageLower.includes("invalid syntax")) {
      return "Something's wrong with your code structure. Check for missing colons, parentheses, or brackets.";
    }
    if (messageLower.includes("expected ':'")) {
      return "You're missing a colon. if/for/def/class statements need a colon at the end.";
    }
  }

  if (errorType === "TypeError") {
    if (messageLower.includes("unsupported operand")) {
      return "You're trying to use an operator (like + or -) with incompatible types.";
    }
    if (messageLower.includes("not callable")) {
      return "You're trying to call something that isn't a function. Check for accidental parentheses.";
    }
    if (messageLower.includes("missing") && messageLower.includes("argument")) {
      return "A function is missing a required argument. Check the function's expected parameters.";
    }
  }

  if (errorType === "KeyError") {
    const match = message.match(/'([^']+)'/);
    if (match) {
      return `Column or key '${match[1]}' doesn't exist. Check for typos or use df.columns to see available columns.`;
    }
  }

  if (errorType === "IndexError") {
    if (messageLower.includes("out of range")) {
      return "You're trying to access an item that doesn't exist. Remember, Python counts from 0.";
    }
  }

  if (errorType === "IndentationError") {
    return "Your code indentation is inconsistent. Use 4 spaces (or consistent tabs) for each level.";
  }

  if (errorType === "AttributeError") {
    const match = message.match(/'([^']+)' object has no attribute '([^']+)'/);
    if (match) {
      return `${match[1]} objects don't have a '${match[2]}' method. Check the object type and available methods.`;
    }
  }

  return null;
}

function ErrorDisplay({ parsedError }: { parsedError: { type: string; message: string; details: string[]; lineInfo: string | null } }) {
  const commonCauses = ERROR_CAUSES[parsedError.type] || [];
  const friendlyExplanation = getFriendlyExplanation(parsedError.type, parsedError.message);

  return (
    <div className="error-display rounded-lg border border-error/30 bg-error/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-error/10 border-b border-error/20">
        <div className="flex items-center gap-2">
          <span className="text-error font-semibold">{parsedError.type}</span>
          {/* A solid background, not a translucent one: bg-error/20 sits inside an
              already error-tinted panel, so the tints compounded to #603539 and the
              label measured 3.67:1 against it. */}
          {parsedError.lineInfo && (
            <span className="px-2 py-0.5 rounded bg-[#3a1f22] text-error text-xs">
              {parsedError.lineInfo}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Friendly explanation at the top */}
        {friendlyExplanation && (
          <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-400 mt-0.5">💡</span>
            <p className="text-sm text-foreground">{friendlyExplanation}</p>
          </div>
        )}

        <p className="text-error font-medium mb-2">{parsedError.message}</p>

        {parsedError.details.length > 0 && (
          <details className="group">
            <summary className="text-xs text-error/60 cursor-pointer hover:text-error/80 mb-2">
              Show traceback
            </summary>
            <pre className="text-xs text-error/70 whitespace-pre-wrap mb-3 p-2 rounded bg-error/5 border border-error/10">
              {parsedError.details.join("\n")}
            </pre>
          </details>
        )}

        {commonCauses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-error/20">
            <p className="text-xs font-medium text-error/80 mb-2">Common causes:</p>
            <ul className="space-y-1">
              {commonCauses.map((cause, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-error/70">
                  <span className="text-error/50 mt-0.5">•</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function OutputPanel({ output, error, isRunning, executionTime, activeChallenge }: OutputPanelProps) {
  const outputParts = useMemo(() => parseOutput(output), [output]);
  const parsedError = useMemo(() => (error ? parseError(error) : null), [error]);

  const hasRealOutput = outputParts.some(
    (part) =>
      part.type === "dataframe" ||
      (part.type === "text" && !part.content.startsWith("✅") && part.content.trim().length > 0)
  );

  return (
    <div className="output-panel h-full flex flex-col rounded-lg border border-border bg-[#1a1a1f] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#1e1e23]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent/50" />
          <span className="text-sm font-medium text-muted-foreground">Output</span>
        </div>
        {/* Persistent live region, not one created at the moment it has something to
            say: an element inserted already carrying role="status" is announced
            unreliably. "Running..." lived outside any live region, so a screen reader
            user pressed Run and heard nothing at all until the output landed, which for
            a cold Pyodide call is several seconds of silence with no way to tell whether
            the keypress registered. */}
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          {executionTime !== undefined && executionTime > 0 && !isRunning && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-success" aria-hidden="true">⚡</span>
              <span className="sr-only">Finished in </span>
              {formatExecutionTime(executionTime)}
            </span>
          )}
          {/* The pulse belongs on the dot, not on the wrapper: loading-pulse animates
              opacity down to 0.4, and on the wrapper that took the word "Running..."
              with it, fading the only text telling you the run had started. */}
          {isRunning && (
            <span className="text-xs text-accent flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              Running...
            </span>
          )}
        </div>
      </div>

      <div
        // Scrollable by pointer, so it must be reachable by keyboard: output can be
        // longer than the pane and a keyboard user could not scroll it otherwise.
        tabIndex={0}
        className="flex-1 overflow-auto p-4 font-mono text-sm output-content"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {!output && !error && !isRunning && <EmptyState activeChallenge={activeChallenge} />}

        {outputParts.map((part, index) => (
          <div key={index} className={index > 0 ? "mt-4" : ""}>
            {part.type === "text" ? (
              <div className="text-output">
                <pre className="whitespace-pre-wrap text-foreground leading-relaxed">{part.content}</pre>
              </div>
            ) : (
              part.dataframeInfo && <DataFrameDisplay info={part.dataframeInfo} />
            )}
          </div>
        ))}

        {!error && !isRunning && output && !hasRealOutput && outputParts.length === 0 && (
          <NoOutputHint />
        )}

        {parsedError && <ErrorDisplay parsedError={parsedError} />}
      </div>
    </div>
  );
}
