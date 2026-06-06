"use client";

import { useActionState } from "react";

import type {
  BuildingSetupRecord,
  ClientSetupRecord,
} from "@/lib/client-building-setup/model";
import { ux } from "@/lib/ux/tokens";

import {
  createBuildingAction,
  type BuildingSetupActionState,
  updateBuildingAction,
} from "./actions";

const initialState = { status: "idle" } satisfies BuildingSetupActionState;

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function buildingNameValue(
  state: BuildingSetupActionState,
  building?: BuildingSetupRecord,
): string {
  if (state.status === "error") {
    return state.values.name;
  }

  return building?.name ?? "";
}

function selectedClientValue(state: BuildingSetupActionState): string {
  return state.status === "error" ? state.values.clientId : "";
}

function fieldError(
  state: BuildingSetupActionState,
  field: "clientId" | "name",
): string | undefined {
  return state.status === "error" ? state.errors[field] : undefined;
}

export function BuildingCreateForm({
  activeClients,
}: {
  activeClients: ClientSetupRecord[];
}) {
  const [state, formAction, isPending] = useActionState(
    createBuildingAction,
    initialState,
  );

  if (activeClients.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Create or restore an active Client before adding Buildings.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <label className="space-y-2" htmlFor="building-client-id">
        <span className="text-sm font-semibold text-slate-900">Client</span>
        <select
          className={ux.input}
          defaultValue={selectedClientValue(state)}
          id="building-client-id"
          name="clientId"
          required
        >
          <option value="">Select a Client</option>
          {activeClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <FieldError message={fieldError(state, "clientId")} />
      </label>

      <label className="space-y-2" htmlFor="building-name">
        <span className="text-sm font-semibold text-slate-900">Building name</span>
        <input
          className={ux.input}
          defaultValue={buildingNameValue(state)}
          id="building-name"
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
        {isPending ? "Saving…" : "Create Building"}
      </button>
    </form>
  );
}

export function BuildingEditForm({ building }: { building: BuildingSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateBuildingAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <input name="id" type="hidden" value={building.id} />
      <label className="space-y-2" htmlFor="building-name">
        <span className="text-sm font-semibold text-slate-900">Building name</span>
        <input
          className={ux.input}
          defaultValue={buildingNameValue(state, building)}
          id="building-name"
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
        {isPending ? "Saving…" : "Save Building"}
      </button>
    </form>
  );
}
