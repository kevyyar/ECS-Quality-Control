import "server-only";

import { and, asc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";

import {
  areas,
  areaTypes,
  buildingInspectionPlanEntries,
  buildingInspectionPlans,
  buildings,
  clients,
  inspectionTemplates,
} from "@/db/schema";

import {
  isBuildingInspectionPlanEntryActive,
  isBuildingInspectionPlanEntryAreaActive,
  isBuildingInspectionPlanInspectionTemplateActive,
  isSetupRecordId,
  summarizeBuildingInspectionPlanEntryCounts,
} from "../model";
import type {
  BuildingInspectionPlanEntryFieldErrors,
  BuildingInspectionPlanInput,
  BuildingInspectionPlanRecord,
  BuildingInspectionPlanSummaryRecord,
  BuildingSetupRecord,
  SetupVisibility,
} from "../model";

type BuildingRow = typeof buildings.$inferSelect;
type BuildingInspectionPlanRow = typeof buildingInspectionPlans.$inferSelect;
type BuildingInspectionPlanEntryRow = typeof buildingInspectionPlanEntries.$inferSelect;
type AreaRow = typeof areas.$inferSelect;
type InspectionTemplateRow = typeof inspectionTemplates.$inferSelect;
type BuildingWithClientRow = {
  building: BuildingRow;
  client: {
    name: string;
    archivedAt: Date | null;
  };
};
type BuildingInspectionPlanHydrationRow = {
  plan: BuildingInspectionPlanRow;
  building: BuildingRow;
  client: {
    id: string;
    name: string;
    archivedAt: Date | null;
  };
  entry: BuildingInspectionPlanEntryRow | null;
  area: AreaRow | null;
  areaType: {
    archivedAt: Date | null;
  } | null;
  inspectionTemplate: InspectionTemplateRow | null;
};

type BuildingInspectionPlanSummaryRow = {
  plan: BuildingInspectionPlanRow;
  building: {
    archivedAt: Date | null;
  };
  client: {
    archivedAt: Date | null;
  };
  entry: BuildingInspectionPlanEntryRow | null;
  area: {
    archivedAt: Date | null;
  } | null;
  areaType: {
    archivedAt: Date | null;
  } | null;
  inspectionTemplate: {
    archivedAt: Date | null;
  } | null;
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
  search?: string | undefined;
};

type ListBuildingOptions = ListOptions & {
  clientId?: string | undefined;
  buildingId?: string | undefined;
};

function combineConditions(conditions: SQL[]): SQL | undefined {
  const [first, ...rest] = conditions;

  if (!first) {
    return undefined;
  }

  return rest.length === 0 ? first : (and(first, ...rest) ?? first);
}

function searchTerm(value: string | undefined): string | null {
  const term = value?.trim();

  return term ? `%${term.replace(/[\\%_]/g, "\\$&")}%` : null;
}

function nameContains(column: SQL, pattern: string): SQL {
  return sql`${column} ilike ${pattern} escape '\\'`;
}

function buildingConditions(options: ListBuildingOptions): SQL | undefined {
  const visibility = options.visibility ?? "active";
  const conditions: SQL[] = [];

  if (visibility === "active") {
    conditions.push(isNull(buildings.archivedAt), isNull(clients.archivedAt));
  }

  if (options.clientId && isSetupRecordId(options.clientId)) {
    conditions.push(eq(buildings.clientId, options.clientId));
  }

  if (options.buildingId && isSetupRecordId(options.buildingId)) {
    conditions.push(eq(buildings.id, options.buildingId));
  }

  const search = searchTerm(options.search);
  if (search) {
    conditions.push(nameContains(sql`${buildings.name}`, search));
  }

  return combineConditions(conditions);
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

async function listBuildingsForInspectionPlanSummaries(
  options: ListBuildingOptions,
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

export class ActiveBuildingInspectionPlanBuildingRequiredError extends Error {
  constructor() {
    super("Building Inspection Plan must belong to an active Building.");
    this.name = "ActiveBuildingInspectionPlanBuildingRequiredError";
  }
}

export function isActiveBuildingInspectionPlanBuildingRequiredError(
  error: unknown,
): error is ActiveBuildingInspectionPlanBuildingRequiredError {
  return error instanceof ActiveBuildingInspectionPlanBuildingRequiredError;
}

export class ActiveBuildingInspectionPlanEntriesRequiredError extends Error {
  readonly entryErrors: BuildingInspectionPlanEntryFieldErrors[];

  constructor(entryErrors: BuildingInspectionPlanEntryFieldErrors[]) {
    super("Building Inspection Plan entries must use active setup records.");
    this.name = "ActiveBuildingInspectionPlanEntriesRequiredError";
    this.entryErrors = entryErrors;
  }
}

export function isActiveBuildingInspectionPlanEntriesRequiredError(
  error: unknown,
): error is ActiveBuildingInspectionPlanEntriesRequiredError {
  return error instanceof ActiveBuildingInspectionPlanEntriesRequiredError;
}

function toBuildingInspectionPlanRecord(
  rows: BuildingInspectionPlanHydrationRow[],
): BuildingInspectionPlanRecord | null {
  const first = rows[0];

  if (!first) {
    return null;
  }

  const isBuildingActive =
    first.building.archivedAt === null && first.client.archivedAt === null;

  return {
    id: first.plan.id,
    buildingId: first.plan.buildingId,
    buildingName: first.building.name,
    clientId: first.client.id,
    clientName: first.client.name,
    buildingArchivedAt: first.building.archivedAt,
    clientArchivedAt: first.client.archivedAt,
    createdAt: first.plan.createdAt,
    updatedAt: first.plan.updatedAt,
    isBuildingActive,
    entries: rows.flatMap((row) => {
      if (!row.entry || !row.area || !row.areaType || !row.inspectionTemplate) {
        return [];
      }

      const isAreaActive = isBuildingInspectionPlanEntryAreaActive({
        areaArchivedAt: row.area.archivedAt,
        areaTypeArchivedAt: row.areaType.archivedAt,
        buildingArchivedAt: row.building.archivedAt,
        clientArchivedAt: row.client.archivedAt,
      });
      const isInspectionTemplateActive = isBuildingInspectionPlanInspectionTemplateActive(
        row.inspectionTemplate.archivedAt,
      );

      return {
        id: row.entry.id,
        planId: row.entry.planId,
        areaId: row.entry.areaId,
        areaName: row.area.name,
        areaArchivedAt: row.area.archivedAt,
        areaTypeArchivedAt: row.areaType.archivedAt,
        inspectionTemplateId: row.entry.inspectionTemplateId,
        inspectionTemplateName: row.inspectionTemplate.name,
        inspectionTemplateArchivedAt: row.inspectionTemplate.archivedAt,
        position: row.entry.position,
        createdAt: row.entry.createdAt,
        updatedAt: row.entry.updatedAt,
        isAreaActive,
        isInspectionTemplateActive,
        isActive: isBuildingInspectionPlanEntryActive({
          areaArchivedAt: row.area.archivedAt,
          areaTypeArchivedAt: row.areaType.archivedAt,
          buildingArchivedAt: row.building.archivedAt,
          clientArchivedAt: row.client.archivedAt,
          inspectionTemplateArchivedAt: row.inspectionTemplate.archivedAt,
        }),
      };
    }),
  };
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function entryValidationErrors(
  input: BuildingInspectionPlanInput,
  areaRows: AreaWithParentsRow[],
  templateRows: InspectionTemplateRow[],
): BuildingInspectionPlanEntryFieldErrors[] {
  const areasById = new Map(areaRows.map((row) => [row.area.id, row]));
  const templatesById = new Map(templateRows.map((row) => [row.id, row]));
  const seenAreaIds = new Set<string>();

  return input.entries.map((entry) => {
    const errors: BuildingInspectionPlanEntryFieldErrors = {};
    const area = areasById.get(entry.areaId);
    const template = templatesById.get(entry.inspectionTemplateId);

    if (
      !area ||
      area.area.buildingId !== input.buildingId ||
      area.area.archivedAt !== null ||
      area.building.archivedAt !== null ||
      area.client.archivedAt !== null ||
      area.areaType.archivedAt !== null
    ) {
      errors.areaId = "Select an active Area.";
    } else if (seenAreaIds.has(entry.areaId)) {
      errors.areaId = "Each Area can appear only once in a Building Inspection Plan.";
    } else {
      seenAreaIds.add(entry.areaId);
    }

    if (!template || template.archivedAt !== null) {
      errors.inspectionTemplateId = "Select an active Inspection Template.";
    }

    return errors;
  });
}

function throwIfInvalidPlanEntries(
  input: BuildingInspectionPlanInput,
  areaRows: AreaWithParentsRow[],
  templateRows: InspectionTemplateRow[],
): void {
  const entryErrors = entryValidationErrors(input, areaRows, templateRows);

  if (entryErrors.some((entryError) => Object.keys(entryError).length > 0)) {
    throw new ActiveBuildingInspectionPlanEntriesRequiredError(entryErrors);
  }
}

export async function getBuildingInspectionPlan(
  buildingId: string,
): Promise<BuildingInspectionPlanRecord | null> {
  if (!isSetupRecordId(buildingId)) {
    return null;
  }

  const { db } = await import("@/db/client");
  const rows = await db
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
      areaType: {
        archivedAt: areaTypes.archivedAt,
      },
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
    .where(eq(buildingInspectionPlans.buildingId, buildingId))
    .orderBy(asc(buildingInspectionPlanEntries.position));

  return toBuildingInspectionPlanRecord(rows);
}

export async function listBuildingInspectionPlanSummaries(
  options: ListBuildingOptions = {},
): Promise<BuildingInspectionPlanSummaryRecord[]> {
  const buildingRecords = await listBuildingsForInspectionPlanSummaries(options);

  if (buildingRecords.length === 0) {
    return [];
  }

  const { db } = await import("@/db/client");
  const rows: BuildingInspectionPlanSummaryRow[] = await db
    .select({
      plan: buildingInspectionPlans,
      building: {
        archivedAt: buildings.archivedAt,
      },
      client: {
        archivedAt: clients.archivedAt,
      },
      entry: buildingInspectionPlanEntries,
      area: {
        archivedAt: areas.archivedAt,
      },
      areaType: {
        archivedAt: areaTypes.archivedAt,
      },
      inspectionTemplate: {
        archivedAt: inspectionTemplates.archivedAt,
      },
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
    .where(
      inArray(
        buildingInspectionPlans.buildingId,
        buildingRecords.map((building) => building.id),
      ),
    )
    .orderBy(
      asc(buildingInspectionPlans.buildingId),
      asc(buildingInspectionPlanEntries.position),
    );
  const summariesByBuildingId = new Map<
    string,
    {
      planId: string;
      entries: { isActive: boolean }[];
      updatedAt: Date;
    }
  >();

  rows.forEach((row) => {
    const current = summariesByBuildingId.get(row.plan.buildingId);
    const entries = [...(current?.entries ?? [])];

    if (row.entry) {
      entries.push({
        isActive: Boolean(
          row.area &&
            row.areaType &&
            row.inspectionTemplate &&
            isBuildingInspectionPlanEntryActive({
              areaArchivedAt: row.area.archivedAt,
              areaTypeArchivedAt: row.areaType.archivedAt,
              buildingArchivedAt: row.building.archivedAt,
              clientArchivedAt: row.client.archivedAt,
              inspectionTemplateArchivedAt: row.inspectionTemplate.archivedAt,
            }),
        ),
      });
    }

    summariesByBuildingId.set(row.plan.buildingId, {
      planId: row.plan.id,
      entries,
      updatedAt: row.plan.updatedAt,
    });
  });

  return buildingRecords.map((building) => {
    const planSummary = summariesByBuildingId.get(building.id);
    const entrySummary = summarizeBuildingInspectionPlanEntryCounts(
      planSummary?.entries ?? [],
    );

    return {
      buildingId: building.id,
      buildingName: building.name,
      clientId: building.clientId,
      clientName: building.clientName,
      buildingArchivedAt: building.archivedAt,
      clientArchivedAt: building.clientArchivedAt,
      planId: planSummary?.planId ?? null,
      entryCount: entrySummary.entryCount,
      activeEntryCount: entrySummary.activeEntryCount,
      staleEntryCount: entrySummary.staleEntryCount,
      updatedAt: planSummary?.updatedAt ?? null,
      isConfigured: entrySummary.isConfigured,
      isBuildingActive: building.isActive,
    };
  });
}

export async function saveBuildingInspectionPlan(
  input: BuildingInspectionPlanInput,
): Promise<BuildingInspectionPlanRecord> {
  if (input.entries.length === 0) {
    throw new ActiveBuildingInspectionPlanEntriesRequiredError([]);
  }

  const { db } = await import("@/db/client");
  await db.transaction(async (tx) => {
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
      throw new ActiveBuildingInspectionPlanBuildingRequiredError();
    }

    const areaRows = await tx
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
      .innerJoin(areaTypes, eq(areas.areaTypeId, areaTypes.id))
      .where(inArray(areas.id, uniqueIds(input.entries.map((entry) => entry.areaId))))
      .for("update");
    const templateRows = await tx
      .select()
      .from(inspectionTemplates)
      .where(
        inArray(
          inspectionTemplates.id,
          uniqueIds(input.entries.map((entry) => entry.inspectionTemplateId)),
        ),
      )
      .for("update");

    throwIfInvalidPlanEntries(input, areaRows, templateRows);

    const [existingPlan] = await tx
      .select()
      .from(buildingInspectionPlans)
      .where(eq(buildingInspectionPlans.buildingId, input.buildingId))
      .for("update")
      .limit(1);
    const [savedPlan] = existingPlan
      ? await tx
          .update(buildingInspectionPlans)
          .set({ updatedAt: sql`now()` })
          .where(eq(buildingInspectionPlans.id, existingPlan.id))
          .returning()
      : await tx
          .insert(buildingInspectionPlans)
          .values({ buildingId: input.buildingId })
          .returning();

    if (!savedPlan) {
      throw new Error("Building Inspection Plan could not be saved.");
    }

    if (existingPlan) {
      await tx
        .delete(buildingInspectionPlanEntries)
        .where(eq(buildingInspectionPlanEntries.planId, savedPlan.id));
    }

    await tx.insert(buildingInspectionPlanEntries).values(
      input.entries.map((entry, index) => ({
        planId: savedPlan.id,
        areaId: entry.areaId,
        inspectionTemplateId: entry.inspectionTemplateId,
        position: index + 1,
      })),
    );
  });

  const plan = await getBuildingInspectionPlan(input.buildingId);

  if (!plan) {
    throw new Error("Building Inspection Plan could not be loaded.");
  }

  return plan;
}
