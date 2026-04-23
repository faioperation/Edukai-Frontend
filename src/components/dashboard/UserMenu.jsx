"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-white/15 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-white/15 dark:group-hover:text-white">
          <User size={16} />
        </span>
        <span className="hidden sm:inline">Admin</span>
        <ChevronDown
          size={16}
          className="text-slate-500 transition-colors group-hover:text-white dark:text-slate-400 dark:group-hover:text-white"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950"
        >
          <Link
            role="menuitem"
            href="/settings"
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <Settings size={16} className="text-slate-500 dark:text-slate-400" />
            Settings
          </Link>
          <Link
            role="menuitem"
            href="/login"
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <LogOut size={16} className="text-slate-500 dark:text-slate-400" />
            Logout
          </Link>
        </div>
      ) : null}
    </div>
  );
}

