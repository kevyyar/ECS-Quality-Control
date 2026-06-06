export type DashboardRangePreset = "this-week" | "last-week" | "this-month" | "custom";

export const DASHBOARD_RANGE_PRESETS: {
  value: DashboardRangePreset;
  label: string;
  hint: string;
}[] = [
  { value: "this-week", label: "This Week", hint: "Mon → Sun" },
  { value: "last-week", label: "Last Week", hint: "Mon → Sun" },
  { value: "this-month", label: "This Month", hint: "Calendar month" },
  { value: "custom", label: "Custom", hint: "Pick a range" },
];

export function buildDashboardRangeHref(
  preset: DashboardRangePreset,
  startDateInput: string,
  endDateInput: string,
): string {
  if (preset === "custom") {
    const params = new URLSearchParams({
      range: "custom",
      startDate: startDateInput,
      endDate: endDateInput,
    });

    return `/dashboard?${params.toString()}`;
  }

  return `/dashboard?range=${preset}`;
}

export function dashboardRangeSearchKey(input: {
  range?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}): string {
  return [input.range ?? "this-week", input.startDate ?? "", input.endDate ?? ""].join("|");
}
