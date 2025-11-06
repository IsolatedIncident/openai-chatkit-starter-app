"use client";

import type { ProposalRecord } from "@/types/dashboard";

type ProposalsTableProps = {
  proposals: ProposalRecord[];
  onApply: (proposal: ProposalRecord) => Promise<void> | void;
  applyingProposalId?: string | null;
};

const ACTION_LABELS: Record<ProposalRecord["actionType"], string> = {
  make_good_invoice: "Make-good invoice",
  credit_memo: "Credit memo",
  plan_amendment: "Plan amendment",
  other: "Other action",
};

export function ProposalsTable({
  proposals,
  onApply,
  applyingProposalId,
}: ProposalsTableProps) {
  const hasProposals = proposals.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Proposals
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Candidate remediation steps prepared by the agent. Approve to apply in the sandbox.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {proposals.length} action{proposals.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="flex-1 overflow-auto">
        {!hasProposals ? (
          <EmptyState message="No proposals yet. The agent will draft make-good invoices, credit memos, or plan amendments here." />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {proposals.map((proposal) => {
              const isApplying = applyingProposalId === proposal.id;

              return (
                <li key={proposal.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-xl space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {ACTION_LABELS[proposal.actionType] ?? proposal.actionType}
                        </span>
                        {proposal.status ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {proposal.status.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {proposal.title || "Untitled proposal"}
                      </h4>
                      {proposal.summary ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {proposal.summary}
                        </p>
                      ) : null}
                      {proposal.linkedFindingId ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Linked finding: {proposal.linkedFindingId}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-700 dark:text-slate-200">
                      {proposal.amount != null && proposal.currency ? (
                        <span className="text-lg font-semibold">
                          {formatCurrency(proposal.amount, proposal.currency)}
                        </span>
                      ) : null}
                      {proposal.confidence ? (
                        <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Confidence: {proposal.confidence}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onApply(proposal)}
                        disabled={isApplying}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                      >
                        {isApplying ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
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
      <span className="text-2xl">🧾</span>
      <p>{message}</p>
    </div>
  );
}


