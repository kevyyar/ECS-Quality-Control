import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  listBuildings,
  listClients,
} from "@/lib/client-building-setup/repository";

import { BuildingCreateForm } from "./building-form";

type BuildingsPageProps = {
  searchParams?: Promise<{ includeArchived?: string; q?: string }>;
};

function statusLabel(building: Awaited<ReturnType<typeof listBuildings>>[number]): string {
  if (building.isArchived) {
    return "Archived";
  }

  if (building.isParentArchived) {
    return "Inactive while parent Client is archived";
  }

  return "Active";
}

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const [buildings, activeClients] = await Promise.all([
    listBuildings({ visibility: includeArchived ? "historical" : "active", search: params?.q }),
    listClients({ visibility: "active" }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-ink sm:px-10">
      <section className="mx-auto max-w-4xl space-y-8 rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Link className="text-sm font-semibold text-brand-700" href="/setup">
            ← Setup
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Buildings
            </h1>
            <p className="text-muted-ink">
              Manage physical service locations under active Clients. Archived
              Clients and Buildings are hidden from active lookup lists.
            </p>
          </div>
        </div>

        <BuildingCreateForm activeClients={activeClients} />

        <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2" htmlFor="building-search">
            <span className="text-sm font-semibold text-slate-900">Search Buildings by name</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
              defaultValue={params?.q ?? ""}
              id="building-search"
              name="q"
              type="search"
            />
          </label>
          {includeArchived ? <input name="includeArchived" type="hidden" value="1" /> : null}
          <button className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100" type="submit">Search</button>
          <Link className="py-3 text-sm font-semibold text-brand-700" href={includeArchived ? "/setup/buildings?includeArchived=1" : "/setup/buildings"}>Clear</Link>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              {includeArchived ? "All Buildings" : "Active Buildings"}
            </h2>
            <Link
              className="text-sm font-semibold text-brand-700"
              href={includeArchived ? "/setup/buildings" : "/setup/buildings?includeArchived=1"}
            >
              {includeArchived ? "Show active only" : "Include archived"}
            </Link>
          </div>

          {buildings.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 p-5 text-sm text-muted-ink">
              No Buildings found.
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
                        {building.clientName} · {statusLabel(building)}
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
