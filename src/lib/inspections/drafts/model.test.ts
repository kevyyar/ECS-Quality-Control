import { describe, expect, it } from "vitest";

import {
  isReportableInspectionStatus,
  parseStartDraftInspectionFormData,
} from "./model";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

describe("Draft Inspection model", () => {
  it("parses a Building id for starting a Draft Inspection", () => {
    expect(
      parseStartDraftInspectionFormData(
        formData({ buildingId: "33333333-3333-4333-8333-333333333333" }),
      ),
    ).toEqual({
      ok: true,
      data: { buildingId: "33333333-3333-4333-8333-333333333333" },
    });
  });

  it("rejects a missing Building id when starting a Draft Inspection", () => {
    expect(parseStartDraftInspectionFormData(formData({ buildingId: "" }))).toEqual({
      ok: false,
      errors: { buildingId: "Select a Building." },
      values: { buildingId: "" },
    });
  });

  it("does not treat Draft Inspections as reportable", () => {
    expect(isReportableInspectionStatus("draft")).toBe(false);
    expect(isReportableInspectionStatus("submitted")).toBe(true);
  });
});
