import { afterEach, describe, expect, it, vi } from "vitest";

import { logOperationalError, logOperationalInfo } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("operational logger", () => {
  it("logs useful context while redacting secrets and photo evidence values", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logOperationalInfo("ticket.close.started", {
      ticketId: "ticket-1",
      afterPhotoCount: 2,
      storagePath: "tickets/ticket-1/secret.jpg",
      serviceRoleKey: "super-secret",
    });

    const [, event, context] = info.mock.calls[0]!;

    expect(event).toBe("ticket.close.started");
    expect(context).toMatchObject({ ticketId: "ticket-1", afterPhotoCount: 2 });
    expect(JSON.stringify(context)).not.toContain("secret.jpg");
    expect(JSON.stringify(context)).not.toContain("super-secret");
  });

  it("logs errors with safe error metadata", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logOperationalError("draft.submit.failed", new TypeError("failed for tickets/ticket-1/secret.jpg"), {
      inspectionId: "inspection-1",
      password: "do-not-log",
    });

    const [, event, payload] = error.mock.calls[0]!;

    expect(event).toBe("draft.submit.failed");
    expect(payload).toMatchObject({
      context: { inspectionId: "inspection-1", password: "[redacted]" },
      error: { name: "TypeError", message: "failed for [redacted]" },
    });
    expect(JSON.stringify(payload)).not.toContain("do-not-log");
    expect(JSON.stringify(payload)).not.toContain("secret.jpg");
  });
});
