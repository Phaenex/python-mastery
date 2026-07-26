"use client";

import { useEffect, useRef } from "react";
import type { Module } from "@/lib/types";
import { Sidebar } from "./Sidebar";

interface MobileModuleNavProps {
  open: boolean;
  onClose: () => void;
  module: Module;
  completedLessons: Set<string>;
}

export function MobileModuleNav({ open, onClose, module, completedLessons }: MobileModuleNavProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
    }, 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(focusTimer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href]')) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden motion-reduce:transition-none ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="close navigation overlay"
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 w-full h-full bg-black/60 transition-opacity motion-reduce:transition-none focus-visible:outline-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="module navigation"
        className={`absolute left-0 top-0 bottom-0 w-[85vw] max-w-xs bg-card border-r border-border shadow-2xl transition-transform motion-reduce:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={handleContainerClick}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border font-mono text-xs">
          <span className="text-muted-foreground"># lessons</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="close navigation"
          >
            close
          </button>
        </div>
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
          <Sidebar module={module} completedLessons={completedLessons} />
        </div>
      </div>
    </div>
  );
}
