"use client";

import { useEffect, useMemo, useState } from "react";
import { getCheckpoint, type CheckpointItem } from "@/lib/checkpoints";
import { completeCheckpoint, isCheckpointCompleted } from "@/lib/storage";
import { useLearn } from "@/lib/mode";

interface ModuleCheckpointProps {
  moduleSlug: string;
}

const norm = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

function McqBlock({
  item,
  index,
  onResolved,
}: {
  item: Extract<CheckpointItem, { kind: "mcq" }>;
  index: number;
  onResolved: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = checked && picked === item.answer;

  return (
    <fieldset className="rounded border border-border bg-card/40 p-4">
      <legend className="px-1 font-mono text-xs text-muted-foreground">question {index + 1}</legend>
      <p className="text-sm text-foreground">{item.question}</p>
      <div role="radiogroup" aria-label={item.question} className="mt-3 space-y-2">
        {item.options.map((opt, i) => {
          const isPicked = picked === i;
          const showRight = checked && i === item.answer;
          const showWrong = checked && isPicked && i !== item.answer;
          return (
            <label
              key={i}
              className={`flex items-start gap-2 rounded border px-3 py-2 text-sm cursor-pointer transition-colors ${
                showRight
                  ? "border-success/60 bg-success/10 text-success"
                  : showWrong
                    ? "border-error/60 bg-error/10 text-error"
                    : isPicked
                      ? "border-accent/60 bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent/40"
              }`}
            >
              <input
                type="radio"
                name={`mcq-${index}`}
                checked={isPicked}
                disabled={correct}
                onChange={() => setPicked(i)}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={picked === null || correct}
          onClick={() => {
            setChecked(true);
            if (picked === item.answer) onResolved();
          }}
          className="px-3 py-1.5 rounded border border-accent text-accent text-xs font-mono hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          check
        </button>
        {checked && (
          <span className={`font-mono text-xs ${correct ? "text-success" : "text-error"}`}>
            {correct ? "✓ correct" : "not quite, try again"}
          </span>
        )}
      </div>
      {checked && correct && <p className="mt-2 font-mono text-xs text-muted-foreground">{item.explain}</p>}
    </fieldset>
  );
}

function FillBlock({
  item,
  index,
  onResolved,
}: {
  item: Extract<CheckpointItem, { kind: "fill" }>;
  index: number;
  onResolved: () => void;
}) {
  const parts = useMemo(() => item.template.split("___"), [item.template]);
  const blankCount = parts.length - 1;
  const [vals, setVals] = useState<string[]>(() => Array(blankCount).fill(""));
  const [checked, setChecked] = useState(false);

  const allCorrect = checked && vals.every((v, b) => item.answers[b].some((a) => norm(a) === norm(v)));

  return (
    <fieldset className="rounded border border-border bg-card/40 p-4">
      <legend className="px-1 font-mono text-xs text-muted-foreground">fill in the blank · question {index + 1}</legend>
      <p className="text-sm text-foreground">{item.prompt}</p>
      <pre className="mt-3 overflow-x-auto rounded bg-[#0f0f12] border border-border p-3 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed" tabIndex={0} role="group" aria-label="Code block, scrollable">
        {parts.map((seg, i) => (
          <span key={i}>
            {seg}
            {i < blankCount && (
              <input
                aria-label={`blank ${i + 1}`}
                value={vals[i]}
                disabled={allCorrect}
                onChange={(e) => {
                  const next = [...vals];
                  next[i] = e.target.value;
                  setVals(next);
                  setChecked(false);
                }}
                className={`mx-1 inline-block w-28 rounded border bg-card px-2 py-0.5 text-foreground align-baseline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  checked
                    ? item.answers[i].some((a) => norm(a) === norm(vals[i]))
                      ? "border-success/60"
                      : "border-error/60"
                    : "border-border"
                }`}
              />
            )}
          </span>
        ))}
      </pre>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={vals.some((v) => !v.trim()) || allCorrect}
          onClick={() => {
            setChecked(true);
            if (vals.every((v, b) => item.answers[b].some((a) => norm(a) === norm(v)))) onResolved();
          }}
          className="px-3 py-1.5 rounded border border-accent text-accent text-xs font-mono hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          check
        </button>
        {checked && (
          <span className={`font-mono text-xs ${allCorrect ? "text-success" : "text-error"}`}>
            {allCorrect ? "✓ correct" : "not quite, check the blank"}
          </span>
        )}
      </div>
      {checked && allCorrect && <p className="mt-2 font-mono text-xs text-muted-foreground">{item.explain}</p>}
    </fieldset>
  );
}

export default function ModuleCheckpoint({ moduleSlug }: ModuleCheckpointProps) {
  const items = useMemo(() => getCheckpoint(moduleSlug), [moduleSlug]);
  const learn = useLearn();
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isCheckpointCompleted(moduleSlug));
  }, [moduleSlug]);

  const allResolved = items.length > 0 && resolved.size === items.length;

  // Record completion in an effect (never during another component's render).
  useEffect(() => {
    if (allResolved && learn && !done) {
      completeCheckpoint(moduleSlug);
      setDone(true);
    }
  }, [allResolved, learn, done, moduleSlug]);

  if (items.length === 0) return null;

  const onResolved = (i: number) => {
    setResolved((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  };

  return (
    <section id="checkpoint" className="scroll-mt-32 pt-2">
      <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-accent"># module checkpoint</p>
          <span className="font-mono text-xs text-muted-foreground">
            {resolved.size}/{items.length} correct
          </span>
        </div>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Quick check that this module stuck. Answer each one to finish the checkpoint.
        </p>

        <div className="space-y-4">
          {items.map((item, i) =>
            item.kind === "mcq" ? (
              <McqBlock key={i} item={item} index={i} onResolved={() => onResolved(i)} />
            ) : (
              <FillBlock key={i} item={item} index={i} onResolved={() => onResolved(i)} />
            ),
          )}
        </div>

        {allResolved && (
          <p className="mt-4 font-mono text-xs text-success">
            ✓ checkpoint cleared
            {learn ? (done ? " · added to your spaced review" : "") : " · (progress tracked on the local learn site)"}
          </p>
        )}
      </div>
    </section>
  );
}
