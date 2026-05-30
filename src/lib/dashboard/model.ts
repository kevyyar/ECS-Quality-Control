export type DashboardTicketStatus = "open" | "closed";
export type DashboardInspectionResultStatus = "pass" | "fail" | "not_applicable";

export type DashboardTicketMetricRow = {
  ticketId: string;
  status: DashboardTicketStatus;
  buildingId: string;
  buildingName: string;
  inspectionStatus: string;
};

export type DashboardInspectionResultMetricRow = {
  resultStatus: DashboardInspectionResultStatus | null;
  inspectionStatus: string;
  isSkipped: boolean;
};

export type DashboardMetrics = {
  ticketStatusCounts: {
    open: number;
    closed: number;
  };
  inspectionResultCounts: {
    pass: number;
    fail: number;
    notApplicable: number;
  };
  openTicketsByBuilding: Array<{
    buildingId: string;
    buildingName: string;
    openTicketCount: number;
  }>;
};

export function summarizeDashboardMetrics(input: {
  tickets: DashboardTicketMetricRow[];
  inspectionResults: DashboardInspectionResultMetricRow[];
}): DashboardMetrics {
  const ticketStatusCounts = { open: 0, closed: 0 };
  const inspectionResultCounts = { pass: 0, fail: 0, notApplicable: 0 };
  const openTicketBuildingCounts = new Map<
    string,
    { buildingId: string; buildingName: string; openTicketCount: number }
  >();

  input.tickets.forEach((ticket) => {
    if (ticket.inspectionStatus !== "submitted") {
      return;
    }

    ticketStatusCounts[ticket.status] += 1;

    if (ticket.status === "open") {
      const current = openTicketBuildingCounts.get(ticket.buildingId) ?? {
        buildingId: ticket.buildingId,
        buildingName: ticket.buildingName,
        openTicketCount: 0,
      };

      current.openTicketCount += 1;
      openTicketBuildingCounts.set(ticket.buildingId, current);
    }
  });

  input.inspectionResults.forEach((result) => {
    if (
      result.inspectionStatus !== "submitted" ||
      result.isSkipped ||
      result.resultStatus === null
    ) {
      return;
    }

    if (result.resultStatus === "not_applicable") {
      inspectionResultCounts.notApplicable += 1;
      return;
    }

    inspectionResultCounts[result.resultStatus] += 1;
  });

  return {
    ticketStatusCounts,
    inspectionResultCounts,
    openTicketsByBuilding: [...openTicketBuildingCounts.values()].sort((left, right) => {
      if (left.openTicketCount !== right.openTicketCount) {
        return right.openTicketCount - left.openTicketCount;
      }

      return left.buildingName.localeCompare(right.buildingName);
    }),
  };
}
