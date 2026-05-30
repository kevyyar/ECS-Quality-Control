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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/inspections">
            ← Inspections
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Submitted Inspection
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {inspection.buildingName}
            </h1>
            <p className="text-muted-ink">
              {inspection.clientName} · Submitted {formatDateTime(inspection.submittedAt)} by {inspection.submittedByEmail ?? "Unknown"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Link
            aria-describedby="weekly-report-download-help"
            className="inline-flex rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            href={`/inspections/${inspection.id}/weekly-report`}
          >
            Download Weekly Inspection Report PDF
          </Link>
          <p id="weekly-report-download-help" className="text-sm text-muted-ink">
            Opens a PDF download for this Submitted Inspection. If the download fails,
            retry after refreshing or ask a Supervisor to check production logs.
          </p>
        </div>

        <section className="space-y-4" aria-labelledby="inspection-correction-notes-heading">
          <h2 id="inspection-correction-notes-heading" className="text-xl font-semibold text-slate-950">
            Correction Notes
          </h2>
          <CorrectionNoteList notes={notes} />
          {canAddCorrectionNote ? (
            <CorrectionNoteForm targetId={inspection.id} targetType="submitted_inspection" />
          ) : null}
        </section>
      </section>
    </main>
  );
}
