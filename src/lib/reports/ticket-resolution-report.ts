import PDFDocument from "pdfkit";

import type { ReportCorrectionNote, ReportPhoto } from "./weekly-inspection-report";

export type TicketResolutionReportPhotoAssets = Map<string, Buffer>;

export type TicketResolutionReportInput = {
  branding: {
    displayName: string;
    logoUrl: string | null;
    primaryBrandColor: string;
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

function formatDate(date: Date | null): string {
  return date ? date.toISOString() : "Not recorded";
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

function addPhoto(
  doc: PDFKit.PDFDocument,
  label: string,
  photo: ReportPhoto,
  photoAssets: TicketResolutionReportPhotoAssets,
): void {
  doc.text(`${label}: ${photo.storagePath}`);
  const asset = photoAssets.get(photo.storagePath);

  if (!asset) {
    doc.text("Photo unavailable in this environment.", { indent: 12 });
    return;
  }

  try {
    doc.image(asset, { fit: [180, 120] });
  } catch {
    doc.text("Photo could not be embedded.", { indent: 12 });
  }
}

export async function renderTicketResolutionReportPdf(
  report: TicketResolutionReportData,
  photoAssets: TicketResolutionReportPhotoAssets = new Map(),
): Promise<Uint8Array> {
  const doc = new PDFDocument({ autoFirstPage: true, margin: 50, compress: false });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.info.Title = "Ticket Resolution Report";
  doc.fillColor(report.branding.primaryBrandColor).fontSize(18).text("Ticket Resolution Report");
  doc.fillColor("black").fontSize(13).text(report.branding.displayName);
  if (report.branding.logoUrl) {
    doc.fontSize(9).text(`Logo: ${report.branding.logoUrl}`);
  }
  doc.moveDown();
  doc.fontSize(10).text(`Ticket: ${report.displayNumber}`);
  doc.text(`Title: ${report.title}`);
  doc.text(`Client: ${report.clientName}`);
  doc.text(`Building: ${report.buildingName}`);
  doc.text(`Area: ${report.areaName}`);
  doc.text(`Inspection submitted: ${formatDate(report.inspectionSubmittedAt)}`);
  doc.text(`Submitted by: ${report.submittedByEmail ?? "Unknown"}`);
  doc.moveDown();
  doc.fillColor(report.branding.primaryBrandColor).fontSize(13).text("Failure proof");
  doc.fillColor("black").fontSize(10).text(`Failed item: ${report.failedItemName}`);
  if (report.failedItemDescription) {
    doc.text(`Description: ${report.failedItemDescription}`);
  }
  if (report.issueNote) {
    doc.text(`Issue note: ${report.issueNote}`);
  }
  report.beforePhotos.forEach((photo) => addPhoto(doc, "Before Photo", photo, photoAssets));
  doc.moveDown();
  doc.fillColor(report.branding.primaryBrandColor).fontSize(13).text("Resolution proof");
  doc.fillColor("black").fontSize(10).text(`Resolution note: ${report.resolutionNote ?? "Not recorded"}`);
  report.afterPhotos.forEach((photo) => addPhoto(doc, "After Photo", photo, photoAssets));
  doc.text(`Closed by: ${report.closedByEmail ?? "Unknown"}`);
  doc.text(`Closed at: ${formatDate(report.closedAt)}`);
  doc.moveDown();
  doc.fillColor(report.branding.primaryBrandColor).fontSize(13).text("Correction Notes");
  doc.fillColor("black").fontSize(10);
  if (report.correctionNotes.length === 0) {
    doc.text("No Correction Notes.");
  } else {
    report.correctionNotes.forEach((note) => {
      doc.text(`${note.createdByEmail} (${formatDate(note.createdAt)}): ${note.note}`);
    });
  }
  doc.end();

  return done;
}
