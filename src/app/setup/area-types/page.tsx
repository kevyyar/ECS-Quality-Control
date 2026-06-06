import { requireProtectedAction } from "@/lib/auth/session";
import { listAreaTypes } from "@/lib/client-building-setup/repository";
import { SetupListPage } from "@/lib/ux/setup-list-page";

import { AreaTypeCreateForm } from "./area-type-form";

type AreaTypesPageProps = {
  searchParams?: Promise<{ includeArchived?: string }>;
};

function statusLabel(isArchived: boolean): string {
  return isArchived ? "Archived" : "Active";
}

export default async function AreaTypesPage({ searchParams }: AreaTypesPageProps) {
  await requireProtectedAction("manageSetup");

  const params = await searchParams;
  const includeArchived = params?.includeArchived === "1";
  const areaTypes = await listAreaTypes({
    visibility: includeArchived ? "historical" : "active",
  });

  return (
    <SetupListPage
      createForm={<AreaTypeCreateForm />}
      description="Manage reusable Area categories. Archived Area Types are hidden from active setup lists but remain available for historical context."
      emptyDescription="Create an Area Type or include archived records to see more results."
      emptyTitle="No Area Types found"
      listHeading={includeArchived ? "All Area Types" : "Active Area Types"}
      listHeadingId="area-types-list-heading"
      records={areaTypes.map((areaType) => ({
        id: areaType.id,
        href: `/setup/area-types/${areaType.id}`,
        title: areaType.name,
        subtitle: statusLabel(areaType.isArchived),
      }))}
      title="Area Types"
      toggleHref={includeArchived ? "/setup/area-types" : "/setup/area-types?includeArchived=1"}
      toggleLabel={includeArchived ? "Show active only" : "Include archived"}
    />
  );
}
