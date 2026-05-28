import { describe, expect, it } from "vitest";
import { appConfig } from "./app-config";

describe("appConfig", () => {
  it("names the internal janitorial quality-control app", () => {
    expect(appConfig.name).toBe("Janitorial Quality Control");
    expect(appConfig.shortName).toBe("ECS QC");
  });
});
