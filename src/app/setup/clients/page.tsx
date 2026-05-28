import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import { listClients } from "@/lib/client-building-setup/repository";

import { ClientCreateForm } from "./client-form";

type ClientsPageProps = {
  searchParams?: Promise<{ includeArchived?: string }>;
};

function statusLabel(isArchived: boolean): string {
  return isArchived ? "Archived" : "Active";
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const clients = await listClients({
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
              Clients
            </h1>
            <p className="text-muted-ink">
              Manage service customers. Archive Clients instead of deleting them
              so historical inspection context remains intact.
            </p>
          </div>
        </div>

        <ClientCreateForm />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              {includeArchived ? "All Clients" : "Active Clients"}
            </h2>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={includeArchived ? "/setup/clients" : "/setup/clients?includeArchived=1"}
            >
              {includeArchived ? "Show active only" : "Include archived"}
            </Link>
          </div>

          {clients.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Clients found.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {clients.map((client) => (
                <li key={client.id}>
                  <Link
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    href={`/setup/clients/${client.id}`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {client.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-ink">
                        {statusLabel(client.isArchived)}
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
