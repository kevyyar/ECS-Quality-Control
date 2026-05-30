import "server-only";

import { and, eq, gte, lt } from "drizzle-orm";

import {
  buildings,
  inspectionAreaInspections,
  inspectionItems,
  inspections,
  tickets,
} from "@/db/schema";

import { summarizeDashboardMetrics } from "./model";
import type {
  DashboardInspectionResultMetricRow,
  DashboardMetrics,
  DashboardTicketMetricRow,
} from "./model";

export type DashboardMetricsRange = {
  startAt: Date;
  endBefore: Date;
};

export async function getDashboardMetrics(
  range: DashboardMetricsRange,
): Promise<DashboardMetrics> {
  const { db } = await import("@/db/client");
  const submittedInspectionRange = and(
    eq(inspections.status, "submitted"),
    gte(inspections.submittedAt, range.startAt),
    lt(inspections.submittedAt, range.endBefore),
  );

  const ticketRows = await db
    .select({
      ticketId: tickets.id,
      status: tickets.status,
      buildingId: tickets.buildingId,
      buildingName: buildings.name,
      inspectionStatus: inspections.status,
    })
    .from(tickets)
    .innerJoin(inspections, eq(inspections.id, tickets.inspectionId))
    .innerJoin(buildings, eq(buildings.id, tickets.buildingId))
    .where(submittedInspectionRange);

  const inspectionResults = await db
    .select({
      resultStatus: inspectionItems.resultStatus,
      inspectionStatus: inspections.status,
      isSkipped: inspectionAreaInspections.isSkipped,
    })
    .from(inspections)
    .innerJoin(
      inspectionAreaInspections,
      eq(inspectionAreaInspections.inspectionId, inspections.id),
    )
    .innerJoin(inspectionItems, eq(inspectionItems.areaInspectionId, inspectionAreaInspections.id))
    .where(submittedInspectionRange);

  return summarizeDashboardMetrics({
    tickets: ticketRows.map((row): DashboardTicketMetricRow => ({
      ticketId: row.ticketId,
      status: row.status === "closed" ? "closed" : "open",
      buildingId: row.buildingId,
      buildingName: row.buildingName,
      inspectionStatus: row.inspectionStatus,
    })),
    inspectionResults: inspectionResults.map((row): DashboardInspectionResultMetricRow => ({
      resultStatus:
        row.resultStatus === "pass" ||
        row.resultStatus === "fail" ||
        row.resultStatus === "not_applicable"
          ? row.resultStatus
          : null,
      inspectionStatus: row.inspectionStatus,
      isSkipped: row.isSkipped,
    })),
  });
}
