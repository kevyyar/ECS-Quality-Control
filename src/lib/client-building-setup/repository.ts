import "server-only";

import { and, asc, eq, isNull, sql, type SQL } from "drizzle-orm";

import { buildings, clients } from "@/db/schema";

import { isSetupRecordId } from "./model";
import type {
  BuildingInput,
  BuildingSetupRecord,
  ClientInput,
  ClientSetupRecord,
  SetupVisibility,
} from "./model";

type ClientRow = typeof clients.$inferSelect;
type BuildingRow = typeof buildings.$inferSelect;
type BuildingWithClientRow = {
  building: BuildingRow;
  client: {
    name: string;
    archivedAt: Date | null;
  };
};

type ListOptions = {
  visibility?: SetupVisibility;
};

type ListBuildingOptions = ListOptions & {
  clientId?: string;
  buildingId?: string;
};

type SetupRecordType = "Client" | "Building";

export class SetupRecordNotFoundError extends Error {
  constructor(recordType: SetupRecordType) {
    super(`${recordType} setup record was not found.`);
    this.name = "SetupRecordNotFoundError";
  }
}

export function isSetupRecordNotFoundError(
  error: unknown,
): error is SetupRecordNotFoundError {
  return error instanceof SetupRecordNotFoundError;
}

function toClientSetupRecord(row: ClientRow): ClientSetupRecord {
  return {
    id: row.id,
    name: row.name,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isArchived: row.archivedAt !== null,
  };
}

function toBuildingSetupRecord(row: BuildingWithClientRow): BuildingSetupRecord {
  const isArchived = row.building.archivedAt !== null;
  const isParentArchived = row.client.archivedAt !== null;

  return {
    id: row.building.id,
    clientId: row.building.clientId,
    clientName: row.client.name,
    name: row.building.name,
    archivedAt: row.building.archivedAt,
    clientArchivedAt: row.client.archivedAt,
    createdAt: row.building.createdAt,
    updatedAt: row.building.updatedAt,
    isArchived,
    isParentArchived,
    isActive: !isArchived && !isParentArchived,
  };
}

function combineConditions(conditions: SQL[]): SQL | undefined {
  const [first, ...rest] = conditions;

  if (!first) {
    return undefined;
  }

  return rest.length === 0 ? first : (and(first, ...rest) ?? first);
}

function clientVisibilityCondition(visibility: SetupVisibility): SQL | undefined {
  return visibility === "active" ? isNull(clients.archivedAt) : undefined;
}

function buildingConditions(options: ListBuildingOptions): SQL | undefined {
  const visibility = options.visibility ?? "active";
  const conditions: SQL[] = [];

  if (visibility === "active") {
    conditions.push(isNull(buildings.archivedAt), isNull(clients.archivedAt));
  }

  if (options.clientId) {
    conditions.push(eq(buildings.clientId, options.clientId));
  }

  if (options.buildingId) {
    conditions.push(eq(buildings.id, options.buildingId));
  }

  return combineConditions(conditions);
}

async function requireSavedClient(row: ClientRow | undefined): Promise<ClientSetupRecord> {
  if (!row) {
    throw new Error("Client setup record could not be saved.");
  }

  return toClientSetupRecord(row);
}

function requireExistingClient(row: ClientRow | undefined): ClientSetupRecord {
  if (!row) {
    throw new SetupRecordNotFoundError("Client");
  }

  return toClientSetupRecord(row);
}

async function requireSavedBuilding(
  row: BuildingRow | undefined,
): Promise<BuildingSetupRecord> {
  if (!row) {
    throw new Error("Building setup record could not be saved.");
  }

  const building = await getBuilding(row.id);

  if (!building) {
    throw new Error("Building setup record could not be loaded.");
  }

  return building;
}

async function requireExistingBuilding(
  row: BuildingRow | undefined,
): Promise<BuildingSetupRecord> {
  if (!row) {
    throw new SetupRecordNotFoundError("Building");
  }

  const building = await getBuilding(row.id);

  if (!building) {
    throw new Error("Building setup record could not be loaded.");
  }

  return building;
}

export async function listClients(
  options: ListOptions = {},
): Promise<ClientSetupRecord[]> {
  const { db } = await import("@/db/client");
  const condition = clientVisibilityCondition(options.visibility ?? "active");
  const query = db.select().from(clients);
  const rows = condition
    ? await query.where(condition).orderBy(asc(clients.name))
    : await query.orderBy(asc(clients.name));

  return rows.map(toClientSetupRecord);
}

export async function getClient(id: string): Promise<ClientSetupRecord | null> {
  if (!isSetupRecordId(id)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

  return row ? toClientSetupRecord(row) : null;
}

export async function createClient(input: ClientInput): Promise<ClientSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db.insert(clients).values({ name: input.name }).returning();

  return requireSavedClient(row);
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<ClientSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(clients)
    .set({ name: input.name, updatedAt: sql`now()` })
    .where(eq(clients.id, id))
    .returning();

  return requireExistingClient(row);
}

export async function archiveClient(id: string): Promise<ClientSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(clients)
    .set({ archivedAt: sql`coalesce(${clients.archivedAt}, now())`, updatedAt: sql`now()` })
    .where(eq(clients.id, id))
    .returning();

  return requireExistingClient(row);
}

export async function restoreClient(id: string): Promise<ClientSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(clients)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(eq(clients.id, id))
    .returning();

  return requireExistingClient(row);
}

export async function listBuildings(
  options: ListBuildingOptions = {},
): Promise<BuildingSetupRecord[]> {
  const { db } = await import("@/db/client");
  const condition = buildingConditions(options);
  const query = db
    .select({
      building: buildings,
      client: {
        name: clients.name,
        archivedAt: clients.archivedAt,
      },
    })
    .from(buildings)
    .innerJoin(clients, eq(buildings.clientId, clients.id));
  const rows = condition
    ? await query.where(condition).orderBy(asc(clients.name), asc(buildings.name))
    : await query.orderBy(asc(clients.name), asc(buildings.name));

  return rows.map(toBuildingSetupRecord);
}

export async function getBuilding(
  id: string,
): Promise<BuildingSetupRecord | null> {
  if (!isSetupRecordId(id)) {
    return null;
  }

  const [building] = await listBuildings({
    visibility: "historical",
    buildingId: id,
  });

  return building ?? null;
}

export async function createBuilding(
  input: BuildingInput,
): Promise<BuildingSetupRecord> {
  const { db } = await import("@/db/client");
  const row = await db.transaction(async (tx) => {
    const [client] = await tx
      .select()
      .from(clients)
      .where(eq(clients.id, input.clientId))
      .for("update")
      .limit(1);

    if (!client || client.archivedAt !== null) {
      return undefined;
    }

    const [building] = await tx
      .insert(buildings)
      .values({ clientId: input.clientId, name: input.name })
      .returning();

    return building;
  });

  if (!row) {
    throw new Error("Building must belong to an active Client.");
  }

  return requireSavedBuilding(row);
}

export async function updateBuilding(
  id: string,
  input: Pick<BuildingInput, "name">,
): Promise<BuildingSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(buildings)
    .set({ name: input.name, updatedAt: sql`now()` })
    .where(eq(buildings.id, id))
    .returning();

  return requireExistingBuilding(row);
}

export async function archiveBuilding(id: string): Promise<BuildingSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(buildings)
    .set({
      archivedAt: sql`coalesce(${buildings.archivedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(eq(buildings.id, id))
    .returning();

  return requireExistingBuilding(row);
}

export async function restoreBuilding(id: string): Promise<BuildingSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(buildings)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(eq(buildings.id, id))
    .returning();

  return requireExistingBuilding(row);
}
