import { describe, expect, it } from "vitest";

import { tickets } from "./schema";

describe("database schema", () => {
  it("models app-wide sequential Ticket Numbers", () => {
    expect(tickets.ticketNumber.name).toBe("ticket_number");
  });
});
