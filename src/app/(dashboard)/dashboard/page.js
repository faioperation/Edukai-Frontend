"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  FileUp,
  ArrowRight,
  Percent,
  Send,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { apiGet } from "@/lib/api";

function formatCompactNumber(n) {
  if (n === null || n === undefined) return "—";
  try {
    return new Intl.NumberFormat().format(Number(n));
  } catch {
    return String(n);
  }
}

function timeAgo(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const mins = Math.round(seconds / 60);
  if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");

  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return rtf.format(-hrs, "hour");

  const days = Math.round(hrs / 24);
  return rtf.format(-days, "day");
}

function activityStyle(action) {
  switch (action) {
    case "CANDIDATE_UPLOAD":
      return {
        dotClass: "bg-sky-500",
        rowClass:
          "bg-sky-50/70 dark:bg-sky-950/25 border-sky-100 dark:border-sky-900/40",
      };
    case "CONTACT_IMPORT":
      return {
        dotClass: "bg-violet-500",
        rowClass:
          "bg-violet-50/70 dark:bg-violet-950/25 border-violet-100 dark:border-violet-900/40",
      };
    case "ORGANIZATION_IMPORT":
      return {
        dotClass: "bg-amber-500",
        rowClass:
          "bg-amber-50/70 dark:bg-amber-950/25 border-amber-100 dark:border-amber-900/40",
      };
    default:
      return {
        dotClass: "bg-emerald-500",
        rowClass:
          "bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/40",
      };
  }
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-overview", "stats"],
    queryFn: async () => {
      const res = await apiGet("/dashboard-overview/stats");
      if (!res?.success) throw new Error(res?.message || "Failed to fetch stats");
      return res.data;
    },
  });

  const stats = useMemo(() => {
    const d = data || {};
    const valueOrLoading = (v, suffix = "") =>
      isLoading ? "…" : `${suffix ? `${v ?? "—"}${suffix}` : v ?? "—"}`;

    return [
      {
        title: "Total CV Import",
        value: isLoading ? "…" : formatCompactNumber(d.totalCvImport),
        icon: FileUp,
        className:
          "border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/40",
        iconClass:
          "bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
      },
      {
        title: "Quality Passed",
        value: isLoading ? "…" : formatCompactNumber(d.qualityPassed),
        icon: ShieldCheck,
        className:
          "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40",
        iconClass:
          "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      },
      {
        title: "Quality Failed",
        value: isLoading ? "…" : formatCompactNumber(d.qualityFailed),
        icon: ShieldX,
        className:
          "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40",
        iconClass:
          "bg-rose-600/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      },
      {
        title: "CV Submitted",
        value: isLoading ? "…" : formatCompactNumber(d.cvSubmitted),
        icon: Send,
        className:
          "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/40",
        iconClass:
          "bg-sky-600/10 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
      },
      {
        title: "Success Rate",
        value: isLoading ? "…" : d.successRate ?? "—",
        icon: Percent,
        className:
          "border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/40",
        iconClass:
          "bg-violet-600/10 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
      },
    ];
  }, [data, isLoading]);

  const activities = useMemo(() => {
    if (isLoading) return [];
    const logs = data?.latestActivityLogs || [];
    return logs.slice(0, 4).map((log) => {
      const userLabel = log?.user?.name || log?.user?.email || "System";
      const { dotClass, rowClass } = activityStyle(log?.action);
      return {
        id: log?.id || `${log?.createdAt}-${log?.action}`,
        title: log?.message || log?.action || "Activity",
        subtitle: userLabel,
        time: log?.createdAt ? timeAgo(log.createdAt) : "",
        dotClass,
        rowClass,
      };
    });
  }, [data, isLoading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary dark:text-primary">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-black/60 dark:text-slate-400">
            Monitor your CV automation workflow in real-time
          </p>
        </div>

        <Link
          href="/bulk-import"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 sm:w-auto dark:bg-primary"
        >
          <CheckCircle2 size={18} />
          Bulk Import
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.title}
              className={[
                "group rounded-2xl transition-transform duration-200 hover:scale-[1.02]",
                s.className,
              ].join(" ")}
            >
              <CardContent className="flex min-h-[120px] items-center justify-between gap-4">
                <div>
                  <div className="text-base font-medium text-black/70 dark:text-slate-300">
                    {s.title}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-tight text-gray-800 dark:text-slate-100">
                    {s.value}
                  </div>
                </div>

                <div
                  className={[
                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                    s.iconClass,
                  ].join(" ")}
                >
                  <Icon size={26} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <CardTitle className="text-base font-semibold text-black dark:text-slate-100">
              Recent Automated Activities
            </CardTitle>
            <p className="mt-1 text-sm text-black/60 dark:text-slate-400">
              Latest events from your CV workflow
            </p>
          </div>
          {/* <button
            type="button"
            className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Mark all as rea
          </button> */}
        </CardHeader>
        <CardContent className="space-y-3">
          {isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {error?.message || "Failed to load dashboard activities."}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              Loading dashboard stats...
            </div>
          ) : null}

          {activities.map((a) => (
            <div
              key={a.id}
              className={[
                "flex items-center justify-between gap-4 rounded-xl border px-4 py-3",
                a.rowClass,
              ].join(" ")}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={[
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    a.dotClass,
                  ].join(" ")}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-black dark:text-slate-100">
                    {a.title}
                  </div>
                  <div className="truncate text-xs text-black/60 dark:text-slate-400">
                    {a.subtitle}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-xs text-black/50 dark:text-slate-400">
                {a.time}
              </div>
            </div>
          ))}

          <Link
            href="/activities"
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-primary"
          >
            See More <ArrowRight size={16} />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

