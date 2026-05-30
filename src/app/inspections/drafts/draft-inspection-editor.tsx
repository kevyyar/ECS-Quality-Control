"use client";

import Link from "next/link";
import { useActionState } from "react";

import type {
  DraftAreaInspectionRecord,
  DraftInspectionItemRecord,
  DraftSubmissionValidation,
} from "@/lib/inspections/drafts/model";

import {
  addOneOffAreaInspectionAction,
  addDraftInspectionItemBeforePhotoAction,
  discardDraftInspectionAction,
  removeDraftInspectionItemBeforePhotoAction,
  saveDraftInspectionItemResultAction,
  skipDraftAreaInspectionAction,
  submitDraftInspectionAction,
  unskipDraftAreaInspectionAction,
  type AddOneOffAreaInspectionActionState,
  type DiscardDraftInspectionActionState,
  type DraftInspectionItemBeforePhotoActionState,
  type SaveDraftInspectionItemResultActionState,
  type SkipDraftAreaInspectionActionState,
  type SubmitDraftInspectionActionState,
  type UnskipDraftAreaInspectionActionState,
} from "./actions";

const saveItemInitialState = {
  status: "idle",
} satisfies SaveDraftInspectionItemResultActionState;
const skipInitialState = { status: "idle" } satisfies SkipDraftAreaInspectionActionState;
const unskipInitialState = { status: "idle" } satisfies UnskipDraftAreaInspectionActionState;
const oneOffInitialState = { status: "idle" } satisfies AddOneOffAreaInspectionActionState;
const submitInitialState = { status: "idle" } satisfies SubmitDraftInspectionActionState;
const discardInitialState = { status: "idle" } satisfies DiscardDraftInspectionActionState;
const beforePhotoInitialState = {
  status: "idle",
} satisfies DraftInspectionItemBeforePhotoActionState;

export type DraftEditorItem = Pick<
  DraftInspectionItemRecord,
  | "id"
  | "position"
  | "sectionNameSnapshot"
  | "itemNameSnapshot"
  | "itemDescriptionSnapshot"
  | "resultStatus"
  | "resultNote"
> & {
  beforePhotos: {
    id: string;
    uploadedAt: string;
    url: string | null;
  }[];
};

export type DraftEditorAreaInspection = Pick<
  DraftAreaInspectionRecord,
  | "id"
  | "inspectionId"
  | "source"
  | "position"
  | "areaNameSnapshot"
  | "areaTypeNameSnapshot"
  | "inspectionTemplateNameSnapshot"
  | "inspectionTemplateDescriptionSnapshot"
  | "isSkipped"
  | "skipReason"
> & {
  items: DraftEditorItem[];
};

export type DraftEditorDraft = {
  id: string;
  areaInspections: DraftEditorAreaInspection[];
};

export type DraftEditorAreaOption = {
  id: string;
  name: string;
  areaTypeName: string;
};

export type DraftEditorTemplateOption = {
  id: string;
  name: string;
};

type DraftInspectionEditorProps = {
  draft: DraftEditorDraft;
  activeAreas: DraftEditorAreaOption[];
  activeTemplates: DraftEditorTemplateOption[];
};

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

function ActionMessage({
  state,
}: {
  state:
    | SaveDraftInspectionItemResultActionState
    | SkipDraftAreaInspectionActionState
    | UnskipDraftAreaInspectionActionState
    | AddOneOffAreaInspectionActionState
    | SubmitDraftInspectionActionState
    | DiscardDraftInspectionActionState
    | DraftInspectionItemBeforePhotoActionState;
}) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "success") {
    return (
      <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
        {state.message}
      </p>
    );
  }

  if (state.formError) {
    return <p className="text-sm font-medium text-red-700">{state.formError}</p>;
  }

  return null;
}

function BeforePhotoControls({
  inspectionId,
  item,
}: {
  inspectionId: string;
  item: DraftEditorItem;
}) {
  const [addState, addFormAction, isAdding] = useActionState(
    addDraftInspectionItemBeforePhotoAction,
    beforePhotoInitialState,
  );
  const [removeState, removeFormAction, isRemoving] = useActionState(
    removeDraftInspectionItemBeforePhotoAction,
    beforePhotoInitialState,
  );

  if (item.resultStatus !== "fail") {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div>
        <p className="text-sm font-semibold text-amber-950">Before Photos</p>
        <p className="text-sm text-amber-900">
          Failed items need at least one Before Photo before submission.
        </p>
      </div>
      {item.beforePhotos.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {item.beforePhotos.map((photo) => (
            <li className="space-y-2 rounded-lg bg-white p-3" key={photo.id}>
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Before evidence" className="h-32 w-full rounded-lg object-cover" src={photo.url} />
              ) : (
                <p className="rounded-lg bg-slate-100 p-3 text-sm text-muted-ink">
                  Preview unavailable.
                </p>
              )}
              <p className="text-xs text-muted-ink">
                Uploaded {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(photo.uploadedAt))}
              </p>
              <form action={removeFormAction}>
                <input name="inspectionId" type="hidden" value={inspectionId} />
                <input name="itemId" type="hidden" value={item.id} />
                <input name="evidenceId" type="hidden" value={photo.id} />
                <button
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  disabled={isRemoving}
                  type="submit"
                >
                  {isRemoving ? "Removing…" : "Remove photo"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <form action={addFormAction} className="space-y-2">
        <input name="inspectionId" type="hidden" value={inspectionId} />
        <input name="itemId" type="hidden" value={item.id} />
        <input accept="image/jpeg,image/png,image/webp" capture="environment" name="photo" type="file" />
        {addState.status === "error" ? <FieldError message={addState.errors.photo} /> : null}
        <ActionMessage state={addState} />
        <ActionMessage state={removeState} />
        <button
          className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          disabled={isAdding}
          type="submit"
        >
          {isAdding ? "Attaching…" : "Attach Before Photo"}
        </button>
      </form>
    </div>
  );
}

function SubmissionValidationSummary({
  validation,
  draft,
}: {
  validation: DraftSubmissionValidation | undefined;
  draft: DraftEditorDraft;
}) {
  if (!validation || validation.ok) {
    return null;
  }

  const areaById = new Map(draft.areaInspections.map((area) => [area.id, area]));
  const itemById = new Map(
    draft.areaInspections.flatMap((area) =>
      area.items.map((item) => [item.id, { area, item }] as const),
    ),
  );

  return (
    <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">Fix these before submitting:</p>
      <ul className="list-disc space-y-1 pl-5">
        {validation.errors.inspection ? <li>{validation.errors.inspection}</li> : null}
        {Object.entries(validation.errors.areaInspections ?? {}).flatMap(
          ([areaInspectionId, messages]) => {
            const area = areaById.get(areaInspectionId);
            const label = area ? area.areaNameSnapshot : "Area Inspection";

            return messages.map((message) => (
              <li key={`${areaInspectionId}-${message}`}>
                {label}: {message}
              </li>
            ));
          },
        )}
        {Object.entries(validation.errors.items ?? {}).flatMap(([itemId, messages]) => {
          const target = itemById.get(itemId);
          const label = target
            ? `${target.area.areaNameSnapshot} — ${target.item.itemNameSnapshot}`
            : "Inspection item";

          return messages.map((message) => (
            <li key={`${itemId}-${message}`}>
              {label}: {message}
            </li>
          ));
        })}
      </ul>
    </div>
  );
}

function ItemResultForm({
  inspectionId,
  item,
}: {
  inspectionId: string;
  item: DraftEditorItem;
}) {
  const [state, formAction, isPending] = useActionState(
    saveDraftInspectionItemResultAction,
    saveItemInitialState,
  );

  return (
    <>
    <form
      action={formAction}
      className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <input name="inspectionId" type="hidden" value={inspectionId} />
      <input name="itemId" type="hidden" value={item.id} />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <label className="space-y-1 text-sm font-medium text-slate-900">
          <span>Result</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={item.resultStatus ?? ""}
            name="resultStatus"
          >
            <option value="">Unanswered</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="not_applicable">Not Applicable</option>
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-900">
          <span>
            Note {item.resultStatus === "fail" ? "(required before submit)" : "(optional)"}
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue={item.resultNote ?? ""}
            maxLength={1000}
            name="resultNote"
            placeholder="Add notes for this result. Failed items need an issue note before submit."
          />
        </label>
      </div>

      {state.status === "error" ? (
        <div className="space-y-1">
          <FieldError message={state.errors.resultStatus} />
          <FieldError message={state.errors.resultNote} />
          <FieldError message={state.errors.itemId} />
          <FieldError message={state.errors.inspectionId} />
        </div>
      ) : null}
      <ActionMessage state={state} />

      <button
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Save item result"}
      </button>
    </form>
    <BeforePhotoControls inspectionId={inspectionId} item={item} />
    </>
  );
}

function AreaSkipControls({ areaInspection }: { areaInspection: DraftEditorAreaInspection }) {
  const [skipState, skipFormAction, isSkipping] = useActionState(
    skipDraftAreaInspectionAction,
    skipInitialState,
  );
  const [unskipState, unskipFormAction, isUnskipping] = useActionState(
    unskipDraftAreaInspectionAction,
    unskipInitialState,
  );

  if (areaInspection.source !== "planned") {
    return null;
  }

  if (areaInspection.isSkipped) {
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p>
          <span className="font-semibold">Skipped:</span> {areaInspection.skipReason}
        </p>
        <form action={unskipFormAction} className="space-y-2">
          <input name="inspectionId" type="hidden" value={areaInspection.inspectionId} />
          <input name="areaInspectionId" type="hidden" value={areaInspection.id} />
          <ActionMessage state={unskipState} />
          <button
            className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUnskipping}
            type="submit"
          >
            {isUnskipping ? "Unskipping…" : "Unskip Area Inspection"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={skipFormAction}
      className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <input name="inspectionId" type="hidden" value={areaInspection.inspectionId} />
      <input name="areaInspectionId" type="hidden" value={areaInspection.id} />
      <label className="space-y-1 text-sm font-medium text-slate-900">
        <span>Skip reason</span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
          maxLength={1000}
          name="skipReason"
          placeholder="Explain why this planned Area Inspection is skipped."
        />
      </label>
      {skipState.status === "error" ? (
        <div className="space-y-1">
          <FieldError message={skipState.errors.skipReason} />
          <FieldError message={skipState.errors.areaInspectionId} />
          <FieldError message={skipState.errors.inspectionId} />
        </div>
      ) : null}
      <ActionMessage state={skipState} />
      <button
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSkipping}
        type="submit"
      >
        {isSkipping ? "Skipping…" : "Skip planned Area Inspection"}
      </button>
    </form>
  );
}

function AreaInspectionCard({ areaInspection }: { areaInspection: DraftEditorAreaInspection }) {
  return (
    <li className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-950">
            {areaInspection.position}. {areaInspection.areaNameSnapshot}
          </h3>
          <p className="text-sm text-muted-ink">
            {areaInspection.areaTypeNameSnapshot} · {areaInspection.inspectionTemplateNameSnapshot}
          </p>
          {areaInspection.inspectionTemplateDescriptionSnapshot ? (
            <p className="text-sm text-muted-ink">
              {areaInspection.inspectionTemplateDescriptionSnapshot}
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
          {areaInspection.source === "one_off" ? "One-off" : "Planned"}
        </span>
      </div>

      <AreaSkipControls areaInspection={areaInspection} />

      {areaInspection.isSkipped ? null : areaInspection.items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-ink">
          No inspection items captured for this Area Inspection.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {areaInspection.items.map((item) => (
            <li className="rounded-xl bg-slate-50 px-4 py-3" key={item.id}>
              <div className="text-sm font-semibold text-slate-950">
                {item.position}. {item.itemNameSnapshot}
              </div>
              {item.sectionNameSnapshot ? (
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.sectionNameSnapshot}
                </div>
              ) : null}
              {item.itemDescriptionSnapshot ? (
                <p className="mt-1 text-sm text-muted-ink">{item.itemDescriptionSnapshot}</p>
              ) : null}
              <ItemResultForm inspectionId={areaInspection.inspectionId} item={item} />
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

function AddOneOffAreaInspectionForm({
  draftId,
  activeAreas,
  activeTemplates,
}: {
  draftId: string;
  activeAreas: DraftEditorAreaOption[];
  activeTemplates: DraftEditorTemplateOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    addOneOffAreaInspectionAction,
    oneOffInitialState,
  );
  const hasChoices = activeAreas.length > 0 && activeTemplates.length > 0;

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <input name="inspectionId" type="hidden" value={draftId} />
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Add one-off Area Inspection</h2>
        <p className="mt-1 text-sm text-muted-ink">
          Add an Area Inspection to this Draft only. This does not change the Building Inspection Plan.
        </p>
      </div>

      {!hasChoices ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-ink">
          Active Areas and Inspection Templates are required before one-off Area Inspections can be added.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-900">
          <span>Area</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue=""
            disabled={activeAreas.length === 0}
            name="areaId"
          >
            <option value="">Select an Area</option>
            {activeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} · {area.areaTypeName}
              </option>
            ))}
          </select>
          {state.status === "error" ? <FieldError message={state.errors.areaId} /> : null}
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-900">
          <span>Inspection Template</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            defaultValue=""
            disabled={activeTemplates.length === 0}
            name="inspectionTemplateId"
          >
            <option value="">Select an Inspection Template</option>
            {activeTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {state.status === "error" ? (
            <FieldError message={state.errors.inspectionTemplateId} />
          ) : null}
        </label>
      </div>

      {state.status === "error" ? <FieldError message={state.errors.inspectionId} /> : null}
      <ActionMessage state={state} />

      <button
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !hasChoices}
        type="submit"
      >
        {isPending ? "Adding…" : "Add one-off Area Inspection"}
      </button>
    </form>
  );
}

function SubmitDraftInspectionForm({ draft }: { draft: DraftEditorDraft }) {
  const [state, formAction, isPending] = useActionState(
    submitDraftInspectionAction,
    submitInitialState,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 p-5">
      <input name="inspectionId" type="hidden" value={draft.id} />
      <h2 className="text-xl font-semibold text-slate-950">Submit Draft Inspection</h2>
      <p className="text-sm text-muted-ink">
        Submit only when all non-skipped items are answered. Failed items need an issue note.
      </p>
      {state.status === "error" ? (
        <>
          <FieldError message={state.errors.inspectionId} />
          <SubmissionValidationSummary validation={state.validation} draft={draft} />
        </>
      ) : null}
      <ActionMessage state={state} />
      {state.status === "success" ? (
        <Link className="text-sm font-semibold text-brand-700 underline" href="/inspections/drafts">
          Back to active Draft Inspections
        </Link>
      ) : null}
      <button
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting…" : "Submit Draft Inspection"}
      </button>
    </form>
  );
}

function DiscardDraftInspectionForm({ inspectionId }: { inspectionId: string }) {
  const [state, formAction, isPending] = useActionState(
    discardDraftInspectionAction,
    discardInitialState,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
      <input name="inspectionId" type="hidden" value={inspectionId} />
      <h2 className="text-xl font-semibold text-red-950">Discard Draft Inspection</h2>
      <p className="text-sm text-red-900">
        Discarding deletes this Draft and its item results. No report history or Tickets are created.
      </p>
      {state.status === "error" ? <FieldError message={state.errors.inspectionId} /> : null}
      <ActionMessage state={state} />
      {state.status === "success" ? (
        <Link className="text-sm font-semibold text-red-900 underline" href="/inspections/drafts">
          Back to active Draft Inspections
        </Link>
      ) : null}
      <button
        className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Discarding…" : "Discard Draft Inspection"}
      </button>
    </form>
  );
}

export function DraftInspectionEditor({
  draft,
  activeAreas,
  activeTemplates,
}: DraftInspectionEditorProps) {
  return (
    <div className="space-y-8">
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Draft data is editable work in progress and is not reportable until submitted.
      </p>

      <section className="space-y-4" aria-labelledby="area-inspections-heading">
        <h2 id="area-inspections-heading" className="text-xl font-semibold text-slate-950">
          Area Inspections
        </h2>

        {draft.areaInspections.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
            No Area Inspections were captured for this Draft.
          </p>
        ) : (
          <ol className="space-y-4">
            {draft.areaInspections.map((areaInspection) => (
              <AreaInspectionCard areaInspection={areaInspection} key={areaInspection.id} />
            ))}
          </ol>
        )}
      </section>

      <AddOneOffAreaInspectionForm
        activeAreas={activeAreas}
        activeTemplates={activeTemplates}
        draftId={draft.id}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SubmitDraftInspectionForm draft={draft} />
        <DiscardDraftInspectionForm inspectionId={draft.id} />
      </div>
    </div>
  );
}
