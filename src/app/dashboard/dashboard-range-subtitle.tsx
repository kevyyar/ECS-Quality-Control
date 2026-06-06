"use client";

import { useSearchParams } from "next/navigation";

import { resolveDateRange } from "@/lib/date-ranges";

function formatDateRangeLabel(startAt: Date, endBefore: Date): string {
  const endDisplay = new Date(endBefore.getTime() - 86_400_000);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${fmt.format(startAt)} – ${fmt.format(endDisplay)}`;
}

type DashboardRangeSubtitleProps = {
  email: string;
  initialLabel: string;
  initialStartAt: string;
  initialEndBefore: string;
};

export function DashboardRangeSubtitle({
  email,
  initialLabel,
  initialStartAt,
  initialEndBefore,
}: DashboardRangeSubtitleProps) {
  const searchParams = useSearchParams();
  const hasSearchParams = searchParams.size > 0;

  const range = resolveDateRange({
    preset: searchParams.get("range") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });

  const label = hasSearchParams ? range.label : initialLabel;
  const rangeLabel = hasSearchParams
    ? formatDateRangeLabel(range.startAt, range.endBefore)
    : formatDateRangeLabel(new Date(initialStartAt), new Date(initialEndBefore));

  return (
    <p className="max-w-xl text-base leading-relaxed text-white/70">
      {email} · {label} ({rangeLabel})
    </p>
  );
}
