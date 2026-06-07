"use client";

import { useActionState } from "react";

import type { CorrectionNoteTargetType } from "@/lib/correction-notes/model";
import { ux } from "@/lib/ux/tokens";

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
    <form action={formAction} className={ux.formStack}>
      <input name="targetType" type="hidden" value={targetType} />
      <input name="targetId" type="hidden" value={targetId} />
      <FieldError message={fieldError(state, "targetType")} />
      <FieldError message={fieldError(state, "targetId")} />

      <label className={ux.formField} htmlFor={`correction-note-${targetId}`}>
        <span className={ux.fieldLabel}>Correction Note</span>
        <textarea
          className={`${ux.textarea} min-h-24`}
          defaultValue={noteValue(state)}
          id={`correction-note-${targetId}`}
          maxLength={1000}
          name="note"
          placeholder="Describe the correction needed"
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
          {isPending ? "Adding…" : "Add Correction Note"}
        </button>
      </div>
    </form>
  );
}
