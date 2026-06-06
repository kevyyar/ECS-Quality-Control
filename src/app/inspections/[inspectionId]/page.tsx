import Link from "next/link";
import { notFound } from "next/navigation";

import { CorrectionNoteForm } from "@/app/correction-notes/correction-note-form";
import { CorrectionNoteList } from "@/app/correction-notes/correction-note-list";
import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import {
  getSubmittedInspectionCorrectionNoteTarget,
  listCorrectionNotes,
} from "@/lib/correction-notes/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

type SubmittedInspectionPageProps = {
  params: Promise<{ inspectionId: string }>;
};

function formatDateTime(date: Date | null): string {
  if (!date) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function SubmittedInspectionPage({
  params,
}: SubmittedInspectionPageProps) {
  const user = await requireInternalUser();

  const { inspectionId } = await params;
  const inspection = await getSubmittedInspectionCorrectionNoteTarget(inspectionId);

  if (!inspection) {
    notFound();
  }

  const canAddCorrectionNote = canPerformProtectedAction(
    user.capabilities,
    "addCorrectionNote",
  );
  const notes = await listCorrectionNotes({
    targetType: "submitted_inspection",
    targetId: inspection.id,
  });

  return (
    <AppPage ambient="detail">
      <AppPageHero
        backHref="/inspections"
        backLabel="Inspections"
        badge={
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-400/25 bg-brand-emerald-500/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-emerald-200 backdrop-blur-sm">
            <Glyph className="size-3.5 text-brand-emerald-300" name="check" />
            Inspection submitted
          </p>
        }
        description={
          <>
            <p className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm">
              <Glyph className="size-4 text-brand-emerald-300" name="building" />
              {inspection.clientName}
            </p>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Glyph className="size-4 text-brand-emerald-300/80" name="clock" />
                <dt className="sr-only">Submitted</dt>
                <dd>{formatDateTime(inspection.submittedAt)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Glyph className="size-4 text-brand-emerald-300/80" name="user" />
                <dt className="sr-only">Submitted by</dt>
                <dd>{inspection.submittedByEmail ?? "Unknown"}</dd>
              </div>
            </dl>
          </>
        }
        title={inspection.buildingName}
        variant="detail"
      />

      <AppPageBody overlap="detail">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <section aria-labelledby="weekly-report-heading" className="lg:col-span-7">
          <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5">
            <div className="border-b border-slate-100 bg-gradient-to-r from-brand-forest-50 via-white to-brand-emerald-50/40 px-6 py-5 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-forest-800 text-brand-emerald-300 shadow-sm">
                  <Glyph className="size-6" name="document" />
                </div>
                <div className="space-y-1">
                  <h2
                    className="font-display text-xl font-bold text-slate-950"
                    id="weekly-report-heading"
                  >
                    Weekly Inspection Report
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-ink">
                    The official PDF for this building&apos;s submitted inspection — ready to
                    share with clients or archive.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6 sm:px-8">
              <Link
                aria-describedby="weekly-report-download-help"
                className={`${ux.primaryButton} w-full gap-2 py-3.5 sm:w-auto`}
                href={`/inspections/${inspection.id}/weekly-report`}
              >
                <Glyph className="size-4" name="download" />
                Download PDF
              </Link>
              <p
                className="text-sm leading-relaxed text-muted-ink"
                id="weekly-report-download-help"
              >
                Opens a PDF download for this Submitted Inspection. If the download fails,
                retry after refreshing or ask a Supervisor to check production logs.
              </p>
            </div>
          </article>
        </section>

        <section
          aria-labelledby="inspection-correction-notes-heading"
          className="lg:col-span-5"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Glyph className="size-4" name="note" />
                </div>
                <h2
                  className="font-display text-lg font-bold text-slate-950"
                  id="inspection-correction-notes-heading"
                >
                  Correction Notes
                </h2>
              </div>
              <span className={ux.countBadge}>{notes.length}</span>
            </div>

            <div className="space-y-5">
              <CorrectionNoteList notes={notes} />
              {canAddCorrectionNote ? (
                <CorrectionNoteForm
                  targetId={inspection.id}
                  targetType="submitted_inspection"
                />
              ) : null}
            </div>
          </div>
        </section>
        </div>
      </AppPageBody>
    </AppPage>
  );
}
