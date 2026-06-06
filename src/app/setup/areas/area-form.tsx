"use client";

import { useActionState } from "react";

import type {
  AreaSetupRecord,
  AreaTypeSetupRecord,
  BuildingSetupRecord,
} from "@/lib/client-building-setup/model";
import { ux } from "@/lib/ux/tokens";

import {
  createAreaAction,
  type AreaSetupActionState,
  updateAreaAction,
} from "./actions";

const initialState = { status: "idle" } satisfies AreaSetupActionState;

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function areaNameValue(state: AreaSetupActionState, area?: AreaSetupRecord): string {
  if (state.status === "error") {
    return state.values.name;
  }

  return area?.name ?? "";
}

function selectedBuildingValue(state: AreaSetupActionState): string {
  return state.status === "error" ? state.values.buildingId : "";
}

function selectedAreaTypeValue(state: AreaSetupActionState): string {
  return state.status === "error" ? state.values.areaTypeId : "";
}

function fieldError(
  state: AreaSetupActionState,
  field: "buildingId" | "areaTypeId" | "name",
): string | undefined {
  return state.status === "error" ? state.errors[field] : undefined;
}

export function AreaCreateForm({
  activeBuildings,
  activeAreaTypes,
}: {
  activeBuildings: BuildingSetupRecord[];
  activeAreaTypes: AreaTypeSetupRecord[];
}) {
  const [state, formAction, isPending] = useActionState(
    createAreaAction,
    initialState,
  );

  if (activeBuildings.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Create or restore an active Building before adding Areas.
      </div>
    );
  }

  if (activeAreaTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Create or restore an active Area Type before adding Areas.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <label className="space-y-2" htmlFor="area-building-id">
        <span className="text-sm font-semibold text-slate-900">Building</span>
        <select
          className={ux.input}
          defaultValue={selectedBuildingValue(state)}
          id="area-building-id"
          name="buildingId"
          required
        >
          <option value="">Select a Building</option>
          {activeBuildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.clientName} · {building.name}
            </option>
          ))}
        </select>
        <FieldError message={fieldError(state, "buildingId")} />
      </label>

      <label className="space-y-2" htmlFor="area-type-id">
        <span className="text-sm font-semibold text-slate-900">Area Type</span>
        <select
          className={ux.input}
          defaultValue={selectedAreaTypeValue(state)}
          id="area-type-id"
          name="areaTypeId"
          required
        >
          <option value="">Select an Area Type</option>
          {activeAreaTypes.map((areaType) => (
            <option key={areaType.id} value={areaType.id}>
              {areaType.name}
            </option>
          ))}
        </select>
        <FieldError message={fieldError(state, "areaTypeId")} />
      </label>

      <label className="space-y-2" htmlFor="area-name">
        <span className="text-sm font-semibold text-slate-900">Area name</span>
        <input
          className={ux.input}
          defaultValue={areaNameValue(state)}
          id="area-name"
          name="name"
          required
        />
        <FieldError message={fieldError(state, "name")} />
      </label>

      {state.status === "success" ? (
        <p className={ux.successMessage}>
          {state.message}
        </p>
      ) : null}

      <button
        className={ux.primaryButton}
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Create Area"}
      </button>
    </form>
  );
}

export function AreaEditForm({ area }: { area: AreaSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateAreaAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <input name="id" type="hidden" value={area.id} />
      <label className="space-y-2" htmlFor="area-name">
        <span className="text-sm font-semibold text-slate-900">Area name</span>
        <input
          className={ux.input}
          defaultValue={areaNameValue(state, area)}
          id="area-name"
          name="name"
          required
        />
        <FieldError message={fieldError(state, "name")} />
      </label>

      {state.status === "success" ? (
        <p className={ux.successMessage}>
          {state.message}
        </p>
      ) : null}

      <button
        className={ux.primaryButton}
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Save Area"}
      </button>
    </form>
  );
}
