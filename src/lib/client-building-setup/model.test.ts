import { describe, expect, it } from "vitest";

import {
  isSetupRecordId,
  parseAreaNameFormData,
  parseAreaFormData,
  parseAreaTypeFormData,
  parseBuildingNameFormData,
  parseBuildingFormData,
  parseClientFormData,
  parseIdFormData,
} from "./model";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

describe("parseClientFormData", () => {
  it("normalizes a valid Client name", () => {
    expect(parseClientFormData(formData({ name: "  Acme Facilities  " }))).toEqual({
      ok: true,
      data: { name: "Acme Facilities" },
    });
  });

  it("rejects missing Client names", () => {
    expect(parseClientFormData(formData({ name: " " }))).toEqual({
      ok: false,
      errors: { name: "Client name is required." },
      values: { name: "" },
    });
  });

  it("rejects Client names over 160 characters", () => {
    const name = "a".repeat(161);

    expect(parseClientFormData(formData({ name }))).toEqual({
      ok: false,
      errors: { name: "Client name must be 160 characters or fewer." },
      values: { name },
    });
  });
});

describe("parseBuildingFormData", () => {
  it("normalizes valid Building setup input", () => {
    expect(
      parseBuildingFormData(
        formData({
          clientId: "11111111-1111-4111-8111-111111111111",
          name: "  North Tower  ",
        }),
      ),
    ).toEqual({
      ok: true,
      data: {
        clientId: "11111111-1111-4111-8111-111111111111",
        name: "North Tower",
      },
    });
  });

  it("rejects missing or invalid Building parent Clients", () => {
    expect(parseBuildingFormData(formData({ clientId: "not-a-uuid", name: "HQ" }))).toEqual({
      ok: false,
      errors: { clientId: "Select an active Client." },
      values: { clientId: "not-a-uuid", name: "HQ" },
    });
  });

  it("rejects missing Building names", () => {
    expect(
      parseBuildingFormData(
        formData({
          clientId: "11111111-1111-4111-8111-111111111111",
          name: " ",
        }),
      ),
    ).toEqual({
      ok: false,
      errors: { name: "Building name is required." },
      values: { clientId: "11111111-1111-4111-8111-111111111111", name: "" },
    });
  });

  it("rejects Building names over 160 characters", () => {
    const name = "a".repeat(161);

    expect(
      parseBuildingFormData(
        formData({ clientId: "11111111-1111-4111-8111-111111111111", name }),
      ),
    ).toEqual({
      ok: false,
      errors: { name: "Building name must be 160 characters or fewer." },
      values: { clientId: "11111111-1111-4111-8111-111111111111", name },
    });
  });
});

describe("parseAreaTypeFormData", () => {
  it("normalizes a valid Area Type name", () => {
    expect(parseAreaTypeFormData(formData({ name: "  Restroom  " }))).toEqual({
      ok: true,
      data: { name: "Restroom" },
    });
  });

  it("rejects missing Area Type names", () => {
    expect(parseAreaTypeFormData(formData({ name: " " }))).toEqual({
      ok: false,
      errors: { name: "Area Type name is required." },
      values: { name: "" },
    });
  });

  it("rejects Area Type names over 160 characters", () => {
    const name = "a".repeat(161);

    expect(parseAreaTypeFormData(formData({ name }))).toEqual({
      ok: false,
      errors: { name: "Area Type name must be 160 characters or fewer." },
      values: { name },
    });
  });
});

describe("parseAreaFormData", () => {
  it("normalizes valid Area setup input", () => {
    expect(
      parseAreaFormData(
        formData({
          buildingId: "33333333-3333-4333-8333-333333333333",
          areaTypeId: "55555555-5555-4555-8555-555555555555",
          name: "  First Floor Restroom  ",
        }),
      ),
    ).toEqual({
      ok: true,
      data: {
        buildingId: "33333333-3333-4333-8333-333333333333",
        areaTypeId: "55555555-5555-4555-8555-555555555555",
        name: "First Floor Restroom",
      },
    });
  });

  it("rejects invalid Area parent Building and Area Type ids", () => {
    expect(
      parseAreaFormData(
        formData({ buildingId: "not-a-building", areaTypeId: "not-a-type", name: "Lobby" }),
      ),
    ).toEqual({
      ok: false,
      errors: {
        buildingId: "Select an active Building.",
        areaTypeId: "Select an active Area Type.",
      },
      values: { buildingId: "not-a-building", areaTypeId: "not-a-type", name: "Lobby" },
    });
  });

  it("rejects missing Area names", () => {
    expect(
      parseAreaFormData(
        formData({
          buildingId: "33333333-3333-4333-8333-333333333333",
          areaTypeId: "55555555-5555-4555-8555-555555555555",
          name: " ",
        }),
      ),
    ).toEqual({
      ok: false,
      errors: { name: "Area name is required." },
      values: {
        buildingId: "33333333-3333-4333-8333-333333333333",
        areaTypeId: "55555555-5555-4555-8555-555555555555",
        name: "",
      },
    });
  });

  it("rejects Area names over 160 characters", () => {
    const name = "a".repeat(161);

    expect(
      parseAreaFormData(
        formData({
          buildingId: "33333333-3333-4333-8333-333333333333",
          areaTypeId: "55555555-5555-4555-8555-555555555555",
          name,
        }),
      ),
    ).toEqual({
      ok: false,
      errors: { name: "Area name must be 160 characters or fewer." },
      values: {
        buildingId: "33333333-3333-4333-8333-333333333333",
        areaTypeId: "55555555-5555-4555-8555-555555555555",
        name,
      },
    });
  });
});

describe("parseAreaNameFormData", () => {
  it("normalizes a valid Area name", () => {
    expect(parseAreaNameFormData(formData({ name: "  First Floor Restroom  " }))).toEqual({
      ok: true,
      name: "First Floor Restroom",
    });
  });

  it("rejects invalid Area names", () => {
    expect(parseAreaNameFormData(formData({ name: " " }))).toEqual({
      ok: false,
      error: "Area name is required.",
      value: "",
    });
  });
});

describe("parseBuildingNameFormData", () => {
  it("normalizes a valid Building name", () => {
    expect(parseBuildingNameFormData(formData({ name: "  North Tower  " }))).toEqual({
      ok: true,
      name: "North Tower",
    });
  });

  it("rejects invalid Building names", () => {
    expect(parseBuildingNameFormData(formData({ name: " " }))).toEqual({
      ok: false,
      error: "Building name is required.",
      value: "",
    });
  });
});

describe("isSetupRecordId", () => {
  it("accepts UUID-shaped setup record ids", () => {
    expect(isSetupRecordId("11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("rejects malformed setup record ids", () => {
    expect(isSetupRecordId("not-a-uuid")).toBe(false);
  });
});

describe("parseIdFormData", () => {
  it("normalizes valid UUID ids", () => {
    expect(parseIdFormData(formData({ id: "11111111-1111-4111-8111-111111111111" }))).toEqual({
      ok: true,
      id: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("rejects missing ids", () => {
    expect(parseIdFormData(formData({ id: "" }))).toEqual({
      ok: false,
      error: "A valid setup record is required.",
    });
  });
});
