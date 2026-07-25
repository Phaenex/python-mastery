"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface TheoryContentProps {
  content: string;
}

// Token types for syntax highlighting
type TokenType = "keyword" | "builtin" | "string" | "comment" | "number" | "method" | "plain";

interface Token {
  type: TokenType;
  value: string;
}

// Tokenize Python code without overlap issues
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
    "iter", "next", "reversed", "slice", "any", "all", "format"
  ]);

  while (remaining.length > 0) {
    let matched = false;

    // Match comments first (highest priority)
    const commentMatch = remaining.match(/^#.*/);
    if (commentMatch) {
      tokens.push({ type: "comment", value: commentMatch[0] });
      remaining = remaining.slice(commentMatch[0].length);
      matched = true;
      continue;
    }

    // Match triple-quoted strings
    const tripleDoubleMatch = remaining.match(/^"""[\s\S]*?"""/);
    if (tripleDoubleMatch) {
      tokens.push({ type: "string", value: tripleDoubleMatch[0] });
      remaining = remaining.slice(tripleDoubleMatch[0].length);
      matched = true;
      continue;
    }
    const tripleSingleMatch = remaining.match(/^'''[\s\S]*?'''/);
    if (tripleSingleMatch) {
      tokens.push({ type: "string", value: tripleSingleMatch[0] });
      remaining = remaining.slice(tripleSingleMatch[0].length);
      matched = true;
      continue;
    }

    // Match single/double quoted strings
    const stringMatch = remaining.match(/^(["'])((?:\\.|(?!\1)[^\\])*?)\1/);
    if (stringMatch) {
      tokens.push({ type: "string", value: stringMatch[0] });
      remaining = remaining.slice(stringMatch[0].length);
      matched = true;
      continue;
    }

    // Match numbers
    const numberMatch = remaining.match(/^\d+\.?\d*(?:[eE][+-]?\d+)?/);
    if (numberMatch) {
      tokens.push({ type: "number", value: numberMatch[0] });
      remaining = remaining.slice(numberMatch[0].length);
      matched = true;
      continue;
    }

    // Match method calls after dot
    const methodMatch = remaining.match(/^\.([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/);
    if (methodMatch) {
      tokens.push({ type: "plain", value: "." });
      tokens.push({ type: "method", value: methodMatch[1] });
      remaining = remaining.slice(methodMatch[0].length);
      matched = true;
      continue;
    }

    // Match identifiers (keywords, builtins, or plain)
    const identMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (identMatch) {
      const word = identMatch[0];
      let type: TokenType = "plain";

      if (KEYWORDS.has(word)) {
        type = "keyword";
      } else if (BUILTINS.has(word)) {
        // Check if followed by opening paren for builtin
        const afterIdent = remaining.slice(word.length);
        if (afterIdent.match(/^\s*\(/)) {
          type = "builtin";
        }
      }

      tokens.push({ type, value: word });
      remaining = remaining.slice(word.length);
      matched = true;
      continue;
    }

    // Match any other single character
    if (!matched) {
      tokens.push({ type: "plain", value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Custom code block component with syntax highlighting
function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const code = String(children).replace(/\n$/, "");
  const language = className?.replace(/language-/, "") || "python";

  const highlightedCode = useMemo(() => {
    if (language !== "python") return escapeHtml(code);

    const tokens = tokenizePython(code);
    return tokens.map(token => {
      const escaped = escapeHtml(token.value);
      if (token.type === "plain") return escaped;
      return `<span class="token-${token.type}">${escaped}</span>`;
    }).join("");
  }, [code, language]);

  return (
    // A horizontally scrollable region needs to be reachable by keyboard, or someone
    // who cannot use a pointer can never scroll it. tabIndex makes it focusable and
    // the role/label tell a screen reader what it just landed in.
    <pre className="code-block" tabIndex={0} role="group" aria-label="Code example, scrollable">
      <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
}

type CalloutType = "key" | "tip" | "warning" | "note";

const CALLOUT_LABELS: Record<CalloutType, string> = {
  key: "key concept",
  tip: "tip",
  warning: "watch out",
  note: "note",
};

function Callout({ type, children }: { type: CalloutType; children: React.ReactNode }) {
  const borderColor = {
    key: "border-amber-400",
    tip: "border-accent",
    warning: "border-orange-400",
    note: "border-blue-400",
  }[type];
  const labelColor = {
    key: "text-amber-300",
    tip: "text-accent",
    warning: "text-orange-300",
    note: "text-blue-300",
  }[type];

  return (
    <div className={`my-4 pl-3 border-l-2 ${borderColor} font-mono text-sm leading-relaxed`}>
      <span className={`font-semibold mr-2 ${labelColor}`}>!</span>
      <span className={`mr-2 ${labelColor}`}>{CALLOUT_LABELS[type]}</span>
      <span className="text-muted-foreground">·</span>
      <span className="ml-2 text-foreground/90">{children}</span>
    </div>
  );
}

export function TheoryContent({ content }: TheoryContentProps) {
  const components: Components = {
    code: ({ children, className, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      }
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    pre: ({ children }) => <>{children}</>,
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium text-foreground mt-6 mb-3">{children}</h3>
    ),
    p: ({ children }) => {
      const text = String(children);
      if (text.startsWith("💡 Key:") || text.startsWith("Key:")) {
        return <Callout type="key">{text.replace(/^(💡 )?Key:\s*/i, "")}</Callout>;
      }
      if (text.startsWith("⚠️ Warning:") || text.startsWith("Warning:")) {
        return <Callout type="warning">{text.replace(/^(⚠️ )?Warning:\s*/i, "")}</Callout>;
      }
      if (text.startsWith("✨ Tip:") || text.startsWith("Tip:")) {
        return <Callout type="tip">{text.replace(/^(✨ )?Tip:\s*/i, "")}</Callout>;
      }
      if (text.startsWith("📝 Note:") || text.startsWith("Note:")) {
        return <Callout type="note">{text.replace(/^(📝 )?Note:\s*/i, "")}</Callout>;
      }
      return <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>;
    },
    ul: ({ children }) => <ul className="list-disc list-outside ml-5 space-y-1 mb-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-outside ml-5 space-y-1 mb-4">{children}</ol>,
    li: ({ children }) => <li className="text-foreground/90 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 pl-3 border-l-2 border-border text-muted-foreground italic">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="theory-content prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default TheoryContent;
