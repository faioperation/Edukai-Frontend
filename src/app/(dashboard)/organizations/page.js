"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Layers,
  MapPin,
  Shield,
  ChevronDown,
  Eye,
  Building2,
  Phone,
  UserRound,
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

function mapImportOrgToRow(item) {
  const d = item || {};
  return {
    id: d.id,
    urn: d.URN ?? d.urn ?? "",
    name: d.OrganizationName ?? d.name ?? "",
    localAuthority: d.LocalAuthority ?? d.localAuthority ?? "",
    phase: normalizePhase(d.Phase ?? d.phase),
    rawPhase: d.Phase ?? d.phase ?? "",
    gender: normalizeGender(d.Gender ?? d.gender),
    telephone: String(d.TelephoneNumber ?? d.telephone ?? ""),
    street: d.Street ?? d.street ?? "",
    postcode: d.Postcode ?? d.postcode ?? "",
    addressLine1: d.AddressLine1 ?? d.addressLine1 ?? "",
    addressLine2: d.AddressLine2 ?? d.addressLine2 ?? "",
    town: d.Town ?? d.town ?? "",
    country: d.country ?? d.Country ?? "",
    county: d.county ?? "",
    region: d.region ?? "",
    district: d.district ?? "",
    latitude: d.latitude ?? d.Latitude ?? "",
    longitude: d.longitude ?? d.Longitude ?? "",
    contactCount: d.contactCount ?? 0,
    isManual: !!d.isManual,
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

function titleCaseWords(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function phaseLabelForApi(normalizedPhase) {
  const p = normalizePhase(normalizedPhase);
  if (!p) return "";
  return titleCaseWords(optionLabel(p));
}

function genderLabelForApi(normalizedGender) {
  const g = normalizeGender(normalizedGender);
  if (!g) return "";
  if (g === "boys") return "Boys";
  if (g === "girls") return "Girls";
  if (g === "mixed") return "Mixed";
  return titleCaseWords(g);
}

function pillClasses() {
  return "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";
}

export default function OrganizationsPage() {
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("all");
  const [region, setRegion] = useState("all");
  const [gender, setGender] = useState("all");
  const [localAuthority, setLocalAuthority] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(200);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add | edit
  const [draft, setDraft] = useState(null);

  /** `{ id, name }` while delete confirmation modal is open */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const importOrgFiltersQuery = useQuery({
    queryKey: ["import-organization", "filters"],
    queryFn: async () => {
      const res = await apiGet("/import-organization/filters");
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load organization filters");
      return res;
    },
    staleTime: 60_000,
  });

  const importOrgsQuery = useQuery({
    queryKey: ["import-organization", "all", { q, phase, region, gender, localAuthority, page, limit }],
    queryFn: async () => {
      const params = {
        searchTerm: q?.trim() ? q.trim() : undefined,
        region: region === "all" ? undefined : region,
        gender: gender === "all" ? undefined : gender,
        phase: phase === "all" ? undefined : phase,
        localAuthority: localAuthority === "all" ? undefined : localAuthority,
        limit,
        page,
      };
      const res = await apiGet("/import-organization/all", { params });
      console.log(res);
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load imported organizations");
      const payload = res || {};
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      const meta = payload?.meta || {};
      return {
        items: items.map(mapImportOrgToRow),
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
  // console.log(importOrgsQuery.data);
  const rows = importOrgsQuery.data?.items || [];
  const meta = importOrgsQuery.data?.meta || {
    page,
    limit,
    total: rows.length,
    totalPage: 1,
  };

  const regions = useMemo(() => {
    const set = new Set(rows.map((r) => r.region).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const authorities = useMemo(() => {
    const set = new Set(rows.map((r) => r.localAuthority).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filterOptions = useMemo(() => {
    const payload = importOrgFiltersQuery.data || {};
    const d = payload?.data || payload?.filters || payload || {};

    const from = (...keys) => {
      for (const k of keys) {
        const v = d?.[k];
        if (Array.isArray(v)) return v.filter(Boolean);
      }
      return null;
    };

    const phasesFromApi = from("phases", "phase", "phaseList");
    const gendersFromApi = from("genders", "gender", "genderList");
    const regionsFromApi = from("regions", "region", "regionList");
    const lasFromApi = from(
      "localAuthorities",
      "local_authorities",
      "localAuthority",
      "local_authority",
      "authorities"
    );

    return {
      phases: (phasesFromApi?.length ? phasesFromApi : PHASES).map((x) => String(x)),
      genders: (gendersFromApi?.length ? gendersFromApi : GENDERS).map((x) => normalizeGender(x)),
      regions: (regionsFromApi?.length ? regionsFromApi : regions).map((x) => String(x)),
      localAuthorities: (lasFromApi?.length ? lasFromApi : authorities).map((x) => String(x)),
    };
  }, [authorities, importOrgFiltersQuery.data, regions]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      const qOk = query
        ? [r.name, r.urn, r.localAuthority, r.town]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(query))
        : true;
      const phaseOk = phase === "all" ? true : r.rawPhase === phase;
      const regionOk = region === "all" ? true : r.region === region;
      const genderOk = gender === "all" ? true : r.gender === gender;
      const laOk = localAuthority === "all" ? true : r.localAuthority === localAuthority;
      return qOk && phaseOk && regionOk && genderOk && laOk;
    });
  }, [gender, localAuthority, phase, q, region, rows]);

  useEffect(() => {
    setPage(1);
  }, [q, phase, region, gender, localAuthority]);

  function openAdd() {
    setDialogMode("add");
    setDraft({
      organizationName: "",
      localAuthority: "",
      postcode: "",
      urn: "",
      town: "",
      phase: "",
      gender: "",
      street: "",
      addressLine1: "",
      telephoneNumber: "",
      country: "",
      latitude: "",
      longitude: "",
    });
    setDialogOpen(true);
  }

  function openEdit(row) {
    setDialogMode("edit");
    setDraft({
      organizationName: row.name || "",
      localAuthority: row.localAuthority || "",
      postcode: row.postcode || "",
      urn: row.urn || "",
      town: row.town || "",
      phase: row.phase || "",
      gender: row.gender || "",
      street: row.street || "",
      addressLine1: row.addressLine1 || "",
      telephoneNumber: row.telephone || "",
      country: row.country || "",
      latitude: row.latitude != null && row.latitude !== "" ? String(row.latitude) : "",
      longitude: row.longitude != null && row.longitude !== "" ? String(row.longitude) : "",
      rowId: row.id,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDraft(null);
  }

  function validateDraft(d) {
    const required = [
      ["organizationName", "Organization name"],
      ["localAuthority", "Local authority"],
      ["postcode", "Postcode"],
      ["urn", "URN"],
      ["town", "Town"],
      ["phase", "Phase"],
      ["gender", "Gender"],
      ["street", "Street"],
      ["addressLine1", "Address line 1"],
      ["telephoneNumber", "Telephone"],
      ["country", "Country"],
      ["latitude", "Latitude"],
      ["longitude", "Longitude"],
    ];
    for (const [key, label] of required) {
      if (!String(d?.[key] ?? "").trim()) return `${label} is required`;
    }
    const lat = Number(String(d.latitude).trim());
    const lng = Number(String(d.longitude).trim());
    if (!Number.isFinite(lat)) return "Latitude must be a valid number";
    if (!Number.isFinite(lng)) return "Longitude must be a valid number";
    return null;
  }

  function buildOrganizationBody(d) {
    return {
      OrganizationName: String(d?.organizationName || "").trim(),
      LocalAuthority: String(d?.localAuthority || "").trim(),
      Postcode: String(d?.postcode || "").trim(),
      URN: String(d?.urn || "").trim(),
      Town: String(d?.town || "").trim(),
      Phase: phaseLabelForApi(d?.phase),
      Gender: genderLabelForApi(d?.gender),
      Street: String(d?.street || "").trim(),
      AddressLine1: String(d?.addressLine1 || "").trim(),
      TelephoneNumber: String(d?.telephoneNumber || "").trim(),
      country: String(d?.country || "").trim(),
      latitude: Number(String(d?.latitude || "").trim()),
      longitude: Number(String(d?.longitude || "").trim()),
    };
  }

  async function saveDraft() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);

    const body = buildOrganizationBody(draft);
    const loadingId = toast.loading(
      dialogMode === "edit" ? "Updating organization…" : "Creating organization…"
    );

    try {
      let res;
      if (dialogMode === "edit") {
        const id = String(draft?.rowId ?? "").trim();
        if (!id) throw new Error("Missing organization id");
        res = await apiPatch(`/organizations/${encodeURIComponent(id)}`, body);
      } else {
        res = await apiPost("/organizations/create-organization", body);
      }
      if (res?.success === false) throw new Error(res?.message || "Request failed");

      toast.success(res?.message || "Saved successfully", { id: loadingId });
      closeDialog();
      if (dialogMode === "add") setPage(1);
      queryClient.invalidateQueries({ queryKey: ["import-organization", "all"] });
    } catch (e) {
      toast.error(e?.message || "Request failed", { id: loadingId });
    }
  }

  function openDeleteModal(row) {
    const oid = String(row?.id ?? "").trim();
    if (!oid) return toast.error("Missing organization id");
    setDeleteTarget({
      id: oid,
      name: String(row?.name || "").trim() || "this organization",
    });
  }

  function closeDeleteModal() {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
  }

  async function confirmDeleteOrganization() {
    if (!deleteTarget?.id) return;

    setDeleteSubmitting(true);
    const loadingId = toast.loading("Deleting organization…");

    try {
      const res = await apiDelete(
        `/organizations/${encodeURIComponent(deleteTarget.id)}`
      );
      if (res && res.success === false) throw new Error(res.message || "Delete failed");

      toast.success((res && res.message) || "Organization deleted", { id: loadingId });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["import-organization", "all"] });
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
        const res = await apiPost("/import-organization/upload", fd);
        if (res?.success !== false) {
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ["import-organization", "all"] });
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
              {meta.total ?? rows.length}
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
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-12 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
            >
              <option value="all">All Towns</option>
              {filterOptions.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
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
                  {optionLabel(g)}
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
              disabled={meta.page <= 1 || importOrgsQuery.isFetching}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
              disabled={meta.page >= meta.totalPage || importOrgsQuery.isFetching}
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
                <th className="px-5 py-4">ORGANIZATION NAME</th>
                <th className="px-5 py-4">CONTACT & GENDER</th>
                <th className="px-5 py-4">LOCATION & POSTCODE</th>
                <th className="px-5 py-4">URN & PHASE</th>
                <th className="px-5 py-4">LOCAL AUTHORITY</th>
                <th className="px-5 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {importOrgsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400"
                  >
                    Loading organizations…
                  </td>
                </tr>
              ) : importOrgsQuery.isError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-rose-700 dark:text-rose-300"
                  >
                    {importOrgsQuery.error?.message || "Failed to load organizations"}
                  </td>
                </tr>
              ) : null}
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone size={14} className="text-slate-400" /> {row.telephone || "N/A"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <UserRound size={14} className="text-slate-400" /> {row.gender ? optionLabel(row.gender) : "—"}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {row.town || "N/A"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {row.postcode || "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="text-slate-400 font-medium">#</span> {row.urn || "—"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Layers size={14} className="text-slate-400" /> {row.phase ? optionLabel(row.phase) : "—"}
                      </div>
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
                        href={`/organizations/${row.id}`}
                        className="inline-flex cursor-pointer items-center justify-center p-2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label={`View ${row.name}`}
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex cursor-pointer items-center justify-center p-2 text-slate-400 transition-colors hover:text-primary"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(row)}
                        className="inline-flex cursor-pointer items-center justify-center p-2 text-slate-400 transition-colors hover:text-rose-600"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!importOrgsQuery.isLoading && !importOrgsQuery.isError && !filtered.length ? (
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
                  onClick={() => openDeleteModal(row)}
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
        <DialogContent
          className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-slate-100">
              {dialogMode === "add" ? "Add Organization" : "Edit Organization"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {!draft ? null : (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Organization Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.organizationName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, organizationName: e.target.value }))
                    }
                    placeholder="Green Valley Academy"
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
                      setDraft((d) => ({
                        ...d,
                        localAuthority: e.target.value,
                      }))
                    }
                    placeholder="Camden"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Postcode <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.postcode}
                    onChange={(e) => setDraft((d) => ({ ...d, postcode: e.target.value }))}
                    placeholder="NW1 8XW"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    URN <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.urn}
                    onChange={(e) => setDraft((d) => ({ ...d, urn: e.target.value }))}
                    placeholder="987654"
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
                    placeholder="London"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Country <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.country}
                    onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                    placeholder="England"
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
                    Street <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.street}
                    onChange={(e) => setDraft((d) => ({ ...d, street: e.target.value }))}
                    placeholder="Green Road"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Address Line 1 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.addressLine1}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, addressLine1: e.target.value }))
                    }
                    placeholder="Camden Town"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Telephone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.telephoneNumber}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, telephoneNumber: e.target.value }))
                    }
                    placeholder="02079460123"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Latitude <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.latitude}
                    onChange={(e) => setDraft((d) => ({ ...d, latitude: e.target.value }))}
                    placeholder="51.539"
                    inputMode="decimal"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Longitude <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={draft.longitude}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, longitude: e.target.value }))
                    }
                    placeholder="-0.142"
                    inputMode="decimal"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 sm:gap-3 dark:border-slate-800">
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
              Delete organization
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
              onClick={confirmDeleteOrganization}
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

