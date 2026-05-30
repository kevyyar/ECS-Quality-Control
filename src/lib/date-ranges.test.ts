import { describe, expect, it } from "vitest";

import { resolveDateRange } from "./date-ranges";

function ymd(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
}

describe("resolveDateRange", () => {
  const now = new Date(2026, 4, 27, 15, 30);

  it("defaults to This Week using Monday calendar boundaries", () => {
    const range = resolveDateRange({ now });

    expect(range.preset).toBe("this-week");
    expect(range.label).toBe("This Week");
    expect(ymd(range.startAt)).toBe("2026-05-25");
    expect(ymd(range.endBefore)).toBe("2026-06-01");
    expect(range.startDateInput).toBe("2026-05-25");
    expect(range.endDateInput).toBe("2026-05-31");
  });

  it("resolves Last Week and This Month presets", () => {
    expect(ymd(resolveDateRange({ preset: "last-week", now }).startAt)).toBe(
      "2026-05-18",
    );
    expect(ymd(resolveDateRange({ preset: "last-week", now }).endBefore)).toBe(
      "2026-05-25",
    );
    expect(ymd(resolveDateRange({ preset: "this-month", now }).startAt)).toBe(
      "2026-05-01",
    );
    expect(ymd(resolveDateRange({ preset: "this-month", now }).endBefore)).toBe(
      "2026-06-01",
    );
  });

  it("treats custom end dates as inclusive form values", () => {
    const range = resolveDateRange({
      preset: "custom",
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      now,
    });

    expect(range.preset).toBe("custom");
    expect(range.isCustomValid).toBe(true);
    expect(ymd(range.startAt)).toBe("2026-05-10");
    expect(ymd(range.endBefore)).toBe("2026-05-13");
    expect(range.startDateInput).toBe("2026-05-10");
    expect(range.endDateInput).toBe("2026-05-12");
  });

  it("falls back to This Week when a custom range is invalid", () => {
    const range = resolveDateRange({
      preset: "custom",
      startDate: "2026-05-12",
      endDate: "2026-05-10",
      now,
    });

    expect(range.preset).toBe("this-week");
    expect(range.isCustomValid).toBe(false);
    expect(ymd(range.startAt)).toBe("2026-05-25");
  });
});
