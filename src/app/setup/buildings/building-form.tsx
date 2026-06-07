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
      <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Create or restore an active Client before adding Buildings.
      </div>
    );
  }

  return (
    <form action={formAction} className={ux.formStack}>
      <label className={ux.formField} htmlFor="building-client-id">
        <span className={ux.fieldLabel}>Client</span>
        <select
          className={ux.select}
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

      <label className={ux.formField} htmlFor="building-name">
        <span className={ux.fieldLabel}>Building name</span>
        <input
          className={ux.input}
          defaultValue={buildingNameValue(state)}
          id="building-name"
          name="name"
          placeholder="e.g. Meridian Tower"
          required
        />
        <FieldError message={fieldError(state, "name")} />
      </label>

      {state.status === "success" ? (
        <p className={ux.successMessage}>
          {state.message}
        </p>
      ) : null}

      <div className={ux.formFooter}>
        <button
          className={ux.primaryButton}
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Create Building"}
        </button>
      </div>
    </form>
  );
}

export function BuildingEditForm({ building }: { building: BuildingSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateBuildingAction,
    initialState,
  );

  return (
    <form action={formAction} className={ux.formStack}>
      <input name="id" type="hidden" value={building.id} />
      <label className={ux.formField} htmlFor="building-name">
        <span className={ux.fieldLabel}>Building name</span>
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

      <div className={ux.formFooter}>
        <button
          className={ux.primaryButton}
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save Building"}
        </button>
      </div>
    </form>
  );
}
