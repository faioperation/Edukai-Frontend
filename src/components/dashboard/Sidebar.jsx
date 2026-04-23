"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Contact,
  FileText,
  Grid2X2,
  Import,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Grid2X2 },
  { href: "/dashboard/bulk-import", label: "Bulk Import", icon: Import },
  { href: "/dashboard/availability", label: "Availability Check", icon: CheckCircle2 },
  { href: "/dashboard/cv-queue", label: "CV Queue", icon: FileText },
  { href: "/dashboard/ai-rewriter", label: "AI Re-writer", icon: Sparkles },
  { href: "/dashboard/organizations", label: "Organizations", icon: Building2 },
  { href: "/dashboard/contact", label: "Contact", icon: Contact },
];

export default function Sidebar({ collapsed = false }) {
  const pathname = usePathname() || "";

  return (
    <aside
      className={[
        "sticky top-0 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center px-5 py-5",
          collapsed ? "justify-center" : "gap-3",
        ].join(" ")}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent">
          <Image
            src="/assets/logo.png"
            alt="Edukai"
            width={26}
            height={26}
            className="h-10 w-10 object-contain"
            priority
          />
        </div>
        <div
          className={[
            "pt-0.5 transition-all duration-300 ease-in-out",
            collapsed
              ? "pointer-events-none w-0 translate-x-2 overflow-hidden opacity-0"
              : "w-auto translate-x-0 opacity-100",
          ].join(" ")}
        >
          <div className="text-lg font-semibold leading-none text-black dark:text-slate-100">
            Edukai
          </div>
          <div className="mt-1 text-sm leading-none text-black/60 dark:text-slate-400">
            Automation Engine
          </div>
        </div>
      </div>

      <nav
        className={[
          "flex-1 overflow-y-auto mt-5",
          collapsed ? "px-2" : "px-3",
        ].join(" ")}
      >
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={[
                    "flex cursor-pointer items-center rounded-xl py-3 text-base font-medium transition-all duration-300 ease-in-out",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
                      : "text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  <Icon size={22} className={active ? "opacity-95" : "opacity-80"} />
                  <span
                    className={[
                      "whitespace-nowrap transition-all duration-300 ease-in-out",
                      collapsed
                        ? "w-0 -translate-x-2 overflow-hidden opacity-0"
                        : "w-auto translate-x-0 opacity-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={[
          "mt-auto border-t border-slate-200 py-4 text-slate-400 dark:border-slate-800 dark:text-slate-500",
          collapsed ? "px-2 text-center text-[10px]" : "px-5 text-xs",
        ].join(" ")}
      >
        © 2026 Edukai
      </div>
    </aside>
  );
}

