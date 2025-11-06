"use client";

import { useMemo, useState } from "react";
import type { MissionLaunchPayload, MissionType } from "@/types/dashboard";
import { MISSION_DEFINITIONS } from "@/lib/missions";

type MissionControlPanelProps = {
  onLaunch: (payload: MissionLaunchPayload) => Promise<void> | void;
  onReset: () => void;
  isLaunching: boolean;
};

type MissionFormState = {
  missionType: MissionType;
  planId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  currency: string;
  notes: string;
};

const DEFAULT_FORM_STATE: MissionFormState = {
  missionType: "plan_vs_invoice",
  planId: "",
  customerId: "",
  startDate: "",
  endDate: "",
  currency: "USD",
  notes: "",
};

export function MissionControlPanel({
  onLaunch,
  onReset,
  isLaunching,
}: MissionControlPanelProps) {
  const [formState, setFormState] = useState<MissionFormState>(DEFAULT_FORM_STATE);

  const activeMissionMeta = useMemo(
    () =>
      MISSION_DEFINITIONS.find(
        (option) => option.value === formState.missionType,
      ),
    [formState.missionType],
  );

  const handleChange = (
    field: keyof MissionFormState,
    value: string,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: MissionLaunchPayload = {
      missionType: formState.missionType,
      planId: formState.planId.trim() || undefined,
      customerId: formState.customerId.trim() || undefined,
      startDate: formState.startDate || undefined,
      endDate: formState.endDate || undefined,
      currency: formState.currency.trim() || undefined,
      notes: formState.notes.trim() || undefined,
    };

    await onLaunch(payload);
  };

  const handleResetClick = () => {
    setFormState(DEFAULT_FORM_STATE);
    onReset();
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Mission Control
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure the investigation scope and send briefing instructions to the agent.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetClick}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Clear dashboard
          </button>
        </div>
      </header>

      <form className="mt-4 grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <label htmlFor="mission-type" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Mission
          </label>
          <select
            id="mission-type"
            value={formState.missionType}
            onChange={(event) => handleChange("missionType", event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {MISSION_DEFINITIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {activeMissionMeta ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeMissionMeta.description}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="plan-id" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Plan ID
            </label>
            <input
              id="plan-id"
              value={formState.planId}
              placeholder="e.g. PLAN-ACME-2024"
              onChange={(event) => handleChange("planId", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="customer-id" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Customer ID
            </label>
            <input
              id="customer-id"
              value={formState.customerId}
              placeholder="e.g. CUST-ACME"
              onChange={(event) => handleChange("customerId", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="start-date" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Period start
            </label>
            <input
              id="start-date"
              type="date"
              value={formState.startDate}
              onChange={(event) => handleChange("startDate", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="end-date" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Period end
            </label>
            <input
              id="end-date"
              type="date"
              value={formState.endDate}
              onChange={(event) => handleChange("endDate", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label htmlFor="currency" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Currency
            </label>
            <input
              id="currency"
              value={formState.currency}
              onChange={(event) => handleChange("currency", event.target.value.toUpperCase())}
              maxLength={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Additional context (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formState.notes}
              placeholder="Share relevant contract notes, suspected issue, or audit instructions."
              onChange={(event) => handleChange("notes", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            disabled={isLaunching}
          >
            {isLaunching ? "Launching mission..." : "Launch mission"}
          </button>
        </div>
      </form>
    </section>
  );
}


