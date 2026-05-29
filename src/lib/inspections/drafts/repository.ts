import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import {
  areas,
  areaTypes,
  buildingInspectionPlanEntries,
  buildingInspectionPlans,
  buildings,
  clients,
  inspectionAreaInspections,
  inspectionItems,
  inspections,
  inspectionTemplateItems,
  inspectionTemplateSections,
  inspectionTemplates,
} from "@/db/schema";
import {
  isBuildingInspectionPlanEntryActive,
  isSetupRecordId,
} from "@/lib/client-building-setup/model";

import type {
  ActiveDraftInspectionSummaryRecord,
  DraftAreaInspectionRecord,
  DraftInspectionItemRecord,
  DraftInspectionRecord,
  DraftInspectionStarter,
  StartDraftInspectionInput,
} from "./model";

type InspectionRow = typeof inspections.$inferSelect;
type AreaInspectionRow = typeof inspectionAreaInspections.$inferSelect;
type InspectionItemRow = typeof inspectionItems.$inferSelect;

type BuildingPlanHydrationRow = {
  plan: typeof buildingInspectionPlans.$inferSelect;
  building: typeof buildings.$inferSelect;
  client: {
    id: string;
    name: string;
    archivedAt: Date | null;
  };
  entry: typeof buildingInspectionPlanEntries.$inferSelect | null;
  area: typeof areas.$inferSelect | null;
  areaType: (typeof areaTypes.$inferSelect) | null;
  inspectionTemplate: (typeof inspectionTemplates.$inferSelect) | null;
};

type TemplateItemHydrationRow = {
  item: typeof inspectionTemplateItems.$inferSelect;
  section: Pick<typeof inspectionTemplateSections.$inferSelect, "id" | "name"> | null;
};

type DraftHydrationRow = {
  inspection: InspectionRow;
  areaInspection: AreaInspectionRow | null;
  item: InspectionItemRow | null;
};

export class ActiveDraftInspectionAlreadyExistsError extends Error {
  readonly draftInspectionId: string;

  constructor(draftInspectionId: string) {
    super("Building already has an active Draft Inspection.");
    this.name = "ActiveDraftInspectionAlreadyExistsError";
    this.draftInspectionId = draftInspectionId;
  }
}

export function isActiveDraftInspectionAlreadyExistsError(
  error: unknown,
): error is ActiveDraftInspectionAlreadyExistsError {
  return error instanceof ActiveDraftInspectionAlreadyExistsError;
}

export class ActiveBuildingInspectionPlanRequiredForDraftError extends Error {
  constructor() {
    super("Draft Inspection requires a non-empty active Building Inspection Plan.");
    this.name = "ActiveBuildingInspectionPlanRequiredForDraftError";
  }
}

export function isActiveBuildingInspectionPlanRequiredForDraftError(
  error: unknown,
): error is ActiveBuildingInspectionPlanRequiredForDraftError {
  return error instanceof ActiveBuildingInspectionPlanRequiredForDraftError;
}

export class ActiveBuildingRequiredForDraftError extends Error {
  constructor() {
    super("Draft Inspection requires an active Building.");
    this.name = "ActiveBuildingRequiredForDraftError";
  }
}

export function isActiveBuildingRequiredForDraftError(
  error: unknown,
): error is ActiveBuildingRequiredForDraftError {
  return error instanceof ActiveBuildingRequiredForDraftError;
}

function activePlanEntries(rows: BuildingPlanHydrationRow[]): BuildingPlanHydrationRow[] {
  return rows.filter((row) => {
    if (!row.entry || !row.area || !row.areaType || !row.inspectionTemplate) {
      return false;
    }

    return isBuildingInspectionPlanEntryActive({
      areaArchivedAt: row.area.archivedAt,
      areaTypeArchivedAt: row.areaType.archivedAt,
      buildingArchivedAt: row.building.archivedAt,
      clientArchivedAt: row.client.archivedAt,
      inspectionTemplateArchivedAt: row.inspectionTemplate.archivedAt,
    });
  });
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function toInspectionItemRecord(row: InspectionItemRow): DraftInspectionItemRecord {
  return {
    id: row.id,
    areaInspectionId: row.areaInspectionId,
    sourceTemplateItemId: row.sourceTemplateItemId,
    sourceTemplateSectionId: row.sourceTemplateSectionId,
    position: row.position,
    sectionNameSnapshot: row.sectionNameSnapshot,
    itemNameSnapshot: row.itemNameSnapshot,
    itemDescriptionSnapshot: row.itemDescriptionSnapshot,
  };
}

function toAreaInspectionRecord(
  row: AreaInspectionRow,
  items: InspectionItemRow[],
): DraftAreaInspectionRecord {
  return {
    id: row.id,
    inspectionId: row.inspectionId,
    source: row.source as DraftAreaInspectionRecord["source"],
    position: row.position,
    areaId: row.areaId,
    areaTypeId: row.areaTypeId,
    inspectionTemplateId: row.inspectionTemplateId,
    areaNameSnapshot: row.areaNameSnapshot,
    areaTypeNameSnapshot: row.areaTypeNameSnapshot,
    inspectionTemplateNameSnapshot: row.inspectionTemplateNameSnapshot,
    inspectionTemplateDescriptionSnapshot: row.inspectionTemplateDescriptionSnapshot,
    items: items.map(toInspectionItemRecord),
  };
}

function toDraftInspectionRecord(
  inspection: InspectionRow,
  areaRows: AreaInspectionRow[],
  itemRows: InspectionItemRow[],
): DraftInspectionRecord {
  return {
    id: inspection.id,
    status: "draft",
    clientId: inspection.clientId,
    buildingId: inspection.buildingId,
    clientNameSnapshot: inspection.clientNameSnapshot,
    buildingNameSnapshot: inspection.buildingNameSnapshot,
    startedByAuthUserId: inspection.startedByAuthUserId,
    startedByEmail: inspection.startedByEmail,
    startedAt: inspection.startedAt,
    areaInspections: areaRows.map((areaInspection) =>
      toAreaInspectionRecord(
        areaInspection,
        itemRows.filter((item) => item.areaInspectionId === areaInspection.id),
      ),
    ),
  };
}

function toDraftInspectionRecordFromHydration(
  rows: DraftHydrationRow[],
): DraftInspectionRecord | null {
  const first = rows[0];

  if (!first || first.inspection.status !== "draft") {
    return null;
  }

  const areaRowsById = new Map<string, AreaInspectionRow>();
  const itemRowsById = new Map<string, InspectionItemRow>();

  rows.forEach((row) => {
    if (row.areaInspection) {
      areaRowsById.set(row.areaInspection.id, row.areaInspection);
    }

    if (row.item) {
      itemRowsById.set(row.item.id, row.item);
    }
  });

  return toDraftInspectionRecord(
    first.inspection,
    Array.from(areaRowsById.values()),
    Array.from(itemRowsById.values()),
  );
}

export async function startDraftInspection(
  input: StartDraftInspectionInput,
  starter: DraftInspectionStarter,
): Promise<DraftInspectionRecord> {
  if (!isSetupRecordId(input.buildingId)) {
    throw new ActiveBuildingRequiredForDraftError();
  }

  const { db } = await import("@/db/client");

  return db.transaction(async (tx) => {
    const [building] = await tx
      .select({
        building: buildings,
        client: {
          id: clients.id,
          name: clients.name,
          archivedAt: clients.archivedAt,
        },
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
      throw new ActiveBuildingRequiredForDraftError();
    }

    const [existingDraft] = await tx
      .select({ id: inspections.id })
      .from(inspections)
      .where(
        and(
          eq(inspections.buildingId, input.buildingId),
          eq(inspections.status, "draft"),
        ),
      )
      .limit(1);

    if (existingDraft) {
      throw new ActiveDraftInspectionAlreadyExistsError(existingDraft.id);
    }

    const planRows: BuildingPlanHydrationRow[] = await tx
      .select({
        plan: buildingInspectionPlans,
        building: buildings,
        client: {
          id: clients.id,
          name: clients.name,
          archivedAt: clients.archivedAt,
        },
        entry: buildingInspectionPlanEntries,
        area: areas,
        areaType: areaTypes,
        inspectionTemplate: inspectionTemplates,
      })
      .from(buildingInspectionPlans)
      .innerJoin(buildings, eq(buildingInspectionPlans.buildingId, buildings.id))
      .innerJoin(clients, eq(buildings.clientId, clients.id))
      .leftJoin(
        buildingInspectionPlanEntries,
        eq(buildingInspectionPlanEntries.planId, buildingInspectionPlans.id),
      )
      .leftJoin(areas, eq(buildingInspectionPlanEntries.areaId, areas.id))
      .leftJoin(areaTypes, eq(areas.areaTypeId, areaTypes.id))
      .leftJoin(
        inspectionTemplates,
        eq(buildingInspectionPlanEntries.inspectionTemplateId, inspectionTemplates.id),
      )
      .where(eq(buildingInspectionPlans.buildingId, input.buildingId))
      .orderBy(asc(buildingInspectionPlanEntries.position));
    const entries = activePlanEntries(planRows);

    if (entries.length === 0) {
      throw new ActiveBuildingInspectionPlanRequiredForDraftError();
    }

    const templateIds = uniqueIds(
      entries
        .map((row) => row.inspectionTemplate?.id)
        .filter((id): id is string => Boolean(id)),
    );
    const templateItemRows: TemplateItemHydrationRow[] = await tx
      .select({
        item: inspectionTemplateItems,
        section: {
          id: inspectionTemplateSections.id,
          name: inspectionTemplateSections.name,
        },
      })
      .from(inspectionTemplateItems)
      .leftJoin(
        inspectionTemplateSections,
        eq(inspectionTemplateItems.sectionId, inspectionTemplateSections.id),
      )
      .where(inArray(inspectionTemplateItems.templateId, templateIds))
      .orderBy(asc(inspectionTemplateItems.templateId), asc(inspectionTemplateItems.position));
    const itemsByTemplateId = new Map<string, TemplateItemHydrationRow[]>();

    templateItemRows.forEach((row) => {
      const rows = itemsByTemplateId.get(row.item.templateId) ?? [];
      rows.push(row);
      itemsByTemplateId.set(row.item.templateId, rows);
    });

    const [savedInspection] = await tx
      .insert(inspections)
      .values({
        status: "draft",
        clientId: building.client.id,
        buildingId: building.building.id,
        clientNameSnapshot: building.client.name,
        buildingNameSnapshot: building.building.name,
        startedByAuthUserId: starter.authUserId,
        startedByEmail: starter.email,
      })
      .returning();

    if (!savedInspection) {
      throw new Error("Draft Inspection could not be started.");
    }

    const savedAreaInspections: AreaInspectionRow[] = await tx
      .insert(inspectionAreaInspections)
      .values(
        entries.map((row, index) => {
          if (!row.area || !row.areaType || !row.inspectionTemplate) {
            throw new ActiveBuildingInspectionPlanRequiredForDraftError();
          }

          return {
            inspectionId: savedInspection.id,
            source: "planned",
            position: index + 1,
            areaId: row.area.id,
            areaTypeId: row.areaType.id,
            inspectionTemplateId: row.inspectionTemplate.id,
            areaNameSnapshot: row.area.name,
            areaTypeNameSnapshot: row.areaType.name,
            inspectionTemplateNameSnapshot: row.inspectionTemplate.name,
            inspectionTemplateDescriptionSnapshot: row.inspectionTemplate.description,
          };
        }),
      )
      .returning();
    const entriesByPosition = new Map(
      entries.map((entry, index) => [index + 1, entry] as const),
    );
    const itemInputs = savedAreaInspections.flatMap((areaInspection) => {
      const entry = entriesByPosition.get(areaInspection.position);
      const templateId = entry?.inspectionTemplate?.id;

      if (!templateId) {
        return [];
      }

      return (itemsByTemplateId.get(templateId) ?? []).map((row, index) => ({
        areaInspectionId: areaInspection.id,
        sourceTemplateItemId: row.item.id,
        sourceTemplateSectionId: row.section?.id ?? null,
        position: index + 1,
        sectionNameSnapshot: row.section?.name ?? null,
        itemNameSnapshot: row.item.name,
        itemDescriptionSnapshot: row.item.description,
      }));
    });
    const savedItems: InspectionItemRow[] = itemInputs.length
      ? await tx.insert(inspectionItems).values(itemInputs).returning()
      : [];

    return toDraftInspectionRecord(savedInspection, savedAreaInspections, savedItems);
  });
}

export async function getDraftInspection(
  id: string,
): Promise<DraftInspectionRecord | null> {
  if (!isSetupRecordId(id)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const rows: DraftHydrationRow[] = await db
    .select({
      inspection: inspections,
      areaInspection: inspectionAreaInspections,
      item: inspectionItems,
    })
    .from(inspections)
    .leftJoin(
      inspectionAreaInspections,
      eq(inspectionAreaInspections.inspectionId, inspections.id),
    )
    .leftJoin(
      inspectionItems,
      eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id),
    )
    .where(and(eq(inspections.id, id), eq(inspections.status, "draft")))
    .orderBy(asc(inspectionAreaInspections.position), asc(inspectionItems.position));

  return toDraftInspectionRecordFromHydration(rows);
}

export async function listActiveDraftInspections(): Promise<
  ActiveDraftInspectionSummaryRecord[]
> {
  const { db } = await import("@/db/client");
  const rows: DraftHydrationRow[] = await db
    .select({
      inspection: inspections,
      areaInspection: inspectionAreaInspections,
      item: inspectionItems,
    })
    .from(inspections)
    .leftJoin(
      inspectionAreaInspections,
      eq(inspectionAreaInspections.inspectionId, inspections.id),
    )
    .leftJoin(
      inspectionItems,
      eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id),
    )
    .where(eq(inspections.status, "draft"))
    .orderBy(asc(inspections.startedAt), asc(inspectionAreaInspections.position));
  const summariesByInspectionId = new Map<
    string,
    ActiveDraftInspectionSummaryRecord & {
      areaInspectionIds: Set<string>;
      itemIds: Set<string>;
    }
  >();

  rows.forEach((row) => {
    if (row.inspection.status !== "draft") {
      return;
    }

    const summary = summariesByInspectionId.get(row.inspection.id) ?? {
      id: row.inspection.id,
      buildingId: row.inspection.buildingId,
      clientId: row.inspection.clientId,
      buildingNameSnapshot: row.inspection.buildingNameSnapshot,
      clientNameSnapshot: row.inspection.clientNameSnapshot,
      startedByEmail: row.inspection.startedByEmail,
      startedAt: row.inspection.startedAt,
      areaInspectionCount: 0,
      itemCount: 0,
      areaInspectionIds: new Set<string>(),
      itemIds: new Set<string>(),
    };

    if (row.areaInspection) {
      summary.areaInspectionIds.add(row.areaInspection.id);
    }

    if (row.item) {
      summary.itemIds.add(row.item.id);
    }

    summary.areaInspectionCount = summary.areaInspectionIds.size;
    summary.itemCount = summary.itemIds.size;
    summariesByInspectionId.set(row.inspection.id, summary);
  });

  return Array.from(summariesByInspectionId.values()).map((summary) => ({
    id: summary.id,
    buildingId: summary.buildingId,
    clientId: summary.clientId,
    buildingNameSnapshot: summary.buildingNameSnapshot,
    clientNameSnapshot: summary.clientNameSnapshot,
    startedByEmail: summary.startedByEmail,
    startedAt: summary.startedAt,
    areaInspectionCount: summary.areaInspectionCount,
    itemCount: summary.itemCount,
  }));
}
