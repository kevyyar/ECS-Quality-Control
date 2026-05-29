import Link from "next/link";

import { signOutInternalUser } from "@/lib/auth/actions";
import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { listActiveDraftInspections } from "@/lib/inspections/drafts/repository";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireInternalUser();
  const canViewActiveDraftMetadata = canPerformProtectedAction(
    user.capabilities,
    "viewActiveDraftMetadata",
  );
  const canEditDrafts = canPerformProtectedAction(
    user.capabilities,
    "editDraftInspection",
  );
  const activeDrafts = canViewActiveDraftMetadata
    ? await listActiveDraftInspections()
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-6 rounded-card border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              Internal workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="text-muted-ink">Signed in as {user.email}</p>
          </div>
          <form action={signOutInternalUser}>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <h2 className="font-semibold text-brand-800">Capabilities</h2>
          <p className="mt-2 text-sm text-brand-700">
            {user.capabilities.join(", ")}
          </p>
        </div>

        {canViewActiveDraftMetadata ? (
          <section
            className="space-y-4 rounded-2xl border border-slate-200 p-5"
            aria-labelledby="active-draft-inspections-heading"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="active-draft-inspections-heading"
                  className="text-xl font-semibold text-slate-950"
                >
                  Active Draft Inspections
                </h2>
                <p className="mt-1 text-sm text-muted-ink">
                  Drafts are shown separately from completed and reportable inspection data.
                </p>
              </div>
              <Link className="text-sm font-semibold text-brand-700" href="/inspections/drafts">
                View all Drafts
              </Link>
            </div>

            {activeDrafts.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-ink">
                No active Draft Inspections.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {activeDrafts.map((draft) => (
                  <li
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    key={draft.id}
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-950">
                        {draft.buildingNameSnapshot}
                      </h3>
                      <p className="text-sm text-muted-ink">
                        {draft.clientNameSnapshot} · Started {formatDateTime(draft.startedAt)} by {draft.startedByEmail}
                      </p>
                      <p className="text-sm text-muted-ink">
                        {draft.areaInspectionCount} area inspections · {draft.itemCount} items
                      </p>
                    </div>
                    {canEditDrafts ? (
                      <Link
                        className="text-sm font-semibold text-brand-700"
                        href={`/inspections/drafts/${draft.id}`}
                      >
                        Continue
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">
                        Read-only metadata
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}
