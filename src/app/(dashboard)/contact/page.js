"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
  ChevronDown,
  Layers,
  Shield,
  Eye,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

const DEFAULT_LIMIT = 200;
const ORG_PICKER_LIMIT = 500;

const PHASES = [
  "not_applicable",
  "nursery",
  "primary",
  "secondary",
  "middle_deemed_primary",
  "16_plus",
];

const GENDERS = ["Boys", "Girls", "Mixed"];

function normalizePhase(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "";
  return s.replace(/\s+/g, "_");
}

function normalizeGender(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "male" || s === "m" || s === "boys") return "Boys";
  if (s === "female" || s === "f" || s === "girls") return "Girls";
  if (s === "mixed") return "Mixed";
  // Fallback to title case for any other values
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickOrganizationFkId(d) {
  const raw = d || {};
  // Same source as Organizations page (`mapImportOrgToRow`): row `id` is the org UUID
  // used for PATCH /organizations/:id. Prefer it over `organizationId`, which may be a
  // different FK on import rows and breaks contacts.organizationId references.
  const candidates = [
    raw.id,
    raw.organizationId,
    raw.OrganizationId,
    raw.organization_id,
    raw.uuid,
    raw.UUID,
    raw._id,
  ];
  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  return "";
}

function mapOrgPickerRow(item) {
  const d = item || {};
  const id = pickOrganizationFkId(d);
  const nameRaw =
    String(d.OrganizationName ?? d.name ?? "").trim() ||
    String(d.URN ?? d.urn ?? "").trim();
  return {
    id: String(id || "").trim(),
    name: nameRaw || "Unnamed organization",
  };
}

function mapImportContactToRow(item) {
  const d = item || {};
  const payload = d.payload && typeof d.payload === "object" ? d.payload : null;
  const orgDetails = d.organizationDetails || {};
  const orgObj = d.organization && typeof d.organization === "object" ? d.organization : null;

  return {
    id: d.id,
    organizationId:
      orgObj?.id ??
      orgObj?.uuid ??
      orgDetails?.id ??
      orgDetails?.uuid ??
      d.organizationId ??
      d.OrganizationId ??
      "",
    organizationName:
      d.OrganizationName ??
      d.organizationName ??
      d.organization ??
      orgDetails?.OrganizationName ??
      payload?.OrganizationName ??
      "",
    localAuthority:
      d.LocalAuthority ??
      d.localAuthority ??
      orgDetails?.LocalAuthority ??
      orgDetails?.district ??
      "",
    contactPerson:
      d.FullName ??
      d.fullName ??
      d.ContactPersonName ??
      d.contactPersonName ??
      d.ContactPerson ??
      d.contactPerson ??
      d.name ??
      "",
    workEmail:
      d.WorkEmail ?? d.workEmail ?? d.email ?? payload?.WorkEmail ?? "",
    workPhone: String(
      d.WorkPhone ?? d.workPhone ?? d.phone ?? payload?.WorkPhone ?? ""
    ),
    jobTitle: d.JobTitle ?? d.jobTitle ?? payload?.JobTitle ?? "",
    department: d.Department ?? d.department ?? payload?.Department ?? "",
    phase: normalizePhase(d.Phase ?? d.phase ?? orgDetails?.Phase ?? orgDetails?.phase ?? payload?.Phase),
    rawPhase: d.Phase ?? d.phase ?? orgDetails?.Phase ?? orgDetails?.phase ?? payload?.Phase ?? "",
    town: d.Town ?? d.town ?? orgDetails?.Town ?? orgDetails?.town ?? "",
    gender: normalizeGender(d.Gender ?? d.gender ?? orgDetails?.Gender ?? orgDetails?.gender ?? payload?.Gender),
    rawGender: d.Gender ?? d.gender ?? orgDetails?.Gender ?? orgDetails?.gender ?? payload?.Gender ?? "",
    createdAt: d.createdAt ?? null,
  };
}

function isExcelFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const okExt = name.endsWith(".xlsx") || name.endsWith(".xls");
  const mime = String(file?.type || "").toLowerCase();
  const okMime =
    !mime ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("officedocument");
  return okExt && okMime;
}

const CONTACT_GENDER_API = ["Male", "Female", "Mixed"];

function genderApiFromRow(row) {
  const raw = String(row?.rawGender || "").trim();
  const rl = raw.toLowerCase();
  if (rl === "male" || rl === "m") return "Male";
  if (rl === "female" || rl === "f") return "Female";
  if (rl === "mixed") return "Mixed";
  const g = normalizeGender(row?.gender);
  if (g === "boys") return "Male";
  if (g === "girls") return "Female";
  return "Mixed";
}

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
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [job, setJob] = useState("all");
  const [phase, setPhase] = useState("all");
  const [town, setTown] = useState("all");
  const [gender, setGender] = useState("all");
  const [localAuthority, setLocalAuthority] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(200);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add | edit
  const [draft, setDraft] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const importContactFiltersQuery = useQuery({
    queryKey: ["import-contact", "filters"],
    queryFn: async () => {
      const res = await apiGet("/import-contact/filters");
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load contact filters");
      return res;
    },
    staleTime: 60_000,
  });

  const organizationsPickerQuery = useQuery({
    queryKey: ["import-organization", "all", "picker", ORG_PICKER_LIMIT],
    enabled: dialogOpen,
    queryFn: async () => {
      const res = await apiGet("/import-organization/all", {
        params: { limit: ORG_PICKER_LIMIT, page: 1 },
      });
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load organizations");

      const payload = res || {};
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      return items.map(mapOrgPickerRow).filter((o) => o.id);
    },
    staleTime: 60_000,
  });

  const orgSelectOptions = useMemo(() => {
    const rows = [...(organizationsPickerQuery.data ?? [])];
    rows.sort((a, b) => a.name.localeCompare(b.name));
    if (
      dialogMode === "edit" &&
      draft?.organizationId &&
      !rows.some((o) => o.id === draft.organizationId)
    ) {
      rows.unshift({
        id: draft.organizationId,
        name:
          String(draft.organizationName || "").trim() ||
          draft.organizationId,
      });
    }
    return rows;
  }, [
    organizationsPickerQuery.data,
    dialogMode,
    draft?.organizationId,
    draft?.organizationName,
  ]);

  useEffect(() => {
    if (
      dialogMode === "edit" &&
      draft &&
      !draft.organizationId &&
      draft.organizationName &&
      organizationsPickerQuery.data?.length > 0
    ) {
      const match = organizationsPickerQuery.data.find(
        (o) => o.name.toLowerCase() === draft.organizationName.toLowerCase()
      );
      if (match) {
        setDraft((d) => ({ ...d, organizationId: match.id }));
      }
    }
  }, [
    dialogMode,
    draft?.organizationId,
    draft?.organizationName,
    organizationsPickerQuery.data,
  ]);

  const importContactsQuery = useQuery({
    queryKey: ["import-contact", "all", { q, job, phase, town, gender, localAuthority, page, limit }],
    queryFn: async () => {
      const params = {
        searchTerm: q?.trim() ? q.trim() : undefined,
        jobs: job === "all" ? undefined : job,
        phase: phase === "all" ? undefined : phase,
        towns: town === "all" ? undefined : town,
        gender: gender === "all" ? undefined : gender,
        localAuthority: localAuthority === "all" ? undefined : localAuthority,
        limit,
        page,
      };
      const res = await apiGet("/import-contact/all", { params });
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load imported contacts");

      const payload = res || {};
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      const meta = payload?.meta || {};
      return {
        items: items.map(mapImportContactToRow),
        meta: {
          page: Number(meta.page || page || 1),
          limit: Number(meta.limit || DEFAULT_LIMIT),
          total: Number(meta.total || items.length || 0),
          totalPage: Number(meta.totalPage || 1),
        },
      };
    },
    staleTime: 10_000,
    keepPreviousData: true,
  });

  const rows = importContactsQuery.data?.items || [];
  const meta = importContactsQuery.data?.meta || {
    page,
    limit,
    total: rows.length,
    totalPage: 1,
  };
  const filterOptions = useMemo(() => {
    const payload = importContactFiltersQuery.data || {};
    const d = payload?.data || payload?.filters || payload || {};

    const from = (...keys) => {
      for (const k of keys) {
        const v = d?.[k];
        if (Array.isArray(v)) return v.filter(Boolean);
      }
      return null;
    };

    const jobsFromApi = from("jobs", "jobList");
    const phasesFromApi = from("phases", "phase", "phaseList");
    const townsFromApi = from("towns", "townList");
    const gendersFromApi = from("genders", "gender", "genderList");
    const lasFromApi = from(
      "authorities",
      "localAuthorities",
      "local_authorities",
      "localAuthority",
      "local_authority"
    );

    return {
      jobs: (jobsFromApi || []).map((x) => String(x)),
      phases: (phasesFromApi || []).map((x) => String(x)),
      towns: (townsFromApi || []).map((x) => String(x)),
      genders: (gendersFromApi || []).map((x) => String(x)),
      localAuthorities: (lasFromApi || []).map((x) => String(x)),
    };
  }, [importContactFiltersQuery.data]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      const qOk = query
        ? [r.contactPerson, r.workEmail, r.jobTitle, r.organizationName, r.localAuthority, r.town]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(query))
        : true;
      const jobOk = job === "all" ? true : r.jobTitle === job;
      const phaseOk = phase === "all" ? true : r.rawPhase === phase;
      const townOk = town === "all" ? true : r.town === town;
      const genderOk = gender === "all" ? true : r.rawGender === gender;
      const laOk = localAuthority === "all" ? true : r.localAuthority === localAuthority;
      return qOk && jobOk && phaseOk && townOk && genderOk && laOk;
    });
  }, [gender, job, localAuthority, phase, q, rows, town]);

  useEffect(() => {
    setPage(1);
  }, [q, job, phase, town, gender, localAuthority]);

  function openAdd() {
    setDialogMode("add");
    setDraft({
      rowId: "",
      organizationId: "",
      organizationName: "",
      contactPerson: "",
      workEmail: "",
      workPhone: "",
      jobTitle: "",
      department: "",
      genderApi: "Male",
    });
    setDialogOpen(true);
  }

  function openEdit(row) {
    setDialogMode("edit");
    setDraft({
      rowId: row.id,
      organizationId: row.organizationId || "",
      organizationName: row.organizationName || "",
      contactPerson: row.contactPerson || "",
      workEmail: row.workEmail || "",
      workPhone: row.workPhone || "",
      jobTitle: row.jobTitle || "",
      department: row.department || "",
      genderApi: genderApiFromRow(row),
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDraft(null);
  }

  function selectOrganization(orgId) {
    const organizationId = String(orgId || "").trim();
    setDraft((d) => {
      const picked =
        orgSelectOptions.find((o) => o.id === organizationId) ||
        (organizationId && organizationId === d.organizationId
          ? { id: organizationId, name: d.organizationName || organizationId }
          : null);
      return {
        ...d,
        organizationId,
        organizationName: picked?.name ?? "",
      };
    });
  }

  function validateDraft(d) {
    const required = [
      ["organizationId", "Organization"],
      ["contactPerson", "Full name"],
      ["workEmail", "Work email"],
      ["workPhone", "Work phone"],
      ["jobTitle", "Job title"],
      ["department", "Department"],
      ["genderApi", "Gender"],
    ];
    for (const [key, label] of required) {
      if (!String(d?.[key] ?? "").trim()) return `${label} is required`;
    }
    return null;
  }

  function buildContactBody(d) {
    return {
      organizationId: String(d?.organizationId || "").trim(),
      FullName: String(d?.contactPerson || "").trim(),
      WorkEmail: String(d?.workEmail || "").trim(),
      WorkPhone: String(d?.workPhone || "").trim(),
      JobTitle: String(d?.jobTitle || "").trim(),
      Department: String(d?.department || "").trim(),
      Gender: String(d?.genderApi || "").trim(),
    };
  }

  async function saveDraft() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);

    const mode = dialogMode;
    const body = buildContactBody(draft);
    const loadingId = toast.loading(
      mode === "add" ? "Creating contact…" : "Updating contact…"
    );

    try {
      let res;
      if (mode === "add") {
        res = await apiPost("/contacts/create-contact", body);
      } else {
        const id = String(draft?.rowId ?? "").trim();
        if (!id) throw new Error("Missing contact id");
        res = await apiPatch(`/contacts/${encodeURIComponent(id)}`, body);
      }
      if (res?.success === false) throw new Error(res?.message || "Request failed");

      toast.success(res?.message || "Saved successfully", { id: loadingId });
      closeDialog();
      if (mode === "add") setPage(1);
      queryClient.invalidateQueries({ queryKey: ["import-contact", "all"] });
    } catch (e) {
      toast.error(e?.message || "Request failed", { id: loadingId });
    }
  }

  function openDeleteModal(row) {
    const cid = String(row?.id ?? "").trim();
    if (!cid) return toast.error("Missing contact id");
    setDeleteTarget({
      id: cid,
      name: String(row?.contactPerson || "").trim() || "this contact",
    });
  }

  function closeDeleteModal() {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
  }

  async function confirmDeleteContact() {
    if (!deleteTarget?.id) return;

    setDeleteSubmitting(true);
    const loadingId = toast.loading("Deleting contact…");

    try {
      const res = await apiDelete(`/import-contact/${encodeURIComponent(deleteTarget.id)}`);
      if (res && res.success === false) throw new Error(res.message || "Delete failed");

      toast.success((res && res.message) || "Contact deleted", { id: loadingId });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["import-contact", "all"] });
    } catch (e) {
      toast.error(e?.message || "Delete failed", { id: loadingId });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isExcelFile(file)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      e.target.value = "";
      return;
    }

    toast.success("File uploaded successfully.");

    (async () => {
      try {
        const fd = new FormData();
        fd.append("files", file);
        const res = await apiPost("/import-contact/upload", fd);
        if (res?.success !== false) {
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ["import-contact", "all"] });
        }
      } catch (err) {
        console.error("Import failed:", err);
      } finally {
        e.target.value = "";
      }
    })();
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
              {meta.total ?? rows.length}
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

          <div className="relative">
            <BriefcaseBusiness size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <select
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
            >
              <option value="all">All Jobs</option>
              {filterOptions.jobs.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <Layers size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
            >
              <option value="all">All Phases</option>
              {filterOptions.phases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <select
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
            >
              <option value="all">All Towns</option>
              {filterOptions.towns.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
            >
              <option value="all">All Genders</option>
              {filterOptions.genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <Shield size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <select
              value={localAuthority}
              onChange={(e) => setLocalAuthority(e.target.value)}
              className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
            >
              <option value="all">All Local Authority</option>
              {filterOptions.localAuthorities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/10 p-4 sm:flex-row dark:border-primary/20 dark:bg-primary/10">
        <div className="flex items-center gap-3 text-sm text-slate-800 dark:text-slate-200">
          <span className="font-medium">Items per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 pr-8 font-medium text-slate-700 outline-none hover:bg-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {[100, 200, 500, 1000, 5000, 10000].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
          <span className="hidden font-medium sm:inline-block">Total {meta.total} records</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Page {meta.page} of {meta.totalPage}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || importContactsQuery.isFetching}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
              disabled={meta.page >= meta.totalPage || importContactsQuery.isFetching}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <tr>
                <th className="px-5 py-4">CONTACT PERSON & MAIL</th>
                <th className="px-5 py-4">ORGANIZATION NAME</th>
                <th className="px-5 py-4">JOB TITLE</th>
                <th className="px-5 py-4">LOCAL AUTHORITY</th>
                <th className="px-5 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="">
              {importContactsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400"
                  >
                    Loading contacts…
                  </td>
                </tr>
              ) : importContactsQuery.isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-rose-700 dark:text-rose-300"
                  >
                    {importContactsQuery.error?.message || "Failed to load contacts"}
                  </td>
                </tr>
              ) : null}
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {row.contactPerson || "N/A"}
                      </div>
                      <div className="flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                        <Mail size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">{row.workEmail || "N/A"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <Building2 size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{row.organizationName || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <BriefcaseBusiness size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{row.jobTitle || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {row.localAuthority ? (
                      <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {row.localAuthority}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/contact/${row.id}`}
                        className="inline-flex cursor-pointer items-center justify-center p-2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label={`View ${row.contactPerson}`}
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex cursor-pointer items-center justify-center p-2 text-slate-400 transition-colors hover:text-primary"
                        aria-label={`Edit ${row.contactPerson}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(row)}
                        className="inline-flex cursor-pointer items-center justify-center p-2 text-slate-400 transition-colors hover:text-rose-600"
                        aria-label={`Delete ${row.contactPerson}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
              {!importContactsQuery.isLoading && !importContactsQuery.isError && !filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
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
                  onClick={() => openDeleteModal(row)}
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Organization <span className="text-rose-600">*</span>
                </label>
                <select
                  value={draft.organizationId}
                  disabled={
                    organizationsPickerQuery.isLoading ||
                    organizationsPickerQuery.isError
                  }
                  onChange={(e) => selectOrganization(e.target.value)}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40 dark:disabled:bg-slate-900/40"
                >
                  <option value="">
                    {organizationsPickerQuery.isLoading
                      ? "Loading organizations…"
                      : "Select organization…"}
                  </option>
                  {orgSelectOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                {organizationsPickerQuery.isError ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {organizationsPickerQuery.error?.message ||
                      "Could not load organizations"}
                  </p>
                ) : draft.organizationId ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selected organization ID:{" "}
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {draft.organizationId}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Full name <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.contactPerson}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, contactPerson: e.target.value }))
                  }
                  placeholder="John Doe"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Work email <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.workEmail}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, workEmail: e.target.value }))
                  }
                  placeholder="john.doe@example.com"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Work phone <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.workPhone}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, workPhone: e.target.value }))
                  }
                  placeholder="07700900000"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Job title <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.jobTitle}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, jobTitle: e.target.value }))
                  }
                  placeholder="Headteacher"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Department <span className="text-rose-600">*</span>
                </label>
                <input
                  value={draft.department}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, department: e.target.value }))
                  }
                  placeholder="Management"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Gender <span className="text-rose-600">*</span>
                </label>
                <select
                  value={draft.genderApi}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, genderApi: e.target.value }))
                  }
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                >
                  {CONTACT_GENDER_API.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) closeDeleteModal();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={!deleteSubmitting}
        >
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900 dark:text-slate-100">
              Delete contact
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {deleteTarget?.name}
            </span>
            ? This cannot be undone.
          </p>

          <DialogFooter className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={closeDeleteModal}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={confirmDeleteContact}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-rose-600 dark:hover:bg-rose-500"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

