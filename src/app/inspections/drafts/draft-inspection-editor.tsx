"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";

import type {
  DraftAreaInspectionRecord,
  DraftInspectionItemRecord,
  DraftSubmissionReviewSummary,
  DraftSubmissionValidation,
  InspectionItemResultStatus,
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
  submissionReview: DraftSubmissionReviewSummary;
};

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-red-700">{message}</p>;
}

type DraftProgress = {
  answered: number;
  total: number;
  percent: number;
};

function computeItemProgress(items: DraftEditorItem[]): DraftProgress {
  const answered = items.filter((item) => item.resultStatus !== null).length;

  return {
    answered,
    total: items.length,
    percent: items.length > 0 ? Math.round((answered / items.length) * 100) : 0,
  };
}

function computeDraftProgress(draft: DraftEditorDraft): DraftProgress {
  const items = draft.areaInspections.flatMap((area) =>
    area.isSkipped ? [] : area.items,
  );

  return computeItemProgress(items);
}

function resultStatusLabel(resultStatus: InspectionItemResultStatus | null): string {
  switch (resultStatus) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "not_applicable":
      return "N/A";
    case null:
      return "Unanswered";
    default: {
      const unreachable: never = resultStatus;
      return unreachable;
    }
  }
}

function itemAccordionSurfaceClass(resultStatus: InspectionItemResultStatus | null): string {
  switch (resultStatus) {
    case "pass":
      return "bg-brand-emerald-50/40";
    case "fail":
      return "bg-red-50/40";
    case "not_applicable":
      return "bg-slate-50";
    case null:
      return "bg-white";
    default: {
      const unreachable: never = resultStatus;
      return unreachable;
    }
  }
}

function ItemResultStatusBadge({
  resultStatus,
}: {
  resultStatus: InspectionItemResultStatus | null;
}) {
  const label = resultStatusLabel(resultStatus);

  const className = (() => {
    switch (resultStatus) {
      case "pass":
        return "border-brand-emerald-200 bg-brand-emerald-50 text-brand-emerald-800";
      case "fail":
        return "border-red-200 bg-red-50 text-red-800";
      case "not_applicable":
        return "border-slate-200 bg-slate-100 text-slate-700";
      case null:
        return "border-dashed border-slate-300 bg-white text-slate-500";
      default: {
        const unreachable: never = resultStatus;
        return unreachable;
      }
    }
  })();

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${className}`}
    >
      {label}
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ProgressTracker({
  answered,
  total,
  percent,
  compact = false,
}: DraftProgress & { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-600">
          {answered} of {total} items answered
        </span>
        <span className="font-display font-semibold tabular-nums text-slate-950">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-forest-700 to-brand-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function DraftProgressSummary({ draft }: { draft: DraftEditorDraft }) {
  const progress = computeDraftProgress(draft);

  if (progress.total === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="draft-progress-heading"
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <h2 className="text-sm font-semibold text-slate-950" id="draft-progress-heading">
        Draft progress
      </h2>
      <p className="mt-1 text-sm text-muted-ink">
        Collapse answered items to scan what still needs attention.
      </p>
      <div className="mt-3">
        <ProgressTracker {...progress} />
      </div>
    </section>
  );
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
        <label className="block space-y-2" htmlFor={`before-photo-${item.id}`}>
          <span className="text-sm font-semibold text-amber-950">
            Choose Before Photo
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-amber-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-amber-50"
            disabled={isAdding}
            id={`before-photo-${item.id}`}
            name="photo"
            type="file"
          />
        </label>
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
    <ul className="space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
      {validation.errors.inspection ? <li>{validation.errors.inspection}</li> : null}
      {Object.entries(validation.errors.areaInspections ?? {}).flatMap(
        ([areaInspectionId, messages]) => {
          const area = areaById.get(areaInspectionId);
          const label = area ? area.areaNameSnapshot : "Area";

          return messages.map((message) => (
            <li key={`${areaInspectionId}-${message}`}>
              <span className="font-medium">{label}:</span> {message}
            </li>
          ));
        },
      )}
      {Object.entries(validation.errors.items ?? {}).flatMap(([itemId, messages]) => {
        const target = itemById.get(itemId);
        const label = target
          ? `${target.area.areaNameSnapshot} — ${target.item.itemNameSnapshot}`
          : "Item";

        return messages.map((message) => (
          <li key={`${itemId}-${message}`}>
            <span className="font-medium">{label}:</span> {message}
          </li>
        ));
      })}
    </ul>
  );
}

function ReviewSectionAccordion({
  title,
  count,
  defaultOpen,
  children,
  emptyMessage,
}: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: ReactNode;
  emptyMessage: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = `review-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <ChevronIcon expanded={isOpen} />
        <span className="min-w-0 flex-1 text-sm font-semibold text-slate-950">{title}</span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
          {count}
        </span>
      </button>
      {isOpen ? (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2 text-sm text-slate-700" id={panelId}>
          {count === 0 ? <p className="text-muted-ink">{emptyMessage}</p> : children}
        </div>
      ) : null}
    </section>
  );
}

function SubmissionReviewPanel({
  review,
  draft,
}: {
  review: DraftSubmissionReviewSummary;
  draft: DraftEditorDraft;
}) {
  const resultCounts = [
    { label: "Pass", value: review.resultCounts.pass, tone: "text-brand-emerald-700" },
    { label: "Fail", value: review.resultCounts.fail, tone: "text-red-700" },
    { label: "N/A", value: review.resultCounts.notApplicable, tone: "text-slate-600" },
    {
      label: "Open",
      value: review.resultCounts.unanswered,
      tone: review.resultCounts.unanswered > 0 ? "text-amber-700" : "text-slate-600",
    },
  ];

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2">
        {resultCounts.map((count) => (
          <div
            className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
            key={count.label}
          >
            <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
              {count.label}
            </dt>
            <dd className={`text-lg font-bold tabular-nums sm:text-xl ${count.tone}`}>
              {count.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <ReviewSectionAccordion
          count={review.completedAreaInspections.length}
          defaultOpen={review.completedAreaInspections.length > 0}
          emptyMessage="No completed areas yet."
          title="Completed areas"
        >
          <ul className="space-y-1.5">
            {review.completedAreaInspections.map((area) => (
              <li className="flex flex-wrap items-baseline gap-x-1.5" key={area.id}>
                <span className="font-medium text-slate-950">{area.areaName}</span>
                <span className="text-xs text-muted-ink">
                  {area.source === "one_off" ? "one-off" : "planned"}
                </span>
              </li>
            ))}
          </ul>
        </ReviewSectionAccordion>

        <ReviewSectionAccordion
          count={review.skippedAreaInspections.length}
          defaultOpen={review.skippedAreaInspections.length > 0}
          emptyMessage="No areas are skipped."
          title="Skipped areas"
        >
          <ul className="space-y-2">
            {review.skippedAreaInspections.map((area) => (
              <li key={area.id}>
                <span className="font-medium text-slate-950">{area.areaName}</span>
                <p className="mt-0.5 text-muted-ink">
                  {area.skipReason || "Missing skip reason"}
                </p>
              </li>
            ))}
          </ul>
        </ReviewSectionAccordion>

        {review.oneOffAreaInspections.length > 0 ? (
          <ReviewSectionAccordion
            count={review.oneOffAreaInspections.length}
            defaultOpen={false}
            emptyMessage="No one-off areas were added."
            title="One-off areas"
          >
            <ul className="space-y-1.5">
              {review.oneOffAreaInspections.map((area) => (
                <li className="font-medium text-slate-950" key={area.id}>
                  {area.areaName}
                </li>
              ))}
            </ul>
          </ReviewSectionAccordion>
        ) : null}

        {review.ticketsToCreate.length > 0 ? (
          <ReviewSectionAccordion
            count={review.ticketsToCreate.length}
            defaultOpen
            emptyMessage="No tickets will be created."
            title="Tickets to create"
          >
            <ul className="space-y-1.5">
              {review.ticketsToCreate.map((ticket) => (
                <li className="font-medium text-slate-950" key={ticket.inspectionItemId}>
                  {ticket.title}
                </li>
              ))}
            </ul>
          </ReviewSectionAccordion>
        ) : null}
      </div>

      {!review.validation.ok ? (
        <SubmissionValidationSummary validation={review.validation} draft={draft} />
      ) : null}
    </div>
  );
}

function ItemResultForm({
  inspectionId,
  item,
  onSaved,
}: {
  inspectionId: string;
  item: DraftEditorItem;
  onSaved?: (resultStatus: InspectionItemResultStatus | null) => void;
}) {
  const [resultStatus, setResultStatus] = useState(item.resultStatus ?? "");
  const [resultNote, setResultNote] = useState(item.resultNote ?? "");
  const [state, formAction, isPending] = useActionState(
    saveDraftInspectionItemResultAction,
    saveItemInitialState,
  );
  const savedResultStatus =
    state.status === "success" ? state.values.resultStatus : item.resultStatus ?? "";
  const isAnswered = item.resultStatus !== null;
  const beforePhotoItem = {
    ...item,
    resultStatus: savedResultStatus === ""
      ? null
      : (savedResultStatus as DraftEditorItem["resultStatus"]),
  };

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const nextStatus =
      state.values.resultStatus === ""
        ? null
        : (state.values.resultStatus as InspectionItemResultStatus);
    onSaved?.(nextStatus);
  }, [onSaved, state]);

  return (
    <>
    <form
      action={formAction}
      className="space-y-3 border-t border-slate-200 bg-white px-4 py-4"
      onReset={(event) => event.preventDefault()}
    >
      <input name="inspectionId" type="hidden" value={inspectionId} />
      <input name="itemId" type="hidden" value={item.id} />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <label className="space-y-1 text-sm font-medium text-slate-900">
          <span>Result</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            name="resultStatus"
            onChange={(event) => setResultStatus(event.currentTarget.value)}
            value={resultStatus}
          >
            <option value="">Unanswered</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="not_applicable">Not Applicable</option>
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-900">
          <span>
            Note {resultStatus === "fail" ? "(required before submit)" : "(optional)"}
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            maxLength={1000}
            name="resultNote"
            onChange={(event) => setResultNote(event.currentTarget.value)}
            placeholder="Add notes for this result. Failed items need an issue note before submit."
            value={resultNote}
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
        {isPending ? "Saving…" : isAnswered ? "Update item result" : "Save item result"}
      </button>
    </form>
    <BeforePhotoControls inspectionId={inspectionId} item={beforePhotoItem} />
    </>
  );
}

function DraftInspectionItemAccordion({
  inspectionId,
  item,
}: {
  inspectionId: string;
  item: DraftEditorItem;
}) {
  const [isOpen, setIsOpen] = useState(item.resultStatus === null);
  const [optimisticStatus, setOptimisticStatus] = useState<DraftEditorItem["resultStatus"] | undefined>(
    undefined,
  );
  const [prevResultStatus, setPrevResultStatus] = useState(item.resultStatus);

  if (item.resultStatus !== prevResultStatus) {
    setPrevResultStatus(item.resultStatus);
    setOptimisticStatus(undefined);
  }

  const displayStatus = optimisticStatus ?? item.resultStatus;
  const panelId = `draft-item-panel-${item.id}`;
  const buttonId = `draft-item-button-${item.id}`;

  return (
    <li
      className={`overflow-hidden rounded-xl border border-slate-200 ${itemAccordionSurfaceClass(displayStatus)}`}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/70"
        id={buttonId}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <ChevronIcon expanded={isOpen} />
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-950">
              {item.position}. {item.itemNameSnapshot}
            </span>
            <ItemResultStatusBadge resultStatus={displayStatus} />
          </span>
          {item.sectionNameSnapshot ? (
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.sectionNameSnapshot}
            </span>
          ) : null}
          {!isOpen && item.itemDescriptionSnapshot ? (
            <span className="block text-sm text-muted-ink">{item.itemDescriptionSnapshot}</span>
          ) : null}
          {!isOpen && item.resultNote?.trim() ? (
            <span className="block truncate text-sm text-slate-700">
              Note: {item.resultNote.trim()}
            </span>
          ) : null}
          {!isOpen && displayStatus === "fail" ? (
            <span className="block text-xs font-medium text-amber-800">
              {item.beforePhotos.length > 0
                ? `${item.beforePhotos.length} before photo${item.beforePhotos.length === 1 ? "" : "s"} attached`
                : "Before photo required before submit"}
            </span>
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <div aria-labelledby={buttonId} id={panelId} role="region">
          {item.itemDescriptionSnapshot ? (
            <p className="border-t border-slate-200/80 px-4 py-3 text-sm text-muted-ink">
              {item.itemDescriptionSnapshot}
            </p>
          ) : null}
          <ItemResultForm
            inspectionId={inspectionId}
            item={item}
            onSaved={(resultStatus) => {
              setOptimisticStatus(resultStatus);
              setIsOpen(false);
            }}
          />
        </div>
      ) : null}
    </li>
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

function AreaInspectionAccordion({
  areaInspection,
}: {
  areaInspection: DraftEditorAreaInspection;
}) {
  const progress = computeItemProgress(areaInspection.items);
  const hasUnansweredItems = areaInspection.items.some((item) => item.resultStatus === null);
  const [isOpen, setIsOpen] = useState(
    areaInspection.isSkipped ? false : hasUnansweredItems || areaInspection.items.length === 0,
  );
  const panelId = `draft-area-panel-${areaInspection.id}`;
  const buttonId = `draft-area-button-${areaInspection.id}`;
  const areaAccentClass = areaInspection.isSkipped
    ? "border-l-amber-400 bg-amber-50/30"
    : progress.total > 0 && progress.answered === progress.total
      ? "border-l-brand-emerald-500 bg-brand-emerald-50/20"
      : "border-l-brand-forest-400 bg-white";

  return (
    <li
      className={`overflow-hidden rounded-2xl border border-slate-200 border-l-4 ${areaAccentClass}`}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 p-5 text-left transition hover:bg-white/60"
        id={buttonId}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <ChevronIcon expanded={isOpen} />
        <span className="min-w-0 flex-1 space-y-3">
          <span className="flex flex-wrap items-start justify-between gap-3">
            <span className="space-y-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-950">
                  {areaInspection.position}. {areaInspection.areaNameSnapshot}
                </span>
                {areaInspection.isSkipped ? (
                  <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
                    Skipped
                  </span>
                ) : progress.total > 0 && progress.answered === progress.total ? (
                  <span className="inline-flex rounded-full border border-brand-emerald-200 bg-brand-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-emerald-800">
                    Complete
                  </span>
                ) : null}
              </span>
              <span className="block text-sm text-muted-ink">
                {areaInspection.areaTypeNameSnapshot} ·{" "}
                {areaInspection.inspectionTemplateNameSnapshot}
              </span>
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              {areaInspection.source === "one_off" ? "One-off" : "Planned"}
            </span>
          </span>

          {!areaInspection.isSkipped && progress.total > 0 ? (
            <ProgressTracker {...progress} compact />
          ) : null}

          {!isOpen && areaInspection.inspectionTemplateDescriptionSnapshot ? (
            <span className="block text-sm text-muted-ink">
              {areaInspection.inspectionTemplateDescriptionSnapshot}
            </span>
          ) : null}
          {!isOpen && areaInspection.isSkipped && areaInspection.skipReason ? (
            <span className="block text-sm text-amber-950">
              Skip reason: {areaInspection.skipReason}
            </span>
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <div aria-labelledby={buttonId} className="border-t border-slate-200 px-5 pb-5" id={panelId} role="region">
          {areaInspection.inspectionTemplateDescriptionSnapshot ? (
            <p className="pt-4 text-sm text-muted-ink">
              {areaInspection.inspectionTemplateDescriptionSnapshot}
            </p>
          ) : null}

          <AreaSkipControls areaInspection={areaInspection} />

          {areaInspection.isSkipped ? null : areaInspection.items.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-ink">
              No inspection items captured for this Area Inspection.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {areaInspection.items.map((item) => (
                <DraftInspectionItemAccordion
                  inspectionId={areaInspection.inspectionId}
                  item={item}
                  key={item.id}
                />
              ))}
            </ol>
          )}
        </div>
      ) : null}
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

function SubmitDraftInspectionForm({
  draft,
  submissionReview,
}: {
  draft: DraftEditorDraft;
  submissionReview: DraftSubmissionReviewSummary;
}) {
  const [state, formAction, isPending] = useActionState(
    submitDraftInspectionAction,
    submitInitialState,
  );
  const [skippedAreaSubmissionConfirmed, setSkippedAreaSubmissionConfirmed] =
    useState(false);
  const hasValidationBlockers = !submissionReview.validation.ok;
  const requiresSkippedAreaConfirmation =
    submissionReview.hasSkippedPlannedAreaInspections;
  const canSubmit =
    !isPending &&
    !hasValidationBlockers &&
    (!requiresSkippedAreaConfirmation || skippedAreaSubmissionConfirmed);

  const showSubmitValidationErrors =
    state.status === "error" &&
    state.validation &&
    !state.validation.ok &&
    submissionReview.validation.ok;

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
      <input name="inspectionId" type="hidden" value={draft.id} />
      <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Submit draft</h2>
      <SubmissionReviewPanel draft={draft} review={submissionReview} />
      {showSubmitValidationErrors ? (
        <SubmissionValidationSummary validation={state.validation} draft={draft} />
      ) : null}
      {state.status === "error" ? <FieldError message={state.errors.inspectionId} /> : null}
      {state.status === "success" ? (
        <>
          <ActionMessage state={state} />
          <Link className="text-sm font-semibold text-brand-700 underline" href="/inspections/drafts">
            Back to drafts
          </Link>
        </>
      ) : null}
      {requiresSkippedAreaConfirmation ? (
        <label className="flex items-start gap-2.5 text-sm text-slate-700">
          <input
            checked={skippedAreaSubmissionConfirmed}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-100"
            name="confirmSkippedPlannedAreas"
            onChange={(event) => setSkippedAreaSubmissionConfirmed(event.target.checked)}
            type="checkbox"
          />
          <span>Confirm skipped areas and reasons above</span>
        </label>
      ) : null}
      <button
        className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canSubmit}
        type="submit"
      >
        {isPending ? "Submitting…" : "Submit draft"}
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
    <form action={formAction} className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
      <input name="inspectionId" type="hidden" value={inspectionId} />
      <h2 className="text-lg font-semibold text-red-950 sm:text-xl">Discard Draft</h2>
      <p className="text-xs text-red-900 sm:text-sm">
        Deletes this draft and all item results. No reports or tickets are created.
      </p>
      {state.status === "error" ? <FieldError message={state.errors.inspectionId} /> : null}
      <ActionMessage state={state} />
      {state.status === "success" ? (
        <Link className="text-sm font-semibold text-red-900 underline" href="/inspections/drafts">
          Back to active Draft Inspections
        </Link>
      ) : null}
      <button
        className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Discarding…" : "Discard Draft"}
      </button>
    </form>
  );
}

export function DraftInspectionEditor({
  draft,
  activeAreas,
  activeTemplates,
  submissionReview,
}: DraftInspectionEditorProps) {
  return (
    <div className="space-y-8">
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Draft data is editable work in progress and is not reportable until submitted.
      </p>

      <DraftProgressSummary draft={draft} />

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
              <AreaInspectionAccordion areaInspection={areaInspection} key={areaInspection.id} />
            ))}
          </ol>
        )}
      </section>

      <AddOneOffAreaInspectionForm
        activeAreas={activeAreas}
        activeTemplates={activeTemplates}
        draftId={draft.id}
      />

      <section aria-labelledby="draft-actions-heading" className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950 sm:text-xl" id="draft-actions-heading">
          Finish draft
        </h2>
        <SubmitDraftInspectionForm draft={draft} submissionReview={submissionReview} />
        <DiscardDraftInspectionForm inspectionId={draft.id} />
      </section>
    </div>
  );
}
