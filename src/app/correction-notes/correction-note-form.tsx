"use client";

import { useActionState } from "react";

import type { CorrectionNoteTargetType } from "@/lib/correction-notes/model";

import { addCorrectionNoteAction, type AddCorrectionNoteActionState } from "./actions";

const initialState = { status: "idle" } satisfies AddCorrectionNoteActionState;


function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function noteValue(state: AddCorrectionNoteActionState): string {
  return state.status === "error" ? state.values.note : "";
}

function fieldError(
  state: AddCorrectionNoteActionState,
  field: "targetType" | "targetId" | "note",
): string | undefined {
  return state.status === "error" ? state.errors[field] : undefined;
}

export function CorrectionNoteForm({
  targetId,
  targetType,
}: {
  targetId: string;
  targetType: CorrectionNoteTargetType;
}) {
  const [state, formAction, isPending] = useActionState(
    addCorrectionNoteAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <input name="targetType" type="hidden" value={targetType} />
      <input name="targetId" type="hidden" value={targetId} />
      <FieldError message={fieldError(state, "targetType")} />
      <FieldError message={fieldError(state, "targetId")} />

      <label className="block space-y-2" htmlFor={`correction-note-${targetId}`}>
        <span className="text-sm font-semibold text-slate-900">Correction Note</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          defaultValue={noteValue(state)}
          id={`correction-note-${targetId}`}
          maxLength={1000}
          name="note"
          required
        />
        <FieldError message={fieldError(state, "note")} />
      </label>

      {state.status === "error" && state.formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.formError}
        </p>
      ) : null}

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
        {isPending ? "Adding…" : "Add Correction Note"}
      </button>
    </form>
  );
}
