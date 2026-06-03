import PDFDocument from "pdfkit/js/pdfkit.standalone";

import { pdfImageSource } from "./pdf-image-source";
import {
  REPORT_PAGE,
  buildBaseReportTheme,
  drawCompanyMark,
  drawReportFooter,
  drawText,
  ensureReportSpace,
  reportContactLines,
  type ReportTheme,
} from "./report-layout";
import type { ReportCorrectionNote, ReportPhoto } from "./weekly-inspection-report";

export type TicketResolutionReportPhotoAssets = Map<string, Buffer>;

export type TicketResolutionReportInput = {
  branding: {
    displayName: string;
    logoUrl: string | null;
    primaryBrandColor: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    contactWebsite?: string | null;
    contactAddress?: string | null;
  };
  ticket: {
    id: string;
    displayNumber: string;
    title: string;
    status: "open" | "closed";
    clientName: string;
    buildingName: string;
    areaName: string;
    inspectionSubmittedAt: Date | null;
    submittedByEmail: string | null;
    failedItemName: string;
    failedItemDescription: string | null;
    issueNote: string | null;
    beforePhotos: ReportPhoto[];
    resolutionNote: string | null;
    afterPhotos: ReportPhoto[];
    closedByEmail: string | null;
    closedAt: Date | null;
  };
  correctionNotes: ReportCorrectionNote[];
};

export type TicketResolutionReportData = TicketResolutionReportInput["ticket"] & {
  branding: TicketResolutionReportInput["branding"];
  correctionNotes: ReportCorrectionNote[];
};

type PdfTheme = ReportTheme & {
  success: string;
};

const PAGE_MARGIN = 44;
const CONTENT_WIDTH = REPORT_PAGE.width - PAGE_MARGIN * 2;
const HEADER_HEIGHT = 150;
const CARD_RADIUS = 12;
const SECTION_GAP = 18;

function formatDate(date: Date | null): string {
  return date ? date.toISOString() : "Not recorded";
}

function themeFor(report: TicketResolutionReportData): PdfTheme {
  return {
    ...buildBaseReportTheme(report.branding.primaryBrandColor),
    success: "#15803d",
  };
}

export function buildTicketResolutionReportData(
  input: TicketResolutionReportInput,
): TicketResolutionReportData | null {
  if (input.ticket.status !== "closed") {
    return null;
  }

  return {
    ...input.ticket,
    branding: input.branding,
    correctionNotes: input.correctionNotes.filter(
      (note) => note.targetType === "ticket" && note.targetId === input.ticket.id,
    ),
  };
}

export function renderTicketResolutionReportText(
  report: TicketResolutionReportData,
): string {
  const lines = [
    "Ticket Resolution Report",
    report.branding.displayName,
    `Ticket: ${report.displayNumber}`,
    `Title: ${report.title}`,
    `Client: ${report.clientName}`,
    `Building: ${report.buildingName}`,
    `Area: ${report.areaName}`,
    `Inspection submitted: ${formatDate(report.inspectionSubmittedAt)}`,
    `Submitted by: ${report.submittedByEmail ?? "Unknown"}`,
    `Failed item: ${report.failedItemName}`,
  ];

  reportContactLines(report.branding).forEach((line) => lines.push(`Company contact: ${line}`));

  if (report.failedItemDescription) {
    lines.push(`Failed item description: ${report.failedItemDescription}`);
  }

  if (report.issueNote) {
    lines.push(`Issue note: ${report.issueNote}`);
  }

  report.beforePhotos.forEach((photo) => lines.push(`Before Photo: ${photo.storagePath}`));
  lines.push(`Resolution note: ${report.resolutionNote ?? "Not recorded"}`);
  report.afterPhotos.forEach((photo) => lines.push(`After Photo: ${photo.storagePath}`));
  lines.push(`Closed by: ${report.closedByEmail ?? "Unknown"}`);
  lines.push(`Closed at: ${formatDate(report.closedAt)}`);
  lines.push("Correction Notes");

  if (report.correctionNotes.length === 0) {
    lines.push("No Correction Notes.");
  } else {
    report.correctionNotes.forEach((note) => {
      lines.push(`${note.createdByEmail} (${formatDate(note.createdAt)}): ${note.note}`);
    });
  }

  return lines.join("\n");
}

function drawBadge(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  theme: PdfTheme,
): void {
  doc.roundedRect(x, y, 76, 22, 11).fill(theme.success);
  drawText(doc, text, x, y + 6, {
    width: 76,
    align: "center",
    color: "#ffffff",
    size: 8,
    bold: true,
  });
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  report: TicketResolutionReportData,
  theme: PdfTheme,
  logoAsset: Buffer | null,
): void {
  doc.rect(0, 0, 612, HEADER_HEIGHT).fill(theme.brand);
  doc.rect(0, HEADER_HEIGHT - 8, 612, 8).fill("#0f172a");

  drawCompanyMark({
    doc,
    branding: report.branding,
    logoAsset,
    pageMargin: PAGE_MARGIN,
    theme,
  });

  drawText(doc, report.branding.displayName, 124, 34, {
    width: 275,
    color: theme.brandText,
    size: 12,
    bold: true,
  });
  drawText(doc, "Ticket Resolution Report", 124, 56, {
    width: 315,
    color: theme.brandText,
    size: 25,
    bold: true,
  });
  drawText(doc, "Corrective-action closure package for client delivery", 124, 88, {
    width: 315,
    color: theme.brandText,
    size: 9,
  });

  drawBadge(doc, "RESOLVED", 480, 34, theme);
  drawText(doc, report.displayNumber, 420, 66, {
    width: 136,
    align: "right",
    color: theme.brandText,
    size: 20,
    bold: true,
  });
  drawText(doc, `Closed ${formatDate(report.closedAt)}`, 380, 94, {
    width: 176,
    align: "right",
    color: theme.brandText,
    size: 8,
  });
}

function drawCard(
  doc: PDFKit.PDFDocument,
  y: number,
  height: number,
  theme: PdfTheme,
): void {
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, height, CARD_RADIUS).fill("#ffffff");
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, height, CARD_RADIUS).stroke(theme.border);
}

function drawMetaRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  theme: PdfTheme,
): number {
  drawText(doc, label.toUpperCase(), x, y, {
    width,
    color: theme.muted,
    size: 7,
    bold: true,
    characterSpacing: 0.4,
  });

  return drawText(doc, value, x, y + 11, {
    width,
    color: theme.ink,
    size: 9.5,
    bold: true,
  });
}

function drawOverview(doc: PDFKit.PDFDocument, report: TicketResolutionReportData, theme: PdfTheme): void {
  const y = 174;
  drawCard(doc, y, 132, theme);

  drawText(doc, report.title, PAGE_MARGIN + 18, y + 16, {
    width: 332,
    color: theme.ink,
    size: 16,
    bold: true,
  });
  drawText(doc, `Area: ${report.areaName}`, PAGE_MARGIN + 18, y + 42, {
    width: 332,
    color: theme.muted,
    size: 9,
  });

  const contact = reportContactLines(report.branding);
  drawText(doc, "Report contact", PAGE_MARGIN + 378, y + 16, {
    width: 130,
    align: "right",
    color: theme.muted,
    size: 8,
    bold: true,
  });
  drawText(doc, contact.length > 0 ? contact.join("\n") : "No contact details configured", PAGE_MARGIN + 318, y + 30, {
    width: 190,
    align: "right",
    color: theme.ink,
    size: 8.5,
  });

  const rowY = y + 74;
  drawMetaRow(doc, "Client", report.clientName, PAGE_MARGIN + 18, rowY, 120, theme);
  drawMetaRow(doc, "Building", report.buildingName, PAGE_MARGIN + 150, rowY, 120, theme);
  drawMetaRow(doc, "Inspection submitted", formatDate(report.inspectionSubmittedAt), PAGE_MARGIN + 282, rowY, 118, theme);
  drawMetaRow(doc, "Submitted by", report.submittedByEmail ?? "Unknown", PAGE_MARGIN + 412, rowY, 78, theme);

  doc.y = y + 132 + SECTION_GAP;
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string, theme: PdfTheme): void {
  ensureReportSpace(doc, 58);
  doc.rect(PAGE_MARGIN, doc.y + 7, 4, 30).fill(theme.brand);
  drawText(doc, title, PAGE_MARGIN + 14, doc.y, {
    width: 320,
    color: theme.ink,
    size: 14,
    bold: true,
  });
  drawText(doc, subtitle, PAGE_MARGIN + 14, doc.y + 3, {
    width: 430,
    color: theme.muted,
    size: 8.5,
  });
  doc.moveDown(1.2);
}

function drawFieldBlock(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  theme: PdfTheme,
): void {
  drawText(doc, label.toUpperCase(), PAGE_MARGIN + 18, doc.y, {
    width: CONTENT_WIDTH - 36,
    color: theme.muted,
    size: 7,
    bold: true,
    characterSpacing: 0.4,
  });
  drawText(doc, value, PAGE_MARGIN + 18, doc.y + 3, {
    width: CONTENT_WIDTH - 36,
    color: theme.ink,
    size: 9.5,
  });
  doc.moveDown(0.8);
}

function drawPhotoCard(
  doc: PDFKit.PDFDocument,
  label: string,
  photo: ReportPhoto,
  photoAssets: TicketResolutionReportPhotoAssets,
  theme: PdfTheme,
): void {
  ensureReportSpace(doc, 124);
  const y = doc.y;
  const asset = photoAssets.get(photo.storagePath);

  doc.roundedRect(PAGE_MARGIN + 18, y, 144, 94, 10).fill(theme.surface);
  doc.roundedRect(PAGE_MARGIN + 18, y, 144, 94, 10).stroke(theme.border);

  if (asset) {
    try {
      doc.image(pdfImageSource(asset), PAGE_MARGIN + 26, y + 8, { fit: [128, 60], align: "center", valign: "center" });
    } catch {
      drawText(doc, "Photo could not be embedded", PAGE_MARGIN + 26, y + 36, {
        width: 128,
        align: "center",
        color: theme.warning,
        size: 8,
        bold: true,
      });
    }
  } else {
    drawText(doc, "Photo unavailable", PAGE_MARGIN + 26, y + 36, {
      width: 128,
      align: "center",
      color: theme.muted,
      size: 8,
      bold: true,
    });
  }

  drawText(doc, label, PAGE_MARGIN + 178, y + 10, {
    width: CONTENT_WIDTH - 210,
    color: theme.ink,
    size: 9.5,
    bold: true,
  });
  drawText(doc, photo.storagePath, PAGE_MARGIN + 178, y + 28, {
    width: CONTENT_WIDTH - 210,
    color: theme.muted,
    size: 8,
  });

  doc.y = y + 106;
}

function drawPhotoList(
  doc: PDFKit.PDFDocument,
  label: string,
  photos: ReportPhoto[],
  photoAssets: TicketResolutionReportPhotoAssets,
  theme: PdfTheme,
): void {
  if (photos.length === 0) {
    drawFieldBlock(doc, label, "No photos were attached.", theme);
    return;
  }

  photos.forEach((photo) => drawPhotoCard(doc, label, photo, photoAssets, theme));
}

function drawProofSection(
  doc: PDFKit.PDFDocument,
  report: TicketResolutionReportData,
  photoAssets: TicketResolutionReportPhotoAssets,
  theme: PdfTheme,
): void {
  drawSectionHeader(doc, "Failure proof", "Original failed inspection item and evidence", theme);
  drawCard(doc, doc.y, 10, theme);
  doc.y += 18;
  drawFieldBlock(doc, "Failed item", report.failedItemName, theme);

  if (report.failedItemDescription) {
    drawFieldBlock(doc, "Required standard", report.failedItemDescription, theme);
  }

  if (report.issueNote) {
    drawFieldBlock(doc, "Issue note", report.issueNote, theme);
  }

  drawPhotoList(doc, "Before Photo", report.beforePhotos, photoAssets, theme);

  drawSectionHeader(doc, "Resolution proof", "Closure note, after photos, and responsible user", theme);
  drawFieldBlock(doc, "Resolution note", report.resolutionNote ?? "Not recorded", theme);
  drawPhotoList(doc, "After Photo", report.afterPhotos, photoAssets, theme);
  drawFieldBlock(doc, "Closed by", report.closedByEmail ?? "Unknown", theme);
  drawFieldBlock(doc, "Closed at", formatDate(report.closedAt), theme);
}

function drawCorrectionNotes(doc: PDFKit.PDFDocument, report: TicketResolutionReportData, theme: PdfTheme): void {
  drawSectionHeader(doc, "Correction Notes", "Additive notes recorded after the ticket was created", theme);

  if (report.correctionNotes.length === 0) {
    drawFieldBlock(doc, "Notes", "No Correction Notes.", theme);
    return;
  }

  report.correctionNotes.forEach((note) => {
    ensureReportSpace(doc, 64);
    const y = doc.y;
    doc.roundedRect(PAGE_MARGIN + 18, y, CONTENT_WIDTH - 36, 54, 10).fill(theme.surface);
    doc.roundedRect(PAGE_MARGIN + 18, y, CONTENT_WIDTH - 36, 54, 10).stroke(theme.border);
    drawText(doc, `${note.createdByEmail} · ${formatDate(note.createdAt)}`, PAGE_MARGIN + 32, y + 12, {
      width: CONTENT_WIDTH - 64,
      color: theme.muted,
      size: 8,
      bold: true,
    });
    drawText(doc, note.note, PAGE_MARGIN + 32, y + 28, {
      width: CONTENT_WIDTH - 64,
      color: theme.ink,
      size: 9,
    });
    doc.y = y + 66;
  });
}

export async function renderTicketResolutionReportPdf(
  report: TicketResolutionReportData,
  photoAssets: TicketResolutionReportPhotoAssets = new Map(),
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

  doc.info.Title = "Ticket Resolution Report";
  doc.info.Subject = `${report.displayNumber} - ${report.title}`;
  drawHeader(doc, report, theme, logoAsset);
  drawOverview(doc, report, theme);
  drawProofSection(doc, report, photoAssets, theme);
  drawCorrectionNotes(doc, report, theme);
  drawReportFooter({
    doc,
    pageMargin: PAGE_MARGIN,
    contentWidth: CONTENT_WIDTH,
    label: "ECS QC · Ticket Resolution Report",
    theme,
  });
  doc.end();

  return done;
}
