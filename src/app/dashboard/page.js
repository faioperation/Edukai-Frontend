import Link from "next/link";
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

const stats = [
  {
    title: "Total CV Import",
    value: "1,284",
    icon: FileUp,
    className:
      "border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/40",
    iconClass:
      "bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  {
    title: "Quality Passed",
    value: "1,032",
    icon: ShieldCheck,
    className:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40",
    iconClass:
      "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    title: "Quality Failed",
    value: "87",
    icon: ShieldX,
    className:
      "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40",
    iconClass:
      "bg-rose-600/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    title: "Pending Review",
    value: "165",
    icon: Clock,
    className:
      "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40",
    iconClass:
      "bg-amber-600/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    title: "CV Submitted",
    value: "978",
    icon: Send,
    className:
      "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/40",
    iconClass:
      "bg-sky-600/10 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  },
  {
    title: "Success Rate",
    value: "92.4%",
    icon: Percent,
    className:
      "border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/40",
    iconClass:
      "bg-violet-600/10 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  },
];

const activities = [
  {
    title: "CV processed: Tahira Tabassum",
    subtitle: "System",
    time: "31 mins ago",
    dotClass: "bg-emerald-500",
    rowClass:
      "bg-indigo-50/60 dark:bg-indigo-950/25 border-indigo-100 dark:border-indigo-900/40",
  },
  {
    title: "CV submitted: Arif Hossain",
    subtitle: "Automation",
    time: "54 mins ago",
    dotClass: "bg-sky-500",
    rowClass:
      "bg-sky-50/70 dark:bg-sky-950/25 border-sky-100 dark:border-sky-900/40",
  },
  {
    title: "Quality passed: Nabila Rahman",
    subtitle: "QA Engine",
    time: "1 hr ago",
    dotClass: "bg-emerald-500",
    rowClass:
      "bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/40",
  },
  {
    title: "Pending review: Imran Ahmed",
    subtitle: "Reviewer Queue",
    time: "2 hrs ago",
    dotClass: "bg-amber-500",
    rowClass:
      "bg-amber-50/70 dark:bg-amber-950/25 border-amber-100 dark:border-amber-900/40",
  },
  {
    title: "Quality failed: Farzana Akter",
    subtitle: "Validation",
    time: "3 hrs ago",
    dotClass: "bg-rose-500",
    rowClass:
      "bg-rose-50/70 dark:bg-rose-950/25 border-rose-100 dark:border-rose-900/40",
  },
];

export default function DashboardPage() {
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
          href="/dashboard/bulk-import"
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
                  <div className="mt-3 text-4xl font-semibold tracking-tight text-black dark:text-slate-100">
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
          <button
            type="button"
            className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Mark all as read
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.map((a) => (
            <div
              key={a.title}
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
            href="/dashboard/activities"
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-primary"
          >
            See More <ArrowRight size={16} />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

