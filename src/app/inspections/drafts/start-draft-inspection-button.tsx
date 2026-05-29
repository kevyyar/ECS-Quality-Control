"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  startDraftInspectionAction,
  type StartDraftInspectionActionState,
} from "./actions";

const initialState = { status: "idle" } satisfies StartDraftInspectionActionState;

function buildingError(state: StartDraftInspectionActionState): string | undefined {
  return state.status === "error" ? state.errors.buildingId : undefined;
}

export function StartDraftInspectionButton({
  buildingId,
  buildingName,
}: {
  buildingId: string;
  buildingName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    startDraftInspectionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input name="buildingId" type="hidden" value={buildingId} />
      <button
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Starting…" : `Start Draft for ${buildingName}`}
      </button>

      {buildingError(state) ? (
        <p className="text-sm font-medium text-red-700">{buildingError(state)}</p>
      ) : null}

      {state.status === "success" ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          {state.message}{" "}
          <Link
            className="underline"
            href={`/inspections/drafts/${state.draftInspectionId}`}
          >
            Continue Draft
          </Link>
        </p>
      ) : null}
    </form>
  );
}
