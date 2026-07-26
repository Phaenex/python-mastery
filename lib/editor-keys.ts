/**
 * Text transformations for the code editor's special keys.
 *
 * This lives outside the component because it could not be tested inside it. The order
 * of the bracket rules was wrong from the day it was written — typing print("hi") came
 * out as print("hi"") because " is its own closing character and the auto-close branch
 * was checked before the step-over branch — and no test could reach the logic to catch
 * it, because it only existed inside a React keydown handler.
 */

export interface EditorSelection {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface EditorKeyResult {
  value: string;
  cursor: number;
}

const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
};

const CLOSERS = [")", "]", "}", '"', "'"];

const INDENT = "    ";

/**
 * Work out what a key should do to the editor's text.
 *
 * @param state Current text and selection.
 * @param key The KeyboardEvent `key` value.
 * @param shiftKey Whether Shift was held (only meaningful for Tab).
 * @returns The new text and caret position, or `null` when the browser's own default
 *   handling is correct and the caller should not preventDefault.
 */
export function applyEditorKey(
  state: EditorSelection,
  key: string,
  shiftKey = false,
): EditorKeyResult | null {
  const { value, selectionStart: start, selectionEnd: end } = state;
  const collapsed = start === end;

  if (key === "Tab") {
    if (shiftKey) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineContent = value.slice(lineStart, start);
      const spacesToRemove = lineContent.match(/^ {1,4}/)?.[0].length ?? 0;
      if (spacesToRemove === 0) return null;
      return {
        value: value.slice(0, lineStart) + value.slice(lineStart + spacesToRemove),
        cursor: start - spacesToRemove,
      };
    }
    return {
      value: value.slice(0, start) + INDENT + value.slice(end),
      cursor: start + INDENT.length,
    };
  }

  // Step over a closer the editor already inserted. Must come before auto-closing:
  // quotes are in both sets, so checking auto-close first doubles them.
  if (collapsed && CLOSERS.includes(key) && value[start] === key) {
    return { value, cursor: start + 1 };
  }

  if (collapsed && PAIRS[key]) {
    return {
      value: value.slice(0, start) + key + PAIRS[key] + value.slice(end),
      cursor: start + 1,
    };
  }

  if (key === "Enter") {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineContent = value.slice(lineStart, start);
    const currentIndent = lineContent.match(/^ */)?.[0] ?? "";
    const deeper = lineContent.trimEnd().endsWith(":");
    const newIndent = deeper ? currentIndent + INDENT : currentIndent;
    return {
      value: value.slice(0, start) + "\n" + newIndent + value.slice(end),
      cursor: start + 1 + newIndent.length,
    };
  }

  return null;
}
