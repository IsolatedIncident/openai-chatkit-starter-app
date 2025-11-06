"use client";

import type { AuditLogEntry } from "@/types/dashboard";

type AuditLogViewerProps = {
  entries: AuditLogEntry[];
};

export function AuditLogViewer({ entries }: AuditLogViewerProps) {
  const hasEntries = entries.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Audit log
          </h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {entries.length}
          </span>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        {!hasEntries ? (
          <EmptyState message="No actions have been applied in the sandbox yet." />
        ) : (
          <ul className="space-y-3 px-5 py-4 text-sm">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {entry.action}
                    </div>
                    {entry.details ? (
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {entry.details}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Actor: {entry.actor}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
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
      <span className="text-xl">📜</span>
      <p>{message}</p>
    </div>
  );
}


