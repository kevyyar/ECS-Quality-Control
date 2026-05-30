import PDFDocument from "pdfkit";

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

function addPhoto(
  doc: PDFKit.PDFDocument,
  label: string,
  photo: ReportPhoto,
  photoAssets: WeeklyInspectionReportPhotoAssets,
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

function addCorrectionNoteLines(
  doc: PDFKit.PDFDocument,
  notes: ReportCorrectionNote[],
): void {
  if (notes.length === 0) {
    doc.text("No Correction Notes.");
    return;
  }

  notes.forEach((note) => {
    doc.text(`${note.createdByEmail} (${formatDate(note.createdAt)}): ${note.note}`);
  });
}

export async function renderWeeklyInspectionReportPdf(
  report: WeeklyInspectionReportData,
  photoAssets: WeeklyInspectionReportPhotoAssets = new Map(),
): Promise<Uint8Array> {
  const doc = new PDFDocument({ autoFirstPage: true, margin: 50, compress: false });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.info.Title = "Weekly Inspection Report";
  doc.fillColor(report.branding.primaryBrandColor).fontSize(18).text("Weekly Inspection Report");
  doc.fillColor("black").fontSize(13).text(report.branding.displayName);
  if (report.branding.logoUrl) {
    doc.fontSize(9).text(`Logo: ${report.branding.logoUrl}`);
  }
  doc.moveDown();
  doc.fontSize(10).text(`Client: ${report.clientName}`);
  doc.text(`Building: ${report.buildingName}`);
  doc.text(`Submitted: ${formatDate(report.submittedAt)}`);
  doc.text(`Submitted by: ${report.submittedByEmail ?? "Unknown"}`);

  report.areas.forEach((area) => {
    doc.moveDown();
    const oneOff = area.source === "one_off" ? " (one-off)" : "";
    doc.fillColor(report.branding.primaryBrandColor).fontSize(13).text(`${area.areaName}${oneOff}`);
    doc.fillColor("black").fontSize(10).text(`Template: ${area.templateName}`);

    if (area.isSkipped) {
      doc.text(`Skipped planned Area: ${area.skipReason ?? "No reason recorded"}`);
      return;
    }

    area.items.forEach((item) => {
      doc.moveDown(0.5);
      doc.fontSize(10).text(`${item.name}: ${resultLabel(item.resultStatus)}`);
      if (item.description) {
        doc.text(`Description: ${item.description}`, { indent: 12 });
      }
      if (item.resultNote) {
        doc.text(`Note: ${item.resultNote}`, { indent: 12 });
      }
      item.beforePhotos.forEach((photo) => addPhoto(doc, "Before Photo", photo, photoAssets));

      if (item.ticket) {
        doc.text(`Ticket: ${item.ticket.displayNumber} - ${item.ticket.status}`, { indent: 12 });
        doc.text(`Ticket title: ${item.ticket.title}`, { indent: 12 });
        if (item.ticket.status === "closed") {
          doc.text(`Closed by: ${item.ticket.closedByEmail ?? "Unknown"}`, { indent: 12 });
          doc.text(`Closed at: ${formatDate(item.ticket.closedAt)}`, { indent: 12 });
        }
        if (item.ticket.resolutionNote) {
          doc.text(`Resolution: ${item.ticket.resolutionNote}`, { indent: 12 });
        }
        item.ticket.afterPhotos.forEach((photo) => addPhoto(doc, "After Photo", photo, photoAssets));
        addCorrectionNoteLines(doc, item.ticket.correctionNotes);
      }
    });
  });

  doc.moveDown();
  doc.fillColor(report.branding.primaryBrandColor).fontSize(13).text("Correction Notes");
  doc.fillColor("black").fontSize(10);
  addCorrectionNoteLines(doc, report.inspectionCorrectionNotes);
  doc.end();

  return done;
}
