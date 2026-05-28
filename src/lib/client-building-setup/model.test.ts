import { describe, expect, it } from "vitest";

import {
  isSetupRecordId,
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
