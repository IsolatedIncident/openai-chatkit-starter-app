"use client";
import type { FindingRecord } from "@/types/dashboard";

type FindingsTableProps = {
  findings: FindingRecord[];
  onSelectFinding?: (finding: FindingRecord) => void;
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  unknown: "Unknown",
};

export function FindingsTable({ findings, onSelectFinding }: FindingsTableProps) {
  const hasFindings = findings.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Findings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Structured anomalies surfaced by the agent during the investigation.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {findings.length} item{findings.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="flex-1 overflow-auto">
        {!hasFindings ? (
          <EmptyState message="No findings yet. Launch a mission or wait for the agent to report its analysis." />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {findings.map((finding) => (
              <li key={finding.id} className="px-5 py-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelectFinding?.(finding)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {finding.id}
                        </span>
                        {renderConfidence(finding.confidence)}
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {finding.title || "Untitled finding"}
                      </h4>
                      {finding.summary ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {finding.summary}
                        </p>
                      ) : null}
                      {finding.evidence && finding.evidence.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500 dark:text-slate-400">
                          {finding.evidence.map((item, index) => (
                            <li key={`${finding.id}-evidence-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                      {finding.tags && finding.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {finding.tags.map((tag) => (
                            <span
                              key={`${finding.id}-tag-${tag}`}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-sm text-slate-700 dark:text-slate-200">
                      {renderImpact(finding)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function renderImpact(finding: FindingRecord) {
  if (finding.impactAmount != null && finding.impactCurrency) {
    return (
      <>
        <span className="text-lg font-semibold">
          {formatCurrency(finding.impactAmount, finding.impactCurrency)}
        </span>
        {finding.impactText ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {finding.impactText}
          </span>
        ) : null}
      </>
    );
  }

  if (finding.impactText) {
    return (
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {finding.impactText}
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-400 dark:text-slate-500">Impact TBD</span>
  );
}

function renderConfidence(confidence: FindingRecord["confidence"]) {
  if (!confidence) {
    return null;
  }

  const label = CONFIDENCE_LABELS[confidence] ?? confidence;
  const baseClass =
    "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
  const variantClass = getConfidenceClass(confidence);

  return <span className={`${baseClass} ${variantClass}`}>{label}</span>;
}

function getConfidenceClass(confidence: FindingRecord["confidence"]) {
  switch (confidence) {
    case "high":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "low":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
    case "unknown":
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
      <span className="text-2xl">🕵️‍♀️</span>
      <p>{message}</p>
    </div>
  );
}


