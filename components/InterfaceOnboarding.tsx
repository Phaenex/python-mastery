"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "python-mastery-onboarding-seen";

interface Step {
  selector: string;
  text: string;
  placement: "top" | "bottom" | "left";
}

const STEPS: Step[] = [
  {
    selector: '[data-tour-target="anchor-nav"]',
    text: "theory teaches it. examples show it. challenges make you do it. project ties it together.",
    placement: "bottom",
  },
  {
    selector: '[data-tour-target="editor"]',
    text: "your code runs here. live, no install. ⌘+enter runs.",
    placement: "left",
  },
  {
    selector: '[data-tour-target="tutor"]',
    text: "stuck? this won't give you the answer, but it'll ask the question that gets you unstuck.",
    placement: "top",
  },
];

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function InterfaceOnboarding() {
  const [step, setStep] = useState<number>(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    const t = setTimeout(() => setStep(0), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step < 0) return;
    // If we've walked past every step (because targets were missing), flip the flag
    // so the user doesn't get the tour again on next visit.
    if (step >= STEPS.length) {
      markSeen();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guided-tour stepper: clears highlight when walked past last step
      setRect(null);
      return;
    }
    const el = document.querySelector(STEPS[step].selector);
    const initialRect = el?.getBoundingClientRect();
    // Skip steps whose target is missing or not visible (e.g. the editor pane
    // is display:none behind the mobile pane toggle).
    if (!el || !initialRect || initialRect.width === 0 || initialRect.height === 0) {
      setRect(null);
      setStep((s) => s + 1);
      return;
    }
    el.scrollIntoView({ behavior: "auto", block: "center" });
    const update = () => setRect(el.getBoundingClientRect());
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  const done = useCallback(() => {
    markSeen();
    setStep(-1);
    // Send focus back where it was, or the user lands at the top of the document with
    // no idea where they are.
    openerRef.current?.focus?.();
    openerRef.current = null;
  }, []);

  // This tour opens on its own, covers the page, and declares aria-modal="true", but it
  // never moved focus into itself and had no keyboard dismissal. A screen reader user
  // was told the rest of the page was inert while focus sat outside the dialog on
  // content they had just been told to ignore, and a keyboard user had to Tab to the
  // end of the page to reach "skip". Escape now closes it, focus enters on open, and
  // Tab cycles inside while it is up.
  const visible = step >= 0 && step < STEPS.length && !!rect;

  useEffect(() => {
    if (!visible) return;
    if (!openerRef.current) openerRef.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));

    const id = requestAnimationFrame(() => focusables()[0]?.focus());

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        done();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || !dialogRef.current?.contains(activeEl))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (activeEl === last || !dialogRef.current?.contains(activeEl))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [visible, step, done]);

  if (!visible || !rect) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  let top = rect.bottom + 12;
  let left = rect.left;
  if (current.placement === "top") {
    top = rect.top - 12 - 100;
  }
  if (current.placement === "left") {
    top = rect.top;
    left = Math.max(12, rect.left - 320);
  }

  const clampedTop = Math.min(Math.max(12, top), window.innerHeight - 150);
  const clampedLeft = Math.min(Math.max(12, left), window.innerWidth - 320);
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    top: `${clampedTop}px`,
    left: `${clampedLeft}px`,
    width: "300px",
    zIndex: 60,
  };

  const highlightStyle: React.CSSProperties = {
    position: "fixed",
    top: `${rect.top - 4}px`,
    left: `${rect.left - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
    borderRadius: "8px",
    pointerEvents: "none",
    zIndex: 59,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
  };

  return (
    <>
      <div style={highlightStyle} className="border-2 border-accent" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="interface tour"
        style={tooltipStyle}
        className="rounded border border-accent bg-background px-4 py-3 font-mono text-xs shadow-2xl"
      >
        <p className="text-foreground leading-relaxed">{current.text}</p>
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span aria-live="polite">
            step {step + 1} of {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={done}
              className="rounded px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              skip
            </button>
            <button
              type="button"
              onClick={() => (isLast ? done() : setStep(step + 1))}
              className="rounded border border-accent px-2 py-1 text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {isLast ? "got it" : "next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
