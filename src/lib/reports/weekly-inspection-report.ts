import PDFDocument from "pdfkit/js/pdfkit.standalone";

import { pdfImageSource } from "./pdf-image-source";
import {
  buildBaseReportTheme,
  drawCompanyMark,
  drawReportFooter,
  drawText,
  ensureReportSpace,
  reportContactLines,
  type ReportTheme,
} from "./report-layout";

export type ReportPhoto = {
  id: string;
  storagePath: string;
};

export type ReportCorrectionNote = {
  id: string;
  targetType: "submitted_inspection" | "ticket";
  targetId: string;
  note: string;
  createdByEmail: string;
  createdAt: Date;
};

export type WeeklyInspectionReportInput = {
  branding: {
    displayName: string;
    logoUrl: string | null;
    primaryBrandColor: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    contactWebsite?: string | null;
    contactAddress?: string | null;
  };
  inspection: {
    id: string;
    status: "draft" | "submitted";
    clientName: string;
    buildingName: string;
    submittedAt: Date | null;
    submittedByEmail: string | null;
  };
  areaInspections: Array<{
    id: string;
    source: "planned" | "one_off";
    position: number;
    areaName: string;
    templateName: string;
    isSkipped: boolean;
    skipReason: string | null;
  }>;
  items: Array<{
    id: string;
    areaInspectionId: string;
    position: number;
    sectionName: string | null;
    name: string;
    description: string | null;
    resultStatus: "pass" | "fail" | "not_applicable" | null;
    resultNote: string | null;
    beforePhotos: ReportPhoto[];
  }>;
  tickets: Array<{
    id: string;
    inspectionItemId: string;
    displayNumber: string;
    title: string;
    status: "open" | "closed";
    resolutionNote: string | null;
    closedByEmail: string | null;
    closedAt: Date | null;
    afterPhotos: ReportPhoto[];
  }>;
  correctionNotes: ReportCorrectionNote[];
};

export type WeeklyInspectionReportData = {
  branding: WeeklyInspectionReportInput["branding"];
  inspectionId: string;
  clientName: string;
  buildingName: string;
  submittedAt: Date | null;
  submittedByEmail: string | null;
  areas: Array<{
    id: string;
    source: "planned" | "one_off";
    areaName: string;
    templateName: string;
    isSkipped: boolean;
    skipReason: string | null;
    items: Array<{
      id: string;
      sectionName: string | null;
      name: string;
      description: string | null;
      resultStatus: "pass" | "fail" | "not_applicable" | null;
      resultNote: string | null;
      beforePhotos: ReportPhoto[];
      ticket: (WeeklyInspectionReportInput["tickets"][number] & {
        correctionNotes: ReportCorrectionNote[];
      }) | null;
    }>;
  }>;
  inspectionCorrectionNotes: ReportCorrectionNote[];
};

type PdfTheme = ReportTheme & {
  danger: string;
  pass: string;
};

const PAGE_MARGIN = 44;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const HEADER_HEIGHT = 150;

function byPosition<T extends { position: number }>(a: T, b: T): number {
  return a.position - b.position;
}

export function buildWeeklyInspectionReportData(
  input: WeeklyInspectionReportInput,
): WeeklyInspectionReportData | null {
  if (input.inspection.status !== "submitted") {
    return null;
  }

  const ticketsByItemId = new Map(
    input.tickets.map((ticket) => [ticket.inspectionItemId, ticket] as const),
  );
  const correctionNotesByTicketId = new Map<string, ReportCorrectionNote[]>();

  input.correctionNotes
    .filter((note) => note.targetType === "ticket")
    .forEach((note) => {
      const notes = correctionNotesByTicketId.get(note.targetId) ?? [];
      notes.push(note);
      correctionNotesByTicketId.set(note.targetId, notes);
    });

  return {
    branding: input.branding,
    inspectionId: input.inspection.id,
    clientName: input.inspection.clientName,
    buildingName: input.inspection.buildingName,
    submittedAt: input.inspection.submittedAt,
    submittedByEmail: input.inspection.submittedByEmail,
    areas: [...input.areaInspections].sort(byPosition).map((area) => ({
      id: area.id,
      source: area.source,
      areaName: area.areaName,
      templateName: area.templateName,
      isSkipped: area.isSkipped,
      skipReason: area.skipReason,
      items: input.items
        .filter((item) => item.areaInspectionId === area.id)
        .sort(byPosition)
        .map((item) => {
          const ticket = ticketsByItemId.get(item.id) ?? null;

          return {
            id: item.id,
            sectionName: item.sectionName,
            name: item.name,
            description: item.description,
            resultStatus: item.resultStatus,
            resultNote: item.resultNote,
            beforePhotos: item.beforePhotos,
            ticket: ticket
              ? {
                  ...ticket,
                  correctionNotes: correctionNotesByTicketId.get(ticket.id) ?? [],
                }
              : null,
          };
        }),
    })),
    inspectionCorrectionNotes: input.correctionNotes.filter(
      (note) =>
        note.targetType === "submitted_inspection" &&
        note.targetId === input.inspection.id,
    ),
  };
}

function formatDate(date: Date | null): string {
  return date ? date.toISOString() : "Not recorded";
}

function resultLabel(status: "pass" | "fail" | "not_applicable" | null): string {
  if (status === "not_applicable") {
    return "N/A";
  }

  return status ?? "Unanswered";
}

function reportLines(report: WeeklyInspectionReportData): string[] {
  const lines = [
    "Weekly Inspection Report",
    report.branding.displayName,
    `Client: ${report.clientName}`,
    `Building: ${report.buildingName}`,
    `Submitted: ${formatDate(report.submittedAt)}`,
    `Submitted by: ${report.submittedByEmail ?? "Unknown"}`,
    "",
  ];

  reportContactLines(report.branding).forEach((line) => lines.push(`Company contact: ${line}`));

  report.areas.forEach((area) => {
    const oneOff = area.source === "one_off" ? " (one-off)" : "";
    lines.push(`${area.areaName}${oneOff} — ${area.templateName}`);

    if (area.isSkipped) {
      lines.push(`Skipped planned Area: ${area.skipReason ?? "No reason recorded"}`);
      lines.push("");
      return;
    }

    area.items.forEach((item) => {
      lines.push(`- ${item.name}: ${resultLabel(item.resultStatus)}`);

      if (item.description) {
        lines.push(`  Description: ${item.description}`);
      }

      if (item.resultNote) {
        lines.push(`  Note: ${item.resultNote}`);
      }

      item.beforePhotos.forEach((photo) => {
        lines.push(`  Before Photo: ${photo.storagePath}`);
      });

      if (item.ticket) {
        lines.push(`  Ticket: ${item.ticket.displayNumber} - ${item.ticket.status}`);
        lines.push(`  Ticket title: ${item.ticket.title}`);

        if (item.ticket.status === "closed") {
          lines.push(`  Closed by: ${item.ticket.closedByEmail ?? "Unknown"}`);
          lines.push(`  Closed at: ${formatDate(item.ticket.closedAt)}`);
        }

        if (item.ticket.resolutionNote) {
          lines.push(`  Resolution: ${item.ticket.resolutionNote}`);
        }

        item.ticket.afterPhotos.forEach((photo) => {
          lines.push(`  After Photo: ${photo.storagePath}`);
        });

        item.ticket.correctionNotes.forEach((note) => {
          lines.push(`  Ticket Correction Note: ${note.note}`);
        });
      }
    });

    lines.push("");
  });

  lines.push("Correction Notes");
  if (report.inspectionCorrectionNotes.length === 0) {
    lines.push("No inspection-level Correction Notes.");
  } else {
    report.inspectionCorrectionNotes.forEach((note) => {
      lines.push(`${note.createdByEmail}: ${note.note}`);
    });
  }

  return lines;
}

export function renderWeeklyInspectionReportText(
  report: WeeklyInspectionReportData,
): string {
  return reportLines(report).join("\n");
}

export type WeeklyInspectionReportPhotoAssets = Map<string, Buffer>;

function themeFor(report: WeeklyInspectionReportData): PdfTheme {
  return {
    ...buildBaseReportTheme(report.branding.primaryBrandColor),
    danger: "#b91c1c",
    pass: "#15803d",
  };
}

function reportStats(report: WeeklyInspectionReportData): Array<{ label: string; value: string }> {
  const items = report.areas.flatMap((area) => area.items);
  const failed = items.filter((item) => item.resultStatus === "fail").length;
  const passed = items.filter((item) => item.resultStatus === "pass").length;
  const openTickets = items.filter((item) => item.ticket?.status === "open").length;
  const closedTickets = items.filter((item) => item.ticket?.status === "closed").length;

  return [
    { label: "Areas", value: String(report.areas.length) },
    { label: "Items", value: String(items.length) },
    { label: "Passed", value: String(passed) },
    { label: "Failed", value: String(failed) },
    { label: "Open tickets", value: String(openTickets) },
    { label: "Closed", value: String(closedTickets) },
  ];
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: WeeklyInspectionReportData,
  theme: PdfTheme,
  logoAsset: Buffer | null,
): void {
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT).fill(theme.brand);
  doc.rect(0, HEADER_HEIGHT - 8, PAGE_WIDTH, 8).fill("#0f172a");

  drawCompanyMark({
    doc,
    branding: report.branding,
    logoAsset,
    pageMargin: PAGE_MARGIN,
    theme,
  });
  drawText(doc, report.branding.displayName, 124, 34, {
    bold: true,
    color: theme.brandText,
    size: 12,
    width: 275,
  });
  drawText(doc, "Weekly Inspection Report", 124, 56, {
    bold: true,
    color: theme.brandText,
    size: 25,
    width: 315,
  });
  drawText(doc, "Submitted inspection summary with current corrective-action status", 124, 88, {
    color: theme.brandText,
    size: 9,
    width: 330,
  });

  drawText(doc, "SUBMITTED", 470, 40, {
    align: "center",
    bold: true,
    color: "#ffffff",
    size: 8,
    width: 86,
  });
  doc.roundedRect(470, 34, 86, 22, 11).stroke("#ffffff");
  drawText(doc, formatDate(report.submittedAt), 382, 76, {
    align: "right",
    color: theme.brandText,
    size: 9,
    width: 174,
  });
}

function drawOverview(doc: PDFKit.PDFDocument, report: WeeklyInspectionReportData, theme: PdfTheme): void {
  const y = 174;
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 146, 12).fill("#ffffff");
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 146, 12).stroke(theme.border);

  const headingEndY = drawText(doc, `${report.clientName} · ${report.buildingName}`, PAGE_MARGIN + 18, y + 16, {
    bold: true,
    color: theme.ink,
    size: 16,
    width: 330,
  });
  drawText(doc, `Submitted by ${report.submittedByEmail ?? "Unknown"}`, PAGE_MARGIN + 18, headingEndY + 6, {
    color: theme.muted,
    size: 9,
    width: 330,
  });

  const contact = reportContactLines(report.branding);
  drawText(doc, "Report contact", PAGE_MARGIN + 364, y + 16, {
    align: "right",
    bold: true,
    color: theme.muted,
    size: 8,
    width: 144,
  });
  drawText(doc, contact.length > 0 ? contact.join("\n") : "No contact details configured", PAGE_MARGIN + 318, y + 30, {
    align: "right",
    color: theme.ink,
    size: 8.5,
    width: 190,
  });

  reportStats(report).forEach((stat, index) => {
    const x = PAGE_MARGIN + 18 + index * 80;
    doc.roundedRect(x, y + 82, 68, 44, 10).fill(theme.surface);
    doc.roundedRect(x, y + 82, 68, 44, 10).stroke(theme.border);
    drawText(doc, stat.value, x, y + 91, {
      align: "center",
      bold: true,
      color: theme.ink,
      size: 14,
      width: 68,
    });
    drawText(doc, stat.label, x, y + 111, {
      align: "center",
      color: theme.muted,
      size: 6.8,
      width: 68,
    });
  });

  doc.y = y + 170;
}

function resultColor(status: "pass" | "fail" | "not_applicable" | null, theme: PdfTheme): string {
  if (status === "pass") {
    return theme.pass;
  }

  if (status === "fail") {
    return theme.danger;
  }

  return theme.warning;
}

function drawBadge(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  doc.roundedRect(x, y, 76, 20, 10).fill(color);
  drawText(doc, text.toUpperCase(), x, y + 6, {
    align: "center",
    bold: true,
    color: "#ffffff",
    size: 7,
    width: 76,
  });
}

function drawPhotoCard(
  doc: PDFKit.PDFDocument,
  label: string,
  photo: ReportPhoto,
  photoAssets: WeeklyInspectionReportPhotoAssets,
  theme: PdfTheme,
): void {
  ensureReportSpace(doc, 102);
  const y = doc.y;
  const asset = photoAssets.get(photo.storagePath);

  doc.roundedRect(PAGE_MARGIN + 28, y, 124, 78, 10).fill(theme.surface);
  doc.roundedRect(PAGE_MARGIN + 28, y, 124, 78, 10).stroke(theme.border);

  if (asset) {
    try {
      doc.image(pdfImageSource(asset), PAGE_MARGIN + 36, y + 8, { fit: [108, 50], align: "center", valign: "center" });
    } catch {
      drawText(doc, "Photo could not be embedded", PAGE_MARGIN + 36, y + 30, {
        align: "center",
        bold: true,
        color: theme.warning,
        size: 7,
        width: 108,
      });
    }
  } else {
    drawText(doc, "Photo unavailable", PAGE_MARGIN + 36, y + 30, {
      align: "center",
      bold: true,
      color: theme.muted,
      size: 7,
      width: 108,
    });
  }

  drawText(doc, label, PAGE_MARGIN + 166, y + 9, {
    bold: true,
    color: theme.ink,
    size: 8.5,
    width: CONTENT_WIDTH - 194,
  });
  drawText(doc, photo.storagePath, PAGE_MARGIN + 166, y + 26, {
    color: theme.muted,
    size: 7.5,
    width: CONTENT_WIDTH - 194,
  });

  doc.y = y + 90;
}

function drawCorrectionNotes(
  doc: PDFKit.PDFDocument,
  notes: ReportCorrectionNote[],
  emptyText: string,
  theme: PdfTheme,
): void {
  if (notes.length === 0) {
    drawText(doc, emptyText, PAGE_MARGIN + 28, doc.y, {
      color: theme.muted,
      size: 8.5,
      width: CONTENT_WIDTH - 56,
    });
    doc.moveDown(0.8);
    return;
  }

  notes.forEach((note) => {
    ensureReportSpace(doc, 58);
    const y = doc.y;
    doc.roundedRect(PAGE_MARGIN + 28, y, CONTENT_WIDTH - 56, 48, 10).fill(theme.surface);
    doc.roundedRect(PAGE_MARGIN + 28, y, CONTENT_WIDTH - 56, 48, 10).stroke(theme.border);
    drawText(doc, `${note.createdByEmail} · ${formatDate(note.createdAt)}`, PAGE_MARGIN + 42, y + 10, {
      bold: true,
      color: theme.muted,
      size: 7.5,
      width: CONTENT_WIDTH - 84,
    });
    drawText(doc, note.note, PAGE_MARGIN + 42, y + 25, {
      color: theme.ink,
      size: 8.5,
      width: CONTENT_WIDTH - 84,
    });
    doc.y = y + 58;
  });
}

function drawTicket(
  doc: PDFKit.PDFDocument,
  item: WeeklyInspectionReportData["areas"][number]["items"][number],
  photoAssets: WeeklyInspectionReportPhotoAssets,
  theme: PdfTheme,
): void {
  if (!item.ticket) {
    return;
  }

  ensureReportSpace(doc, 92);
  const y = doc.y;
  doc.roundedRect(PAGE_MARGIN + 20, y, CONTENT_WIDTH - 40, 72, 10).fill(theme.surface);
  doc.roundedRect(PAGE_MARGIN + 20, y, CONTENT_WIDTH - 40, 72, 10).stroke(theme.border);
  drawText(doc, `${item.ticket.displayNumber} · ${item.ticket.status.toUpperCase()}`, PAGE_MARGIN + 34, y + 12, {
    bold: true,
    color: item.ticket.status === "closed" ? theme.pass : theme.danger,
    size: 8,
    width: 130,
  });
  drawText(doc, item.ticket.title, PAGE_MARGIN + 34, y + 28, {
    bold: true,
    color: theme.ink,
    size: 9,
    width: 250,
  });

  if (item.ticket.status === "closed") {
    drawText(doc, `Closed by ${item.ticket.closedByEmail ?? "Unknown"}`, PAGE_MARGIN + 310, y + 12, {
      align: "right",
      color: theme.muted,
      size: 7.5,
      width: 170,
    });
    drawText(doc, formatDate(item.ticket.closedAt), PAGE_MARGIN + 310, y + 27, {
      align: "right",
      color: theme.muted,
      size: 7.5,
      width: 170,
    });
  }

  if (item.ticket.resolutionNote) {
    drawText(doc, `Resolution: ${item.ticket.resolutionNote}`, PAGE_MARGIN + 34, y + 48, {
      color: theme.ink,
      size: 8,
      width: CONTENT_WIDTH - 68,
    });
  }

  doc.y = y + 86;
  item.ticket.afterPhotos.forEach((photo) => drawPhotoCard(doc, "After Photo", photo, photoAssets, theme));
  drawCorrectionNotes(doc, item.ticket.correctionNotes, "No Ticket Correction Notes.", theme);
}

function drawItem(
  doc: PDFKit.PDFDocument,
  item: WeeklyInspectionReportData["areas"][number]["items"][number],
  photoAssets: WeeklyInspectionReportPhotoAssets,
  theme: PdfTheme,
): void {
  ensureReportSpace(doc, 74);
  const y = doc.y;

  doc.roundedRect(PAGE_MARGIN + 12, y, CONTENT_WIDTH - 24, 2, 1).fill(theme.border);
  drawBadge(doc, resultLabel(item.resultStatus), PAGE_MARGIN + CONTENT_WIDTH - 94, y + 14, resultColor(item.resultStatus, theme));

  drawText(doc, item.name, PAGE_MARGIN + 20, y + 14, {
    bold: true,
    color: theme.ink,
    size: 10,
    width: CONTENT_WIDTH - 126,
  });

  let detailY = doc.y + 5;
  if (item.sectionName) {
    detailY = drawText(doc, item.sectionName, PAGE_MARGIN + 20, detailY, {
      color: theme.muted,
      size: 7.5,
      width: CONTENT_WIDTH - 126,
    }) + 2;
  }

  if (item.description) {
    detailY = drawText(doc, item.description, PAGE_MARGIN + 20, detailY, {
      color: theme.muted,
      size: 8.2,
      width: CONTENT_WIDTH - 70,
    }) + 2;
  }

  if (item.resultNote) {
    detailY = drawText(doc, `Note: ${item.resultNote}`, PAGE_MARGIN + 20, detailY, {
      color: theme.ink,
      size: 8.2,
      width: CONTENT_WIDTH - 70,
    }) + 2;
  }

  doc.y = Math.max(detailY + 4, y + 58);
  item.beforePhotos.forEach((photo) => drawPhotoCard(doc, "Before Photo", photo, photoAssets, theme));
  drawTicket(doc, item, photoAssets, theme);
}

function drawArea(
  doc: PDFKit.PDFDocument,
  area: WeeklyInspectionReportData["areas"][number],
  photoAssets: WeeklyInspectionReportPhotoAssets,
  theme: PdfTheme,
): void {
  ensureReportSpace(doc, 94);
  const y = doc.y;
  const oneOff = area.source === "one_off" ? "One-off" : "Planned";

  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 70, 12).fill("#ffffff");
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 70, 12).stroke(theme.border);
  doc.rect(PAGE_MARGIN, y + 16, 4, 38).fill(theme.brand);
  drawText(doc, area.areaName, PAGE_MARGIN + 18, y + 14, {
    bold: true,
    color: theme.ink,
    size: 14,
    width: 330,
  });
  drawText(doc, `${oneOff} area · ${area.templateName}`, PAGE_MARGIN + 18, y + 39, {
    color: theme.muted,
    size: 8.5,
    width: 330,
  });
  drawText(doc, `${area.items.length} item${area.items.length === 1 ? "" : "s"}`, PAGE_MARGIN + 400, y + 26, {
    align: "right",
    bold: true,
    color: theme.muted,
    size: 8,
    width: 90,
  });
  doc.y = y + 88;

  if (area.isSkipped) {
    drawText(doc, `Skipped planned Area: ${area.skipReason ?? "No reason recorded"}`, PAGE_MARGIN + 18, doc.y, {
      color: theme.warning,
      size: 9,
      width: CONTENT_WIDTH - 36,
    });
    doc.moveDown(1.2);
    return;
  }

  area.items.forEach((item) => drawItem(doc, item, photoAssets, theme));
  doc.moveDown(0.8);
}

function drawInspectionCorrectionNotes(doc: PDFKit.PDFDocument, report: WeeklyInspectionReportData, theme: PdfTheme): void {
  ensureReportSpace(doc, 72);
  doc.rect(PAGE_MARGIN, doc.y + 7, 4, 30).fill(theme.brand);
  drawText(doc, "Correction Notes", PAGE_MARGIN + 14, doc.y, {
    bold: true,
    color: theme.ink,
    size: 14,
    width: 320,
  });
  drawText(doc, "Inspection-level notes added after submission", PAGE_MARGIN + 14, doc.y + 3, {
    color: theme.muted,
    size: 8.5,
    width: 430,
  });
  doc.moveDown(1.2);
  drawCorrectionNotes(doc, report.inspectionCorrectionNotes, "No inspection-level Correction Notes.", theme);
}

export async function renderWeeklyInspectionReportPdf(
  report: WeeklyInspectionReportData,
  photoAssets: WeeklyInspectionReportPhotoAssets = new Map(),
  logoAsset: Buffer | null = null,
): Promise<Uint8Array> {
  const doc = new PDFDocument({ autoFirstPage: true, bufferPages: true, margin: PAGE_MARGIN, compress: false });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const theme = themeFor(report);

  doc.info.Title = "Weekly Inspection Report";
  doc.info.Subject = `${report.clientName} - ${report.buildingName}`;
  drawHeader(doc, report, theme, logoAsset);
  drawOverview(doc, report, theme);
  report.areas.forEach((area) => drawArea(doc, area, photoAssets, theme));
  drawInspectionCorrectionNotes(doc, report, theme);
  drawReportFooter({
    doc,
    pageMargin: PAGE_MARGIN,
    contentWidth: CONTENT_WIDTH,
    label: "ECS Quality Control · Weekly Inspection Report",
    theme,
  });
  doc.end();

  return done;
}
