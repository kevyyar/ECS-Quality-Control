"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useTransition } from "react";

import {
  buildDashboardRangeHref,
  DASHBOARD_RANGE_PRESETS,
  type DashboardRangePreset,
} from "@/lib/dashboard/range-url";
import { resolveDateRange } from "@/lib/date-ranges";
import { ux } from "@/lib/ux/tokens";

function CalIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

type DashboardRangeFilterProps = {
  initialPreset: DashboardRangePreset;
  initialStartDateInput: string;
  initialEndDateInput: string;
  initialIsCustomValid: boolean;
};

export function DashboardRangeFilter({
  initialPreset,
  initialStartDateInput,
  initialEndDateInput,
  initialIsCustomValid,
}: DashboardRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const range = resolveDateRange({
    preset: searchParams.get("range") ?? initialPreset,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });

  const preset = searchParams.size > 0 ? range.preset : initialPreset;
  const startDateInput = searchParams.size > 0 ? range.startDateInput : initialStartDateInput;
  const endDateInput = searchParams.size > 0 ? range.endDateInput : initialEndDateInput;
  const isCustomValid = searchParams.size > 0 ? range.isCustomValid : initialIsCustomValid;

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router],
  );

  const onPresetClick = (nextPreset: DashboardRangePreset) => {
    navigate(buildDashboardRangeHref(nextPreset, startDateInput, endDateInput));
  };

  const onCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    navigate(buildDashboardRangeHref("custom", startDate, endDate));
  };

  const onReset = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div aria-busy={isPending} className={`space-y-4 transition-opacity ${isPending ? "opacity-70" : ""}`}>
      <div
        aria-label="Reporting window presets"
        className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1"
        role="tablist"
      >
        {DASHBOARD_RANGE_PRESETS.map((option) => {
          const isActive = preset === option.value;

          return (
            <button
              aria-selected={isActive}
              className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400 ${
                isActive
                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                  : "text-muted-ink hover:bg-white/70 hover:text-slate-900"
              }`}
              key={option.value}
              onClick={() => onPresetClick(option.value)}
              role="tab"
              type="button"
            >
              <span>{option.label}</span>
              <span
                className={`text-[0.65rem] font-medium uppercase tracking-wider ${
                  isActive ? "text-brand-forest-700" : "text-slate-400"
                }`}
              >
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>

      <form className="grid gap-3 sm:grid-cols-3 sm:items-end" onSubmit={onCustomSubmit}>
        <label className={ux.formField} htmlFor="dashboard-start-date">
          <span className={ux.fieldLabel}>Start date</span>
          <div className="relative">
            <CalIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${ux.input} pl-9`}
              defaultValue={startDateInput}
              id="dashboard-start-date"
              key={`start-${startDateInput}`}
              name="startDate"
              type="date"
            />
          </div>
        </label>
        <label className={ux.formField} htmlFor="dashboard-end-date">
          <span className={ux.fieldLabel}>End date</span>
          <div className="relative">
            <CalIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${ux.input} pl-9`}
              defaultValue={endDateInput}
              id="dashboard-end-date"
              key={`end-${endDateInput}`}
              name="endDate"
              type="date"
            />
          </div>
        </label>
        <div className={ux.searchActions}>
          <button
            className={`${ux.primaryButton} inline-flex items-center gap-2`}
            disabled={isPending}
            type="submit"
          >
            Apply range
            <ArrowIcon className="size-3.5" />
          </button>
          <button
            className={`${ux.textLink} disabled:cursor-wait`}
            disabled={isPending}
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>
      </form>

      {!isCustomValid ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          Custom range was invalid, so the dashboard is showing This Week.
        </p>
      ) : null}
    </div>
  );
}
