import { describe, expect, it } from "vitest";

import { parseAddCorrectionNoteFormData } from "./model";

describe("Correction Note model", () => {
  it("requires a target and non-blank note", () => {
    const result = parseAddCorrectionNoteFormData(new FormData());

    expect(result).toEqual({
      ok: false,
      values: { targetType: "", targetId: "", note: "" },
      errors: {
        targetType: "Choose a Submitted Inspection or Ticket.",
        targetId: "Choose a Submitted Inspection or Ticket.",
        note: "Enter a Correction Note.",
      },
    });
  });

  it("parses Submitted Inspection targets", () => {
    const data = new FormData();
    data.set("targetType", "submitted_inspection");
    data.set("targetId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    data.set("note", "  Clarifying note.  ");

    expect(parseAddCorrectionNoteFormData(data)).toEqual({
      ok: true,
      data: {
        targetType: "submitted_inspection",
        targetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        note: "Clarifying note.",
      },
    });
  });

  it("parses Ticket targets", () => {
    const data = new FormData();
    data.set("targetType", "ticket");
    data.set("targetId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    data.set("note", "Ticket clarification.");

    expect(parseAddCorrectionNoteFormData(data)).toEqual({
      ok: true,
      data: {
        targetType: "ticket",
        targetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        note: "Ticket clarification.",
      },
    });
  });

  it("rejects overlong notes", () => {
    const data = new FormData();
    data.set("targetType", "ticket");
    data.set("targetId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    data.set("note", "a".repeat(1001));

    expect(parseAddCorrectionNoteFormData(data)).toEqual({
      ok: false,
      values: {
        targetType: "ticket",
        targetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        note: "a".repeat(1001),
      },
      errors: { note: "Correction Notes must be 1,000 characters or fewer." },
    });
  });
});
