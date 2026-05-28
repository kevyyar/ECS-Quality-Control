"use client";

import { useActionState } from "react";

import type { AreaTypeSetupRecord } from "@/lib/client-building-setup/model";

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
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <label className="space-y-2" htmlFor="area-type-name">
        <span className="text-sm font-semibold text-slate-900">Area Type name</span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={areaTypeNameValue(state)}
          id="area-type-name"
          name="name"
          required
        />
        <FieldError message={nameError(state)} />
      </label>

      {state.status === "success" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Create Area Type"}
      </button>
    </form>
  );
}

export function AreaTypeEditForm({ areaType }: { areaType: AreaTypeSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateAreaTypeAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <input name="id" type="hidden" value={areaType.id} />
      <label className="space-y-2" htmlFor="area-type-name">
        <span className="text-sm font-semibold text-slate-900">Area Type name</span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={areaTypeNameValue(state, areaType)}
          id="area-type-name"
          name="name"
          required
        />
        <FieldError message={nameError(state)} />
      </label>

      {state.status === "success" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Save Area Type"}
      </button>
    </form>
  );
}
