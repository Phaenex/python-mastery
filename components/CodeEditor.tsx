"use client";

import { useCallback, useRef, useEffect, useMemo } from "react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  disabled?: boolean;
  /** Accessible name for the editor textarea (the app's primary control). */
  label?: string;
}

// Token types for syntax highlighting
type TokenType = "keyword" | "builtin" | "string" | "comment" | "number" | "method" | "decorator" | "function-def" | "class-def" | "plain";

interface Token {
  type: TokenType;
  value: string;
}

// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tokenize Python code without overlap issues (sequential processing)
function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  let remaining = code;

  const KEYWORDS = new Set([
    "import", "from", "as", "def", "class", "return", "if", "else", "elif",
    "for", "while", "in", "not", "and", "or", "is", "None", "True", "False",
    "try", "except", "finally", "with", "lambda", "yield", "pass", "break",
    "continue", "raise", "assert", "global", "nonlocal", "del", "await", "async"
  ]);

  const BUILTINS = new Set([
    "print", "len", "range", "str", "int", "float", "list", "dict", "set",
    "tuple", "type", "isinstance", "sorted", "enumerate", "zip", "map",
    "filter", "sum", "min", "max", "abs", "round", "open", "input", "bool",
    "bytes", "bytearray", "callable", "chr", "ord", "hex", "bin", "oct",
    "repr", "hash", "id", "dir", "vars", "getattr", "setattr", "hasattr",
    "iter", "next", "reversed", "slice", "any", "all", "format", "super",
    "object", "property", "staticmethod", "classmethod", "memoryview",
    "delattr", "locals", "globals"
  ]);

  while (remaining.length > 0) {
    // Match comments first (highest priority)
    const commentMatch = remaining.match(/^#.*/);
    if (commentMatch) {
      tokens.push({ type: "comment", value: commentMatch[0] });
      remaining = remaining.slice(commentMatch[0].length);
      continue;
    }

    // Match triple-quoted strings
    const tripleDoubleMatch = remaining.match(/^"""[\s\S]*?"""/);
    if (tripleDoubleMatch) {
      tokens.push({ type: "string", value: tripleDoubleMatch[0] });
      remaining = remaining.slice(tripleDoubleMatch[0].length);
      continue;
    }
    const tripleSingleMatch = remaining.match(/^'''[\s\S]*?'''/);
    if (tripleSingleMatch) {
      tokens.push({ type: "string", value: tripleSingleMatch[0] });
      remaining = remaining.slice(tripleSingleMatch[0].length);
      continue;
    }

    // Match single/double quoted strings
    const stringMatch = remaining.match(/^(["'])((?:\\.|(?!\1)[^\\])*?)\1/);
    if (stringMatch) {
      tokens.push({ type: "string", value: stringMatch[0] });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    // Match decorators
    const decoratorMatch = remaining.match(/^@[a-zA-Z_][a-zA-Z0-9_]*/);
    if (decoratorMatch) {
      tokens.push({ type: "decorator", value: decoratorMatch[0] });
      remaining = remaining.slice(decoratorMatch[0].length);
      continue;
    }

    // Match numbers
    const numberMatch = remaining.match(/^\d+\.?\d*(?:[eE][+-]?\d+)?/);
    if (numberMatch) {
      tokens.push({ type: "number", value: numberMatch[0] });
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    // Match method calls after dot
    const methodMatch = remaining.match(/^\.([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/);
    if (methodMatch) {
      tokens.push({ type: "plain", value: "." });
      tokens.push({ type: "method", value: methodMatch[1] });
      remaining = remaining.slice(methodMatch[0].length);
      continue;
    }

    // Match identifiers (keywords, builtins, function/class defs, or plain)
    const identMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (identMatch) {
      const word = identMatch[0];
      let type: TokenType = "plain";

      // Check if this is a function or class definition
      if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        if (lastToken.type === "keyword" && lastToken.value === "def") {
          type = "function-def";
        } else if (lastToken.type === "keyword" && lastToken.value === "class") {
          type = "class-def";
        }
      }

      if (type === "plain") {
        if (KEYWORDS.has(word)) {
          type = "keyword";
        } else if (BUILTINS.has(word)) {
          // Check if followed by opening paren for builtin
          const afterIdent = remaining.slice(word.length);
          if (afterIdent.match(/^\s*\(/)) {
            type = "builtin";
          }
        }
      }

      tokens.push({ type, value: word });
      remaining = remaining.slice(word.length);
      continue;
    }

    // Match any other single character
    tokens.push({ type: "plain", value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

// Render tokens to HTML string
function renderTokensToHtml(tokens: Token[]): string {
  return tokens.map(token => {
    const escaped = escapeHtml(token.value);
    if (token.type === "plain") return escaped;
    return `<span class="token-${token.type}">${escaped}</span>`;
  }).join("");
}

export function CodeEditor({
  code,
  onChange,
  onRun,
  disabled = false,
  label,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.shiftKey || e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onRun();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;

        if (e.shiftKey) {
          const lineStart = value.lastIndexOf("\n", start - 1) + 1;
          const lineContent = value.slice(lineStart, start);
          const spacesToRemove = lineContent.match(/^ {1,4}/)?.[0].length || 0;
          if (spacesToRemove > 0) {
            const newValue = value.substring(0, lineStart) + value.substring(lineStart + spacesToRemove);
            onChange(newValue);
            setTimeout(() => {
              target.selectionStart = target.selectionEnd = start - spacesToRemove;
            }, 0);
          }
        } else {
          const newValue = value.substring(0, start) + "    " + value.substring(end);
          onChange(newValue);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + 4;
          }, 0);
        }
      }

      const pairs: Record<string, string> = {
        "(": ")",
        "[": "]",
        "{": "}",
        '"': '"',
        "'": "'",
      };

      if (pairs[e.key]) {
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;

        if (start === end) {
          e.preventDefault();
          const closingChar = pairs[e.key];
          const newValue = value.substring(0, start) + e.key + closingChar + value.substring(end);
          onChange(newValue);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + 1;
          }, 0);
        }
      }

      if ([")", "]", "}", '"', "'"].includes(e.key)) {
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const value = target.value;
        if (value[start] === e.key) {
          e.preventDefault();
          target.selectionStart = target.selectionEnd = start + 1;
        }
      }

      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const value = target.value;

        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineContent = value.slice(lineStart, start);
        const currentIndent = lineContent.match(/^[ ]*/)?.[0] || "";

        const trimmedLine = lineContent.trimEnd();
        const needsExtraIndent = trimmedLine.endsWith(":");

        e.preventDefault();
        const newIndent = needsExtraIndent ? currentIndent + "    " : currentIndent;
        const newValue = value.substring(0, start) + "\n" + newIndent + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1 + newIndent.length;
        }, 0);
      }
    },
    [onRun, onChange]
  );

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    const lineNumbers = lineNumbersRef.current;

    if (textarea) {
      if (highlight) {
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
      }
      if (lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener("scroll", syncScroll);
    return () => textarea.removeEventListener("scroll", syncScroll);
  }, [syncScroll]);

  const lineNumbers = useMemo(() => {
    const count = code.split("\n").length;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [code]);

  const highlightedCode = useMemo(() => {
    const tokens = tokenizePython(code);
    return renderTokensToHtml(tokens);
  }, [code]);

  return (
    <div className="code-editor relative h-full rounded-lg overflow-hidden border border-border bg-[#1e1e1e]">
      <div className="flex h-full">
        <div
          ref={lineNumbersRef}
          // Purely decorative: the line numbers duplicate position information the
          // editor already exposes, so announcing them is noise.
          aria-hidden="true"
          className="line-numbers flex-shrink-0 py-4 px-2 text-right select-none overflow-hidden text-muted text-sm font-mono border-r border-border/50 bg-[#1a1a1f]"
          style={{ width: "3.5rem" }}
        >
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6 h-6">
              {num}
            </div>
          ))}
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div
            ref={highlightRef}
            className="absolute inset-0 p-4 overflow-hidden pointer-events-none font-mono text-sm leading-6 whitespace-pre-wrap break-words"
            style={{ fontFamily: "var(--font-geist-mono), monospace", tabSize: 4 }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }}
          />

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={label ?? "Python code editor"}
            aria-keyshortcuts="Control+Enter Meta+Enter Shift+Enter"
            className="absolute inset-0 w-full h-full resize-none p-4 bg-transparent font-mono text-sm leading-6 outline-none disabled:opacity-50 caret-accent"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              tabSize: 4,
              color: "transparent",
              caretColor: "var(--accent)",
            }}
          />
        </div>
      </div>

      {disabled && (
        <div className="absolute inset-0 bg-[#1e1e1e]/90 flex flex-col items-center justify-center z-10 font-mono">
          <p className="flex items-center gap-2 text-sm text-warning">
            <span
              className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            pyodide: loading…
          </p>
          <p className="mt-1 text-xs text-muted-foreground">setting up pandas + numpy in your browser</p>
        </div>
      )}
    </div>
  );
}
