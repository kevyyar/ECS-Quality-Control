"use client";

import { useActionState } from "react";

import type { ClientSetupRecord } from "@/lib/client-building-setup/model";

import {
  createClientAction,
  type ClientSetupActionState,
  updateClientAction,
} from "./actions";

const initialState = { status: "idle" } satisfies ClientSetupActionState;

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function clientNameValue(
  state: ClientSetupActionState,
  client?: ClientSetupRecord,
): string {
  if (state.status === "error") {
    return state.values.name;
  }

  return client?.name ?? "";
}

function nameError(state: ClientSetupActionState): string | undefined {
  return state.status === "error" ? state.errors.name : undefined;
}

export function ClientCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createClientAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <label className="space-y-2" htmlFor="client-name">
        <span className="text-sm font-semibold text-slate-900">Client name</span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={clientNameValue(state)}
          id="client-name"
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
        {isPending ? "Saving…" : "Create Client"}
      </button>
    </form>
  );
}

export function ClientEditForm({ client }: { client: ClientSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateClientAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <input name="id" type="hidden" value={client.id} />
      <label className="space-y-2" htmlFor="client-name">
        <span className="text-sm font-semibold text-slate-900">Client name</span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={clientNameValue(state, client)}
          id="client-name"
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
        {isPending ? "Saving…" : "Save Client"}
      </button>
    </form>
  );
}
