"use client";

import { useActionState } from "react";

import type { AreaTypeSetupRecord } from "@/lib/client-building-setup/model";
import { ux } from "@/lib/ux/tokens";

import {
  createAreaTypeAction,
  type AreaTypeSetupActionState,
  updateAreaTypeAction,
} from "./actions";

const initialState = { status: "idle" } satisfies AreaTypeSetupActionState;

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function areaTypeNameValue(
  state: AreaTypeSetupActionState,
  areaType?: AreaTypeSetupRecord,
): string {
  if (state.status === "error") {
    return state.values.name;
  }

  return areaType?.name ?? "";
}

function nameError(state: AreaTypeSetupActionState): string | undefined {
  return state.status === "error" ? state.errors.name : undefined;
}

export function AreaTypeCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createAreaTypeAction,
    initialState,
  );

  return (
    <form action={formAction} className={ux.formStack}>
      <label className={ux.formField} htmlFor="area-type-name">
        <span className={ux.fieldLabel}>Area Type name</span>
        <input
          className={ux.input}
          defaultValue={areaTypeNameValue(state)}
          id="area-type-name"
          name="name"
          placeholder="e.g. Restroom"
          required
        />
        <FieldError message={nameError(state)} />
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
          {isPending ? "Saving…" : "Create Area Type"}
        </button>
      </div>
    </form>
  );
}

export function AreaTypeEditForm({ areaType }: { areaType: AreaTypeSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateAreaTypeAction,
    initialState,
  );

  return (
    <form action={formAction} className={ux.formStack}>
      <input name="id" type="hidden" value={areaType.id} />
      <label className={ux.formField} htmlFor="area-type-name">
        <span className={ux.fieldLabel}>Area Type name</span>
        <input
          className={ux.input}
          defaultValue={areaTypeNameValue(state, areaType)}
          id="area-type-name"
          name="name"
          required
        />
        <FieldError message={nameError(state)} />
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
          {isPending ? "Saving…" : "Save Area Type"}
        </button>
      </div>
    </form>
  );
}
