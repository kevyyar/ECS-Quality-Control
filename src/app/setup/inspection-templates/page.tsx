import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import { listInspectionTemplates } from "@/lib/client-building-setup/repository";

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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup">
            ← Setup
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Inspection Templates
            </h1>
            <p className="text-muted-ink">
              Manage reusable inspection checklists. Archived Templates are hidden
              from active setup lists but remain available for historical context.
            </p>
          </div>
        </div>

        <InspectionTemplateCreateForm />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              {includeArchived ? "All Inspection Templates" : "Active Inspection Templates"}
            </h2>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={
                includeArchived
                  ? "/setup/inspection-templates"
                  : "/setup/inspection-templates?includeArchived=1"
              }
            >
              {includeArchived ? "Show active only" : "Include archived"}
            </Link>
          </div>

          {templates.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Inspection Templates found.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {templates.map((template) => (
                <li key={template.id}>
                  <Link
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    href={`/setup/inspection-templates/${template.id}`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {template.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-ink">
                        {templateSummary(template)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-brand-700">View</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
