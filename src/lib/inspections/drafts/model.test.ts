import { describe, expect, it } from "vitest";

import {
  isReportableInspectionStatus,
  parseAddOneOffAreaInspectionFormData,
  parseDiscardDraftInspectionFormData,
  parseSaveDraftInspectionItemResultFormData,
  parseSkipDraftAreaInspectionFormData,
  parseStartDraftInspectionFormData,
  parseSubmitDraftInspectionFormData,
  parseUnskipDraftAreaInspectionFormData,
  validateDraftInspectionForSubmission,
  type DraftInspectionRecord,
} from "./model";

const inspectionId = "abababab-abab-4aba-8aba-abababababab";
const areaInspectionId = "cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd";
const oneOffAreaInspectionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const itemId = "efefefef-efef-4efe-8efe-efefefefefef";
const oneOffItemId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const areaId = "77777777-7777-4777-8777-777777777777";
const areaTypeId = "55555555-5555-4555-8555-555555555555";
const templateId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function validDraft(): DraftInspectionRecord {
  return {
    id: inspectionId,
    status: "draft",
    clientId: "11111111-1111-4111-8111-111111111111",
    buildingId: "33333333-3333-4333-8333-333333333333",
    clientNameSnapshot: "Acme Facilities",
    buildingNameSnapshot: "North Tower",
    startedByAuthUserId: "99999999-9999-4999-8999-999999999999",
    startedByEmail: "supervisor@example.com",
    startedAt: new Date("2026-05-29T14:30:00Z"),
    areaInspections: [
      {
        id: areaInspectionId,
        inspectionId,
        source: "planned",
        position: 1,
        areaId,
        areaTypeId,
        inspectionTemplateId: templateId,
        areaNameSnapshot: "First Floor Restroom",
        areaTypeNameSnapshot: "Restroom",
        inspectionTemplateNameSnapshot: "Restroom Standard",
        inspectionTemplateDescriptionSnapshot: "Weekly restroom checks",
        isSkipped: false,
        skipReason: null,
        items: [
          {
            id: itemId,
            areaInspectionId,
            sourceTemplateItemId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            sourceTemplateSectionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            position: 1,
            sectionNameSnapshot: "Fixtures",
            itemNameSnapshot: "Mirrors",
            itemDescriptionSnapshot: "No streaks",
            resultStatus: "pass",
            resultNote: null,
            beforePhotos: [],
          },
        ],
      },
    ],
  };
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

  it("parses item results while allowing a Fail note to be supplied later", () => {
    expect(
      parseSaveDraftInspectionItemResultFormData(
        formData({
          inspectionId,
          itemId,
          resultStatus: "fail",
          resultNote: "  Mirror cracked  ",
        }),
      ),
    ).toEqual({
      ok: true,
      data: {
        inspectionId,
        itemId,
        resultStatus: "fail",
        resultNote: "Mirror cracked",
      },
    });

    expect(
      parseSaveDraftInspectionItemResultFormData(
        formData({ inspectionId, itemId, resultStatus: "", resultNote: "" }),
      ),
    ).toEqual({
      ok: true,
      data: { inspectionId, itemId, resultStatus: null, resultNote: "" },
    });
  });

  it("rejects invalid item result form values", () => {
    expect(
      parseSaveDraftInspectionItemResultFormData(
        formData({
          inspectionId: "bad-id",
          itemId,
          resultStatus: "maybe",
          resultNote: "x".repeat(1001),
        }),
      ),
    ).toEqual({
      ok: false,
      errors: {
        inspectionId: "Select a Draft Inspection.",
        resultStatus: "Select Pass, Fail, Not Applicable, or Unanswered.",
        resultNote: "Notes must be 1,000 characters or fewer.",
      },
      values: {
        inspectionId: "bad-id",
        itemId,
        resultStatus: "maybe",
        resultNote: "x".repeat(1001),
      },
    });
  });

  it("parses skip, unskip, one-off, submit, and discard Draft Inspection inputs", () => {
    expect(
      parseSkipDraftAreaInspectionFormData(
        formData({ inspectionId, areaInspectionId, skipReason: "  Closed for repairs  " }),
      ),
    ).toEqual({
      ok: true,
      data: { inspectionId, areaInspectionId, skipReason: "Closed for repairs" },
    });
    expect(
      parseUnskipDraftAreaInspectionFormData(formData({ inspectionId, areaInspectionId })),
    ).toEqual({ ok: true, data: { inspectionId, areaInspectionId } });
    expect(
      parseAddOneOffAreaInspectionFormData(formData({ inspectionId, areaId, inspectionTemplateId: templateId })),
    ).toEqual({ ok: true, data: { inspectionId, areaId, inspectionTemplateId: templateId } });
    expect(parseSubmitDraftInspectionFormData(formData({ inspectionId }))).toEqual({
      ok: true,
      data: { inspectionId },
    });
    expect(parseDiscardDraftInspectionFormData(formData({ inspectionId }))).toEqual({
      ok: true,
      data: { inspectionId },
    });
  });

  it("rejects missing skip reasons", () => {
    expect(
      parseSkipDraftAreaInspectionFormData(
        formData({ inspectionId, areaInspectionId, skipReason: "   " }),
      ),
    ).toEqual({
      ok: false,
      errors: { skipReason: "Enter a skip reason." },
      values: { inspectionId, areaInspectionId, skipReason: "" },
    });
  });

  it("validates Draft submission rules", () => {
    expect(validateDraftInspectionForSubmission(validDraft())).toEqual({
      ok: true,
      errors: {},
    });

    const unanswered = validDraft();
    unanswered.areaInspections[0]!.items[0]!.resultStatus = null;
    expect(validateDraftInspectionForSubmission(unanswered)).toMatchObject({
      ok: false,
      errors: { items: { [itemId]: ["Answer this item before submitting."] } },
    });

    const failedWithoutIssueNote = validDraft();
    failedWithoutIssueNote.areaInspections[0]!.items[0]!.resultStatus = "fail";
    failedWithoutIssueNote.areaInspections[0]!.items[0]!.resultNote = "   ";
    expect(validateDraftInspectionForSubmission(failedWithoutIssueNote)).toMatchObject({
      ok: false,
      errors: {
        items: {
          [itemId]: [
            "Enter an issue note for failed items.",
            "Attach at least one Before Photo for failed items.",
          ],
        },
      },
    });

    const failedWithoutBeforePhoto = validDraft();
    failedWithoutBeforePhoto.areaInspections[0]!.items[0]!.resultStatus = "fail";
    failedWithoutBeforePhoto.areaInspections[0]!.items[0]!.resultNote = "Mirror cracked";
    expect(validateDraftInspectionForSubmission(failedWithoutBeforePhoto)).toMatchObject({
      ok: false,
      errors: { items: { [itemId]: ["Attach at least one Before Photo for failed items."] } },
    });

    const failedWithBeforePhoto = validDraft();
    failedWithBeforePhoto.areaInspections[0]!.items[0]!.resultStatus = "fail";
    failedWithBeforePhoto.areaInspections[0]!.items[0]!.resultNote = "Mirror cracked";
    failedWithBeforePhoto.areaInspections[0]!.items[0]!.beforePhotos = [
      {
        id: "10101010-1010-4101-8101-101010101010",
        inspectionItemId: itemId,
        evidenceType: "before_photo",
        storagePath: "inspections/drafts/photo.jpg",
        uploadedByAuthUserId: "99999999-9999-4999-8999-999999999999",
        uploadedAt: new Date("2026-05-29T15:00:00Z"),
      },
    ];
    expect(validateDraftInspectionForSubmission(failedWithBeforePhoto)).toEqual({
      ok: true,
      errors: {},
    });

    const passedWithBeforePhoto = validDraft();
    passedWithBeforePhoto.areaInspections[0]!.items[0]!.beforePhotos = [
      {
        id: "10101010-1010-4101-8101-101010101010",
        inspectionItemId: itemId,
        evidenceType: "before_photo",
        storagePath: "inspections/drafts/photo.jpg",
        uploadedByAuthUserId: "99999999-9999-4999-8999-999999999999",
        uploadedAt: new Date("2026-05-29T15:00:00Z"),
      },
    ];
    expect(validateDraftInspectionForSubmission(passedWithBeforePhoto)).toMatchObject({
      ok: false,
      errors: { items: { [itemId]: ["Before Photos are only allowed for failed items."] } },
    });
  });

  it("allows skipped planned Area Inspections and ignores their unanswered items", () => {
    const draft = validDraft();
    draft.areaInspections.push({
      ...draft.areaInspections[0]!,
      id: "12121212-1212-4121-8121-121212121212",
      source: "planned",
      isSkipped: true,
      skipReason: "Tenant denied access",
      items: [{ ...draft.areaInspections[0]!.items[0]!, id: oneOffItemId, resultStatus: null }],
    });

    expect(validateDraftInspectionForSubmission(draft)).toEqual({ ok: true, errors: {} });
  });

  it("rejects invalid skipped Area Inspection states and all-skipped Drafts", () => {
    const allSkipped = validDraft();
    allSkipped.areaInspections[0]!.isSkipped = true;
    allSkipped.areaInspections[0]!.skipReason = "Tenant denied access";
    expect(validateDraftInspectionForSubmission(allSkipped)).toMatchObject({
      ok: false,
      errors: { inspection: "Submit at least one non-skipped Area Inspection." },
    });

    const skippedOneOff = validDraft();
    skippedOneOff.areaInspections.push({
      ...skippedOneOff.areaInspections[0]!,
      id: oneOffAreaInspectionId,
      source: "one_off",
      isSkipped: true,
      skipReason: "Not needed",
      items: [],
    });
    expect(validateDraftInspectionForSubmission(skippedOneOff)).toMatchObject({
      ok: false,
      errors: {
        areaInspections: {
          [oneOffAreaInspectionId]: ["Only planned Area Inspections can be skipped."],
        },
      },
    });
  });

  it("does not treat Draft Inspections as reportable", () => {
    expect(isReportableInspectionStatus("draft")).toBe(false);
    expect(isReportableInspectionStatus("submitted")).toBe(true);
  });
});
