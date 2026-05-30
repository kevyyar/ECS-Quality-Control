import "server-only";

import { getCompanyBranding } from "@/lib/company-branding/repository";
import { listCorrectionNotes } from "@/lib/correction-notes/repository";
import { getTicket } from "@/lib/tickets/repository";

import {
  buildTicketResolutionReportData,
  type TicketResolutionReportData,
} from "./ticket-resolution-report";

export async function getTicketResolutionReportData(
  ticketId: string,
): Promise<TicketResolutionReportData | null> {
  const [branding, ticket, correctionNotes] = await Promise.all([
    getCompanyBranding(),
    getTicket(ticketId),
    listCorrectionNotes({ targetType: "ticket", targetId: ticketId }),
  ]);

  if (!ticket) {
    return null;
  }

  return buildTicketResolutionReportData({
    branding,
    ticket,
    correctionNotes,
  });
}
