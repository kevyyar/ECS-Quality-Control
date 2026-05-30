import "server-only";

import { and, desc, eq, gte, lt, or, type SQL } from "drizzle-orm";

import {
  inspectionAreaInspections,
  inspectionItems,
  inspections,
} from "@/db/schema";
import { isSetupRecordId } from "@/lib/client-building-setup/model";
import { resolveDateRange } from "@/lib/date-ranges";
import type { InspectionStatus } from "@/lib/inspections/drafts/model";

export type InspectionListStatus = InspectionStatus;
export type InspectionWeekFilter = "all" | "this-week" | "last-week" | "this-month";

export type InspectionListFilters = {
  clientId?: string | undefined;
  buildingId?: string | undefined;
  status?: "all" | InspectionListStatus | undefined;
  inspectionWeek?: InspectionWeekFilter | undefined;
  now?: Date | undefined;
};

export type InspectionListRecord = {
  id: string;
  status: InspectionListStatus;
  clientId: string;
  buildingId: string;
  clientName: string;
  buildingName: string;
  startedAt: Date;
  startedByEmail: string;
  submittedAt: Date | null;
  submittedByEmail: string | null;
  areaInspectionCount: number;
  itemCount: number;
};

type InspectionRow = typeof inspections.$inferSelect;
type InspectionListHydrationRow = {
  inspection: InspectionRow;
  areaInspection: { id: string } | null;
  item: { id: string } | null;
};

function combineConditions(conditions: SQL[]): SQL | undefined {
  const [first, ...rest] = conditions;

  if (!first) {
    return undefined;
  }

  return rest.length === 0 ? first : (and(first, ...rest) ?? first);
}

function inspectionWeekCondition(filters: InspectionListFilters): SQL | undefined {
  const week = filters.inspectionWeek;

  if (!week || week === "all") {
    return undefined;
  }

  const range = resolveDateRange({ preset: week, now: filters.now });

  if (filters.status === "draft") {
    return and(gte(inspections.startedAt, range.startAt), lt(inspections.startedAt, range.endBefore));
  }

  if (filters.status === "submitted") {
    return and(
      gte(inspections.submittedAt, range.startAt),
      lt(inspections.submittedAt, range.endBefore),
    );
  }

  return or(
    and(
      eq(inspections.status, "draft"),
      gte(inspections.startedAt, range.startAt),
      lt(inspections.startedAt, range.endBefore),
    ),
    and(
      eq(inspections.status, "submitted"),
      gte(inspections.submittedAt, range.startAt),
      lt(inspections.submittedAt, range.endBefore),
    ),
  );
}

function inspectionListCondition(filters: InspectionListFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.clientId && isSetupRecordId(filters.clientId)) {
    conditions.push(eq(inspections.clientId, filters.clientId));
  }

  if (filters.buildingId && isSetupRecordId(filters.buildingId)) {
    conditions.push(eq(inspections.buildingId, filters.buildingId));
  }

  if (filters.status === "draft" || filters.status === "submitted") {
    conditions.push(eq(inspections.status, filters.status));
  }

  const weekCondition = inspectionWeekCondition(filters);
  if (weekCondition) {
    conditions.push(weekCondition);
  }

  return combineConditions(conditions);
}

function addInspectionListRow(
  summaries: Map<
    string,
    InspectionListRecord & { areaInspectionIds: Set<string>; itemIds: Set<string> }
  >,
  row: InspectionListHydrationRow,
): void {
  if (row.inspection.status !== "draft" && row.inspection.status !== "submitted") {
    return;
  }

  const summary = summaries.get(row.inspection.id) ?? {
    id: row.inspection.id,
    status: row.inspection.status,
    clientId: row.inspection.clientId,
    buildingId: row.inspection.buildingId,
    clientName: row.inspection.clientNameSnapshot,
    buildingName: row.inspection.buildingNameSnapshot,
    startedAt: row.inspection.startedAt,
    startedByEmail: row.inspection.startedByEmail,
    submittedAt: row.inspection.submittedAt,
    submittedByEmail: row.inspection.submittedByEmail,
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
  summaries.set(row.inspection.id, summary);
}

export async function listInspections(
  filters: InspectionListFilters = {},
): Promise<InspectionListRecord[]> {
  const { db } = await import("@/db/client");
  const condition = inspectionListCondition(filters);
  const query = db
    .select({
      inspection: inspections,
      areaInspection: { id: inspectionAreaInspections.id },
      item: { id: inspectionItems.id },
    })
    .from(inspections)
    .leftJoin(
      inspectionAreaInspections,
      eq(inspectionAreaInspections.inspectionId, inspections.id),
    )
    .leftJoin(inspectionItems, eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id));
  const rows: InspectionListHydrationRow[] = condition
    ? await query.where(condition).orderBy(desc(inspections.startedAt))
    : await query.orderBy(desc(inspections.startedAt));
  const summaries = new Map<
    string,
    InspectionListRecord & { areaInspectionIds: Set<string>; itemIds: Set<string> }
  >();

  rows.forEach((row) => addInspectionListRow(summaries, row));

  return [...summaries.values()].map((summary) => ({
    id: summary.id,
    status: summary.status,
    clientId: summary.clientId,
    buildingId: summary.buildingId,
    clientName: summary.clientName,
    buildingName: summary.buildingName,
    startedAt: summary.startedAt,
    startedByEmail: summary.startedByEmail,
    submittedAt: summary.submittedAt,
    submittedByEmail: summary.submittedByEmail,
    areaInspectionCount: summary.areaInspectionCount,
    itemCount: summary.itemCount,
  }));
}
