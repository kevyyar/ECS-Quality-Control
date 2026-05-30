import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { listAreas, listInspectionTemplates } from "@/lib/client-building-setup/repository";
import { getDraftInspection } from "@/lib/inspections/drafts/repository";

import {
  DraftInspectionEditor,
  type DraftEditorAreaOption,
  type DraftEditorDraft,
  type DraftEditorTemplateOption,
} from "../draft-inspection-editor";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type DraftInspectionDetailPageProps = {
  params: Promise<{ inspectionId: string }>;
};

function toDraftEditorDraft(
  draft: NonNullable<Awaited<ReturnType<typeof getDraftInspection>>>,
): DraftEditorDraft {
  return {
    id: draft.id,
    areaInspections: draft.areaInspections.map((areaInspection) => ({
      id: areaInspection.id,
      inspectionId: areaInspection.inspectionId,
      source: areaInspection.source,
      position: areaInspection.position,
      areaNameSnapshot: areaInspection.areaNameSnapshot,
      areaTypeNameSnapshot: areaInspection.areaTypeNameSnapshot,
      inspectionTemplateNameSnapshot: areaInspection.inspectionTemplateNameSnapshot,
      inspectionTemplateDescriptionSnapshot:
        areaInspection.inspectionTemplateDescriptionSnapshot,
      isSkipped: areaInspection.isSkipped,
      skipReason: areaInspection.skipReason,
      items: areaInspection.items.map((item) => ({
        id: item.id,
        position: item.position,
        sectionNameSnapshot: item.sectionNameSnapshot,
        itemNameSnapshot: item.itemNameSnapshot,
        itemDescriptionSnapshot: item.itemDescriptionSnapshot,
        resultStatus: item.resultStatus,
        resultNote: item.resultNote,
      })),
    })),
  };
}

function toAreaOptions(
  areas: Awaited<ReturnType<typeof listAreas>>,
): DraftEditorAreaOption[] {
  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    areaTypeName: area.areaTypeName,
  }));
}

function toTemplateOptions(
  templates: Awaited<ReturnType<typeof listInspectionTemplates>>,
): DraftEditorTemplateOption[] {
  return templates.map((template) => ({ id: template.id, name: template.name }));
}

export default async function DraftInspectionDetailPage({
  params,
}: DraftInspectionDetailPageProps) {
  await requireProtectedAction("editDraftInspection");

  const { inspectionId } = await params;
  const draft = await getDraftInspection(inspectionId);

  if (!draft) {
    notFound();
  }

  const [activeAreas, activeTemplates] = await Promise.all([
    listAreas({ visibility: "active", buildingId: draft.buildingId }),
    listInspectionTemplates({ visibility: "active" }),
  ]);

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
              {draft.clientNameSnapshot} · Started {formatDateTime(draft.startedAt)} by{" "}
              {draft.startedByEmail}
            </p>
          </div>
        </div>

        <DraftInspectionEditor
          activeAreas={toAreaOptions(activeAreas)}
          activeTemplates={toTemplateOptions(activeTemplates)}
          draft={toDraftEditorDraft(draft)}
        />
      </section>
    </main>
  );
}
