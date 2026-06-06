import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  listBuildings,
  listClients,
} from "@/lib/client-building-setup/repository";
import { SetupListPage } from "@/lib/ux/setup-list-page";
import { ux } from "@/lib/ux/tokens";

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
    <SetupListPage
      createForm={<BuildingCreateForm activeClients={activeClients} />}
      description="Manage physical service locations under active Clients. Archived Clients and Buildings are hidden from active lookup lists."
      emptyDescription="Create a Building or adjust your search to see more results."
      emptyTitle="No Buildings found"
      listHeading={includeArchived ? "All Buildings" : "Active Buildings"}
      listHeadingId="buildings-list-heading"
      records={buildings.map((building) => ({
        id: building.id,
        href: `/setup/buildings/${building.id}`,
        title: building.name,
        meta: building.clientName,
        subtitle: statusLabel(building),
      }))}
      searchForm={
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5" htmlFor="building-search">
            <span className={ux.fieldLabel}>Building name</span>
            <input
              className={ux.input}
              defaultValue={params?.q ?? ""}
              id="building-search"
              name="q"
              type="search"
            />
          </label>
          {includeArchived ? <input name="includeArchived" type="hidden" value="1" /> : null}
          <div className="flex flex-wrap items-end gap-3">
            <button className={ux.primaryButton} type="submit">
              Search
            </button>
            <Link
              className={`${ux.textLink} py-2.5`}
              href={includeArchived ? "/setup/buildings?includeArchived=1" : "/setup/buildings"}
            >
              Clear
            </Link>
          </div>
        </form>
      }
      title="Buildings"
      toggleHref={includeArchived ? "/setup/buildings" : "/setup/buildings?includeArchived=1"}
      toggleLabel={includeArchived ? "Show active only" : "Include archived"}
    />
  );
}
