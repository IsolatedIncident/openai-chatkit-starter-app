export type MissionType =
  | "plan_vs_invoice"
  | "missing_invoice"
  | "revenue_leakage_overview"
  | "custom";

export type MissionLaunchPayload = {
  missionType: MissionType;
  planId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  notes?: string;
};

export type ConfidenceLevel = "low" | "medium" | "high" | "unknown";

export type FindingRecord = {
  id: string;
  title: string;
  summary?: string;
  impactText?: string;
  impactAmount?: number;
  impactCurrency?: string;
  confidence?: ConfidenceLevel;
  evidence?: string[];
  tags?: string[];
  raw?: Record<string, unknown>;
};

export type ProposalActionType =
  | "make_good_invoice"
  | "credit_memo"
  | "plan_amendment"
  | "other";

export type ProposalRecord = {
  id: string;
  actionType: ProposalActionType;
  title: string;
  summary?: string;
  amount?: number;
  currency?: string;
  status?: "draft" | "pending_review" | "awaiting_approval" | "applied";
  confidence?: ConfidenceLevel | string;
  linkedFindingId?: string;
  requestedBy?: string;
  raw?: Record<string, unknown>;
};

export type TraceEntry = {
  id: string;
  timestamp?: string;
  label: string;
  detail?: string;
  raw?: Record<string, unknown>;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: string;
  raw?: Record<string, unknown>;
};

export type DashboardEvent = {
  toolName: string;
  params: Record<string, unknown>;
};

export type DashboardEventResult = Record<string, unknown> | void;


