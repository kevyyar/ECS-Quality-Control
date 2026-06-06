import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { getInspectionTemplate } from "@/lib/client-building-setup/repository";
import { PageEmptyState } from "@/lib/ux/app-page";
import {
  SetupDetailPage,
  SetupDetailSection,
} from "@/lib/ux/setup-detail-page";
import { ux } from "@/lib/ux/tokens";

import {
  archiveInspectionTemplateAction,
  duplicateInspectionTemplateAction,
  restoreInspectionTemplateAction,
} from "../actions";
import { InspectionTemplateEditForm } from "../inspection-template-form";

type InspectionTemplateDetailPageProps = {
  params: Promise<{ id: string }>;
};

function statusLabel(
  template: NonNullable<Awaited<ReturnType<typeof getInspectionTemplate>>>,
): string {
  return template.isArchived ? "Archived Inspection Template" : "Active Inspection Template";
}

export default async function InspectionTemplateDetailPage({
  params,
}: InspectionTemplateDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { id } = await params;
  const template = await getInspectionTemplate(id);

  if (!template) {
    notFound();
  }

  const sortedItems = template.items
    .slice()
    .sort((first, second) => first.position - second.position);

  return (
    <SetupDetailPage
      backHref="/setup/inspection-templates"
      backLabel="Inspection Templates"
      description={template.description ?? undefined}
      eyebrow={statusLabel(template)}
      title={template.name}
    >
      <SetupDetailSection heading="Edit template" headingId="template-edit-heading" icon="settings">
        <InspectionTemplateEditForm template={template} />
      </SetupDetailSection>

      <SetupDetailSection heading="Actions" headingId="template-actions-heading" icon="document">
        <div className="flex flex-wrap gap-3">
          <form
            action={
              template.isArchived
                ? restoreInspectionTemplateAction
                : archiveInspectionTemplateAction
            }
          >
            <input name="id" type="hidden" value={template.id} />
            <button className={ux.mutedButton} type="submit">
              {template.isArchived ? "Restore Inspection Template" : "Archive Inspection Template"}
            </button>
          </form>

          <form action={duplicateInspectionTemplateAction}>
            <input name="id" type="hidden" value={template.id} />
            <button className={ux.secondaryButton} type="submit">
              Duplicate Inspection Template
            </button>
          </form>
        </div>
      </SetupDetailSection>

      <SetupDetailSection heading="Current items" headingId="template-items-heading" icon="list">
        {sortedItems.length === 0 ? (
          <PageEmptyState
            description="Add checklist items to this template so it can be used in Building Inspection Plans."
            icon="list"
            title="No items yet"
          />
        ) : (
          <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200/80">
            {sortedItems.map((item) => (
              <li className="px-4 py-4" key={item.id}>
                <div className="font-display font-bold text-slate-950">
                  {item.position}. {item.name}
                </div>
                <div className="mt-1 text-sm text-muted-ink">
                  {item.sectionName ? `${item.sectionName} · ` : ""}
                  {item.description ?? "No description"}
                </div>
              </li>
            ))}
          </ol>
        )}
      </SetupDetailSection>
    </SetupDetailPage>
  );
}
