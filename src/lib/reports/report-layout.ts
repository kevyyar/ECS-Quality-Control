import { pdfImageSource } from "./pdf-image-source";

export type ReportTheme = {
  brand: string;
  brandText: string;
  border: string;
  ink: string;
  muted: string;
  surface: string;
  warning: string;
};

export type ReportBranding = {
  displayName: string;
  primaryBrandColor: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactWebsite?: string | null;
  contactAddress?: string | null;
};

export const REPORT_PAGE = {
  width: 612,
  footerLineY: 720,
  footerTextY: 730,
  contentBottomY: 710,
} as const;

export function buildBaseReportTheme(primaryBrandColor: string): ReportTheme {
  const brand = /^#[0-9a-f]{6}$/i.test(primaryBrandColor)
    ? primaryBrandColor
    : "#0f766e";

  return {
    brand,
    brandText: contrastTextColor(brand),
    border: "#dbe4e8",
    ink: "#0f172a",
    muted: "#64748b",
    surface: "#f8fafc",
    warning: "#b45309",
  };
}

function contrastTextColor(hexColor: string): string {
  const red = Number.parseInt(hexColor.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hexColor.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hexColor.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance > 0.62 ? "#0f172a" : "#ffffff";
}

export function reportContactLines(branding: ReportBranding): string[] {
  return [
    branding.contactPhone,
    branding.contactEmail,
    branding.contactWebsite,
    branding.contactAddress,
  ].filter((line): line is string => Boolean(line));
}

function companyInitials(displayName: string): string {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "QC";
}

export function drawText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  options: PDFKit.Mixins.TextOptions & { bold?: boolean; color?: string; size?: number } = {},
): number {
  doc
    .fillColor(options.color ?? "#0f172a")
    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(options.size ?? 10)
    .text(text, x, y, options);

  return doc.y;
}

export function ensureReportSpace(
  doc: PDFKit.PDFDocument,
  height: number,
  bottomY = REPORT_PAGE.contentBottomY,
): void {
  if (doc.y + height <= bottomY) {
    return;
  }

  doc.addPage();
  doc.y = doc.page.margins.top;
}

export function drawCompanyMark(input: {
  doc: PDFKit.PDFDocument;
  branding: Pick<ReportBranding, "displayName">;
  logoAsset: Buffer | null;
  pageMargin: number;
  theme: Pick<ReportTheme, "brand" | "brandText">;
}): void {
  const { doc, branding, logoAsset, pageMargin, theme } = input;
  const x = pageMargin;
  const y = 32;
  const size = 64;

  doc.roundedRect(x, y, size, size, 14).fill("#ffffff");

  if (logoAsset) {
    try {
      doc.image(pdfImageSource(logoAsset), x + 8, y + 8, {
        fit: [48, 48],
        align: "center",
        valign: "center",
      });
      return;
    } catch {
      // Fall back to initials when the saved logo cannot be embedded by PDFKit.
    }
  }

  doc.roundedRect(x + 8, y + 8, 48, 48, 12).fill(theme.brand);
  drawText(doc, companyInitials(branding.displayName), x + 8, y + 23, {
    width: 48,
    align: "center",
    color: theme.brandText,
    size: 16,
    bold: true,
  });
}

export function drawReportFooter(input: {
  doc: PDFKit.PDFDocument;
  pageMargin: number;
  contentWidth: number;
  label: string;
  theme: Pick<ReportTheme, "border" | "muted">;
}): void {
  const { doc, pageMargin, contentWidth, label, theme } = input;
  const range = doc.bufferedPageRange();

  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    doc.rect(pageMargin, REPORT_PAGE.footerLineY, contentWidth, 1).fill(theme.border);
    drawText(doc, label, pageMargin, REPORT_PAGE.footerTextY, {
      width: 240,
      color: theme.muted,
      size: 7,
      lineBreak: false,
    });
    drawText(doc, `Page ${pageIndex + 1} of ${range.count}`, pageMargin + 350, REPORT_PAGE.footerTextY, {
      width: 160,
      align: "right",
      color: theme.muted,
      size: 7,
      lineBreak: false,
    });
  }
}
