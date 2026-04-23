"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardShellLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onToggleSidebar={() => setSidebarCollapsed((s) => !s)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 p-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

