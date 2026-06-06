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
}: {
  buildingId: string;
  buildingName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    startDraftInspectionAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline-block w-full sm:w-auto">
      <input name="buildingId" type="hidden" value={buildingId} />
      <button
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-forest-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-forest-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Starting…
          </>
        ) : (
          "Start Draft"
        )}
      </button>

      {buildingError(state) ? (
        <p className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5">{buildingError(state)}</p>
      ) : null}

      {state.status === "success" ? (
        <div className="mt-2 rounded-xl border border-brand-emerald-200 bg-brand-emerald-50 px-4 py-3 text-sm font-medium text-brand-emerald-800">
          <span className="block font-semibold mb-1">{state.message}</span>
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-forest-800 underline hover:text-brand-forest-700"
            href={`/inspections/drafts/${state.draftInspectionId}`}
          >
            Continue Draft →
          </Link>
        </div>
      ) : null}
    </form>
  );
}
