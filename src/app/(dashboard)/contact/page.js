"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BriefcaseBusiness,
  Building2,
  Download,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
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

const orgOptions = [
  { name: "Kingsley Academy", localAuthority: "Hounslow", town: "Hounslow", phase: "secondary", gender: "mixed" },
  { name: "Barnhill Community High School", localAuthority: "Hillingdon", town: "Hayes", phase: "secondary", gender: "mixed" },
  { name: "Highgate Wood Secondary School", localAuthority: "Haringey", town: "London", phase: "secondary", gender: "mixed" },
  { name: "Gladesmore Community School", localAuthority: "Haringey", town: "London", phase: "secondary", gender: "mixed" },
  { name: "Leytonstone School", localAuthority: "Waltham Forest", town: "London", phase: "secondary", gender: "mixed" },
  { name: "Queen Elizabeth's Girls' School", localAuthority: "Barnet", town: "Barnet", phase: "secondary", gender: "girls" },
  { name: "Ashmole Academy", localAuthority: "Barnet", town: "Barnet", phase: "secondary", gender: "mixed" },
  { name: "Cheam High School", localAuthority: "Sutton", town: "Sutton", phase: "secondary", gender: "mixed" },
];

const seed = [
  {
    id: "c_1",
    organizationName: "Kingsley Academy",
    localAuthority: "Hounslow",
    contactPerson: "Abdi",
    workEmail: "aabdi@kingsleyacademy.org",
    jobTitle: "English & film studies LP",
    phase: "secondary",
    town: "Hounslow",
    gender: "mixed",
  },
  {
    id: "c_2",
    organizationName: "Barnhill Community High School",
    localAuthority: "Hillingdon",
    contactPerson: "Abunsair",
    workEmail: "aabunsair@barnhill.school",
    jobTitle: "Assistant Head of Maths",
    phase: "secondary",
    town: "Hayes",
    gender: "mixed",
  },
  {
    id: "c_3",
    organizationName: "Highgate Wood Secondary School",
    localAuthority: "Haringey",
    contactPerson: "Ahmet",
    workEmail: "aah@hws.haringey.sch.uk",
    jobTitle: "HOD Media",
    phase: "secondary",
    town: "London",
    gender: "mixed",
  },
  {
    id: "c_4",
    organizationName: "Gladesmore Community School",
    localAuthority: "Haringey",
    contactPerson: "Aibangbee",
    workEmail: "aae@gladesmore.com",
    jobTitle: "Deputy Head",
    phase: "secondary",
    town: "London",
    gender: "mixed",
  },
  {
    id: "c_5",
    organizationName: "Leytonstone School",
    localAuthority: "Waltham Forest",
    contactPerson: "Ajab",
    workEmail: "atif.ajab@leytonstone.waltham.sch.uk",
    jobTitle: "Senior Assistant Headteacher",
    phase: "secondary",
    town: "London",
    gender: "mixed",
  },
];

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "A";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function optionLabel(x) {
  if (!x) return "";
  return String(x).replaceAll("_", " ");
}

export default function ContactPage() {
  const fileInputRef = useRef(null);
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [job, setJob] = useState("all");
  const [phase, setPhase] = useState("all");
  const [town, setTown] = useState("all");
  const [gender, setGender] = useState("all");
  const [localAuthority, setLocalAuthority] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add | edit
  const [draft, setDraft] = useState(null);

  const jobs = useMemo(() => {
    const set = new Set(rows.map((r) => r.jobTitle).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

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
        ? [r.contactPerson, r.workEmail, r.jobTitle, r.organizationName, r.localAuthority, r.town]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(query))
        : true;
      const jobOk = job === "all" ? true : r.jobTitle === job;
      const phaseOk = phase === "all" ? true : r.phase === phase;
      const townOk = town === "all" ? true : r.town === town;
      const genderOk = gender === "all" ? true : r.gender === gender;
      const laOk = localAuthority === "all" ? true : r.localAuthority === localAuthority;
      return qOk && jobOk && phaseOk && townOk && genderOk && laOk;
    });
  }, [gender, job, localAuthority, phase, q, rows, town]);

  function openAdd() {
    setDialogMode("add");
    setDraft({
      id: "",
      organizationName: "",
      localAuthority: "",
      contactPerson: "",
      workEmail: "",
      jobTitle: "",
      phase: "",
      town: "",
      gender: "",
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
      ["organizationName", "Organization name"],
      ["contactPerson", "Contact person"],
      ["workEmail", "Work email"],
      ["jobTitle", "Job title"],
    ];
    for (const [key, label] of required) {
      if (!String(d?.[key] || "").trim()) return `${label} is required`;
    }
    return null;
  }

  function onOrgChange(value) {
    const match = orgOptions.find((o) => o.name === value);
    setDraft((d) => ({
      ...d,
      organizationName: value,
      localAuthority: match ? match.localAuthority : d.localAuthority,
      town: match ? match.town : d.town,
      phase: match ? match.phase : d.phase,
      gender: match ? match.gender : d.gender,
    }));
  }

  function saveDraft() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);

    if (dialogMode === "add") {
      const match = orgOptions.find((o) => o.name === draft.organizationName);
      const newRow = {
        ...draft,
        id: `c_${Date.now()}`,
        localAuthority: match ? match.localAuthority : draft.localAuthority,
        town: match ? match.town : draft.town,
        phase: match ? match.phase : draft.phase,
        gender: match ? match.gender : draft.gender,
      };
      setRows((prev) => [newRow, ...prev]);
      toast.success("Contact added");
      closeDialog();
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    toast.success("Contact updated");
    closeDialog();
  }

  function onDelete(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Contact deleted");
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
            Contact Management
          </h2>
          <p className="mt-2 max-w-2xl text-base text-black/60 dark:text-slate-400">
            Maintain and organize contact persons for your institutions and organizations.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
            <span className="text-base  font-medium text-black/60 dark:text-slate-400">
              Total contacts
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
            Add Contact
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
        <div className="mt-3 grid gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search contacts..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
            />
          </div>

          <select
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
          >
            <option value="all">All Jobs</option>
            {jobs.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

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
                <th className="px-5 py-4">CONTACT PERSON & MAIL</th>
                <th className="px-5 py-4">JOB TITLE</th>
                <th className="px-5 py-4">ORGANIZATION & LOCAL AUTHORITY</th>
                <th className="px-5 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/15 dark:text-primary">
                        {initials(row.contactPerson)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.contactPerson}
                        </div>
                        <div className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate">{row.workEmail}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <BriefcaseBusiness size={16} className="text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{row.jobTitle}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <Building2 size={16} className="mt-0.5 text-slate-400 dark:text-slate-500" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.organizationName}
                        </div>
                        <div className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={14} className="shrink-0" />
                          <span className="truncate">{row.localAuthority || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                        aria-label={`Edit ${row.contactPerson}`}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200 dark:hover:bg-rose-950/40"
                        aria-label={`Delete ${row.contactPerson}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                    No contacts found. Try a different search.
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
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/15 dark:text-primary">
                  {initials(row.contactPerson)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    {row.contactPerson}
                  </div>
                  <div className="mt-1 flex items-center gap-2 truncate text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate">{row.workEmail}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                  aria-label={`Edit ${row.contactPerson}`}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row.id)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200 dark:hover:bg-rose-950/40"
                  aria-label={`Delete ${row.contactPerson}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">Job Title</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <BriefcaseBusiness size={16} className="text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{row.jobTitle}</span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500 dark:text-slate-400">Organization</div>
                <div className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Building2 size={16} className="mt-0.5 text-slate-400 dark:text-slate-500" />
                  <span className="min-w-0 truncate">{row.organizationName}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin size={16} className="text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{row.localAuthority || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!filtered.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No contacts found. Try a different search.
          </div>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl text-slate-900 dark:text-slate-100">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                <UserRound size={18} />
              </span>
              {dialogMode === "add" ? "Add Contact" : "Edit Contact"}
            </DialogTitle>
          </DialogHeader>

          {!draft ? null : (
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Organization Name<span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    value={draft.organizationName}
                    onChange={(e) => onOrgChange(e.target.value)}
                    placeholder="Search organization..."
                    list="org-options"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    ▾
                  </div>
                  <datalist id="org-options">
                    {orgOptions.map((o) => (
                      <option key={o.name} value={o.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Contact Person <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.contactPerson}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contactPerson: e.target.value }))
                  }
                  placeholder="Enter contact person name"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Work Email <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.workEmail}
                  onChange={(e) => setDraft((d) => ({ ...d, workEmail: e.target.value }))}
                  placeholder="Enter work email"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Job Title <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.jobTitle}
                  onChange={(e) => setDraft((d) => ({ ...d, jobTitle: e.target.value }))}
                  placeholder="Enter job title"
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
              {dialogMode === "add" ? "Add Contact" : "Save changes"}
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

