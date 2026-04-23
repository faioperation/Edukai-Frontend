"use client";

import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { Menu } from "lucide-react";

export default function Topbar({
  title = "Dashboard",
  onToggleSidebar,
  onOpenMobileNav,
  sidebarCollapsed,
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger -> opens sheet */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        {/* Desktop hamburger -> collapses sidebar */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 md:inline-flex"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={18} />
        </button>

        <div className="leading-tight">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Manage your workspace
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

