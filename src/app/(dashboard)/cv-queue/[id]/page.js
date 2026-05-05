"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
  ArrowLeft,
} from "lucide-react";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import Link from "next/link";

// --- Helpers copied from cv-queue/page.js ---
function generatedCvStorageKey(qualityCheckId) {
  return `generatedCv:qc:${qualityCheckId}`;
}

function mapAvailability(status) {
  if (typeof status === "boolean") return status ? "Available" : "Not available";
  const raw = String(status || "");
  const v = raw.toLowerCase();
  const compact = v.replace(/[^a-z]/g, "");
  if (compact === "available") return "Available";
  if (compact === "notavailable" || compact === "unavailable") return "Not available";
  return raw ? raw : "Not available";
}

function mapQualityStatus(status) {
  if (typeof status === "boolean") return status ? "passed" : "failed";
  const v = String(status || "").toLowerCase();
  if (v === "passed" || v === "pass" || v === "true") return "passed";
  if (v === "failed" || v === "fail" || v === "false") return "failed";
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

  if (preferNext && next.length) return next;
  if (mapped.length) return mapped;
  if (next.length) return next;
  return prev;
}

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
    candidateName: row.name || undefined,
    emailAddress: row.email || undefined,
    contactNumber: row.phone || undefined,
    jobTitle: row.role || undefined,
    address: row.location || undefined,
    experienceYears: parseExperienceYears(row.experience),
    professionalProfile: row.bio || undefined,
  };
}

export default function CandidateProfilePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params?.id;

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["quality-checks", id],
    queryFn: async () => {
      const res = await apiGet(`/quality-checks/${id}`);
      if (res?.success === false) throw new Error(res?.message || "Failed to load CV");
      return res?.data ?? res;
    },
    enabled: !!id,
  });

  const form = draft || (item ? mapQualityCheckToRow(item) : null);

  useEffect(() => {
    if (item && !draft) {
      setDraft(mapQualityCheckToRow(item));
    }
  }, [item, draft]);

  const updateQualityCheckMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiPatch(`/quality-checks/${id}`, payload);
      if (res?.success === false) throw new Error(res?.message || "Update failed");
      return res?.data ?? res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-checks", id] });
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

  async function generateCv(row, options = {}) {
    const { navigateToRewriter = true, isRegenerate = false } = options;
    const name = row?.name || "candidate";

    setIsGenerating(true);
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

      queryClient.invalidateQueries({ queryKey: ["quality-checks", id] });
      queryClient.invalidateQueries({ queryKey: ["quality-checks", "all"] });

      toast.success(isRegenerate ? "CV regenerated" : "CV generated", { id: loadingId });
      if (navigateToRewriter) router.push("/ai-rewriter");
    } catch (e) {
      toast.error(e?.message || "Failed to generate CV", { id: loadingId });
    } finally {
      setIsGenerating(false);
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
    const name = row?.name || "candidate";
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

  function viewCv(rowOrUrl) {
    const url =
      typeof rowOrUrl === "string"
        ? rowOrUrl
        : rowOrUrl?.pdfUrl || rowOrUrl?.rawPdfPath || "";
    if (!url) {
      toast.error("No CV file available for this candidate");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onDelete() {
    if (!id) return;
    if (deleteQualityCheckMutation.isPending) return;

    if (!window.confirm("Are you sure you want to delete this candidate?")) return;

    deleteQualityCheckMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Deleted successfully");
        router.push("/cv-queue");
      },
      onError: (err) => {
        toast.error(err?.message || "Delete failed");
      },
    });
  }

  function onSave() {
    if (!id || !draft) return;

    const prevRow = item ? mapQualityCheckToRow(item) : {};
    const nextRow = { ...prevRow, ...draft };

    updateQualityCheckMutation.mutate(
      { id, payload: buildPayloadFromRow(nextRow) },
      {
        onSuccess: (updated) => {
          if (updated && (updated?.candidate || updated?.id)) {
            const mapped = mapQualityCheckToRow(updated);
            mapped.skills = mergeSkills({
              prevSkills: prevRow?.skills,
              nextSkills: nextRow?.skills,
              mappedSkills: mapped?.skills,
              preferNext: true,
            });
            setDraft(mapped);
          }
          setEditMode(false);
          toast.success("Saved changes");
        },
        onError: (err) => {
          toast.error(err?.message || "Save failed");
        },
      }
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading candidate...</div>;
  }

  if (isError || !form) {
    return (
      <div className="p-8 text-center text-rose-500">
        {error?.message || "Candidate not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/cv-queue"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <ArrowLeft size={18} />
        </Link>
        <h2 className="text-2xl font-semibold text-black dark:text-slate-100">
          Candidate Profile
        </h2>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex w-full items-start gap-4 md:w-auto md:flex-1">
              <div className="min-w-0 flex-1">
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
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className="mt-1 h-12 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                    />
                    <label className="mt-3 block text-xs font-medium text-black/60 dark:text-slate-400">
                      Role
                    </label>
                    <input
                      value={draft?.role || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
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

                <div className="mt-4 grid w-full gap-3 text-sm text-black/70 dark:text-slate-300 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin size={16} className="shrink-0 text-black/50 dark:text-slate-400" />
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
                  <div className="flex min-w-0 items-center gap-2">
                    <UserRound size={16} className="shrink-0 text-black/50 dark:text-slate-400" />
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
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail size={16} className="shrink-0 text-black/50 dark:text-slate-400" />
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

            <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[200px]">
              {form.aiGenerated ? (
                <>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => viewAiGeneratedCv(form)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50 to-white px-5 py-3 text-base font-semibold text-violet-900 shadow-sm transition hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-55 dark:border-violet-900/50 dark:from-violet-950/45 dark:to-slate-950 dark:text-violet-100"
                  >
                    <Sparkles size={18} />
                    View AI Generated CV
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => generateCv(form, { isRegenerate: true })}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-5 py-3 text-base font-semibold text-amber-950 shadow-sm transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-55 dark:border-amber-900/45 dark:from-amber-950/35 dark:to-slate-950 dark:text-amber-100"
                  >
                    <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                    Regenerate
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isGenerating}
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
              <div className="mt-2 flex w-full items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editMode) {
                      setDraft(mapQualityCheckToRow(item));
                      setEditMode(false);
                    } else {
                      setEditMode(true);
                    }
                  }}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200 dark:hover:bg-amber-950/40"
                >
                  <Pencil size={16} />
                  {editMode ? "Cancel" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200 dark:hover:bg-rose-950/40"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
              {editMode && (
                <button
                  type="button"
                  onClick={onSave}
                  className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold text-black dark:text-slate-100">
                Personal Information
              </div>
              {!editMode ? (
                <div className="flex min-w-0 items-center gap-2 text-sm text-black/60 dark:text-slate-400">
                  <Phone size={16} className="shrink-0" /> <span className="truncate">{na(form.phone)}</span>
                </div>
              ) : (
                <div className="w-full sm:max-w-xs">
                  <label className="text-xs font-medium text-black/60 dark:text-slate-400">
                    Phone number
                  </label>
                  <input
                    value={draft?.phone || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm font-medium text-black/70 dark:text-slate-300">Bio</div>
              {!editMode ? (
                <div className="break-words text-sm leading-relaxed text-black/70 dark:text-slate-300">
                  {truncateWords(form.bio, 200)}
                </div>
              ) : (
                <textarea
                  value={draft?.bio || ""}
                  onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                />
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
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
                  <span className="text-sm text-black/60 dark:text-slate-400">N/A</span>
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
    </div>
  );
}
