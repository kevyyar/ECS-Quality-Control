import { requireProtectedAction } from "@/lib/auth/session";
import { listInspectionTemplates } from "@/lib/client-building-setup/repository";
import { SetupListPage } from "@/lib/ux/setup-list-page";

import { InspectionTemplateCreateForm } from "./inspection-template-form";

type InspectionTemplatesPageProps = {
  searchParams?: Promise<{ includeArchived?: string }>;
};

function statusLabel(isArchived: boolean): string {
  return isArchived ? "Archived" : "Active";
}

function templateSummary(
  template: Awaited<ReturnType<typeof listInspectionTemplates>>[number],
): string {
  const itemLabel = template.items.length === 1 ? "item" : "items";
  const sectionLabel = template.sections.length === 1 ? "section" : "sections";

  return `${template.items.length} ${itemLabel} · ${template.sections.length} ${sectionLabel} · ${statusLabel(template.isArchived)}`;
}

export default async function InspectionTemplatesPage({
  searchParams,
}: InspectionTemplatesPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const templates = await listInspectionTemplates({
    visibility: includeArchived ? "historical" : "active",
  });

  return (
    <SetupListPage
      createForm={<InspectionTemplateCreateForm />}
      description="Manage reusable inspection checklists. Archived Templates are hidden from active setup lists but remain available for historical context."
      emptyDescription="Create an Inspection Template or include archived records to see more results."
      emptyTitle="No Inspection Templates found"
      listHeading={includeArchived ? "All Inspection Templates" : "Active Inspection Templates"}
      listHeadingId="inspection-templates-list-heading"
      records={templates.map((template) => ({
        id: template.id,
        href: `/setup/inspection-templates/${template.id}`,
        title: template.name,
        subtitle: templateSummary(template),
      }))}
      title="Inspection"
      titleAccent="Templates"
      toggleHref={
        includeArchived
          ? "/setup/inspection-templates"
          : "/setup/inspection-templates?includeArchived=1"
      }
      toggleLabel={includeArchived ? "Show active only" : "Include archived"}
    />
  );
}
