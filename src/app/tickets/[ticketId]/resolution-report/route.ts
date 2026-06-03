import { requireInternalUser } from "@/lib/auth/session";
import { downloadEvidencePhoto } from "@/lib/evidence/storage";
import { logOperationalError } from "@/lib/observability/logger";
import { loadReportLogoAsset } from "@/lib/reports/logo-assets";
import { getTicketResolutionReportData } from "@/lib/reports/ticket-resolution-report-data";
import {
  renderTicketResolutionReportPdf,
  type TicketResolutionReportData,
  type TicketResolutionReportPhotoAssets,
} from "@/lib/reports/ticket-resolution-report";

async function loadTicketPhotoAssets(
  report: TicketResolutionReportData,
): Promise<TicketResolutionReportPhotoAssets> {
  const storagePaths = new Set<string>();

  report.beforePhotos.forEach((photo) => storagePaths.add(photo.storagePath));
  report.afterPhotos.forEach((photo) => storagePaths.add(photo.storagePath));

  const assets = new Map<string, Buffer>();
  await Promise.all(
    [...storagePaths].map(async (storagePath) => {
      const photo = await downloadEvidencePhoto(storagePath);

      if (photo) {
        assets.set(storagePath, photo);
      }
    }),
  );

  return assets;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
): Promise<Response> {
  await requireInternalUser();

  const { ticketId } = await params;

  try {
    const report = await getTicketResolutionReportData(ticketId);

    if (!report) {
      return new Response("Ticket Resolution Report was not found.", { status: 404 });
    }

    const [photoAssets, logoAsset] = await Promise.all([
      loadTicketPhotoAssets(report),
      loadReportLogoAsset(report.branding.logoUrl),
    ]);
    const pdf = await renderTicketResolutionReportPdf(report, photoAssets, logoAsset);
    const body = pdf.buffer.slice(
      pdf.byteOffset,
      pdf.byteOffset + pdf.byteLength,
    ) as ArrayBuffer;

    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-resolution-report-${ticketId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logOperationalError("pdf.ticket-resolution.failed", error, {
      workflow: "pdf.ticket-resolution",
      ticketId,
    });
    throw error;
  }
}
