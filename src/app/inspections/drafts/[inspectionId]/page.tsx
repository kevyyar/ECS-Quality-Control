import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { getDraftInspection } from "@/lib/inspections/drafts/repository";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type DraftInspectionDetailPageProps = {
  params: Promise<{ inspectionId: string }>;
};

export default async function DraftInspectionDetailPage({
  params,
}: DraftInspectionDetailPageProps) {
  await requireProtectedAction("editDraftInspection");

  const { inspectionId } = await params;
  const draft = await getDraftInspection(inspectionId);

  if (!draft) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/inspections/drafts">
            ← Draft Inspections
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Draft Inspection
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {draft.buildingNameSnapshot}
            </h1>
            <p className="text-muted-ink">
              {draft.clientNameSnapshot} · Started {formatDateTime(draft.startedAt)} by {draft.startedByEmail}
            </p>
          </div>
        </div>

        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Draft data is editable work in progress and is not reportable until submitted.
        </p>

        <section className="space-y-4" aria-labelledby="planned-area-inspections-heading">
          <h2
            id="planned-area-inspections-heading"
            className="text-xl font-semibold text-slate-950"
          >
            Planned Area Inspections
          </h2>

          {draft.areaInspections.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No planned Area Inspections were captured for this Draft.
            </p>
          ) : (
            <ol className="space-y-4">
              {draft.areaInspections.map((areaInspection) => (
                <li
                  className="rounded-2xl border border-slate-200 p-5"
                  key={areaInspection.id}
                >
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

                  {areaInspection.items.length === 0 ? (
                    <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-ink">
                      No inspection items captured for this Area Inspection.
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-3">
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
                            <p className="mt-1 text-sm text-muted-ink">
                              {item.itemDescriptionSnapshot}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}
