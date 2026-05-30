import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("health route", () => {
  it("returns a no-store healthy operational signal", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ status: "ok", service: "ecs-qc" });
    expect(body).toHaveProperty("checkedAt");
  });
});
