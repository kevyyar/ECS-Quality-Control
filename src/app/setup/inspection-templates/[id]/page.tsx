import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import { getInspectionTemplate } from "@/lib/client-building-setup/repository";

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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link
            className="text-sm font-semibold text-brand-700"
            href="/setup/inspection-templates"
          >
            ← Inspection Templates
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {statusLabel(template)}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {template.name}
            </h1>
            {template.description ? (
              <p className="text-muted-ink">{template.description}</p>
            ) : null}
          </div>
        </div>

        <InspectionTemplateEditForm template={template} />

        <div className="flex flex-wrap gap-3">
          <form
            action={
              template.isArchived
                ? restoreInspectionTemplateAction
                : archiveInspectionTemplateAction
            }
          >
            <input name="id" type="hidden" value={template.id} />
            <button
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
              type="submit"
            >
              {template.isArchived ? "Restore Inspection Template" : "Archive Inspection Template"}
            </button>
          </form>

          <form action={duplicateInspectionTemplateAction}>
            <input name="id" type="hidden" value={template.id} />
            <button
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
              type="submit"
            >
              Duplicate Inspection Template
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950">Current items</h2>
          {sortedItems.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No items have been added to this Inspection Template.
            </p>
          ) : (
            <ol className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {sortedItems.map((item) => (
                <li className="p-5" key={item.id}>
                  <div className="font-semibold text-slate-950">
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
        </div>
      </section>
    </main>
  );
}
