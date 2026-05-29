import "server-only";

import { and, asc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";

import {
  areas,
  areaTypes,
  buildings,
  clients,
  inspectionTemplateItems,
  inspectionTemplateSections,
  inspectionTemplates,
} from "@/db/schema";

import { isSetupRecordId } from "./model";
import type {
  AreaInput,
  AreaSetupRecord,
  AreaTypeInput,
  AreaTypeSetupRecord,
  BuildingInput,
  InspectionTemplateInput,
  InspectionTemplateItemRecord,
  InspectionTemplateSectionRecord,
  InspectionTemplateSetupRecord,
  BuildingSetupRecord,
  ClientInput,
  ClientSetupRecord,
  SetupVisibility,
} from "./model";

type ClientRow = typeof clients.$inferSelect;
type BuildingRow = typeof buildings.$inferSelect;
type AreaTypeRow = typeof areaTypes.$inferSelect;
type AreaRow = typeof areas.$inferSelect;
type InspectionTemplateRow = typeof inspectionTemplates.$inferSelect;
type InspectionTemplateSectionRow = typeof inspectionTemplateSections.$inferSelect;
type InspectionTemplateItemRow = typeof inspectionTemplateItems.$inferSelect;
type BuildingWithClientRow = {
  building: BuildingRow;
  client: {
    name: string;
    archivedAt: Date | null;
  };
};
type AreaWithParentsRow = {
  area: AreaRow;
  building: {
    id: string;
    name: string;
    archivedAt: Date | null;
  };
  client: {
    id: string;
    name: string;
    archivedAt: Date | null;
  };
  areaType: {
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

type ListAreaOptions = ListOptions & {
  clientId?: string;
  buildingId?: string;
  areaTypeId?: string;
  areaId?: string;
};

type SetupRecordType =
  | "Client"
  | "Building"
  | "Area Type"
  | "Area"
  | "Inspection Template";
type AreaParentField = "buildingId" | "areaTypeId";
type CreateAreaTransactionResult =
  | { area: AreaRow | undefined }
  | { invalidParentFields: AreaParentField[] };

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

export class ActiveAreaParentsRequiredError extends Error {
  readonly fields: readonly AreaParentField[];

  constructor(fields: readonly AreaParentField[]) {
    super("Area must belong to active setup parents.");
    this.name = "ActiveAreaParentsRequiredError";
    this.fields = fields;
  }
}

export function isActiveAreaParentsRequiredError(
  error: unknown,
): error is ActiveAreaParentsRequiredError {
  return error instanceof ActiveAreaParentsRequiredError;
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

function toAreaTypeSetupRecord(row: AreaTypeRow): AreaTypeSetupRecord {
  return {
    id: row.id,
    name: row.name,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isArchived: row.archivedAt !== null,
  };
}

function toInspectionTemplateSectionRecord(
  row: InspectionTemplateSectionRow,
): InspectionTemplateSectionRecord {
  return {
    id: row.id,
    templateId: row.templateId,
    name: row.name,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInspectionTemplateItemRecord(
  row: InspectionTemplateItemRow,
  sectionRows: InspectionTemplateSectionRow[],
): InspectionTemplateItemRecord {
  const section = row.sectionId
    ? sectionRows.find((section) => section.id === row.sectionId)
    : undefined;

  return {
    id: row.id,
    templateId: row.templateId,
    sectionId: row.sectionId,
    sectionName: section?.name ?? null,
    name: row.name,
    description: row.description,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInspectionTemplateSetupRecord(
  row: InspectionTemplateRow,
  sections: InspectionTemplateSectionRow[],
  items: InspectionTemplateItemRow[],
): InspectionTemplateSetupRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isArchived: row.archivedAt !== null,
    sections: sections.map(toInspectionTemplateSectionRecord),
    items: items.map((item) => toInspectionTemplateItemRecord(item, sections)),
  };
}

function toAreaSetupRecord(row: AreaWithParentsRow): AreaSetupRecord {
  const isArchived = row.area.archivedAt !== null;
  const isBuildingArchived = row.building.archivedAt !== null;
  const isClientArchived = row.client.archivedAt !== null;
  const isAreaTypeArchived = row.areaType.archivedAt !== null;

  return {
    id: row.area.id,
    buildingId: row.area.buildingId,
    buildingName: row.building.name,
    clientId: row.client.id,
    clientName: row.client.name,
    areaTypeId: row.area.areaTypeId,
    areaTypeName: row.areaType.name,
    name: row.area.name,
    archivedAt: row.area.archivedAt,
    buildingArchivedAt: row.building.archivedAt,
    clientArchivedAt: row.client.archivedAt,
    areaTypeArchivedAt: row.areaType.archivedAt,
    createdAt: row.area.createdAt,
    updatedAt: row.area.updatedAt,
    isArchived,
    isBuildingArchived,
    isClientArchived,
    isAreaTypeArchived,
    isActive: !isArchived && !isBuildingArchived && !isClientArchived && !isAreaTypeArchived,
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

function areaTypeVisibilityCondition(visibility: SetupVisibility): SQL | undefined {
  return visibility === "active" ? isNull(areaTypes.archivedAt) : undefined;
}

function inspectionTemplateVisibilityCondition(
  visibility: SetupVisibility,
): SQL | undefined {
  return visibility === "active" ? isNull(inspectionTemplates.archivedAt) : undefined;
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

function areaConditions(options: ListAreaOptions): SQL | undefined {
  const visibility = options.visibility ?? "active";
  const conditions: SQL[] = [];

  if (visibility === "active") {
    conditions.push(
      isNull(areas.archivedAt),
      isNull(buildings.archivedAt),
      isNull(clients.archivedAt),
      isNull(areaTypes.archivedAt),
    );
  }

  if (options.clientId) {
    conditions.push(eq(buildings.clientId, options.clientId));
  }

  if (options.buildingId) {
    conditions.push(eq(areas.buildingId, options.buildingId));
  }

  if (options.areaTypeId) {
    conditions.push(eq(areas.areaTypeId, options.areaTypeId));
  }

  if (options.areaId) {
    conditions.push(eq(areas.id, options.areaId));
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

async function requireSavedAreaType(
  row: AreaTypeRow | undefined,
): Promise<AreaTypeSetupRecord> {
  if (!row) {
    throw new Error("Area Type setup record could not be saved.");
  }

  return toAreaTypeSetupRecord(row);
}

function requireExistingAreaType(row: AreaTypeRow | undefined): AreaTypeSetupRecord {
  if (!row) {
    throw new SetupRecordNotFoundError("Area Type");
  }

  return toAreaTypeSetupRecord(row);
}

async function hydrateInspectionTemplates(
  rows: InspectionTemplateRow[],
): Promise<InspectionTemplateSetupRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const { db } = await import("@/db/client");
  const templateIds = rows.map((row) => row.id);
  const sectionRows = await db
    .select()
    .from(inspectionTemplateSections)
    .where(inArray(inspectionTemplateSections.templateId, templateIds))
    .orderBy(
      asc(inspectionTemplateSections.templateId),
      asc(inspectionTemplateSections.position),
    );
  const itemRows = await db
    .select()
    .from(inspectionTemplateItems)
    .where(inArray(inspectionTemplateItems.templateId, templateIds))
    .orderBy(
      asc(inspectionTemplateItems.templateId),
      asc(inspectionTemplateItems.position),
    );

  return rows.map((row) =>
    toInspectionTemplateSetupRecord(
      row,
      sectionRows.filter((section) => section.templateId === row.id),
      itemRows.filter((item) => item.templateId === row.id),
    ),
  );
}

type SavedInspectionTemplateRows = {
  template: InspectionTemplateRow | undefined;
  sections: InspectionTemplateSectionRow[];
  items: InspectionTemplateItemRow[];
};

async function requireSavedInspectionTemplate(
  rows: SavedInspectionTemplateRows,
): Promise<InspectionTemplateSetupRecord> {
  if (!rows.template) {
    throw new Error("Inspection Template setup record could not be saved.");
  }

  return toInspectionTemplateSetupRecord(rows.template, rows.sections, rows.items);
}

async function requireExistingInspectionTemplate(
  row: InspectionTemplateRow | undefined,
): Promise<InspectionTemplateSetupRecord> {
  if (!row) {
    throw new SetupRecordNotFoundError("Inspection Template");
  }

  const template = await getInspectionTemplate(row.id);

  if (!template) {
    throw new Error("Inspection Template setup record could not be loaded.");
  }

  return template;
}

function sectionIdByName(
  sections: InspectionTemplateSectionRow[],
): Map<string, string> {
  return new Map(sections.map((section) => [section.name, section.id]));
}

function duplicateInspectionTemplateName(name: string): string {
  return `${name.slice(0, 155)} Copy`;
}

function descriptionValue(value: string): string | null {
  return value === "" ? null : value;
}

async function requireSavedArea(row: AreaRow | undefined): Promise<AreaSetupRecord> {
  if (!row) {
    throw new Error("Area setup record could not be saved.");
  }

  const area = await getArea(row.id);

  if (!area) {
    throw new Error("Area setup record could not be loaded.");
  }

  return area;
}

async function requireExistingArea(row: AreaRow | undefined): Promise<AreaSetupRecord> {
  if (!row) {
    throw new SetupRecordNotFoundError("Area");
  }

  const area = await getArea(row.id);

  if (!area) {
    throw new Error("Area setup record could not be loaded.");
  }

  return area;
}

export async function listInspectionTemplates(
  options: ListOptions = {},
): Promise<InspectionTemplateSetupRecord[]> {
  const { db } = await import("@/db/client");
  const condition = inspectionTemplateVisibilityCondition(
    options.visibility ?? "active",
  );
  const query = db.select().from(inspectionTemplates);
  const rows = condition
    ? await query.where(condition).orderBy(asc(inspectionTemplates.name))
    : await query.orderBy(asc(inspectionTemplates.name));

  return hydrateInspectionTemplates(rows);
}

export async function getInspectionTemplate(
  id: string,
): Promise<InspectionTemplateSetupRecord | null> {
  if (!isSetupRecordId(id)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const [row] = await db
    .select()
    .from(inspectionTemplates)
    .where(eq(inspectionTemplates.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const [template] = await hydrateInspectionTemplates([row]);

  return template ?? null;
}

export async function createInspectionTemplate(
  input: InspectionTemplateInput,
): Promise<InspectionTemplateSetupRecord> {
  const { db } = await import("@/db/client");
  const rows = await db.transaction(async (tx): Promise<SavedInspectionTemplateRows> => {
    const [template] = await tx
      .insert(inspectionTemplates)
      .values({
        name: input.name,
        description: descriptionValue(input.description),
      })
      .returning();

    if (!template) {
      return { template, sections: [], items: [] };
    }

    const sections = input.sections.length
      ? await tx
          .insert(inspectionTemplateSections)
          .values(
            input.sections.map((section) => ({
              templateId: template.id,
              position: section.position,
              name: section.name,
            })),
          )
          .returning()
      : [];
    const sectionIds = sectionIdByName(sections);
    const items = await tx
      .insert(inspectionTemplateItems)
      .values(
        input.items.map((item) => ({
          templateId: template.id,
          sectionId: item.sectionName ? (sectionIds.get(item.sectionName) ?? null) : null,
          position: item.position,
          name: item.name,
          description: descriptionValue(item.description),
        })),
      )
      .returning();

    return { template, sections, items };
  });

  return requireSavedInspectionTemplate(rows);
}

export async function updateInspectionTemplate(
  id: string,
  input: InspectionTemplateInput,
): Promise<InspectionTemplateSetupRecord> {
  const { db } = await import("@/db/client");
  const rows = await db.transaction(async (tx): Promise<SavedInspectionTemplateRows> => {
    const [template] = await tx
      .update(inspectionTemplates)
      .set({
        name: input.name,
        description: descriptionValue(input.description),
        updatedAt: sql`now()`,
      })
      .where(eq(inspectionTemplates.id, id))
      .returning();

    if (!template) {
      return { template, sections: [], items: [] };
    }

    await tx
      .delete(inspectionTemplateItems)
      .where(eq(inspectionTemplateItems.templateId, id));
    await tx
      .delete(inspectionTemplateSections)
      .where(eq(inspectionTemplateSections.templateId, id));

    const sections = input.sections.length
      ? await tx
          .insert(inspectionTemplateSections)
          .values(
            input.sections.map((section) => ({
              templateId: template.id,
              position: section.position,
              name: section.name,
            })),
          )
          .returning()
      : [];
    const sectionIds = sectionIdByName(sections);
    const items = await tx
      .insert(inspectionTemplateItems)
      .values(
        input.items.map((item) => ({
          templateId: template.id,
          sectionId: item.sectionName ? (sectionIds.get(item.sectionName) ?? null) : null,
          position: item.position,
          name: item.name,
          description: descriptionValue(item.description),
        })),
      )
      .returning();

    return { template, sections, items };
  });

  if (!rows.template) {
    throw new SetupRecordNotFoundError("Inspection Template");
  }

  return requireSavedInspectionTemplate(rows);
}

export async function duplicateInspectionTemplate(
  id: string,
): Promise<InspectionTemplateSetupRecord> {
  const { db } = await import("@/db/client");
  const rows = await db.transaction(async (tx): Promise<SavedInspectionTemplateRows> => {
    const [source] = await tx
      .select()
      .from(inspectionTemplates)
      .where(eq(inspectionTemplates.id, id))
      .for("update")
      .limit(1);

    if (!source) {
      return { template: undefined, sections: [], items: [] };
    }

    const sourceSections = await tx
      .select()
      .from(inspectionTemplateSections)
      .where(eq(inspectionTemplateSections.templateId, source.id))
      .orderBy(asc(inspectionTemplateSections.position));
    const sourceItems = await tx
      .select()
      .from(inspectionTemplateItems)
      .where(eq(inspectionTemplateItems.templateId, source.id))
      .orderBy(asc(inspectionTemplateItems.position));
    const [copy] = await tx
      .insert(inspectionTemplates)
      .values({
        name: duplicateInspectionTemplateName(source.name),
        description: source.description,
      })
      .returning();

    if (!copy) {
      return { template: copy, sections: [], items: [] };
    }

    const sections = sourceSections.length
      ? await tx
          .insert(inspectionTemplateSections)
          .values(
            sourceSections.map((section) => ({
              templateId: copy.id,
              position: section.position,
              name: section.name,
            })),
          )
          .returning()
      : [];
    const sectionIds = new Map(
      sourceSections.map((section, index) => [section.id, sections[index]?.id]),
    );
    const items = sourceItems.length
      ? await tx
          .insert(inspectionTemplateItems)
          .values(
            sourceItems.map((item) => ({
              templateId: copy.id,
              sectionId: item.sectionId ? (sectionIds.get(item.sectionId) ?? null) : null,
              position: item.position,
              name: item.name,
              description: item.description,
            })),
          )
          .returning()
      : [];

    return { template: copy, sections, items };
  });

  if (!rows.template) {
    throw new SetupRecordNotFoundError("Inspection Template");
  }

  return requireSavedInspectionTemplate(rows);
}

export async function archiveInspectionTemplate(
  id: string,
): Promise<InspectionTemplateSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(inspectionTemplates)
    .set({
      archivedAt: sql`coalesce(${inspectionTemplates.archivedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(eq(inspectionTemplates.id, id))
    .returning();

  return requireExistingInspectionTemplate(row);
}

export async function restoreInspectionTemplate(
  id: string,
): Promise<InspectionTemplateSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(inspectionTemplates)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(eq(inspectionTemplates.id, id))
    .returning();

  return requireExistingInspectionTemplate(row);
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

export async function listAreaTypes(
  options: ListOptions = {},
): Promise<AreaTypeSetupRecord[]> {
  const { db } = await import("@/db/client");
  const condition = areaTypeVisibilityCondition(options.visibility ?? "active");
  const query = db.select().from(areaTypes);
  const rows = condition
    ? await query.where(condition).orderBy(asc(areaTypes.name))
    : await query.orderBy(asc(areaTypes.name));

  return rows.map(toAreaTypeSetupRecord);
}

export async function getAreaType(id: string): Promise<AreaTypeSetupRecord | null> {
  if (!isSetupRecordId(id)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const [row] = await db.select().from(areaTypes).where(eq(areaTypes.id, id)).limit(1);

  return row ? toAreaTypeSetupRecord(row) : null;
}

export async function createAreaType(
  input: AreaTypeInput,
): Promise<AreaTypeSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db.insert(areaTypes).values({ name: input.name }).returning();

  return requireSavedAreaType(row);
}

export async function updateAreaType(
  id: string,
  input: AreaTypeInput,
): Promise<AreaTypeSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(areaTypes)
    .set({ name: input.name, updatedAt: sql`now()` })
    .where(eq(areaTypes.id, id))
    .returning();

  return requireExistingAreaType(row);
}

export async function archiveAreaType(id: string): Promise<AreaTypeSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(areaTypes)
    .set({
      archivedAt: sql`coalesce(${areaTypes.archivedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(eq(areaTypes.id, id))
    .returning();

  return requireExistingAreaType(row);
}

export async function restoreAreaType(id: string): Promise<AreaTypeSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(areaTypes)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(eq(areaTypes.id, id))
    .returning();

  return requireExistingAreaType(row);
}

export async function listAreas(
  options: ListAreaOptions = {},
): Promise<AreaSetupRecord[]> {
  const { db } = await import("@/db/client");
  const condition = areaConditions(options);
  const query = db
    .select({
      area: areas,
      building: {
        id: buildings.id,
        name: buildings.name,
        archivedAt: buildings.archivedAt,
      },
      client: {
        id: clients.id,
        name: clients.name,
        archivedAt: clients.archivedAt,
      },
      areaType: {
        name: areaTypes.name,
        archivedAt: areaTypes.archivedAt,
      },
    })
    .from(areas)
    .innerJoin(buildings, eq(areas.buildingId, buildings.id))
    .innerJoin(clients, eq(buildings.clientId, clients.id))
    .innerJoin(areaTypes, eq(areas.areaTypeId, areaTypes.id));
  const rows = condition
    ? await query
        .where(condition)
        .orderBy(asc(clients.name), asc(buildings.name), asc(areaTypes.name), asc(areas.name))
    : await query.orderBy(
        asc(clients.name),
        asc(buildings.name),
        asc(areaTypes.name),
        asc(areas.name),
      );

  return rows.map(toAreaSetupRecord);
}

export async function getArea(id: string): Promise<AreaSetupRecord | null> {
  if (!isSetupRecordId(id)) {
    return null;
  }

  const [area] = await listAreas({
    visibility: "historical",
    areaId: id,
  });

  return area ?? null;
}

export async function createArea(input: AreaInput): Promise<AreaSetupRecord> {
  const { db } = await import("@/db/client");
  const result = await db.transaction(
    async (tx): Promise<CreateAreaTransactionResult> => {
      const invalidParentFields: AreaParentField[] = [];
      const [building] = await tx
        .select({
          building: buildings,
          client: { archivedAt: clients.archivedAt },
        })
        .from(buildings)
        .innerJoin(clients, eq(buildings.clientId, clients.id))
        .where(eq(buildings.id, input.buildingId))
        .for("update")
        .limit(1);

      if (
        !building ||
        building.building.archivedAt !== null ||
        building.client.archivedAt !== null
      ) {
        invalidParentFields.push("buildingId");
      }

      const [areaType] = await tx
        .select()
        .from(areaTypes)
        .where(eq(areaTypes.id, input.areaTypeId))
        .for("update")
        .limit(1);

      if (!areaType || areaType.archivedAt !== null) {
        invalidParentFields.push("areaTypeId");
      }

      if (invalidParentFields.length > 0) {
        return { invalidParentFields };
      }

      const [area] = await tx
        .insert(areas)
        .values({
          buildingId: input.buildingId,
          areaTypeId: input.areaTypeId,
          name: input.name,
        })
        .returning();

      return { area };
    },
  );

  if ("invalidParentFields" in result) {
    throw new ActiveAreaParentsRequiredError(result.invalidParentFields);
  }

  return requireSavedArea(result.area);
}

export async function updateArea(
  id: string,
  input: Pick<AreaInput, "name">,
): Promise<AreaSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(areas)
    .set({ name: input.name, updatedAt: sql`now()` })
    .where(eq(areas.id, id))
    .returning();

  return requireExistingArea(row);
}

export async function archiveArea(id: string): Promise<AreaSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(areas)
    .set({
      archivedAt: sql`coalesce(${areas.archivedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(eq(areas.id, id))
    .returning();

  return requireExistingArea(row);
}

export async function restoreArea(id: string): Promise<AreaSetupRecord> {
  const { db } = await import("@/db/client");
  const [row] = await db
    .update(areas)
    .set({ archivedAt: null, updatedAt: sql`now()` })
    .where(eq(areas.id, id))
    .returning();

  return requireExistingArea(row);
}
