import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProtectedAction } from "@/lib/auth/session";
import {
  getClient,
  listBuildings,
} from "@/lib/client-building-setup/repository";
import {
  PageEmptyState,
  RecordList,
  RecordListItem,
} from "@/lib/ux/app-page";
import {
  SetupDetailPage,
  SetupDetailSection,
} from "@/lib/ux/setup-detail-page";
import { ux } from "@/lib/ux/tokens";

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
    <SetupDetailPage
      backHref="/setup/clients"
      backLabel="Clients"
      eyebrow={client.isArchived ? "Archived Client" : "Active Client"}
      title={client.name}
    >
      <SetupDetailSection heading="Edit Client" headingId="client-edit-heading" icon="settings">
        <ClientEditForm client={client} />
      </SetupDetailSection>

      <SetupDetailSection heading="Archive status" headingId="client-archive-heading" icon="shield">
        <form action={client.isArchived ? restoreClientAction : archiveClientAction}>
          <input name="id" type="hidden" value={client.id} />
          <button className={ux.mutedButton} type="submit">
            {client.isArchived ? "Restore Client" : "Archive Client"}
          </button>
        </form>
      </SetupDetailSection>

      <SetupDetailSection
        headerAside={
          <Link className={ux.textLink} href="/setup/buildings">
            Manage Buildings
          </Link>
        }
        heading="Buildings"
        headingId="client-buildings-heading"
        icon="building"
      >
        {buildings.length === 0 ? (
          <PageEmptyState
            description="Create a Building under this Client to start assigning Areas and inspection plans."
            icon="building"
            title="No Buildings yet"
          />
        ) : (
          <RecordList label="Buildings">
            {buildings.map((building) => (
              <RecordListItem
                href={`/setup/buildings/${building.id}`}
                key={building.id}
                subtitle={buildingStatus(building)}
                title={building.name}
              />
            ))}
          </RecordList>
        )}
      </SetupDetailSection>
    </SetupDetailPage>
  );
}
