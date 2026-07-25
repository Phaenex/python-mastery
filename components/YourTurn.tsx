"use client";

import { useMemo, useState } from "react";
import { getYourTurn } from "@/lib/yourturn";
import type { FillItem } from "@/lib/checkpoints";

interface YourTurnProps {
  moduleSlug: string;
  lessonSlug: string;
}

const norm = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();

function FillCard({ item, index }: { item: FillItem; index: number }) {
  const parts = useMemo(() => item.template.split("___"), [item.template]);
  const blankCount = parts.length - 1;
  const [vals, setVals] = useState<string[]>(() => Array(blankCount).fill(""));
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const correct = checked && vals.every((v, b) => item.answers[b].some((a) => norm(a) === norm(v)));
  const solved = correct || revealed;

  return (
    <div className="rounded border border-border bg-card/40 p-4">
      <p className="text-sm text-foreground">
        <span className="font-mono text-xs text-accent">your turn{blankCount > 1 ? ` (${index + 1})` : ""} · </span>
        {item.prompt}
      </p>
      <pre className="mt-3 overflow-x-auto rounded bg-[#0f0f12] border border-border p-3 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed" tabIndex={0} role="group" aria-label="Code block, scrollable">
        {parts.map((seg, i) => (
          <span key={i}>
            {seg}
            {i < blankCount && (
              <input
                aria-label={`blank ${i + 1}`}
                value={revealed ? item.answers[i][0] : vals[i]}
                disabled={solved}
                onChange={(e) => {
                  const next = [...vals];
                  next[i] = e.target.value;
                  setVals(next);
                  setChecked(false);
                }}
                className={`mx-1 inline-block w-28 rounded border bg-card px-2 py-0.5 text-foreground align-baseline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  revealed
                    ? "border-warning/60"
                    : checked
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
          disabled={vals.some((v) => !v.trim()) || solved}
          onClick={() => setChecked(true)}
          className="px-3 py-1.5 rounded border border-accent text-accent text-xs font-mono hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          check
        </button>
        {!solved && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="px-3 py-1.5 rounded border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            show answer
          </button>
        )}
        {checked && !revealed && (
          <span className={`font-mono text-xs ${correct ? "text-success" : "text-error"}`}>
            {correct ? "✓ nice" : "not quite, try again or reveal"}
          </span>
        )}
        {revealed && <span className="font-mono text-xs text-warning">answer shown</span>}
      </div>
      {solved && <p className="mt-2 font-mono text-xs text-muted-foreground">{item.explain}</p>}
    </div>
  );
}

export default function YourTurn({ moduleSlug, lessonSlug }: YourTurnProps) {
  const items = useMemo(() => getYourTurn(moduleSlug, lessonSlug), [moduleSlug, lessonSlug]);
  if (items.length === 0) return null;

  return (
    <section id="your-turn" className="scroll-mt-32">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3"># your turn</p>
      <p className="mb-3 text-xs text-muted-foreground">
        You read the examples. Now finish the code yourself before the full challenges. Stuck? reveal the answer.
      </p>
      <div className="space-y-4">
        {items.map((item, i) => (
          <FillCard key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
