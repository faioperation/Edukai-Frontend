"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

import { Activity, Clock, ShieldAlert, Loader2, FileText, UserCircle, Settings } from "lucide-react";
import { motion } from "framer-motion";

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
        icon: <FileText size={16} className="text-sky-600 dark:text-sky-400" />,
      };
    case "CONTACT_IMPORT":
      return {
        dotClass: "bg-violet-500",
        rowClass:
          "bg-violet-50/70 dark:bg-violet-950/25 border-violet-100 dark:border-violet-900/40",
        icon: <UserCircle size={16} className="text-violet-600 dark:text-violet-400" />,
      };
    case "ORGANIZATION_IMPORT":
      return {
        dotClass: "bg-amber-500",
        rowClass:
          "bg-amber-50/70 dark:bg-amber-950/25 border-amber-100 dark:border-amber-900/40",
        icon: <Settings size={16} className="text-amber-600 dark:text-amber-400" />,
      };
    default:
      return {
        dotClass: "bg-emerald-500",
        rowClass:
          "bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/40",
        icon: <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />,
      };
  }
}

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["all-activities", page],
    queryFn: async () => {
      const res = await apiGet("/activity-logs/all", { params: { page, limit } });
      if (!res?.success) throw new Error(res?.message || "Failed to fetch activities");
      return res;
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta || { totalPage: 1 };

  return (
    <div className="mx-auto max-w-7xl space-y-6 ">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Activity className="h-8 w-8 text-indigo-500" />
          Activity Logs
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          A comprehensive history of all automated activities and system events.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <Clock className="h-5 w-5 text-slate-500" />
          Recent Activities
        </div>
        <div className="space-y-4">
          {isError && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              <ShieldAlert className="h-5 w-5" />
              {error?.message || "Failed to load activity logs."}
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : logs.length === 0 && !isError ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Activity className="mb-3 h-10 w-10 opacity-20" />
              <p>No recent activities found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => {
                const { dotClass, rowClass, icon } = activityStyle(log?.action);
                
                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={[
                      "flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-all hover:scale-[1.01]",
                      rowClass,
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white/60 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                        {icon}
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <div className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                          {log.message}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 rounded-full bg-slate-200/50 px-2 py-0.5 dark:bg-slate-800/50">
                            <span className={["h-1.5 w-1.5 rounded-full", dotClass].join(" ")} />
                            {log.action}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <Clock size={14} className="opacity-70" />
                      {log.createdAt ? timeAgo(log.createdAt) : ""}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && !isError && meta.totalPage > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200/60 pt-6 dark:border-slate-800/60">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page <span className="font-medium text-slate-900 dark:text-white">{page}</span> of{" "}
                <span className="font-medium text-slate-900 dark:text-white">{meta.totalPage}</span>
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))}
                disabled={page === meta.totalPage}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
