"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PHASES = [
  "not_applicable",
  "nursery",
  "primary",
  "secondary",
  "middle_deemed_primary",
  "16_plus",
];

const GENDERS = ["boys", "girls", "mixed"];

const seed = [
  {
    id: "org_1",
    urn: "133226",
    name: "16–19 Abingdon",
    localAuthority: "Oxfordshire",
    phase: "not_applicable",
    gender: "mixed",
    telephone: "N/A",
    street: "",
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    town: "Abingdon",
    county: "",
  },
  {
    id: "org_2",
    urn: "134909",
    name: "3 Dimensions",
    localAuthority: "Somerset",
    phase: "not_applicable",
    gender: "mixed",
    telephone: "146065611",
    street: "",
    postcode: "TA20 3AJ",
    addressLine1: "",
    addressLine2: "",
    town: "Chard",
    county: "",
  },
  {
    id: "org_3",
    urn: "142835",
    name: "ACE Schools Plymouth",
    localAuthority: "Plymouth",
    phase: "not_applicable",
    gender: "mixed",
    telephone: "1752396100",
    street: "",
    postcode: "PL4 0AT",
    addressLine1: "",
    addressLine2: "",
    town: "Plymouth",
    county: "",
  },
  {
    id: "org_4",
    urn: "125421",
    name: "ACS Cobham International School",
    localAuthority: "Surrey",
    phase: "not_applicable",
    gender: "mixed",
    telephone: "1932867251",
    street: "",
    postcode: "KT11 1BL",
    addressLine1: "",
    addressLine2: "",
    town: "Cobham",
    county: "",
  },
  {
    id: "org_5",
    urn: "131173",
    name: "ACS Egham International School",
    localAuthority: "Surrey",
    phase: "not_applicable",
    gender: "mixed",
    telephone: "1784430800",
    street: "",
    postcode: "TW20 0HS",
    addressLine1: "",
    addressLine2: "",
    town: "Egham",
    county: "",
  },
];

function optionLabel(x) {
  if (!x) return "";
  return String(x).replaceAll("_", " ");
}

function pillClasses() {
  return "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";
}

export default function OrganizationsPage() {
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("all");
  const [town, setTown] = useState("all");
  const [gender, setGender] = useState("all");
  const [localAuthority, setLocalAuthority] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add | edit
  const [draft, setDraft] = useState(null);

  const towns = useMemo(() => {
    const set = new Set(rows.map((r) => r.town).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const authorities = useMemo(() => {
    const set = new Set(rows.map((r) => r.localAuthority).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      const qOk = query
        ? [r.name, r.urn, r.localAuthority, r.town]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(query))
        : true;
      const phaseOk = phase === "all" ? true : r.phase === phase;
      const townOk = town === "all" ? true : r.town === town;
      const genderOk = gender === "all" ? true : r.gender === gender;
      const laOk = localAuthority === "all" ? true : r.localAuthority === localAuthority;
      return qOk && phaseOk && townOk && genderOk && laOk;
    });
  }, [gender, localAuthority, phase, q, rows, town]);

  function openAdd() {
    setDialogMode("add");
    setDraft({
      id: "",
      urn: "",
      name: "",
      localAuthority: "",
      phase: "",
      gender: "",
      telephone: "",
      street: "",
      postcode: "",
      addressLine1: "",
      addressLine2: "",
      town: "",
      county: "",
    });
    setDialogOpen(true);
  }

  function openEdit(row) {
    setDialogMode("edit");
    setDraft({ ...row });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDraft(null);
  }

  function validateDraft(d) {
    const required = [
      ["urn", "URN"],
      ["name", "Organization name"],
      ["localAuthority", "Local authority"],
      ["phase", "Phase"],
      ["gender", "Gender"],
      ["telephone", "Telephone"],
      ["street", "Street"],
      ["postcode", "Postcode"],
      ["town", "Town"],
    ];
    for (const [key, label] of required) {
      if (!String(d?.[key] || "").trim()) return `${label} is required`;
    }
    return null;
  }

  function saveDraft() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);

    if (dialogMode === "add") {
      const newRow = { ...draft, id: `org_${Date.now()}` };
      setRows((prev) => [newRow, ...prev]);
      toast.success("Organization added");
      closeDialog();
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    toast.success("Organization updated");
    closeDialog();
  }

  function onDelete(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Organization deleted");
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`Selected: ${file.name}`);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl font-semibold text-primary dark:text-slate-100">
            Organization Management
          </h2>
          <p className="mt-2 max-w-2xl text-base text-black/60 dark:text-slate-400">
            Maintain and structure all your educational institutions and organizations.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
            <span className="text-base  font-medium text-black/60 dark:text-slate-400">
              Total organizations :
            </span>
            <span className="ml-2 mt-1 text-base font-semibold text-primary dark:text-primary">
              {rows.length}
            </span>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
          >
            <Plus size={18} />
            Add Organizations
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onImportFile}
          />
          <button
            type="button"
            onClick={triggerImport}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900/40"
          >
            <Download size={18} />
            Import from Excel File
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          SEARCH & FILTER AUDIENCE
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search organizations..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
            />
          </div>

          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
          >
            <option value="all">All Phases</option>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {optionLabel(p)}
              </option>
            ))}
          </select>

          <select
            value={town}
            onChange={(e) => setTown(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
          >
            <option value="all">All Towns</option>
            {towns.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
          >
            <option value="all">All Genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {optionLabel(g)}
              </option>
            ))}
          </select>

          <select
            value={localAuthority}
            onChange={(e) => setLocalAuthority(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
          >
            <option value="all">All Local Authority</option>
            {authorities.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <tr>
                <th className="px-5 py-4">NAME & LOCAL AUTHORITY</th>
                <th className="px-5 py-4">URN & PHASE</th>
                <th className="px-5 py-4">CONTACT & GENDER</th>
                <th className="px-5 py-4">LOCATION & POSTCODE</th>
                <th className="px-5 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.name}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {row.localAuthority || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.urn || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {row.phase ? optionLabel(row.phase) : "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.telephone || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {row.gender ? optionLabel(row.gender) : "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.town || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {row.postcode || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200 dark:hover:bg-rose-950/40"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                    No organizations found. Try different filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-4 md:hidden">
        {filtered.map((row) => (
          <div
            key={row.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                  {row.name}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {row.localAuthority || "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                  aria-label={`Edit ${row.name}`}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row.id)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200 dark:hover:bg-rose-950/40"
                  aria-label={`Delete ${row.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">URN</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {row.urn || "—"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">Phase</div>
                <div className="mt-2">
                  <span className={[pillClasses(), "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"].join(" ")}>
                    {row.phase ? optionLabel(row.phase) : "—"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">Contact</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {row.telephone || "—"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">Gender</div>
                <div className="mt-2">
                  <span className={[pillClasses(), "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"].join(" ")}>
                    {row.gender ? optionLabel(row.gender) : "—"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">Town & Postcode</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {row.town || "—"}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {row.postcode || "—"}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!filtered.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No organizations found. Try different filters.
          </div>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-4xl" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-slate-100">
              {dialogMode === "add" ? "Add Organization" : "Edit Organization"}
            </DialogTitle>
          </DialogHeader>

          {!draft ? null : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  URN <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.urn}
                  onChange={(e) => setDraft((d) => ({ ...d, urn: e.target.value }))}
                  placeholder="Enter URN"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Organization Name <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Enter organization name"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Local Authority <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.localAuthority}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, localAuthority: e.target.value }))
                  }
                  placeholder="Enter local authority"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Phase <span className="text-rose-600">*</span>
                </label>
                <select
                  value={draft.phase}
                  onChange={(e) => setDraft((d) => ({ ...d, phase: e.target.value }))}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                >
                  <option value="">Select Phase</option>
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {optionLabel(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Gender <span className="text-rose-600">*</span>
                </label>
                <select
                  value={draft.gender}
                  onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                >
                  <option value="">Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {optionLabel(g)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Telephone <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.telephone}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, telephone: e.target.value }))
                  }
                  placeholder="Enter telephone"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Street <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.street}
                  onChange={(e) => setDraft((d) => ({ ...d, street: e.target.value }))}
                  placeholder="Enter street"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Postcode <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.postcode}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, postcode: e.target.value }))
                  }
                  placeholder="Enter postcode"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Address Line 1
                </label>
                <input
                  value={draft.addressLine1}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, addressLine1: e.target.value }))
                  }
                  placeholder="Enter address line 1"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Address Line 2
                </label>
                <input
                  value={draft.addressLine2}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, addressLine2: e.target.value }))
                  }
                  placeholder="Enter address line 2"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Town <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.town}
                  onChange={(e) => setDraft((d) => ({ ...d, town: e.target.value }))}
                  placeholder="Enter town"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  County
                </label>
                <input
                  value={draft.county}
                  onChange={(e) => setDraft((d) => ({ ...d, county: e.target.value }))}
                  placeholder="Enter county"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
            >
              <Plus size={18} />
              {dialogMode === "add" ? "Add Organization" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

