"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

const TABS = [
  { key: "all", label: "All CVs" },
  { key: "passed", label: "Quality Passed" },
  { key: "failed", label: "Quality Failed" },
];

function generatedCvStorageKey(qualityCheckId) {
  return `generatedCv:qc:${qualityCheckId}`;
}

function mapAvailability(status) {
  if (typeof status === "boolean") return status ? "Available" : "Not available";
  const raw = String(status || "");
  const v = raw.toLowerCase();
  const compact = v.replace(/[^a-z]/g, ""); // handles notAvailable, not_available, "not available"
  if (compact === "available") return "Available";
  if (compact === "notavailable" || compact === "unavailable") return "Not available";
  return raw ? raw : "Not available";
}

function mapQualityStatus(status) {
  if (typeof status === "boolean") return status ? "passed" : "failed";
  const v = String(status || "").toLowerCase();
  if (v === "passed" || v === "pass" || v === "true") return "passed";
  if (v === "failed" || v === "fail" || v === "false") return "failed";
  // No "pending" state in UI; treat unknown as failed.
  return "failed";
}

function mapQualityCheckToRow(item) {
  const c = item?.candidate || {};
  const extracted = c?.extractedJson || {};
  const skills =
    (Array.isArray(c?.skills) && c.skills) ||
    (Array.isArray(c?.top_skills) && c.top_skills) ||
    (Array.isArray(item?.skills) && item.skills) ||
    (Array.isArray(extracted?.top_skills) && extracted.top_skills) ||
    [];
  const derivedStatus =
    c?.qualityStatus !== undefined && c?.qualityStatus !== null
      ? c.qualityStatus
      : item?.qualityPass;

  const aiGenerated =
    item?.aiGenerated === true ||
    item?.aiGenerated === "true" ||
    c?.aiGenerated === true ||
    c?.aiGenerated === "true";

  return {
    id: item?.id || c?.id,
    candidateId: item?.candidateId || c?.id,
    score: item?.score ?? null,
    name: c?.candidateName || "—",
    email: c?.emailAddress || "—",
    phone: c?.contactNumber || "",
    availability: mapAvailability(c?.availabilityStatus),
    status: mapQualityStatus(derivedStatus),
    role: c?.jobTitle || "—",
    location: c?.address || "—",
    experience: c?.experienceYears ? `${c.experienceYears}+ Years Experience` : "—",
    bio: c?.professionalProfile || "",
    skills,
    pdfUrl: c?.rawPdfUrl || null,
    rawPdfPath: c?.rawPdfPath || null,
    aiCheck: !!c?.aiCheck,
    aiGenerated,
    fullResponse: item?.fullResponse || null,
    createdAt: item?.createdAt || c?.createdAt || null,
    candidate: c,
  };
}

function mergeSkills({ prevSkills, nextSkills, mappedSkills, preferNext = false }) {
  const norm = (arr) =>
    (Array.isArray(arr) ? arr : [])
      .map((s) => String(s || "").trim())
      .filter(Boolean);

  const prev = norm(prevSkills);
  const next = norm(nextSkills);
  const mapped = norm(mappedSkills);

  // When user edits skills in the dialog, the backend response often still contains
  // the old extractedJson.top_skills. In that case, keep the user's edited value.
  if (preferNext && next.length) return next;

  // Otherwise prefer backend value when it exists; fall back to what we had.
  if (mapped.length) return mapped;
  if (next.length) return next;
  return prev;
}

const seed = [
  {
    id: "cv_1",
    name: "Mehedi Hasan Munna",
    email: "mehedi.hasan.munna@gmail.com",
    phone: "+880 1623132407",
    availability: "Available",
    status: "passed",
    role: "Backend Engineer, Django Developer",
    location: "Dhaka, Bangladesh",
    experience: "4+ Years Experience",
    bio:
      "Highly skilled Backend Engineer specializing in Python and Django. Experienced in building scalable REST APIs and managing complex data pipelines. Passionate about clean code and efficient system architecture.",
    skills: ["Django", "REST API", "PostgreSQL", "Docker", "Python", "Redis", "Kubernetes"],
  },
  {
    id: "cv_2",
    name: "Arif Hossain",
    email: "arif.hossain@gmail.com",
    phone: "+880 1812-345-678",
    availability: "Not available",
    status: "pending",
    role: "Frontend Engineer, React",
    location: "Chattogram, Bangladesh",
    experience: "2+ Years Experience",
    bio:
      "Frontend Engineer focused on building modern dashboards and responsive UI. Strong with component-driven design and performance optimizations.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind", "Radix UI"],
  },
  {
    id: "cv_3",
    name: "Nabila Rahman",
    email: "nabila.rahman@gmail.com",
    phone: "+880 1913-456-789",
    availability: "Available",
    status: "passed",
    role: "Product Designer",
    location: "Sylhet, Bangladesh",
    experience: "3+ Years Experience",
    bio:
      "Designer with a strong eye for detail and a passion for crafting usable experiences. Experienced with design systems and handoff workflows.",
    skills: ["Figma", "Design Systems", "UX Research", "Prototyping"],
  },
  {
    id: "cv_4",
    name: "Imran Ahmed",
    email: "imran.ahmed@gmail.com",
    phone: "+880 1614-567-890",
    availability: "Available",
    status: "failed",
    role: "QA Engineer",
    location: "Rajshahi, Bangladesh",
    experience: "4+ Years Experience",
    bio:
      "QA Engineer experienced in test strategy, automation, and CI workflows. Enjoys improving product reliability and developer velocity.",
    skills: ["Playwright", "Cypress", "Jest", "CI/CD"],
  },
  {
    id: "cv_5",
    name: "Farzana Akter",
    email: "farzana.akter@gmail.com",
    phone: "+880 1515-678-901",
    availability: "Not available",
    status: "pending",
    role: "HR Specialist",
    location: "Khulna, Bangladesh",
    experience: "5+ Years Experience",
    bio:
      "HR specialist with strong experience in talent screening and process optimization. Comfortable working with ATS and automation tools.",
    skills: ["Recruitment", "Screening", "ATS", "Communication"],
  },
  {
    id: "cv_6",
    name: "Munna Rahman",
    email: "munna.rahman@gmail.com",
    phone: "+880 1316-789-012",
    availability: "Available",
    status: "passed",
    role: "Full Stack Developer",
    location: "Barishal, Bangladesh",
    experience: "3+ Years Experience",
    bio:
      "Full stack developer building end-to-end apps with Next.js and Node. Enjoys shipping features fast with good UX.",
    skills: ["Next.js", "Node.js", "Prisma", "PostgreSQL", "Tailwind"],
  },
  {
    id: "cv_7",
    name: "Nime Ullaha",
    email: "nime.ullaha@gmail.com",
    phone: "+880 1711-234-567",
    availability: "Available",
    status: "passed",
    role: "Data Analyst",
    location: "Cumilla, Bangladesh",
    experience: "2+ Years Experience",
    bio:
      "Analyst working with dashboards and reporting pipelines. Strong with data cleaning, visualization, and stakeholder communication.",
    skills: ["SQL", "Power BI", "Excel", "Python"],
  },
];

function statusLabel(status) {
  if (status === "passed") return "Quality Passed";
  if (status === "failed") return "Quality Failed";
  return "Quality Failed";
}

function statusPillClasses(status) {
  if (status === "passed")
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200";
  return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
}

function availabilityPillClasses(availability) {
  const ok = mapAvailability(availability) === "Available";
  return ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
    : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
}

function na(v) {
  if (v === null || v === undefined) return "N/A";
  const s = String(v).trim();
  if (!s) return "N/A";
  if (s === "—") return "N/A";
  return s;
}

function truncateWords(text, maxWords) {
  const s = na(text);
  if (s === "N/A") return s;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return s;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function toApiAvailability(availabilityLabel) {
  return availabilityLabel === "Available" ? "available" : "notAvailable";
}

function qualityFromStatus(status) {
  // UI has only: passed | failed
  return { qualityPass: status === "passed" };
}

function parseExperienceYears(experienceLabel) {
  const s = String(experienceLabel || "");
  const m = s.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function buildPayloadFromRow(row) {
  const { qualityPass } = qualityFromStatus(row.status);
  return {
    qualityPass,
    availabilityStatus: toApiAvailability(row.availability),
    // candidate fields (flat) - backend validates this shape
    candidateName: row.name || undefined,
    emailAddress: row.email || undefined,
    contactNumber: row.phone || undefined,
    jobTitle: row.role || undefined,
    address: row.location || undefined,
    experienceYears: parseExperienceYears(row.experience),
    professionalProfile: row.bio || undefined,
  };
}

function buildPayloadFromPatch(prevRow, nextRow, changedKeys) {
  const payload = {};

  for (const k of changedKeys) {
    if (k === "status") {
      const { qualityPass } = qualityFromStatus(nextRow.status);
      payload.qualityPass = qualityPass;
    }
    if (k === "availability") {
      payload.availabilityStatus = toApiAvailability(nextRow.availability);
    }
    if (k === "name") payload.candidateName = nextRow.name;
    if (k === "email") payload.emailAddress = nextRow.email;
    if (k === "phone") payload.contactNumber = nextRow.phone;
    if (k === "role") payload.jobTitle = nextRow.role;
    if (k === "location") payload.address = nextRow.location;
    if (k === "bio") payload.professionalProfile = nextRow.bio;
    if (k === "experience")
      payload.experienceYears = parseExperienceYears(nextRow.experience);
  }

  return payload;
}

export default function CvQueuePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [minScore, setMinScore] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [generatingIds, setGeneratingIds] = useState({});

  const qualityChecksQuery = useQuery({
    queryKey: ["quality-checks", "all"],
    queryFn: async () => {
      const extractArray = (res) => {
        const d = res?.data ?? res;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.items)) return d.items;
        if (Array.isArray(d?.results)) return d.results;
        if (Array.isArray(d?.rows)) return d.rows;
        if (Array.isArray(d?.data)) return d.data;
        return [];
      };

      // Some backends validate/deny unknown query params. Try with a larger limit,
      // but gracefully fall back to no params if it 400s.
      try {
        const res = await apiGet("/quality-checks/all", {
          params: { limit: 200 },
        });
        if (res?.success === false)
          throw new Error(res?.message || "Failed to load CVs");
        return extractArray(res);
      } catch (err) {
        if (err?.status !== 400) throw err;
        const res = await apiGet("/quality-checks/all");
        if (res?.success === false) throw new Error(res?.message || "Failed to load CVs");
        return extractArray(res);
      }
    },
    staleTime: 20_000,
  });

  const updateQualityCheckMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiPatch(`/quality-checks/${id}`, payload);
      if (res?.success === false) throw new Error(res?.message || "Update failed");
      return res?.data ?? res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-checks", "all"] });
    },
  });

  const deleteQualityCheckMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiDelete(`/quality-checks/${id}`);
      if (res?.success === false) throw new Error(res?.message || "Delete failed");
      return res?.data ?? res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-checks", "all"] });
    },
  });

  useEffect(() => {
    if (qualityChecksQuery.isLoading) return;
    if (qualityChecksQuery.isError) return;
    if (!qualityChecksQuery.data) return;
    setRows(qualityChecksQuery.data.map(mapQualityCheckToRow));
  }, [
    qualityChecksQuery.data,
    qualityChecksQuery.isError,
    qualityChecksQuery.isLoading,
  ]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const min = minScore === "" ? null : Number(minScore);
    return rows.filter((row) => {
      const tabOk =
        activeTab === "all" ? true : activeTab === row.status;
      const hay = [row.name, row.email, row.role, row.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const qOk = query ? hay.includes(query) : true;
      const availOk =
        availabilityFilter === "all"
          ? true
          : availabilityFilter === "available"
            ? row.availability === "Available"
            : row.availability !== "Available";
      const scoreOk = min === null ? true : Number(row.score ?? -1) >= min;
      return tabOk && qOk && availOk && scoreOk;
    });
  }, [activeTab, availabilityFilter, minScore, q, rows]);

  const counts = useMemo(() => {
    const all = rows.length;
    const passed = rows.filter((r) => r.status === "passed").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    return { all, passed, failed };
  }, [rows]);

  async function generateCv(row, options = {}) {
    const { navigateToRewriter = true, isRegenerate = false } = options;
    const id = row?.id;
    const name = row?.name || "candidate";
    if (!id) {
      toast.error("Missing quality check id");
      return;
    }

    setGeneratingIds((prev) => ({ ...prev, [id]: true }));
    const loadingId = toast.loading(
      isRegenerate ? `Regenerating CV for ${name}…` : `Generating CV for ${name}…`
    );
    try {
      const res = await apiPost("/generated-cv/create", { qualityCheckId: id });
      try {
        const stamp = { response: res, savedAt: Date.now() };
        sessionStorage.setItem(generatedCvStorageKey(id), JSON.stringify(stamp));
        sessionStorage.setItem("generatedCv:last", JSON.stringify(stamp));
      } catch {
        // ignore storage errors
      }

      queryClient.invalidateQueries({ queryKey: ["quality-checks", "all"] });

      toast.success(isRegenerate ? "CV regenerated" : "CV generated", { id: loadingId });
      if (navigateToRewriter) router.push("/ai-rewriter");
      return res?.data ?? res;
    } catch (e) {
      toast.error(e?.message || "Failed to generate CV", { id: loadingId });
    } finally {
      setGeneratingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function extractCvFromQualityCheckResponse(res) {
    const payload = res?.data ?? res;
    const qc = payload?.data ?? payload;
    if (qc?.cv && typeof qc.cv === "object") return qc.cv;
    if (
      qc &&
      (qc.profileContent != null ||
        qc.rawPdfUrl ||
        qc.rawPdfPath ||
        qc.firstName != null ||
        qc.aiRaw)
    ) {
      return qc;
    }
    return null;
  }

  async function viewAiGeneratedCv(row) {
    const id = row?.id;
    const name = row?.name || "candidate";
    if (!id) return;

    const key = generatedCvStorageKey(id);
    const loadingId = toast.loading(`Opening AI CV for ${name}…`);
    try {
      const res = await apiGet(`/quality-checks/${id}`);
      if (res?.success === false) throw new Error(res?.message || "Failed to load quality check");

      const cv = extractCvFromQualityCheckResponse(res);
      if (!cv) throw new Error("No AI-generated CV found on this quality check.");

      const wrapped = { success: true, data: cv };
      const stamp = { response: wrapped, savedAt: Date.now() };
      sessionStorage.setItem(key, JSON.stringify(stamp));
      sessionStorage.setItem("generatedCv:last", JSON.stringify(stamp));

      toast.success("Loaded AI CV", { id: loadingId });
      router.push("/ai-rewriter");
    } catch (e) {
      toast.error(e?.message || "Could not load AI CV.", { id: loadingId });
    }
  }

  function openProfile(row) {
    setSelectedId(row.id);
    setDraft({ ...row });
    setEditMode(false);
    setProfileOpen(true);
  }

  function viewCv(rowOrUrl) {
    const url =
      typeof rowOrUrl === "string"
        ? rowOrUrl
        : rowOrUrl?.pdfUrl || rowOrUrl?.rawPdfPath || "";
    if (!url) {
      toast.error("No CV file available for this candidate");
      return;
    }
    const win = window.open(url, "_blank", "noopener,noreferrer");
    // if (!win) toast.error("Popup blocked. Allow popups to view the CV.");
  }

  async function onDelete() {
    if (!draft?.id) return;
    if (deleteQualityCheckMutation.isPending) return;

    const name = draft?.name || "this CV";
    const id = draft.id;

    const prevRows = rows;
    setRows((prev) => prev.filter((r) => r.id !== id));
    setProfileOpen(false);

    deleteQualityCheckMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Deleted successfully");
      },
      onError: (err) => {
        setRows(prevRows);
        toast.error(err?.message || "Delete failed");
      },
    });
  }

  function onSave() {
    if (!draft?.id) return;
    const prevRow = rows.find((r) => r.id === draft.id);
    const nextRow = { ...(prevRow || {}), ...draft };

    // Optimistic update
    setRows((prev) => prev.map((r) => (r.id === draft.id ? nextRow : r)));

    updateQualityCheckMutation.mutate(
      { id: draft.id, payload: buildPayloadFromRow(nextRow) },
      {
        onSuccess: (updated) => {
          // If backend returns full updated entity, sync from it. Otherwise keep optimistic row.
          if (updated && (updated?.candidate || updated?.id)) {
            const mapped = mapQualityCheckToRow(updated);
            mapped.skills = mergeSkills({
              prevSkills: prevRow?.skills,
              nextSkills: nextRow?.skills,
              mappedSkills: mapped?.skills,
              preferNext: true,
            });
            setRows((prev) => prev.map((r) => (r.id === draft.id ? mapped : r)));
            setDraft(mapped);
          }
          setEditMode(false);
          toast.success("Saved changes");
        },
        onError: (err) => {
          if (prevRow) {
            setRows((prev) => prev.map((r) => (r.id === draft.id ? prevRow : r)));
            setDraft(prevRow);
          }
          toast.error(err?.message || "Save failed");
        },
      }
    );
  }

  function persistRowPatch(id, patch, changedKeys, successMessage) {
    const prevRow = rows.find((r) => r.id === id);
    if (!prevRow) return;
    const nextRow = { ...prevRow, ...patch };
    const payload = buildPayloadFromPatch(prevRow, nextRow, changedKeys);

    // Optimistic update
    setRows((prev) => prev.map((r) => (r.id === id ? nextRow : r)));
    if (draft?.id === id) setDraft(nextRow);

    updateQualityCheckMutation.mutate(
      { id, payload },
      {
        onSuccess: (updated) => {
          // If backend returns the full entity, keep UI 100% synced.
          if (updated && (updated?.candidate || updated?.id)) {
            const mapped = mapQualityCheckToRow(updated);
            mapped.skills = mergeSkills({
              prevSkills: prevRow?.skills,
              nextSkills: nextRow?.skills,
              mappedSkills: mapped?.skills,
            });
            setRows((prev) => prev.map((r) => (r.id === id ? mapped : r)));
            if (draft?.id === id) setDraft(mapped);
          }
          if (successMessage) toast.success(successMessage);
        },
        onError: (err) => {
          setRows((prev) => prev.map((r) => (r.id === id ? prevRow : r)));
          if (draft?.id === id) setDraft(prevRow);
          toast.error(err?.message || "Update failed");
        },
      }
    );
  }

  function updateRowField(id, patch) {
    // Keep for local-only updates (if needed elsewhere)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r) => r.id === selectedId) || null;
  }, [rows, selectedId]);

  const form = draft || selected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary dark:text-slate-100">
            CV Processing Queue
          </h2>
          <p className="mt-2 text-base text-black/60 dark:text-slate-400">
            Manage, review, and organize incoming candidate resumes effortlessly.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-sm font-medium text-black/60 dark:text-slate-400">
            Total CVs uploaded :
          </span>
          <span className="mt-1 text-sm font-semibold text-primary dark:text-primary">
             {counts.all}
            </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, job title..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between py-5">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              const count =
                t.key === "all"
                  ? counts.all
                  : t.key === "passed"
                    ? counts.passed
                    : counts.failed;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={[
                    "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-base font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
                  ].join(" ")}
                >
                  <span>{t.label}</span>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-sm",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Availability
              </span>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="not_available">Not available</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Min score
              </span>
              <input
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                inputMode="numeric"
                placeholder="0-100"
                className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={() => qualityChecksQuery.refetch()}
              disabled={qualityChecksQuery.isFetching}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {qualityChecksQuery.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <tr>
                <th className="px-5 py-4 font-semibold">Name</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Phone</th>
                <th className="px-5 py-4 font-semibold">Quality</th>
                <th className="px-5 py-4 font-semibold">Availability</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {qualityChecksQuery.isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-6 text-sm text-rose-700 dark:text-rose-200"
                  >
                    {qualityChecksQuery.error?.message ||
                      "Failed to load CVs. Please try again."}
                  </td>
                </tr>
              ) : null}
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-black dark:text-slate-100">
                          {row.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {row.email}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {row.phone}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={row.status}
                      onChange={(e) => {
                        const next = e.target.value;
                        persistRowPatch(
                          row.id,
                          { status: next },
                          ["status"],
                          `Quality updated for ${row.name}`
                        );
                      }}
                      className={[
                        "mr-2 h-9 cursor-pointer rounded-full border px-4 pr-9 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-primary/25",
                        statusPillClasses(row.status),
                      ].join(" ")}
                    >
                      <option value="passed">Quality Passed</option>
                      <option value="failed">Quality Failed</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={row.availability}
                      onChange={(e) => {
                        const next = e.target.value;
                        persistRowPatch(
                          row.id,
                          { availability: next },
                          ["availability"],
                          `Availability updated for ${row.name}`
                        );
                      }}
                      className={[
                        "mr-2 h-9 cursor-pointer rounded-full border px-4 pr-9 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-primary/25",
                        availabilityPillClasses(row.availability),
                      ].join(" ")}
                    >
                      <option value="Available">Available</option>
                      <option value="Not available">Not available</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex w-full min-w-[200px] max-w-md flex-nowrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        {row?.aiGenerated ? (
                          <button
                            type="button"
                            disabled={!!generatingIds[row.id]}
                            onClick={() => generateCv(row, { isRegenerate: true })}
                            className="inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm transition hover:border-amber-300 hover:from-amber-100 hover:to-amber-50 disabled:cursor-not-allowed disabled:opacity-55 dark:border-amber-900/45 dark:from-amber-950/35 dark:to-slate-950 dark:text-amber-100 dark:hover:border-amber-800"
                          >
                            <RefreshCw
                              size={15}
                              className={[
                                "shrink-0 text-amber-700 dark:text-amber-300",
                                generatingIds[row.id] ? "animate-spin" : "",
                              ].join(" ")}
                            />
                            Regenerate
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!!generatingIds[row.id]}
                            onClick={() => generateCv(row)}
                            className="inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-primary"
                          >
                            <Wand2 size={15} className="shrink-0" />
                            Generate CV
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openProfile(row)}
                        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                        aria-label={`View ${row.name}`}
                      >
                        <Eye size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-base text-black/60 dark:text-slate-400"
                  >
                    No CVs found. Try a different search.
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
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold text-black dark:text-slate-100">
                  {row.name}
                </div>
                <div
                  className={[
                    "mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                    statusPillClasses(row.status),
                  ].join(" ")}
                >
                  {statusLabel(row.status)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-base">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-black/60 dark:text-slate-400">Email</div>
                <div className="mt-1 truncate text-sm font-medium text-black dark:text-slate-100">
                  {row.email}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-black/60 dark:text-slate-400">Phone</div>
                <div className="mt-1 text-sm font-medium text-black dark:text-slate-100">
                  {row.phone}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-black/60 dark:text-slate-400">Quality</div>
                <div className="mt-2">
                  <select
                    value={row.status}
                    onChange={(e) => {
                      const next = e.target.value;
                      persistRowPatch(
                        row.id,
                        { status: next },
                        ["status"],
                        `Quality updated for ${row.name}`
                      );
                    }}
                    className={[
                      "h-9 w-full cursor-pointer rounded-full border px-4 pr-9 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-primary/25",
                      statusPillClasses(row.status),
                    ].join(" ")}
                  >
                    <option value="passed">Quality Passed</option>
                    <option value="failed">Quality Failed</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-black/60 dark:text-slate-400">
                  Availability
                </div>
                <div className="mt-2">
                  <select
                    value={row.availability}
                    onChange={(e) => {
                      const next = e.target.value;
                      persistRowPatch(
                        row.id,
                        { availability: next },
                        ["availability"],
                        `Availability updated for ${row.name}`
                      );
                    }}
                    className={[
                      "h-9 w-full cursor-pointer rounded-full border px-4 pr-9 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-primary/25",
                      availabilityPillClasses(row.availability),
                    ].join(" ")}
                  >
                    <option value="Available">Available</option>
                    <option value="Not available">Not available</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-stretch gap-2">
              {row?.aiGenerated ? (
                <button
                  type="button"
                  disabled={!!generatingIds[row.id]}
                  onClick={() => generateCv(row, { isRegenerate: true })}
                  className="inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-3 py-3 text-sm font-semibold text-amber-950 shadow-sm transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-55 dark:border-amber-900/45 dark:from-amber-950/35 dark:to-slate-950 dark:text-amber-100 sm:text-base"
                >
                  <RefreshCw
                    size={18}
                    className={generatingIds[row.id] ? "animate-spin" : ""}
                  />
                  Regenerate
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!!generatingIds[row.id]}
                  onClick={() => generateCv(row)}
                  className="inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-primary sm:text-base"
                >
                  <Wand2 size={18} />
                  Generate CV
                </button>
              )}
              <button
                type="button"
                onClick={() => openProfile(row)}
                className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                aria-label={`View ${row.name}`}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}

        {!filtered.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-black/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No CVs found. Try a different search.
          </div>
        ) : null}
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent
          className="sm:max-w-5xl max-h-[85vh] overflow-y-auto"
          showCloseButton
        >
          <DialogHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-950/95">
            <DialogTitle className="text-2xl text-black dark:text-slate-100">
              Candidate Profile
            </DialogTitle>
          </DialogHeader>

          {!form ? (
            <div className="text-base text-black/60 dark:text-slate-400">
              No candidate selected.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0">
                      {!editMode ? (
                        <>
                          <div className="truncate text-2xl font-semibold text-black dark:text-slate-100">
                            {na(form.name)}
                          </div>
                          <div className="mt-1 text-base font-medium text-primary dark:text-primary">
                            {na(form.role)}
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="text-xs font-medium text-black/60 dark:text-slate-400">
                            Name
                          </label>
                          <input
                            value={draft?.name || ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, name: e.target.value }))
                            }
                            className="mt-1 h-12 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                          />
                          <label className="mt-3 block text-xs font-medium text-black/60 dark:text-slate-400">
                            Role
                          </label>
                          <input
                            value={draft?.role || ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, role: e.target.value }))
                            }
                            className="mt-1 h-12 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                          />
                        </>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!editMode ? (
                          <>
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                statusPillClasses(form.status),
                              ].join(" ")}
                            >
                              {statusLabel(form.status)}
                            </span>
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                availabilityPillClasses(form.availability),
                              ].join(" ")}
                            >
                              {form.availability}
                            </span>
                          </>
                        ) : (
                          <div className="grid w-full gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-black/60 dark:text-slate-400">
                                Quality
                              </label>
                              <select
                                value={draft?.status || "passed"}
                                onChange={(e) =>
                                  setDraft((d) => ({ ...d, status: e.target.value }))
                                }
                                className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                              >
                                <option value="passed">Quality Passed</option>
                                <option value="failed">Quality Failed</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-black/60 dark:text-slate-400">
                                Availability
                              </label>
                              <select
                                value={draft?.availability || "Available"}
                                onChange={(e) =>
                                  setDraft((d) => ({
                                    ...d,
                                    availability: e.target.value,
                                  }))
                                }
                                className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                              >
                                <option value="Available">Available</option>
                                <option value="Not available">Not available</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-black/70 dark:text-slate-300 sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-black/50 dark:text-slate-400" />
                          {!editMode ? (
                            <span className="truncate">{na(form.location)}</span>
                          ) : (
                            <input
                              value={draft?.location || ""}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, location: e.target.value }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <UserRound size={16} className="text-black/50 dark:text-slate-400" />
                          {!editMode ? (
                            <span className="truncate">{na(form.experience)}</span>
                          ) : (
                            <input
                              value={draft?.experience || ""}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, experience: e.target.value }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-black/50 dark:text-slate-400" />
                          {!editMode ? (
                            <span className="truncate">{na(form.email)}</span>
                          ) : (
                            <input
                              value={draft?.email || ""}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, email: e.target.value }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* actions moved to footer */}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-lg font-semibold text-black dark:text-slate-100">
                      Personal Information
                    </div>
                    {!editMode ? (
                      <div className="flex items-center gap-2 text-sm text-black/60 dark:text-slate-400">
                        <Phone size={16} /> {na(form.phone)}
                      </div>
                    ) : (
                      <div className="w-full sm:max-w-xs">
                        <label className="text-xs font-medium text-black/60 dark:text-slate-400">
                          Phone number
                        </label>
                        <input
                          value={draft?.phone || ""}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, phone: e.target.value }))
                          }
                          className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium text-black/70 dark:text-slate-300">
                      Bio
                    </div>
                    {!editMode ? (
                      <div className="text-sm leading-relaxed text-black/70 dark:text-slate-300">
                        {truncateWords(form.bio, 200)}
                      </div>
                    ) : (
                      <textarea
                        value={draft?.bio || ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, bio: e.target.value }))
                        }
                        rows={6}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-lg font-semibold text-black dark:text-slate-100">
                    Technical Expertise
                  </div>

                  {!editMode ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Array.isArray(form.skills) && form.skills.length ? (
                        form.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-black/60 dark:text-slate-400">
                          N/A
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-black/60 dark:text-slate-400">
                        Edit skills (comma separated)
                      </div>
                      <input
                        value={(draft?.skills || []).join(", ")}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            skills: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                        placeholder="Django, REST API, PostgreSQL"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap justify-end gap-2 sm:gap-3">
            {form ? (
              <>
                {form.aiGenerated ? (
                  <>
                    <button
                      type="button"
                      disabled={!!generatingIds[form.id]}
                      onClick={() => viewAiGeneratedCv(form)}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-white px-5 py-3 text-base font-semibold text-violet-900 shadow-sm transition hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-55 dark:border-violet-900/50 dark:from-violet-950/45 dark:to-slate-950 dark:text-violet-100"
                    >
                      <Sparkles size={18} />
                      View AI Generated CV
                    </button>
                    <button
                      type="button"
                      disabled={!!generatingIds[form.id]}
                      onClick={() => generateCv(form, { isRegenerate: true })}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-5 py-3 text-base font-semibold text-amber-950 shadow-sm transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-55 dark:border-amber-900/45 dark:from-amber-950/35 dark:to-slate-950 dark:text-amber-100"
                    >
                      <RefreshCw
                        size={18}
                        className={generatingIds[form.id] ? "animate-spin" : ""}
                      />
                      Regenerate
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!!generatingIds[form.id]}
                    onClick={() => generateCv(form)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-primary"
                  >
                    <Wand2 size={18} />
                    Generate CV
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => viewCv(form)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-base font-semibold text-sky-900 transition-colors hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/25 dark:text-sky-200 dark:hover:bg-sky-950/40"
                >
                  <FileText size={18} />
                  View CV
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode((s) => !s)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-base font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200 dark:hover:bg-amber-950/40"
                >
                  <Pencil size={18} />
                  {editMode ? "Cancel Edit" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-base font-semibold text-rose-800 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200 dark:hover:bg-rose-950/40"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                {editMode ? (
                  <button
                    type="button"
                    onClick={onSave}
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    Save changes
                  </button>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

