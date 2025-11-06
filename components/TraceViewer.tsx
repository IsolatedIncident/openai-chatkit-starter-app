"use client";

import type { TraceEntry } from "@/types/dashboard";

type TraceViewerProps = {
  trace: TraceEntry[];
  title?: string;
};

export function TraceViewer({ trace, title = "Reasoning trace" }: TraceViewerProps) {
  const hasTrace = trace.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </header>
      <div className="flex-1 overflow-auto">
        {!hasTrace ? (
          <EmptyState message="Trace updates will appear here when the agent narrates its reasoning." />
        ) : (
          <ol className="space-y-3 px-5 py-4 text-sm">
            {trace.map((entry, index) => (
              <li key={entry.id || index} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {entry.label || `Step ${index + 1}`}
                    </p>
                    {entry.detail ? (
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {entry.detail}
                      </p>
                    ) : null}
                  </div>
                  {entry.timestamp ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
      <span className="text-xl">🧠</span>
      <p>{message}</p>
    </div>
  );
}


