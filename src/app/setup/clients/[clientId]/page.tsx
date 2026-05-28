import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getClient,
  listBuildings,
} from "@/lib/client-building-setup/repository";

import { archiveClientAction, restoreClientAction } from "../actions";
import { ClientEditForm } from "../client-form";

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>;
};

function buildingStatus(building: Awaited<ReturnType<typeof listBuildings>>[number]): string {
  if (building.isArchived) {
    return "Archived";
  }

  if (building.isParentArchived) {
    return "Inactive while parent Client is archived";
  }

  return "Active";
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  await requireProtectedAction("manageSetup");

  const { clientId } = await params;
  const client = await getClient(clientId);

  if (!client) {
    notFound();
  }

  const buildings = await listBuildings({
    visibility: "historical",
    clientId: client.id,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup/clients">
            ← Clients
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {client.isArchived ? "Archived Client" : "Active Client"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {client.name}
            </h1>
          </div>
        </div>

        <ClientEditForm client={client} />

        <form action={client.isArchived ? restoreClientAction : archiveClientAction}>
          <input name="id" type="hidden" value={client.id} />
          <button
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
            type="submit"
          >
            {client.isArchived ? "Restore Client" : "Archive Client"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">Buildings</h2>
            <Link className="text-sm font-semibold text-brand-700" href="/setup/buildings">
              Manage Buildings
            </Link>
          </div>

          {buildings.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Buildings have been set up for this Client.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {buildings.map((building) => (
                <li key={building.id}>
                  <Link
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    href={`/setup/buildings/${building.id}`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {building.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-ink">
                        {buildingStatus(building)}
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
