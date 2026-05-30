import { describe, expect, it } from "vitest";

import { formatTicketNumber, parseCloseTicketFormData, parseTicketSearch } from "./model";

describe("Ticket model", () => {
  it("formats app-wide sequential Ticket Numbers", () => {
    expect(formatTicketNumber(1)).toBe("T-000001");
    expect(formatTicketNumber(42)).toBe("T-000042");
  });

  it("parses basic Ticket search by formatted number, raw number, and title", () => {
    expect(parseTicketSearch(" T-000042 ")).toEqual({ term: "T-000042", ticketNumber: 42 });
    expect(parseTicketSearch("42")).toEqual({ term: "42", ticketNumber: 42 });
    expect(parseTicketSearch("restroom mirror")).toEqual({
      term: "restroom mirror",
      ticketNumber: null,
    });
    expect(parseTicketSearch("   ")).toEqual({ term: "", ticketNumber: null });
  });

  it("requires a Ticket, resolution note, and After Photo to close", () => {
    const data = new FormData();

    const result = parseCloseTicketFormData(data);

    expect(result).toEqual({
      ok: false,
      values: { ticketId: "", resolutionNote: "" },
      errors: {
        ticketId: "Choose an Open Ticket.",
        resolutionNote: "Enter a resolution note.",
        afterPhotos: "Attach at least one After Photo.",
      },
    });
  });

  it("parses closure form data and ignores empty file controls", () => {
    const data = new FormData();
    const photo = new File(["after"], "after.jpg", { type: "image/jpeg" });

    data.set("ticketId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    data.set("resolutionNote", "  Re-cleaned and verified.  ");
    data.append("afterPhotos", new File([], "", { type: "application/octet-stream" }));
    data.append("afterPhotos", photo);

    const result = parseCloseTicketFormData(data);

    expect(result).toEqual({
      ok: true,
      data: {
        ticketId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        resolutionNote: "Re-cleaned and verified.",
        afterPhotos: [photo],
      },
    });
  });
});
