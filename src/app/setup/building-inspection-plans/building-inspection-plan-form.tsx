"use client";

import { useActionState, useState } from "react";

import type {
  AreaSetupRecord,
  BuildingInspectionPlanRecord,
  InspectionTemplateSetupRecord,
} from "@/lib/client-building-setup/model";

import {
  saveBuildingInspectionPlanAction,
  type BuildingInspectionPlanSetupActionState,
} from "./actions";

const initialState = { status: "idle" } satisfies BuildingInspectionPlanSetupActionState;

type PlanRow = {
  key: string;
  areaId: string;
  inspectionTemplateId: string;
};

type BuildingInspectionPlanFormProps = {
  buildingId: string;
  plan: BuildingInspectionPlanRecord | null;
  activeAreas: AreaSetupRecord[];
  activeTemplates: InspectionTemplateSetupRecord[];
};

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function blankRow(key = "plan-row-initial"): PlanRow {
  return { key, areaId: "", inspectionTemplateId: "" };
}

function newPlanRow(): PlanRow {
  return blankRow(`plan-row-${Date.now()}`);
}

function planToRows(plan: BuildingInspectionPlanRecord | null): PlanRow[] {
  if (!plan || plan.entries.length === 0) {
    return [blankRow()];
  }

  return plan.entries
    .slice()
    .sort((first, second) => first.position - second.position)
    .map((entry, index) => ({
      key: entry.id || `plan-entry-${index}`,
      areaId: entry.areaId,
      inspectionTemplateId: entry.inspectionTemplateId,
    }));
}

function entryError(
  state: BuildingInspectionPlanSetupActionState,
  index: number,
  field: "areaId" | "inspectionTemplateId",
): string | undefined {
  return state.status === "error" ? state.entryErrors[index]?.[field] : undefined;
}

function findPlanEntryForAreaId(
  plan: BuildingInspectionPlanRecord | null,
  areaId: string,
) {
  return plan?.entries.find((entry) => entry.areaId === areaId);
}

function findPlanEntryForTemplateId(
  plan: BuildingInspectionPlanRecord | null,
  templateId: string,
) {
  return plan?.entries.find((entry) => entry.inspectionTemplateId === templateId);
}

export function BuildingInspectionPlanForm({
  buildingId,
  plan,
  activeAreas,
  activeTemplates,
}: BuildingInspectionPlanFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveBuildingInspectionPlanAction,
    initialState,
  );
  const [rows, setRows] = useState(() => planToRows(plan));

  function updateRow(index: number, values: Partial<Omit<PlanRow, "key">>): void {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...values } : row)),
    );
  }

  function removeRow(index: number): void {
    setRows((current) =>
      current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index),
    );
  }

  function moveRow(index: number, direction: -1 | 1): void {
    setRows((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = current.slice();
      const [row] = next.splice(index, 1);

      if (!row) {
        return current;
      }

      next.splice(targetIndex, 0, row);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-slate-200 p-5">
      <input name="buildingId" type="hidden" value={buildingId} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-950">Plan entries</h2>
        <p className="text-sm text-muted-ink">
          Each row assigns one active Area to one active Inspection Template. Row order is
          used when starting future Draft Inspections.
        </p>
        <FieldError message={state.status === "error" ? state.errors.entries : undefined} />
        <FieldError message={state.status === "error" ? state.errors.buildingId : undefined} />
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => {
          const staleArea = row.areaId ? findPlanEntryForAreaId(plan, row.areaId) : undefined;
          const staleTemplate = row.inspectionTemplateId
            ? findPlanEntryForTemplateId(plan, row.inspectionTemplateId)
            : undefined;
          const activeAreaIds = new Set(activeAreas.map((area) => area.id));
          const activeTemplateIds = new Set(activeTemplates.map((template) => template.id));

          return (
            <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4" key={row.key}>
              <div className="flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-slate-900">
                  Area/template pair {index + 1}
                </legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={index === 0}
                    onClick={() => moveRow(index, -1)}
                    type="button"
                  >
                    Up
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={index === rows.length - 1}
                    onClick={() => moveRow(index, 1)}
                    type="button"
                  >
                    Down
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <label className="space-y-2" htmlFor={`plan-area-${row.key}`}>
                <span className="text-sm font-semibold text-slate-900">Area</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  id={`plan-area-${row.key}`}
                  name="areaId"
                  onChange={(event) => updateRow(index, { areaId: event.target.value })}
                  required
                  value={row.areaId}
                >
                  <option value="">Select an Area</option>
                  {row.areaId && !activeAreaIds.has(row.areaId) && staleArea ? (
                    <option value={row.areaId}>
                      {staleArea.areaName} (archived or unavailable — choose an active Area)
                    </option>
                  ) : null}
                  {activeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name} · {area.areaTypeName}
                    </option>
                  ))}
                </select>
                <FieldError message={entryError(state, index, "areaId")} />
              </label>

              <label className="space-y-2" htmlFor={`plan-template-${row.key}`}>
                <span className="text-sm font-semibold text-slate-900">
                  Inspection Template
                </span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  id={`plan-template-${row.key}`}
                  name="inspectionTemplateId"
                  onChange={(event) =>
                    updateRow(index, { inspectionTemplateId: event.target.value })
                  }
                  required
                  value={row.inspectionTemplateId}
                >
                  <option value="">Select an Inspection Template</option>
                  {row.inspectionTemplateId &&
                  !activeTemplateIds.has(row.inspectionTemplateId) &&
                  staleTemplate ? (
                    <option value={row.inspectionTemplateId}>
                      {staleTemplate.inspectionTemplateName} (archived — choose an active Template)
                    </option>
                  ) : null}
                  {activeTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <FieldError message={entryError(state, index, "inspectionTemplateId")} />
              </label>
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
          onClick={() => setRows((current) => [...current, newPlanRow()])}
          type="button"
        >
          Add pair
        </button>

        <button
          className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save Building Inspection Plan"}
        </button>
      </div>

      {state.status === "success" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
