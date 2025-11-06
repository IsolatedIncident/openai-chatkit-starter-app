"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChatKitPanel,
  type ChatKitHandles,
  type FactAction,
} from "@/components/ChatKitPanel";
import { MissionControlPanel } from "@/components/MissionControlPanel";
import { FindingsTable } from "@/components/FindingsTable";
import { ProposalsTable } from "@/components/ProposalsTable";
import { TraceViewer } from "@/components/TraceViewer";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  type AuditLogEntry,
  type DashboardEvent,
  type ConfidenceLevel,
  type FindingRecord,
  type MissionLaunchPayload,
  type ProposalRecord,
  type TraceEntry,
} from "@/types/dashboard";
import { getMissionDefinition } from "@/lib/missions";

export default function App() {
  const { scheme, setScheme } = useColorScheme();
  const [chatHandles, setChatHandles] = useState<ChatKitHandles | null>(null);
  const [missionContext, setMissionContext] = useState<MissionLaunchPayload | null>(null);
  const [isLaunchingMission, setIsLaunchingMission] = useState(false);
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [applyingProposalId, setApplyingProposalId] = useState<string | null>(null);

  const clearDashboard = useCallback(() => {
    setFindings([]);
    setProposals([]);
    setTrace([]);
    setAuditLog([]);
  }, []);

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  const handleDashboardEvent = useCallback(
    async (event: DashboardEvent) => {
      const params = event.params ?? {};
      if (!params || typeof params !== "object") {
        return { success: true };
      }

      if (toolNameMatches(event.toolName, ["reset_dashboard", "clear_dashboard", "reset"])) {
        clearDashboard();
        setMissionContext(null);
        return { success: true };
      }

      const recordParams = params as Record<string, unknown>;
      const replace = isReplaceFlag(recordParams);

      if (toolNameMatches(event.toolName, ["update_findings", "report_findings"])) {
        const payload = extractList(recordParams, ["findings", "items", "data"]);
        const normalized = normalizeFindings(payload);
        setFindings((current) => mergeRecords(current, normalized, replace));
        return { success: true };
      }

      if (toolNameMatches(event.toolName, ["update_proposals", "report_proposals"])) {
        const payload = extractList(recordParams, ["proposals", "items", "data"]);
        const normalized = normalizeProposals(payload);
        setProposals((current) => mergeRecords(current, normalized, replace));
        return { success: true };
      }

      if (toolNameMatches(event.toolName, ["update_trace", "report_trace", "trace_update"])) {
        const payload = extractList(recordParams, ["trace", "steps", "entries", "events"]);
        const normalized = normalizeTraceEntries(payload);
        setTrace((current) => mergeRecords(current, normalized, replace));
        return { success: true };
      }

      if (toolNameMatches(event.toolName, ["update_audit_log", "append_audit_log", "audit_log"])) {
        const payload = extractList(recordParams, ["entries", "events", "log"]);
        const normalized = normalizeAuditEntries(payload);
        setAuditLog((current) => mergeRecords(current, normalized, replace));
        return { success: true };
      }

      if (toolNameMatches(event.toolName, ["set_mission", "update_mission_context"])) {
        const missionPayload = recordParams.mission;
        if (missionPayload && typeof missionPayload === "object") {
          setMissionContext((prev) => ({ ...prev, ...coerceMissionPayload(missionPayload) }));
        }
        return { success: true };
      }

      if (process.env.NODE_ENV !== "production") {
        console.info("[Dashboard] Unhandled tool", event.toolName, params);
      }

      return { success: true };
    },
    [clearDashboard]
  );

  const handleMissionLaunch = useCallback(
    async (payload: MissionLaunchPayload) => {
      setIsLaunchingMission(true);
      setMissionContext(payload);
      clearDashboard();

      if (!chatHandles) {
        console.warn("Chat controls not ready yet. Mission context stored locally.");
        setIsLaunchingMission(false);
        return;
      }

      try {
        await chatHandles.setThreadId(null);
        await chatHandles.sendUserMessage({
          text: buildMissionBrief(payload),
          newThread: true,
        });
        await chatHandles.focusComposer();
      } catch (error) {
        console.error("Failed to launch mission", error);
      } finally {
        setIsLaunchingMission(false);
      }
    },
    [chatHandles, clearDashboard]
  );

  const handleMissionReset = useCallback(() => {
    clearDashboard();
    setMissionContext(null);
    if (chatHandles) {
      void chatHandles.setThreadId(null);
    }
  }, [chatHandles, clearDashboard]);

  const handleApplyProposal = useCallback(
    async (proposal: ProposalRecord) => {
      if (!chatHandles) {
        console.warn("Chat controls not ready yet. Unable to apply proposal.");
        return;
      }

      setApplyingProposalId(proposal.id);
      try {
        await chatHandles.sendCustomAction({
          type: "apply_proposal",
          payload: {
            proposal_id: proposal.id,
            proposal,
          },
        });

        setAuditLog((current) => [
          {
            id: `operator-apply-${proposal.id}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: "Operator",
            action: `Apply ${proposal.actionType}`,
            details: proposal.summary ?? proposal.title,
            raw: { proposalId: proposal.id },
          },
          ...current,
        ]);
      } catch (error) {
        console.error("Failed to apply proposal", error);
      } finally {
        setApplyingProposalId(null);
      }
    },
    [chatHandles]
  );

  const missionSummary = useMemo(() => {
    if (!missionContext) {
      return null;
    }

    const definition = getMissionDefinition(missionContext.missionType);
    const entries: Array<{ label: string; value: string }> = [];
    if (missionContext.planId) {
      entries.push({ label: "Plan", value: missionContext.planId });
    }
    if (missionContext.customerId) {
      entries.push({ label: "Customer", value: missionContext.customerId });
    }
    if (missionContext.startDate || missionContext.endDate) {
      const start = missionContext.startDate ?? "?";
      const end = missionContext.endDate ?? "?";
      entries.push({ label: "Period", value: `${start} → ${end}` });
    }
    if (missionContext.currency) {
      entries.push({ label: "Currency", value: missionContext.currency });
    }
    if (missionContext.notes) {
      entries.push({ label: "Notes", value: missionContext.notes });
    }

    return {
      title: definition?.label ?? missionContext.missionType,
      description: definition?.description,
      entries,
    };
  }, [missionContext]);

  return (
    <main className="min-h-screen w-full bg-slate-100 pb-10 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Revenue Leakage Detective
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Investigate anomalies across billing plans, invoices, and corrective actions with an AI financial detective.
          </p>
        </header>

        <MissionControlPanel
          onLaunch={handleMissionLaunch}
          onReset={handleMissionReset}
          isLaunching={isLaunchingMission}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            {missionSummary ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <header className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Active mission
                    </h2>
                    {missionSummary.description ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {missionSummary.description}
                      </p>
                    ) : null}
                  </div>
                </header>
                <dl className="grid gap-3 text-sm">
                  {missionSummary.entries.map((entry) => (
                    <div key={`${entry.label}-${entry.value}`} className="flex flex-wrap justify-between gap-2">
                      <dt className="text-slate-500 dark:text-slate-400">{entry.label}</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">
                        {entry.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <ChatKitPanel
              theme={scheme}
              onWidgetAction={handleWidgetAction}
              onResponseEnd={handleResponseEnd}
              onThemeRequest={setScheme}
              onDashboardEvent={handleDashboardEvent}
              onControlReady={setChatHandles}
            />
          </div>
          <div className="flex flex-col gap-6">
            <FindingsTable findings={findings} />
            <ProposalsTable
              proposals={proposals}
              onApply={handleApplyProposal}
              applyingProposalId={applyingProposalId}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TraceViewer trace={trace} />
          <AuditLogViewer entries={auditLog} />
        </div>
      </div>
    </main>
  );
}

function mergeRecords<T extends { id: string }>(
  current: T[],
  incoming: T[],
  replace: boolean
): T[] {
  if (replace) {
    return incoming;
  }

  if (incoming.length === 0) {
    return current;
  }

  const incomingMap = new Map<string, T>();
  incoming.forEach((item) => {
    incomingMap.set(item.id, item);
  });

  const updated = current.map((item) => {
    const next = incomingMap.get(item.id);
    if (!next) {
      return item;
    }
    incomingMap.delete(item.id);
    return { ...item, ...next };
  });

  return [...updated, ...incomingMap.values()];
}

function isReplaceFlag(params: Record<string, unknown>): boolean {
  const candidate = params.replace ?? params.reset ?? params.overwrite ?? params.clear;
  return candidate === true || candidate === "true";
}

function extractList(
  params: Record<string, unknown>,
  keys: string[]
): unknown[] {
  for (const key of keys) {
    if (key in params) {
      return toArray((params as Record<string, unknown>)[key]);
    }
  }
  return [];
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function normalizeFindings(items: unknown[]): FindingRecord[] {
  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = sanitizeId(
        record.id ?? record.finding_id ?? record.key ?? `finding-${index + 1}`
      );
      const title =
        toStringValue(record.title) ??
        toStringValue(record.name) ??
        toStringValue(record.summary) ??
        "Untitled finding";
      const summary =
        toStringValue(record.summary) ??
        toStringValue(record.description) ??
        toStringValue(record.detail);
      const evidence = toStringArray(record.evidence ?? record.supporting_evidence);
      const tags = toStringArray(record.tags);

      const {
        impactAmount,
        impactCurrency,
        impactText,
      } = extractImpact(record.impact ?? record.impact_summary ?? record.value);
      const resolvedImpactText =
        impactText ??
        (impactAmount != null && impactCurrency
          ? `${impactCurrency} ${impactAmount.toLocaleString()}`
          : undefined);

      const confidence = toConfidence(
        record.confidence ?? record.confidence_level ?? record.score
      );

      return {
        id,
        title,
        summary: summary || undefined,
        impactAmount,
        impactCurrency,
        impactText: resolvedImpactText,
        confidence,
        evidence,
        tags,
        raw: record,
      } satisfies FindingRecord;
    })
    .filter(Boolean) as FindingRecord[];
}

function normalizeProposals(items: unknown[]): ProposalRecord[] {
  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = sanitizeId(
        record.id ?? record.proposal_id ?? record.key ?? `proposal-${index + 1}`
      );
      const actionType = toProposalActionType(record.action_type ?? record.type);
      const title =
        toStringValue(record.title) ??
        toStringValue(record.summary) ??
        `${actionType} proposal`;
      const summary = toStringValue(record.summary) ?? toStringValue(record.description);
      const amount = toNumber(record.amount ?? record.total ?? record.value);
      const currency = toCurrency(record.currency ?? record.ccy);
      const status = toStatus(record.status ?? record.state);
      const rawConfidence =
        record.confidence ?? record.confidence_level ?? record.score;
      const confidence = toConfidence(rawConfidence);
      const confidenceLabel =
        confidence ?? toStringValue(rawConfidence) ?? undefined;
      const linkedFindingId = toStringValue(record.linked_finding_id ?? record.finding_id);

      return {
        id,
        actionType,
        title,
        summary: summary || undefined,
        amount: amount ?? undefined,
        currency,
        status,
        confidence: confidenceLabel,
        linkedFindingId: linkedFindingId || undefined,
        raw: record,
      } satisfies ProposalRecord;
    })
    .filter(Boolean) as ProposalRecord[];
}

function normalizeTraceEntries(items: unknown[]): TraceEntry[] {
  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = sanitizeId(
        record.id ?? record.step_id ?? record.key ?? `trace-${index + 1}`
      );
      const label =
        toStringValue(record.label) ??
        toStringValue(record.step) ??
        `Step ${index + 1}`;
      const detail =
        toStringValue(record.detail) ??
        toStringValue(record.summary) ??
        toStringValue(record.thought);
      const timestamp = toTimestamp(record.timestamp ?? record.at ?? record.time);

      return {
        id,
        label,
        detail: detail || undefined,
        timestamp: timestamp || undefined,
        raw: record,
      } satisfies TraceEntry;
    })
    .filter(Boolean) as TraceEntry[];
}

function normalizeAuditEntries(items: unknown[]): AuditLogEntry[] {
  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = sanitizeId(
        record.id ?? record.event_id ?? record.key ?? `audit-${index + 1}`
      );
      const timestamp =
        toTimestamp(record.timestamp ?? record.at ?? record.executed_at) ??
        new Date().toISOString();
      const actor =
        toStringValue(record.actor) ??
        toStringValue(record.user) ??
        toStringValue(record.principal) ??
        "Agent";
      const action =
        toStringValue(record.action) ??
        toStringValue(record.type) ??
        "Action";
      const details =
        toStringValue(record.details) ??
        toStringValue(record.summary) ??
        toStringValue(record.description);

      return {
        id,
        timestamp,
        actor,
        action,
        details: details || undefined,
        raw: record,
      } satisfies AuditLogEntry;
    })
    .filter(Boolean) as AuditLogEntry[];
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const arr = value
      .map((item) => toStringValue(item))
      .filter(Boolean) as string[];
    return arr.length > 0 ? arr : undefined;
  }
  const single = toStringValue(value);
  return single ? [single] : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function toCurrency(value: unknown): string | undefined {
  const text = toStringValue(value);
  return text ? text.toUpperCase() : undefined;
}

function toStatus(value: unknown): ProposalRecord["status"] | undefined {
  const text = toStringValue(value);
  if (!text) {
    return undefined;
  }

  const normalized = text.toLowerCase().replaceAll(" ", "_");
  if (
    normalized === "draft" ||
    normalized === "pending_review" ||
    normalized === "awaiting_approval" ||
    normalized === "applied"
  ) {
    return normalized;
  }

  return undefined;
}

function toConfidence(value: unknown): ConfidenceLevel | undefined {
  const text = toStringValue(value);
  if (!text) {
    return undefined;
  }

  const normalized = text.toLowerCase();
  if (normalized.includes("high")) {
    return "high";
  }
  if (normalized.includes("medium")) {
    return "medium";
  }
  if (normalized.includes("low")) {
    return "low";
  }
  if (normalized.includes("unknown")) {
    return "unknown";
  }

  return undefined;
}

function extractImpact(value: unknown): {
  impactAmount?: number;
  impactCurrency?: string;
  impactText?: string;
} {
  if (value == null) {
    return {};
  }

  if (typeof value === "number") {
    return { impactAmount: value };
  }

  if (typeof value === "string") {
    return { impactText: value };
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const amount = toNumber(record.amount ?? record.value ?? record.delta);
    const currency = toCurrency(record.currency ?? record.ccy);
    const text = toStringValue(record.text ?? record.summary ?? record.comment);
    return {
      impactAmount: amount,
      impactCurrency: currency,
      impactText: text || undefined,
    };
  }

  return {};
}

function toProposalActionType(value: unknown): ProposalRecord["actionType"] {
  const text = toStringValue(value);
  if (!text) {
    return "other";
  }

  const normalized = text.toLowerCase().replaceAll(" ", "_");
  if (normalized.includes("make") || normalized.includes("invoice")) {
    return "make_good_invoice";
  }
  if (normalized.includes("credit")) {
    return "credit_memo";
  }
  if (normalized.includes("amend")) {
    return "plan_amendment";
  }
  return "other";
}

function toTimestamp(value: unknown): string | undefined {
  const text = toStringValue(value);
  if (!text) {
    return undefined;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return date.toISOString();
}

function sanitizeId(value: unknown): string {
  const text = toStringValue(value);
  if (text) {
    return text;
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function toolNameMatches(toolName: string, candidates: string[]): boolean {
  return candidates.some(
    (candidate) =>
      toolName === candidate ||
      toolName.endsWith(`.${candidate}`) ||
      toolName.startsWith(`${candidate}.`)
  );
}

function buildMissionBrief(payload: MissionLaunchPayload): string {
  const mission = getMissionDefinition(payload.missionType);
  const lines: string[] = [];
  lines.push(
    `Mission: ${mission?.label ?? payload.missionType.replaceAll("_", " ")}`
  );
  lines.push(
    "You are the financial detective. Investigate revenue leakage using the JSON datasets provided (billing_plans, invoices, credit_memos, exchange_rates)."
  );
  if (payload.planId) {
    lines.push(`Focus Plan ID: ${payload.planId}`);
  }
  if (payload.customerId) {
    lines.push(`Customer ID: ${payload.customerId}`);
  }
  if (payload.startDate || payload.endDate) {
    lines.push(`Period: ${payload.startDate ?? "?"} -> ${payload.endDate ?? "?"}`);
  }
  if (payload.currency) {
    lines.push(`Preferred currency for summaries: ${payload.currency}`);
  }
  if (payload.notes) {
    lines.push(`Operator notes: ${payload.notes}`);
  }
  lines.push(
    "Report structured findings via the update_findings tool, draft remediations via update_proposals, provide reasoning trace updates, and wait for explicit Apply actions before using the apply tool. Include evidence references and amounts in all outputs."
  );

  return lines.join("\n");
}

function coerceMissionPayload(value: Record<string, unknown>): MissionLaunchPayload {
  return {
    missionType: toMissionType(value.missionType ?? value.type),
    planId: toStringValue(value.planId ?? value.plan_id) ?? undefined,
    customerId: toStringValue(value.customerId ?? value.customer_id) ?? undefined,
    startDate: toStringValue(value.startDate ?? value.start_date) ?? undefined,
    endDate: toStringValue(value.endDate ?? value.end_date) ?? undefined,
    currency: toCurrency(value.currency ?? value.ccy) ?? undefined,
    notes: toStringValue(value.notes ?? value.description) ?? undefined,
  };
}

function toMissionType(value: unknown): MissionLaunchPayload["missionType"] {
  const text = toStringValue(value);
  if (!text) {
    return "custom";
  }

  const normalized = text.toLowerCase().replaceAll(" ", "_");
  if (normalized === "plan_vs_invoice") {
    return "plan_vs_invoice";
  }
  if (normalized === "missing_invoice") {
    return "missing_invoice";
  }
  if (normalized === "revenue_leakage_overview") {
    return "revenue_leakage_overview";
  }
  return "custom";
}
