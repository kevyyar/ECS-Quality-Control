import { requireInternalUser } from "@/lib/auth/session";
import { downloadEvidencePhoto } from "@/lib/evidence/storage";
import { logOperationalError } from "@/lib/observability/logger";
import { loadReportLogoAsset } from "@/lib/reports/logo-assets";
import { getWeeklyInspectionReportData } from "@/lib/reports/weekly-inspection-report-data";
import {
  renderWeeklyInspectionReportPdf,
  type WeeklyInspectionReportData,
  type WeeklyInspectionReportPhotoAssets,
} from "@/lib/reports/weekly-inspection-report";

async function loadReportPhotoAssets(
  report: WeeklyInspectionReportData,
): Promise<WeeklyInspectionReportPhotoAssets> {
  const storagePaths = new Set<string>();

  report.areas.forEach((area) => {
    area.items.forEach((item) => {
      item.beforePhotos.forEach((photo) => storagePaths.add(photo.storagePath));
      item.ticket?.afterPhotos.forEach((photo) => storagePaths.add(photo.storagePath));
    });
  });

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
  { params }: { params: Promise<{ inspectionId: string }> },
): Promise<Response> {
  await requireInternalUser();

  const { inspectionId } = await params;

  try {
    const report = await getWeeklyInspectionReportData(inspectionId);

    if (!report) {
      return new Response("Weekly Inspection Report was not found.", { status: 404 });
    }

    const [photoAssets, logoAsset] = await Promise.all([
      loadReportPhotoAssets(report),
      loadReportLogoAsset(report.branding.logoUrl),
    ]);
    const pdf = await renderWeeklyInspectionReportPdf(report, photoAssets, logoAsset);
    const body = pdf.buffer.slice(
      pdf.byteOffset,
      pdf.byteOffset + pdf.byteLength,
    ) as ArrayBuffer;

    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="weekly-inspection-report-${inspectionId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logOperationalError("pdf.weekly-inspection.failed", error, {
      workflow: "pdf.weekly-inspection",
      inspectionId,
    });
    throw error;
  }
}
