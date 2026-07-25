"use client";

import { useEffect, useRef, useState } from "react";
import { MODULE_CHECKPOINTS, type CheckpointItem } from "@/lib/checkpoints";
import {
  getCompletedCheckpoints,
  getReviewedMap,
  isDue,
  markReviewed,
  checkpointKey,
} from "@/lib/storage";
import { useLearn } from "@/lib/mode";

// Gentle pop-quiz tuning. Adjust these to dial frequency up or down.
const POP_PROBABILITY = 0.25; // ~1 in 4 lesson completions
const COOLDOWN_TRIGGERS = 3; // skip this many completions after one fires
const DUE_ONLY = true; // only pop a question whose module checkpoint is due

const norm = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

interface Picked {
  moduleSlug: string;
  item: CheckpointItem;
}

export default function PopQuiz() {
  const learn = useLearn();
  const [picked, setPicked] = useState<Picked | null>(null);
  const cooldownRef = useRef(0);
  const pickedRef = useRef(false);

  useEffect(() => {
    if (!learn) return;

    const onLessonCompleted = () => {
      if (pickedRef.current) return; // one at a time
      if (cooldownRef.current > 0) {
        cooldownRef.current -= 1;
        return;
      }
      if (Math.random() > POP_PROBABILITY) return;

      const map = getReviewedMap();
      const eligible = getCompletedCheckpoints().filter(
        (m) => MODULE_CHECKPOINTS[m] && (!DUE_ONLY || isDue(checkpointKey(m), map)),
      );
      if (eligible.length === 0) return;

      const mod = eligible[Math.floor(Math.random() * eligible.length)];
      const items = MODULE_CHECKPOINTS[mod];
      const item = items[Math.floor(Math.random() * items.length)];
      pickedRef.current = true;
      setPicked({ moduleSlug: mod, item });
      cooldownRef.current = COOLDOWN_TRIGGERS;
    };

    window.addEventListener("lesson-completed", onLessonCompleted);
    return () => window.removeEventListener("lesson-completed", onLessonCompleted);
  }, [learn]);

  const close = () => {
    pickedRef.current = false;
    setPicked(null);
  };

  if (!learn || !picked) return null;

  return (
    <PopCard
      picked={picked}
      onClose={close}
      onCorrect={() => markReviewed(checkpointKey(picked.moduleSlug))}
    />
  );
}

function PopCard({
  picked,
  onClose,
  onCorrect,
}: {
  picked: Picked;
  onClose: () => void;
  onCorrect: () => void;
}) {
  const { item } = picked;
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [fillVal, setFillVal] = useState("");
  const [checked, setChecked] = useState(false);

  const mcq = item.kind === "mcq" ? item : null;
  const fill = item.kind === "fill" ? item : null;
  const fillAccepted = fill ? fill.answers[0] : [];
  const correct = checked && (mcq ? pickedIdx === mcq.answer : fillAccepted.some((a) => norm(a) === norm(fillVal)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="pop quiz, quick recall check"
      className="fixed bottom-4 right-4 z-[55] w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-accent/40 bg-card shadow-2xl font-mono"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-accent">pop quiz · quick check</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="dismiss pop quiz"
          className="text-muted-foreground hover:text-foreground text-xs px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ✕
        </button>
      </div>
      <div className="p-3">
        {mcq && (
          <>
            <p className="text-sm text-foreground">{mcq.question}</p>
            <div role="radiogroup" aria-label={mcq.question} className="mt-2 space-y-1.5">
              {mcq.options.map((opt, i) => {
                const showRight = checked && i === mcq.answer;
                const showWrong = checked && pickedIdx === i && i !== mcq.answer;
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-2 rounded border px-2 py-1.5 text-xs cursor-pointer ${
                      showRight
                        ? "border-success/60 bg-success/10 text-success"
                        : showWrong
                          ? "border-error/60 bg-error/10 text-error"
                          : pickedIdx === i
                            ? "border-accent/60 text-foreground"
                            : "border-border text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="popquiz"
                      checked={pickedIdx === i}
                      disabled={correct}
                      onChange={() => setPickedIdx(i)}
                      className="mt-0.5 accent-[var(--accent)]"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}
        {fill && (
          <>
            <p className="text-sm text-foreground">{fill.prompt}</p>
            <pre className="mt-2 overflow-x-auto rounded bg-[#0f0f12] border border-border p-2 text-xs text-foreground/90 whitespace-pre-wrap" tabIndex={0} role="group" aria-label="Code block, scrollable">
              {fill.template.split("___")[0]}
              <input
                aria-label="fill the blank"
                value={fillVal}
                disabled={correct}
                onChange={(e) => {
                  setFillVal(e.target.value);
                  setChecked(false);
                }}
                className={`mx-1 inline-block w-24 rounded border bg-card px-1.5 py-0.5 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  checked ? (correct ? "border-success/60" : "border-error/60") : "border-border"
                }`}
              />
              {fill.template.split("___").slice(1).join("___")}
            </pre>
          </>
        )}

        <div className="mt-3 flex items-center gap-3">
          {!correct ? (
            <button
              type="button"
              disabled={mcq ? pickedIdx === null : !fillVal.trim()}
              onClick={() => {
                setChecked(true);
                const ok = mcq ? pickedIdx === mcq.answer : fillAccepted.some((a) => norm(a) === norm(fillVal));
                if (ok) onCorrect();
              }}
              className="px-3 py-1 rounded border border-accent text-accent text-xs hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              check
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded border border-success text-success text-xs hover:bg-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
            >
              nice, close
            </button>
          )}
          {checked && (
            <span className={`text-xs ${correct ? "text-success" : "text-error"}`}>
              {correct ? "✓ still got it" : "not quite"}
            </span>
          )}
        </div>
        {checked && correct && <p className="mt-2 text-xs text-muted-foreground">{item.explain}</p>}
      </div>
    </div>
  );
}
