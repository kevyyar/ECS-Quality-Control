import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import type { db as appDb } from "@/db/client";
import {
  areas,
  areaTypes,
  buildingInspectionPlanEntries,
  buildingInspectionPlans,
  buildings,
  clients,
  inspectionAreaInspections,
  inspectionItemEvidence,
  inspectionItems,
  inspections,
  inspectionTemplateItems,
  inspectionTemplateSections,
  inspectionTemplates,
  tickets,
} from "@/db/schema";
import {
  isBuildingInspectionPlanEntryActive,
  isSetupRecordId,
} from "@/lib/client-building-setup/model";

import { validateDraftInspectionForSubmission } from "./model";
import type {
  ActiveDraftInspectionSummaryRecord,
  AddOneOffAreaInspectionInput,
  AddDraftInspectionItemBeforePhotoInput,
  DiscardDraftInspectionInput,
  DraftAreaInspectionRecord,
  DraftInspectionItemRecord,
  DraftInspectionRecord,
  DraftInspectionStarter,
  DraftSubmissionValidation,
  InspectionItemResultStatus,
  SaveDraftInspectionItemResultInput,
  SkipDraftAreaInspectionInput,
  StartDraftInspectionInput,
  SubmitDraftInspectionInput,
  RemoveDraftInspectionItemBeforePhotoInput,
  UnskipDraftAreaInspectionInput,
} from "./model";

type InspectionRow = typeof inspections.$inferSelect;
type AreaInspectionRow = typeof inspectionAreaInspections.$inferSelect;
type InspectionItemRow = typeof inspectionItems.$inferSelect;
type InspectionItemEvidenceRow = typeof inspectionItemEvidence.$inferSelect;

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

type OneOffAreaHydrationRow = {
  area: typeof areas.$inferSelect;
  areaType: typeof areaTypes.$inferSelect;
  building: Pick<typeof buildings.$inferSelect, "id" | "archivedAt">;
  client: Pick<typeof clients.$inferSelect, "id" | "archivedAt">;
};

type DraftHydrationRow = {
  inspection: InspectionRow;
  areaInspection: AreaInspectionRow | null;
  item: InspectionItemRow | null;
  evidence: InspectionItemEvidenceRow | null;
};

type DraftInspectionRecordWithRemovedEvidence = DraftInspectionRecord & {
  removedStoragePaths: string[];
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

export class DraftInspectionNotFoundError extends Error {
  constructor() {
    super("Draft Inspection was not found.");
    this.name = "DraftInspectionNotFoundError";
  }
}

export function isDraftInspectionNotFoundError(
  error: unknown,
): error is DraftInspectionNotFoundError {
  return error instanceof DraftInspectionNotFoundError;
}

export class DraftInspectionMutationNotAllowedError extends Error {
  constructor(message = "Draft Inspection cannot be changed this way.") {
    super(message);
    this.name = "DraftInspectionMutationNotAllowedError";
  }
}

export function isDraftInspectionMutationNotAllowedError(
  error: unknown,
): error is DraftInspectionMutationNotAllowedError {
  return error instanceof DraftInspectionMutationNotAllowedError;
}

export class DraftSubmissionValidationError extends Error {
  readonly validation: DraftSubmissionValidation;

  constructor(validation: DraftSubmissionValidation) {
    super("Draft Inspection is not ready to submit.");
    this.name = "DraftSubmissionValidationError";
    this.validation = validation;
  }
}

export function isDraftSubmissionValidationError(
  error: unknown,
): error is DraftSubmissionValidationError {
  return error instanceof DraftSubmissionValidationError;
}

export class DraftSubmissionConfirmationRequiredError extends Error {
  constructor() {
    super("Confirm skipped planned Area Inspections before submitting.");
    this.name = "DraftSubmissionConfirmationRequiredError";
  }
}

export function isDraftSubmissionConfirmationRequiredError(
  error: unknown,
): error is DraftSubmissionConfirmationRequiredError {
  return error instanceof DraftSubmissionConfirmationRequiredError;
}

export class ActiveOneOffAreaInspectionSetupRequiredError extends Error {
  readonly fields: Partial<Record<"areaId" | "inspectionTemplateId", string>>;

  constructor(fields: Partial<Record<"areaId" | "inspectionTemplateId", string>>) {
    super("One-off Area Inspection requires active setup records.");
    this.name = "ActiveOneOffAreaInspectionSetupRequiredError";
    this.fields = fields;
  }
}

export function isActiveOneOffAreaInspectionSetupRequiredError(
  error: unknown,
): error is ActiveOneOffAreaInspectionSetupRequiredError {
  return error instanceof ActiveOneOffAreaInspectionSetupRequiredError;
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

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function requireFreshDraftInspection(id: string): Promise<DraftInspectionRecord> {
  const draft = await getDraftInspection(id);

  if (!draft) {
    throw new DraftInspectionNotFoundError();
  }

  return draft;
}

function templateItemsByTemplateId(
  rows: TemplateItemHydrationRow[],
): Map<string, TemplateItemHydrationRow[]> {
  const itemsByTemplateId = new Map<string, TemplateItemHydrationRow[]>();

  rows.forEach((row) => {
    const rowsForTemplate = itemsByTemplateId.get(row.item.templateId) ?? [];
    rowsForTemplate.push(row);
    itemsByTemplateId.set(row.item.templateId, rowsForTemplate);
  });

  return itemsByTemplateId;
}

function oneOffSetupError(
  field: "areaId" | "inspectionTemplateId",
): ActiveOneOffAreaInspectionSetupRequiredError {
  if (field === "areaId") {
    return new ActiveOneOffAreaInspectionSetupRequiredError({
      areaId: "Select an active Area.",
    });
  }

  return new ActiveOneOffAreaInspectionSetupRequiredError({
    inspectionTemplateId: "Select an active Inspection Template.",
  });
}

const inspectionItemResultStatuses = new Set<InspectionItemResultStatus>([
  "pass",
  "fail",
  "not_applicable",
]);

function assertValidItemResultInput(input: SaveDraftInspectionItemResultInput): void {
  if (
    input.resultStatus !== null &&
    !inspectionItemResultStatuses.has(input.resultStatus)
  ) {
    throw new DraftInspectionMutationNotAllowedError("Select a valid item result.");
  }

  if (input.resultNote.length > 1000) {
    throw new DraftInspectionMutationNotAllowedError(
      "Item result notes must be 1,000 characters or fewer.",
    );
  }
}

function assertValidSkipReason(skipReason: string): void {
  const trimmed = skipReason.trim();

  if (trimmed.length === 0) {
    throw new DraftInspectionMutationNotAllowedError("Enter a skip reason.");
  }

  if (trimmed.length > 1000) {
    throw new DraftInspectionMutationNotAllowedError(
      "Skip reason must be 1,000 characters or fewer.",
    );
  }
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
    resultStatus: row.resultStatus as DraftInspectionItemRecord["resultStatus"],
    resultNote: row.resultNote,
    beforePhotos: [],
  };
}

function toInspectionItemRecordWithEvidence(
  row: InspectionItemRow,
  evidenceRows: InspectionItemEvidenceRow[],
): DraftInspectionItemRecord {
  return {
    ...toInspectionItemRecord(row),
    beforePhotos: evidenceRows
      .filter((evidence) => evidence.evidenceType === "before_photo")
      .map((evidence) => ({
        id: evidence.id,
        inspectionItemId: evidence.inspectionItemId,
        evidenceType: "before_photo",
        storagePath: evidence.storagePath,
        uploadedByAuthUserId: evidence.uploadedByAuthUserId,
        uploadedAt: evidence.uploadedAt,
      })),
  };
}

function toAreaInspectionRecord(
  row: AreaInspectionRow,
  items: InspectionItemRow[],
  evidenceRows: InspectionItemEvidenceRow[] = [],
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
    isSkipped: row.isSkipped,
    skipReason: row.skipReason,
    items: items.map((item) =>
      toInspectionItemRecordWithEvidence(
        item,
        evidenceRows.filter((evidence) => evidence.inspectionItemId === item.id),
      ),
    ),
  };
}

function toDraftInspectionRecord(
  inspection: InspectionRow,
  areaRows: AreaInspectionRow[],
  itemRows: InspectionItemRow[],
  evidenceRows: InspectionItemEvidenceRow[] = [],
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
        evidenceRows,
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
  const evidenceRowsById = new Map<string, InspectionItemEvidenceRow>();

  rows.forEach((row) => {
    if (row.areaInspection) {
      areaRowsById.set(row.areaInspection.id, row.areaInspection);
    }

    if (row.item) {
      itemRowsById.set(row.item.id, row.item);
    }

    if (row.evidence) {
      evidenceRowsById.set(row.evidence.id, row.evidence);
    }
  });

  return toDraftInspectionRecord(
    first.inspection,
    Array.from(areaRowsById.values()),
    Array.from(itemRowsById.values()),
    Array.from(evidenceRowsById.values()),
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
    const itemsByTemplateId = templateItemsByTemplateId(templateItemRows);

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
      evidence: inspectionItemEvidence,
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
    .leftJoin(
      inspectionItemEvidence,
      eq(inspectionItemEvidence.inspectionItemId, inspectionItems.id),
    )
    .where(and(eq(inspections.id, id), eq(inspections.status, "draft")))
    .orderBy(asc(inspectionAreaInspections.position), asc(inspectionItems.position));

  return toDraftInspectionRecordFromHydration(rows);
}

export async function saveDraftInspectionItemResult(
  input: SaveDraftInspectionItemResultInput,
): Promise<DraftInspectionRecordWithRemovedEvidence> {
  if (!isSetupRecordId(input.inspectionId) || !isSetupRecordId(input.itemId)) {
    throw new DraftInspectionNotFoundError();
  }

  assertValidItemResultInput(input);

  const { db } = await import("@/db/client");
  let removedStoragePaths: string[] = [];

  await db.transaction(async (tx) => {
    const [target] = await tx
      .select({
        inspection: inspections,
        areaInspection: inspectionAreaInspections,
        item: inspectionItems,
      })
      .from(inspectionItems)
      .innerJoin(
        inspectionAreaInspections,
        eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id),
      )
      .innerJoin(inspections, eq(inspectionAreaInspections.inspectionId, inspections.id))
      .where(
        and(
          eq(inspections.id, input.inspectionId),
          eq(inspectionItems.id, input.itemId),
          eq(inspections.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);

    if (!target) {
      throw new DraftInspectionNotFoundError();
    }

    if (target.areaInspection.isSkipped) {
      throw new DraftInspectionMutationNotAllowedError(
        "Skipped Area Inspection items cannot be edited.",
      );
    }

    await tx
      .update(inspectionItems)
      .set({
        resultStatus: input.resultStatus,
        resultNote: input.resultStatus === null ? null : nullableText(input.resultNote),
        updatedAt: sql`now()`,
      })
      .where(eq(inspectionItems.id, input.itemId));
    if (input.resultStatus !== "fail") {
      const evidenceRows = await tx
        .select({ storagePath: inspectionItemEvidence.storagePath })
        .from(inspectionItemEvidence)
        .where(eq(inspectionItemEvidence.inspectionItemId, input.itemId))
        .orderBy(asc(inspectionItemEvidence.id));
      removedStoragePaths = evidenceRows.map((row) => row.storagePath);

      await tx
        .delete(inspectionItemEvidence)
        .where(eq(inspectionItemEvidence.inspectionItemId, input.itemId));
    }
    await tx
      .update(inspections)
      .set({ updatedAt: sql`now()` })
      .where(eq(inspections.id, input.inspectionId));
  });

  return Object.assign(await requireFreshDraftInspection(input.inspectionId), {
    removedStoragePaths,
  });
}

export async function addDraftInspectionItemBeforePhoto(
  input: AddDraftInspectionItemBeforePhotoInput,
): Promise<DraftInspectionRecord> {
  if (!isSetupRecordId(input.inspectionId) || !isSetupRecordId(input.itemId)) {
    throw new DraftInspectionNotFoundError();
  }

  if (input.storagePath.trim().length === 0) {
    throw new DraftInspectionMutationNotAllowedError("Photo storage path is required.");
  }

  const { db } = await import("@/db/client");

  await db.transaction(async (tx) => {
    const [target] = await tx
      .select({
        inspection: inspections,
        areaInspection: inspectionAreaInspections,
        item: inspectionItems,
      })
      .from(inspectionItems)
      .innerJoin(
        inspectionAreaInspections,
        eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id),
      )
      .innerJoin(inspections, eq(inspectionAreaInspections.inspectionId, inspections.id))
      .where(
        and(
          eq(inspections.id, input.inspectionId),
          eq(inspectionItems.id, input.itemId),
          eq(inspections.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);

    if (!target) {
      throw new DraftInspectionNotFoundError();
    }

    if (target.areaInspection.isSkipped || target.item.resultStatus !== "fail") {
      throw new DraftInspectionMutationNotAllowedError(
        "Before Photos can only be attached to failed Draft Inspection items.",
      );
    }

    await tx.insert(inspectionItemEvidence).values({
      inspectionItemId: input.itemId,
      evidenceType: "before_photo",
      storagePath: input.storagePath.trim(),
      uploadedByAuthUserId: input.uploadedByAuthUserId,
    });
    await tx
      .update(inspections)
      .set({ updatedAt: sql`now()` })
      .where(eq(inspections.id, input.inspectionId));
  });

  return requireFreshDraftInspection(input.inspectionId);
}

export type RemoveDraftInspectionItemBeforePhotoResult = {
  draft: DraftInspectionRecord;
  storagePath: string;
};

export async function removeDraftInspectionItemBeforePhoto(
  input: RemoveDraftInspectionItemBeforePhotoInput,
): Promise<RemoveDraftInspectionItemBeforePhotoResult> {
  if (
    !isSetupRecordId(input.inspectionId) ||
    !isSetupRecordId(input.itemId) ||
    !isSetupRecordId(input.evidenceId)
  ) {
    throw new DraftInspectionNotFoundError();
  }

  const { db } = await import("@/db/client");

  const storagePath = await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ evidence: inspectionItemEvidence })
      .from(inspectionItemEvidence)
      .innerJoin(inspectionItems, eq(inspectionItemEvidence.inspectionItemId, inspectionItems.id))
      .innerJoin(
        inspectionAreaInspections,
        eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id),
      )
      .innerJoin(inspections, eq(inspectionAreaInspections.inspectionId, inspections.id))
      .where(
        and(
          eq(inspections.id, input.inspectionId),
          eq(inspectionItems.id, input.itemId),
          eq(inspectionItemEvidence.id, input.evidenceId),
          eq(inspections.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);

    if (!target) {
      throw new DraftInspectionNotFoundError();
    }

    await tx
      .delete(inspectionItemEvidence)
      .where(eq(inspectionItemEvidence.id, input.evidenceId));
    await tx
      .update(inspections)
      .set({ updatedAt: sql`now()` })
      .where(eq(inspections.id, input.inspectionId));

    return target.evidence.storagePath;
  });

  return { draft: await requireFreshDraftInspection(input.inspectionId), storagePath };
}

export async function skipDraftAreaInspection(
  input: SkipDraftAreaInspectionInput,
): Promise<DraftInspectionRecordWithRemovedEvidence> {
  if (!isSetupRecordId(input.inspectionId) || !isSetupRecordId(input.areaInspectionId)) {
    throw new DraftInspectionNotFoundError();
  }

  assertValidSkipReason(input.skipReason);

  const { db } = await import("@/db/client");
  let removedStoragePaths: string[] = [];

  await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ areaInspection: inspectionAreaInspections })
      .from(inspectionAreaInspections)
      .innerJoin(inspections, eq(inspectionAreaInspections.inspectionId, inspections.id))
      .where(
        and(
          eq(inspections.id, input.inspectionId),
          eq(inspectionAreaInspections.id, input.areaInspectionId),
          eq(inspections.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);

    if (!target) {
      throw new DraftInspectionNotFoundError();
    }

    if (target.areaInspection.source !== "planned") {
      throw new DraftInspectionMutationNotAllowedError(
        "Only planned Area Inspections can be skipped.",
      );
    }

    const evidenceRows = await tx
      .select({ storagePath: inspectionItemEvidence.storagePath })
      .from(inspectionItemEvidence)
      .innerJoin(inspectionItems, eq(inspectionItemEvidence.inspectionItemId, inspectionItems.id))
      .where(eq(inspectionItems.areaInspectionId, input.areaInspectionId))
      .orderBy(asc(inspectionItemEvidence.id));
    removedStoragePaths = evidenceRows.map((row) => row.storagePath);

    await tx
      .update(inspectionAreaInspections)
      .set({
        isSkipped: true,
        skipReason: input.skipReason.trim(),
        updatedAt: sql`now()`,
      })
      .where(eq(inspectionAreaInspections.id, input.areaInspectionId));
    await tx.delete(inspectionItemEvidence).where(sql`
      ${inspectionItemEvidence.inspectionItemId} in (
        select ${inspectionItems.id}
        from ${inspectionItems}
        where ${inspectionItems.areaInspectionId} = ${input.areaInspectionId}
      )
    `);
    await tx
      .update(inspectionItems)
      .set({ resultStatus: null, resultNote: null, updatedAt: sql`now()` })
      .where(eq(inspectionItems.areaInspectionId, input.areaInspectionId));
    await tx
      .update(inspections)
      .set({ updatedAt: sql`now()` })
      .where(eq(inspections.id, input.inspectionId));
  });

  return Object.assign(await requireFreshDraftInspection(input.inspectionId), {
    removedStoragePaths,
  });
}

export async function unskipDraftAreaInspection(
  input: UnskipDraftAreaInspectionInput,
): Promise<DraftInspectionRecord> {
  if (!isSetupRecordId(input.inspectionId) || !isSetupRecordId(input.areaInspectionId)) {
    throw new DraftInspectionNotFoundError();
  }

  const { db } = await import("@/db/client");

  await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ areaInspection: inspectionAreaInspections })
      .from(inspectionAreaInspections)
      .innerJoin(inspections, eq(inspectionAreaInspections.inspectionId, inspections.id))
      .where(
        and(
          eq(inspections.id, input.inspectionId),
          eq(inspectionAreaInspections.id, input.areaInspectionId),
          eq(inspections.status, "draft"),
        ),
      )
      .for("update")
      .limit(1);

    if (!target) {
      throw new DraftInspectionNotFoundError();
    }

    if (target.areaInspection.source !== "planned") {
      throw new DraftInspectionMutationNotAllowedError(
        "Only planned Area Inspections can be unskipped.",
      );
    }

    await tx
      .update(inspectionAreaInspections)
      .set({ isSkipped: false, skipReason: null, updatedAt: sql`now()` })
      .where(eq(inspectionAreaInspections.id, input.areaInspectionId));
    await tx
      .update(inspections)
      .set({ updatedAt: sql`now()` })
      .where(eq(inspections.id, input.inspectionId));
  });

  return requireFreshDraftInspection(input.inspectionId);
}

export async function addOneOffAreaInspection(
  input: AddOneOffAreaInspectionInput,
): Promise<DraftInspectionRecord> {
  if (!isSetupRecordId(input.inspectionId)) {
    throw new DraftInspectionNotFoundError();
  }

  if (!isSetupRecordId(input.areaId)) {
    throw oneOffSetupError("areaId");
  }

  if (!isSetupRecordId(input.inspectionTemplateId)) {
    throw oneOffSetupError("inspectionTemplateId");
  }

  const { db } = await import("@/db/client");

  await db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(inspections)
      .where(and(eq(inspections.id, input.inspectionId), eq(inspections.status, "draft")))
      .for("update")
      .limit(1);

    if (!draft) {
      throw new DraftInspectionNotFoundError();
    }

    const [areaRow]: OneOffAreaHydrationRow[] = await tx
      .select({
        area: areas,
        areaType: areaTypes,
        building: { id: buildings.id, archivedAt: buildings.archivedAt },
        client: { id: clients.id, archivedAt: clients.archivedAt },
      })
      .from(areas)
      .innerJoin(areaTypes, eq(areas.areaTypeId, areaTypes.id))
      .innerJoin(buildings, eq(areas.buildingId, buildings.id))
      .innerJoin(clients, eq(buildings.clientId, clients.id))
      .where(eq(areas.id, input.areaId))
      .limit(1);

    if (
      !areaRow ||
      areaRow.area.buildingId !== draft.buildingId ||
      areaRow.area.archivedAt !== null ||
      areaRow.areaType.archivedAt !== null ||
      areaRow.building.archivedAt !== null ||
      areaRow.client.archivedAt !== null
    ) {
      throw oneOffSetupError("areaId");
    }

    const [template] = await tx
      .select()
      .from(inspectionTemplates)
      .where(eq(inspectionTemplates.id, input.inspectionTemplateId))
      .limit(1);

    if (!template || template.archivedAt !== null) {
      throw oneOffSetupError("inspectionTemplateId");
    }

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
      .where(eq(inspectionTemplateItems.templateId, input.inspectionTemplateId))
      .orderBy(asc(inspectionTemplateItems.position));

    if (templateItemRows.length === 0) {
      throw oneOffSetupError("inspectionTemplateId");
    }

    const [lastAreaInspection] = await tx
      .select({ position: inspectionAreaInspections.position })
      .from(inspectionAreaInspections)
      .where(eq(inspectionAreaInspections.inspectionId, input.inspectionId))
      .orderBy(desc(inspectionAreaInspections.position));
    const nextPosition = (lastAreaInspection?.position ?? 0) + 1;
    const [savedAreaInspection] = await tx
      .insert(inspectionAreaInspections)
      .values({
        inspectionId: input.inspectionId,
        source: "one_off",
        position: nextPosition,
        areaId: areaRow.area.id,
        areaTypeId: areaRow.areaType.id,
        inspectionTemplateId: template.id,
        areaNameSnapshot: areaRow.area.name,
        areaTypeNameSnapshot: areaRow.areaType.name,
        inspectionTemplateNameSnapshot: template.name,
        inspectionTemplateDescriptionSnapshot: template.description,
      })
      .returning();

    if (!savedAreaInspection) {
      throw new Error("One-off Area Inspection could not be added.");
    }

    await tx.insert(inspectionItems).values(
      templateItemRows.map((row, index) => ({
        areaInspectionId: savedAreaInspection.id,
        sourceTemplateItemId: row.item.id,
        sourceTemplateSectionId: row.section?.id ?? null,
        position: index + 1,
        sectionNameSnapshot: row.section?.name ?? null,
        itemNameSnapshot: row.item.name,
        itemDescriptionSnapshot: row.item.description,
      })),
    );
    await tx
      .update(inspections)
      .set({ updatedAt: sql`now()` })
      .where(eq(inspections.id, input.inspectionId));
  });

  return requireFreshDraftInspection(input.inspectionId);
}

export type SubmittedDraftInspectionResult = {
  id: string;
  status: "submitted";
  ticketCount: number;
  alreadySubmitted: boolean;
};

async function countSubmittedInspectionTickets(
  tx: Pick<typeof appDb, "select">,
  inspectionId: string,
): Promise<number> {
  const ticketRows = await tx
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.inspectionId, inspectionId))
    .orderBy(asc(tickets.ticketNumber));

  return ticketRows.length;
}

export async function submitDraftInspection(
  input: SubmitDraftInspectionInput,
  submitter: DraftInspectionStarter,
): Promise<SubmittedDraftInspectionResult> {
  if (!isSetupRecordId(input.inspectionId)) {
    throw new DraftInspectionNotFoundError();
  }

  const { db } = await import("@/db/client");

  return db.transaction(async (tx) => {
    const [inspection] = await tx
      .select()
      .from(inspections)
      .where(eq(inspections.id, input.inspectionId))
      .for("update")
      .limit(1);

    if (!inspection) {
      throw new DraftInspectionNotFoundError();
    }

    if (inspection.status === "submitted") {
      return {
        id: input.inspectionId,
        status: "submitted",
        ticketCount: await countSubmittedInspectionTickets(tx, input.inspectionId),
        alreadySubmitted: true,
      };
    }

    if (inspection.status !== "draft") {
      throw new DraftInspectionNotFoundError();
    }

    const rows: DraftHydrationRow[] = await tx
      .select({
        inspection: inspections,
        areaInspection: inspectionAreaInspections,
        item: inspectionItems,
        evidence: inspectionItemEvidence,
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
      .leftJoin(
        inspectionItemEvidence,
        eq(inspectionItemEvidence.inspectionItemId, inspectionItems.id),
      )
      .where(and(eq(inspections.id, input.inspectionId), eq(inspections.status, "draft")))
      .orderBy(asc(inspectionAreaInspections.position), asc(inspectionItems.position));
    const draft = toDraftInspectionRecordFromHydration(rows);

    if (!draft) {
      throw new DraftInspectionNotFoundError();
    }

    const validation = validateDraftInspectionForSubmission(draft);

    if (!validation.ok) {
      throw new DraftSubmissionValidationError(validation);
    }

    const hasSkippedPlannedAreaInspections = draft.areaInspections.some(
      (areaInspection) =>
        areaInspection.source === "planned" && areaInspection.isSkipped,
    );

    if (
      hasSkippedPlannedAreaInspections &&
      !input.confirmSkippedPlannedAreas
    ) {
      throw new DraftSubmissionConfirmationRequiredError();
    }

    await tx
      .update(inspections)
      .set({
        status: "submitted",
        submittedByAuthUserId: submitter.authUserId,
        submittedByEmail: submitter.email,
        submittedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(inspections.id, input.inspectionId));

    const ticketInputs = draft.areaInspections.flatMap((areaInspection) => {
      if (areaInspection.isSkipped) {
        return [];
      }

      return areaInspection.items
        .filter((item) => item.resultStatus === "fail")
        .map((item) => ({
          status: "open",
          title: `${areaInspection.areaNameSnapshot} — ${item.itemNameSnapshot}`,
          inspectionId: draft.id,
          areaInspectionId: areaInspection.id,
          inspectionItemId: item.id,
          clientId: draft.clientId,
          buildingId: draft.buildingId,
          areaId: areaInspection.areaId,
          createdByAuthUserId: submitter.authUserId,
          createdByEmail: submitter.email,
        }));
    });

    if (ticketInputs.length > 0) {
      await tx.insert(tickets).values(ticketInputs);
    }

    return {
      id: input.inspectionId,
      status: "submitted",
      ticketCount: await countSubmittedInspectionTickets(tx, input.inspectionId),
      alreadySubmitted: false,
    };
  });
}

export async function discardDraftInspection(
  input: DiscardDraftInspectionInput,
): Promise<{ discardedInspectionId: string; removedStoragePaths: string[] }> {
  if (!isSetupRecordId(input.inspectionId)) {
    throw new DraftInspectionNotFoundError();
  }

  const { db } = await import("@/db/client");

  return db.transaction(async (tx) => {
    const [inspection] = await tx
      .select({ id: inspections.id })
      .from(inspections)
      .where(and(eq(inspections.id, input.inspectionId), eq(inspections.status, "draft")))
      .for("update")
      .limit(1);

    if (!inspection) {
      throw new DraftInspectionNotFoundError();
    }

    const evidenceRows = await tx
      .select({ storagePath: inspectionItemEvidence.storagePath })
      .from(inspectionItemEvidence)
      .innerJoin(inspectionItems, eq(inspectionItemEvidence.inspectionItemId, inspectionItems.id))
      .innerJoin(
        inspectionAreaInspections,
        eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id),
      )
      .where(eq(inspectionAreaInspections.inspectionId, input.inspectionId))
      .orderBy(asc(inspectionItemEvidence.id));
    const removedStoragePaths = evidenceRows.map((row) => row.storagePath);

    await tx.delete(inspections).where(eq(inspections.id, input.inspectionId));

    return { discardedInspectionId: input.inspectionId, removedStoragePaths };
  });
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
      evidence: inspectionItemEvidence,
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
    .leftJoin(
      inspectionItemEvidence,
      eq(inspectionItemEvidence.inspectionItemId, inspectionItems.id),
    )
    .where(eq(inspections.status, "draft"))
    .orderBy(asc(inspections.startedAt), asc(inspectionAreaInspections.position));
  const summariesByInspectionId = new Map<
    string,
    ActiveDraftInspectionSummaryRecord & {
      areaInspectionIds: Set<string>;
      itemIds: Set<string>;
      answeredItemIds: Set<string>;
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
      answeredItemCount: 0,
      areaInspectionIds: new Set<string>(),
      itemIds: new Set<string>(),
      answeredItemIds: new Set<string>(),
    };

    if (row.areaInspection) {
      summary.areaInspectionIds.add(row.areaInspection.id);
    }

    if (row.item) {
      summary.itemIds.add(row.item.id);
      if (row.item.resultStatus !== null) {
        summary.answeredItemIds.add(row.item.id);
      }
    }

    summary.areaInspectionCount = summary.areaInspectionIds.size;
    summary.itemCount = summary.itemIds.size;
    summary.answeredItemCount = summary.answeredItemIds.size;
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
    answeredItemCount: summary.answeredItemCount,
  }));
}
