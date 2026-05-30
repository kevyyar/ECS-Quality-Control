export type DateRangePreset = "this-week" | "last-week" | "this-month" | "custom";

export type ResolvedDateRange = {
  preset: DateRangePreset;
  label: string;
  startAt: Date;
  endBefore: Date;
  startDateInput: string;
  endDateInput: string;
  isCustomValid: boolean;
};

type ResolveDateRangeInput = {
  preset?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  now?: Date | undefined;
};

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string | undefined): Date | null {
  if (!value || !dateInputPattern.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function mondayFor(date: Date): Date {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  return addDays(start, -daysSinceMonday);
}

function resolved(
  preset: DateRangePreset,
  label: string,
  startAt: Date,
  endBefore: Date,
  isCustomValid: boolean,
): ResolvedDateRange {
  return {
    preset,
    label,
    startAt,
    endBefore,
    startDateInput: dateInputValue(startAt),
    endDateInput: dateInputValue(addDays(endBefore, -1)),
    isCustomValid,
  };
}

function thisWeek(now: Date, isCustomValid = true): ResolvedDateRange {
  const startAt = mondayFor(now);

  return resolved("this-week", "This Week", startAt, addDays(startAt, 7), isCustomValid);
}

export function resolveDateRange(input: ResolveDateRangeInput = {}): ResolvedDateRange {
  const now = input.now ?? new Date();

  if (input.preset === "last-week") {
    const thisWeekStart = mondayFor(now);
    const startAt = addDays(thisWeekStart, -7);

    return resolved("last-week", "Last Week", startAt, thisWeekStart, true);
  }

  if (input.preset === "this-month") {
    const startAt = new Date(now.getFullYear(), now.getMonth(), 1);
    const endBefore = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return resolved("this-month", "This Month", startAt, endBefore, true);
  }

  if (input.preset === "custom") {
    const startAt = parseDateInput(input.startDate);
    const endAt = parseDateInput(input.endDate);

    if (startAt && endAt && endAt >= startAt) {
      return resolved("custom", "Custom Range", startAt, addDays(endAt, 1), true);
    }

    return thisWeek(now, false);
  }

  return thisWeek(now);
}
