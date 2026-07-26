import { describe, it, expect } from "vitest";
import { applyEditorKey } from "../editor-keys";

/** Type a whole string one key at a time, the way the editor really receives it. */
function typeAll(text: string, initial = "") {
  let value = initial;
  let cursor = initial.length;
  for (const ch of text) {
    const key = ch === "\n" ? "Enter" : ch;
    const result = applyEditorKey({ value, selectionStart: cursor, selectionEnd: cursor }, key);
    if (result) {
      value = result.value;
      cursor = result.cursor;
    } else {
      // No special handling: the browser would insert the character itself.
      value = value.slice(0, cursor) + ch + value.slice(cursor);
      cursor += 1;
    }
  }
  return value;
}

describe("bracket and quote pairing", () => {
  // This shipped broken. " is its own closing character, so it was in both the
  // auto-close map and the step-over list, and auto-close was checked first: typing the
  // closing quote inserted a second pair instead of stepping over the one already there.
  // Every user who typed a string got invalid Python and a SyntaxError they did not write.
  it("types a plain print call without doubling the quote", () => {
    expect(typeAll('print("hi")')).toBe('print("hi")');
  });

  it("does not double single quotes either", () => {
    expect(typeAll("x = 'abc'")).toBe("x = 'abc'");
  });

  it("handles nested brackets and quotes", () => {
    expect(typeAll('d = {"k": [1, 2]}')).toBe('d = {"k": [1, 2]}');
  });

  it("auto-closes an opening bracket and leaves the caret inside", () => {
    const r = applyEditorKey({ value: "", selectionStart: 0, selectionEnd: 0 }, "(");
    expect(r).toEqual({ value: "()", cursor: 1 });
  });

  it("steps over a closer instead of inserting one", () => {
    const r = applyEditorKey({ value: "()", selectionStart: 1, selectionEnd: 1 }, ")");
    expect(r).toEqual({ value: "()", cursor: 2 });
  });

  it("still inserts a closer when the next character is not the matching one", () => {
    const r = applyEditorKey({ value: "x", selectionStart: 0, selectionEnd: 0 }, '"');
    expect(r).toEqual({ value: '""x', cursor: 1 });
  });

  it("does not auto-close over a selection", () => {
    // Wrapping a selection is a different feature; the old code silently did nothing here.
    const r = applyEditorKey({ value: "abc", selectionStart: 0, selectionEnd: 3 }, "(");
    expect(r).toBeNull();
  });
});

describe("tab indenting", () => {
  it("inserts four spaces", () => {
    expect(applyEditorKey({ value: "", selectionStart: 0, selectionEnd: 0 }, "Tab")).toEqual({
      value: "    ",
      cursor: 4,
    });
  });

  it("shift-tab removes up to four leading spaces", () => {
    expect(applyEditorKey({ value: "    x", selectionStart: 4, selectionEnd: 4 }, "Tab", true)).toEqual({
      value: "x",
      cursor: 0,
    });
  });

  // Returning null matters: it tells the component not to preventDefault, so Shift+Tab
  // on an unindented line moves focus instead of being swallowed into a dead keystroke.
  it("returns null for shift-tab when there is nothing to outdent", () => {
    expect(applyEditorKey({ value: "x", selectionStart: 1, selectionEnd: 1 }, "Tab", true)).toBeNull();
  });
});

describe("enter auto-indent", () => {
  it("keeps the current indentation", () => {
    expect(applyEditorKey({ value: "    a", selectionStart: 5, selectionEnd: 5 }, "Enter")).toEqual({
      value: "    a\n    ",
      cursor: 10,
    });
  });

  it("indents one level deeper after a colon", () => {
    expect(applyEditorKey({ value: "if x:", selectionStart: 5, selectionEnd: 5 }, "Enter")).toEqual({
      value: "if x:\n    ",
      cursor: 10,
    });
  });

  it("writes a real multi-line block", () => {
    expect(typeAll("if x:\nprint(1)")).toBe("if x:\n    print(1)");
  });
});

describe("keys the editor should not touch", () => {
  it("returns null for ordinary characters", () => {
    expect(applyEditorKey({ value: "", selectionStart: 0, selectionEnd: 0 }, "a")).toBeNull();
  });

  it("returns null for Escape so it can arm the focus escape hatch", () => {
    expect(applyEditorKey({ value: "", selectionStart: 0, selectionEnd: 0 }, "Escape")).toBeNull();
  });
});
