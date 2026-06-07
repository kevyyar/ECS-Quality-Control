import Link from "next/link";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  listAreas,
  listAreaTypes,
  listBuildings,
} from "@/lib/client-building-setup/repository";
import { SetupListPage } from "@/lib/ux/setup-list-page";
import { ux } from "@/lib/ux/tokens";

import { AreaCreateForm } from "./area-form";

type AreasPageProps = {
  searchParams?: Promise<{ includeArchived?: string; q?: string }>;
};

function statusLabel(area: Awaited<ReturnType<typeof listAreas>>[number]): string {
  if (area.isArchived) {
    return "Archived";
  }

  if (area.isClientArchived) {
    return "Inactive while parent Client is archived";
  }

  if (area.isBuildingArchived) {
    return "Inactive while parent Building is archived";
  }

  if (area.isAreaTypeArchived) {
    return "Inactive while Area Type is archived";
  }

  return "Active";
}

export default async function AreasPage({ searchParams }: AreasPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const [areas, activeBuildings, activeAreaTypes] = await Promise.all([
    listAreas({ visibility: includeArchived ? "historical" : "active", search: params?.q }),
    listBuildings({ visibility: "active" }),
    listAreaTypes({ visibility: "active" }),
  ]);

  return (
    <SetupListPage
      createForm={
        <AreaCreateForm activeAreaTypes={activeAreaTypes} activeBuildings={activeBuildings} />
      }
      description="Manage inspectable spaces under active Buildings and Area Types. Archived parents hide Areas from active lookup lists."
      emptyDescription="Create an Area or adjust your search to see more results."
      emptyTitle="No Areas found"
      listHeading={includeArchived ? "All Areas" : "Active Areas"}
      listHeadingId="areas-list-heading"
      records={areas.map((area) => ({
        id: area.id,
        href: `/setup/areas/${area.id}`,
        title: area.name,
        meta: `${area.clientName} · ${area.buildingName}`,
        subtitle: `${area.areaTypeName} · ${statusLabel(area)}`,
      }))}
      searchForm={
        <form className={ux.searchForm}>
          <label className={ux.formField} htmlFor="area-search">
            <span className={ux.fieldLabel}>Area name</span>
            <input
              className={ux.input}
              defaultValue={params?.q ?? ""}
              id="area-search"
              name="q"
              placeholder="Search by name"
              type="search"
            />
          </label>
          {includeArchived ? <input name="includeArchived" type="hidden" value="1" /> : null}
          <div className={ux.searchActions}>
            <button className={ux.primaryButton} type="submit">
              Search
            </button>
            <Link
              className={ux.textLink}
              href={includeArchived ? "/setup/areas?includeArchived=1" : "/setup/areas"}
            >
              Clear
            </Link>
          </div>
        </form>
      }
      title="Areas"
      toggleHref={includeArchived ? "/setup/areas" : "/setup/areas?includeArchived=1"}
      toggleLabel={includeArchived ? "Show active only" : "Include archived"}
    />
  );
}
