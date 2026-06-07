"use client";

import { useActionState } from "react";

import type { ClientSetupRecord } from "@/lib/client-building-setup/model";
import { ux } from "@/lib/ux/tokens";

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
    <form action={formAction} className={ux.formStack}>
      <label className={ux.formField} htmlFor="client-name">
        <span className={ux.fieldLabel}>Client name</span>
        <input
          className={ux.input}
          defaultValue={clientNameValue(state)}
          id="client-name"
          name="name"
          placeholder="e.g. Apex Property Group"
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
          {isPending ? "Saving…" : "Create Client"}
        </button>
      </div>
    </form>
  );
}

export function ClientEditForm({ client }: { client: ClientSetupRecord }) {
  const [state, formAction, isPending] = useActionState(
    updateClientAction,
    initialState,
  );

  return (
    <form action={formAction} className={ux.formStack}>
      <input name="id" type="hidden" value={client.id} />
      <label className={ux.formField} htmlFor="client-name">
        <span className={ux.fieldLabel}>Client name</span>
        <input
          className={ux.input}
          defaultValue={clientNameValue(state, client)}
          id="client-name"
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
          {isPending ? "Saving…" : "Save Client"}
        </button>
      </div>
    </form>
  );
}
