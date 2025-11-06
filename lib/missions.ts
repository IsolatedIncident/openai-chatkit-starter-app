import type { MissionType } from "@/types/dashboard";

export type MissionDefinition = {
  value: MissionType;
  label: string;
  description: string;
};

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    value: "plan_vs_invoice",
    label: "Plan vs Invoice Mismatch",
    description:
      "Compare contracted plans with billed invoices to spot over/under billing",
  },
  {
    value: "missing_invoice",
    label: "Missing Invoice Sweep",
    description:
      "Scan ledgers for months or entitlements that were never invoiced",
  },
  {
    value: "revenue_leakage_overview",
    label: "Revenue Leakage Overview",
    description:
      "Summarize anomalies across all customers and flag the biggest gaps",
  },
  {
    value: "custom",
    label: "Custom Investigation",
    description:
      "Send bespoke instructions to the agent with optional notes and filters",
  },
];

export function getMissionDefinition(type: MissionType): MissionDefinition | undefined {
  return MISSION_DEFINITIONS.find((mission) => mission.value === type);
}


