"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Download, Mail, PencilLine, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PdfPreview from "@/components/PdfPreview";
import { apiGet, apiPatch, apiPut } from "@/lib/api";

function na(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s === "null" ? "" : s;
}

function resolveRawPdfUrl({ rawPdfUrl, rawPdfPath }) {
  const direct = na(rawPdfUrl);
  if (direct) return direct;
  const path = na(rawPdfPath);
  if (!path) return "";

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!base) return path;
  // Try to remove "/api" suffix if present so uploads resolve.
  const normalizedBase = base.replace(/\/+$/, "").replace(/\/api$/i, "");
  try {
    return new URL(path, normalizedBase + "/").toString();
  } catch {
    return path;
  }
}

function resolveGeneratedPdfUrl({ pdfUrl, pdfPath }) {
  const direct = na(pdfUrl);
  if (direct) return direct;
  const path = na(pdfPath);
  if (!path) return "";

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!base) return path;
  const normalizedBase = base.replace(/\/+$/, "").replace(/\/api$/i, "");
  try {
    return new URL(path, normalizedBase + "/").toString();
  } catch {
    return path;
  }
}

function toPdfProxyUrl(url) {
  const u = na(url);
  if (!u) return "";
  // pdfjs requires CORS for cross-origin PDFs; proxy it through same-origin.
  if (u.startsWith("/")) return u;
  const params = new URLSearchParams({ url: u });
  return `/api/pdf-proxy?${params.toString()}`;
}

function parseContactDetails(contactDetails) {
  const raw = na(contactDetails);
  if (!raw) return { email: "", phone: "", other: "" };
  const parts = raw
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  const email = parts.find((p) => p.includes("@")) || "";
  const phone = parts.find((p) => !p.includes("@")) || "";
  const other = parts.filter((p) => p !== email && p !== phone).join(" / ");
  return { email, phone, other };
}

function toBullets(list, pick) {
  const items = Array.isArray(list) ? list : [];
  const lines = items
    .map((it) => pick(it))
    .flat()
    .map((x) => na(x))
    .filter(Boolean);
  if (!lines.length) return "N/A";
  return lines.map((x) => `- ${x}`).join("\n");
}

function buildContactDetails({ email, phone, other }) {
  const parts = [na(email), na(phone), na(other)].filter(Boolean);
  return parts.join(" / ");
}

function parseJobsText(text) {
  const raw = na(text);
  if (!raw || raw === "N/A") return [];

  const blocks = raw
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) return null;

      // Expected:
      // Company (Period)
      // Role
      // - Resp...
      const first = lines[0] || "";
      const m = first.match(/^(.*?)(?:\s*\((.*)\))?$/);
      const company = na(m?.[1]) || "N/A";
      const period = na(m?.[2]);

      let role = "";
      const rest = lines.slice(1);
      if (rest.length && !rest[0].startsWith("-")) {
        role = na(rest[0]);
        rest.shift();
      }
      const responsibilities = rest
        .filter((l) => l.startsWith("-"))
        .map((l) => na(l.replace(/^-+\s*/, "")))
        .filter(Boolean);

      return { company, period: period || undefined, role: role || undefined, responsibilities };
    })
    .filter(Boolean);
}

function parseEducationText(text) {
  const raw = na(text);
  if (!raw || raw === "N/A") return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-"))
    .map((l) => na(l.replace(/^-+\s*/, "")))
    .filter(Boolean)
    .map((title) => ({ title }));
}

function jobsToText(jobs) {
  const items = Array.isArray(jobs) ? jobs : [];
  if (!items.length) return "N/A";

  return items
    .map((j) => {
      const company = na(j?.company ?? j?.company_name) || "N/A";
      const period = na(j?.period);
      const role = na(j?.role);
      const resps = Array.isArray(j?.responsibilities) ? j.responsibilities : [];

      const lines = [];
      lines.push(`${company}${period ? ` (${period})` : ""}`);
      if (role) lines.push(role);

      const respLines = resps.map((r) => na(r)).filter(Boolean).map((r) => `- ${r}`);
      if (respLines.length) lines.push(...respLines);

      return lines.join("\n");
    })
    .join("\n\n");
}

/** Flatten quality-check `cv` + nested `aiRaw` into the shape used by the rewriter UI. */
function normalizeCvPayload(cv) {
  if (!cv || typeof cv !== "object") return cv;

  const hasJobs = Array.isArray(cv.jobs) && cv.jobs.length > 0;
  const rawJobs = cv.aiRaw?.data?.employment_history?.jobs;
  let jobs = hasJobs ? cv.jobs : [];
  if (!jobs.length && Array.isArray(rawJobs)) {
    jobs = rawJobs.map((j) => ({
      role: na(j?.role),
      company: na(j?.company_name ?? j?.company),
      period: na(j?.period),
      responsibilities: Array.isArray(j?.responsibilities) ? j.responsibilities : [],
    }));
  }

  let educations = Array.isArray(cv.educations) ? cv.educations : [];
  const eduItems = cv.aiRaw?.data?.education_qualifications?.items;
  if (!educations.length && Array.isArray(eduItems)) {
    educations = eduItems.map((t) => ({
      title: typeof t === "string" ? t : na(t?.title ?? t),
    }));
  }

  const header = cv.aiRaw?.data?.header;
  const pp = cv.aiRaw?.data?.professional_profile;

  return {
    ...cv,
    firstName: na(cv.firstName) || na(header?.first_name) || na(header?.name) || cv.firstName,
    professionalTitle:
      na(cv.professionalTitle) || na(header?.professional_title) || cv.professionalTitle,
    location: na(cv.location) || na(header?.location) || cv.location,
    contactDetails:
      na(cv.contactDetails) || na(header?.contact_details) || cv.contactDetails,
    profileTitle: na(cv.profileTitle) || na(pp?.title) || "Professional Profile",
    profileContent: na(cv.profileContent) || na(pp?.content) || "N/A",
    jobs,
    educations,
  };
}

function buildEnhancedFromGeneratedCv(data) {
  const d = data || {};

  const name = [na(d.firstName), na(d.lastName)].filter(Boolean).join(" ") || "—";
  
  let designation = na(d.professionalTitle);
  if (!designation && Array.isArray(d.expertise) && d.expertise.length > 0) {
    designation = d.expertise.join(", ");
  }
  if (!designation) {
    designation = "—";
  }

  const contactDetails = na(d.contactDetails) || "—";
  const location = na(d.location) || "—";
  const logo = na(d.logo);

  const jobsText = jobsToText(d.jobs);

  const eduText = toBullets(d.educations, (e) => na(e.title));
  const profileTitle = na(d.profileTitle) || "Professional Profile";
  const profileContent = na(d.profileContent) || "N/A";

  let skillsItems = [];
  if (d.skills && Array.isArray(d.skills.items)) {
    skillsItems = d.skills.items;
  } else if (Array.isArray(d.skills)) {
    skillsItems = d.skills;
  }
  const skillsText = toBullets(skillsItems, (s) => s);
  const skillsTitle = d.skills?.title || "Skills";

  return {
    header: {
      logo,
      name,
      designation,
      contactDetails,
      location,
    },
    sections: [
      { id: "profile", title: profileTitle, body: profileContent },
      { id: "history", title: "Employment History", body: jobsText },
      { id: "education", title: "Education & Qualifications", body: eduText },
      {
        id: "skills",
        title: skillsTitle,
        body: skillsText,
      },
    ],
  };
}

function EditIconButton({ onClick, label = "Edit" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-950"
    >
      <PencilLine size={16} />
    </button>
  );
}

function InlineActionButton({ onClick, variant = "default", children, label }) {
  const classes =
    variant === "primary"
      ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
        classes,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CvHoverEditText({
  id,
  value,
  draft,
  setDraft,
  isActive,
  onStart,
  onSave,
  onCancel,
  className = "",
  textClassName = "",
  inputClassName = "",
  placeholder = "",
  align = "left",
}) {
  const alignClasses =
    align === "center"
      ? "text-center justify-center"
      : align === "right"
        ? "text-right justify-end"
        : "text-left justify-start";

  return (
    <div className={["group relative", className].join(" ")}>
      {!isActive ? (
        <div className={["relative flex items-center gap-3", alignClasses].join(" ")}>
          <div className={["min-w-0", textClassName].join(" ")}>
            {value || (
              <span className="text-slate-400 dark:text-slate-500">
                {placeholder || "—"}
              </span>
            )}
          </div>
          <div
            className={[
              "absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100",
              align === "center" ? "right-0" : "",
            ].join(" ")}
          >
            <EditIconButton onClick={() => onStart(id, value)} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className={[
              "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
              inputClassName,
            ].join(" ")}
          />
          <div className="flex shrink-0 items-center gap-2">
            <InlineActionButton
              variant="primary"
              onClick={() => onSave(id, draft)}
              label="Save"
            >
              <Check size={14} />
              Save
            </InlineActionButton>
            <InlineActionButton onClick={onCancel} label="Cancel">
              <X size={14} />
              Cancel
            </InlineActionButton>
          </div>
        </div>
      )}
    </div>
  );
}

function CvHoverEditSection({
  id,
  title,
  value,
  draft,
  setDraft,
  isActive,
  onStart,
  onSave,
  onCancel,
  rows = 6,
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-800">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </div>

        {!isActive ? (
          <div className="opacity-0 transition group-hover:opacity-100">
            <EditIconButton onClick={() => onStart(id, value)} label={`Edit ${title}`} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <InlineActionButton
              variant="primary"
              onClick={() => onSave(id, draft)}
              label={`Save ${title}`}
            >
              <Check size={14} />
              Save
            </InlineActionButton>
            <InlineActionButton onClick={onCancel} label={`Cancel ${title}`}>
              <X size={14} />
              Cancel
            </InlineActionButton>
          </div>
        )}
      </div>

      <div className="mt-3">
        {isActive ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={rows}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-slate-700 outline-none focus:ring-0 dark:text-slate-200"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiRewriterPage() {
  const router = useRouter();

  const [generated, setGenerated] = useState(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState("");
  const [enhanced, setEnhanced] = useState(() =>
    buildEnhancedFromGeneratedCv(null)
  );
  const [activeEditId, setActiveEditId] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("generatedCv:last");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const res = parsed?.response;
      let cv =
        res?.data?.cv ||
        res?.data?.data ||
        res?.data ||
        res?.data?.item ||
        null;
      if (!cv || typeof cv !== "object") return;
      cv = normalizeCvPayload(cv);
      setGenerated(cv);
      setEnhanced(buildEnhancedFromGeneratedCv(cv));
      setOriginalPdfUrl(
        resolveRawPdfUrl({ rawPdfUrl: cv.rawPdfUrl, rawPdfPath: cv.rawPdfPath })
      );
    } catch {
      // ignore
    }
  }, []);

  const candidateName = enhanced?.header?.name || "—";
  const encodedOriginalUrl = useMemo(() => {
    const u = originalPdfUrl || "";
    const proxied = toPdfProxyUrl(u);
    return proxied || "";
  }, [originalPdfUrl]);

  function updateHeader(key, value) {
    setEnhanced((prev) => ({
      ...prev,
      header: { ...prev.header, [key]: value },
    }));
  }

  function updateSection(id, value) {
    setEnhanced((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, body: value } : s)),
    }));
  }

  function startEdit(id, currentValue) {
    setActiveEditId(id);
    setDraftValue(currentValue ?? "");
  }

  function cancelEdit() {
    setActiveEditId(null);
    setDraftValue("");
  }

  async function persistGeneratedCvPatch(patch) {
    const cvId = generated?.id;
    if (!cvId) throw new Error("Missing generated CV id");
    let res;
    try {
      res = await apiPatch(`/generated-cv/${cvId}`, patch);
    } catch (e) {
      // Some backends only allow PUT for updates.
      if (e?.status === 405 || e?.status === 404) {
        res = await apiPut(`/generated-cv/${cvId}`, patch);
      } else {
        throw e;
      }
    }
    if (res?.success === false) throw new Error(res?.message || "Update failed");

    // Some backends return { success, message } without the updated entity.
    let updated = res?.data ?? res;
    const looksLikeCv =
      updated &&
      typeof updated === "object" &&
      (updated?.id || updated?.profileContent != null || updated?.rawPdfUrl || updated?.aiRaw);

    if (!looksLikeCv) {
      const fresh = await apiGet(`/generated-cv/${cvId}`);
      if (fresh?.success === false)
        throw new Error(fresh?.message || "Failed to refresh generated CV");
      updated = fresh?.data ?? fresh;
    }

    return normalizeCvPayload(updated);
  }

  async function saveEdit(id, value) {
    if (!id) return;

    if (!generated?.id) {
      toast.error("No generated CV loaded");
      return;
    }

    if (id.startsWith("header.")) {
      const key = id.replace("header.", "");
      updateHeader(key, value);
    } else {
      updateSection(id, value);
    }

    setActiveEditId(null);
    setDraftValue("");

    // Persist to backend using /generated-cv/:cvId
    const loadingId = toast.loading("Saving changes…");
    setSaving(true);
    try {
      const patch = {};

      // Header mappings
      if (id === "header.name") patch.firstName = na(value) || generated.firstName;
      if (id === "header.designation") patch.professionalTitle = na(value);
      if (id === "header.contactDetails") patch.contactDetails = na(value);
      if (id === "header.location") patch.location = na(value);

      // Section mappings
      if (id === "profile") patch.profileContent = na(value);
      if (id === "history") patch.jobs = parseJobsText(value);
      if (id === "education") patch.educations = parseEducationText(value);
      if (id === "skills") {
        const items = value
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("-"))
          .map((l) => na(l.replace(/^-+\s*/, "")))
          .filter(Boolean);
        patch.skills = { items, title: generated?.skills?.title || "Skills" };
      }

      const updatedCv = await persistGeneratedCvPatch(patch);
      setGenerated(updatedCv);
      setEnhanced(buildEnhancedFromGeneratedCv(updatedCv));
      setOriginalPdfUrl(
        resolveRawPdfUrl({ rawPdfUrl: updatedCv.rawPdfUrl, rawPdfPath: updatedCv.rawPdfPath })
      );
      try {
        const stamp = { response: { success: true, data: updatedCv }, savedAt: Date.now() };
        sessionStorage.setItem("generatedCv:last", JSON.stringify(stamp));
      } catch {
        // ignore
      }
      toast.success("Saved", { id: loadingId });
    } catch (e) {
      toast.error(e?.message || "Save failed", { id: loadingId });
      // We already applied optimistic UI update; re-sync from last known generated state.
      const cv = normalizeCvPayload(generated);
      setEnhanced(buildEnhancedFromGeneratedCv(cv));
    } finally {
      setSaving(false);
    }
  }

  async function downloadProcessed() {
    const cvId = generated?.id;
    if (!cvId) {
      toast.error("No generated CV loaded");
      return;
    }

    const loadingId = toast.loading("Generating PDF…");
    try {
      const res = await apiPatch(`/generated-cv/generate-pdf/${cvId}`, {});
      if (res?.success === false)
        throw new Error(res?.message || "Failed to generate PDF");

      const payload = res?.data ?? res;
      const updated = payload?.data ?? payload;

      const nextCv = normalizeCvPayload({
        ...(generated || {}),
        ...(updated || {}),
      });
      setGenerated(nextCv);

      const directUrl = resolveGeneratedPdfUrl({
        pdfUrl: nextCv.pdfUrl,
        pdfPath: nextCv.pdfPath,
      });
      if (!directUrl) throw new Error("PDF URL not returned");

      // Download via same-origin proxy to avoid CORS issues.
      const downloadUrl = toPdfProxyUrl(directUrl);
      const fileRes = await fetch(downloadUrl, { cache: "no-store" });
      if (!fileRes.ok) throw new Error(`Download failed (${fileRes.status})`);
      const blob = await fileRes.blob();

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const safeName = (enhanced?.header?.name || "CV").replace(/[\\/:*?"<>|]+/g, "-");
      a.download = `${safeName}-AI.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success("PDF downloaded", { id: loadingId });
    } catch (e) {
      toast.error(e?.message || "PDF generation failed", { id: loadingId });
    }
  }

  function proceedToMail() {
    const cvId = generated?.id;
    if (!cvId) {
      toast.error("Missing generated CV id");
      return;
    }

    try {
      sessionStorage.setItem("generatedCv:activeId", String(cvId));
    } catch {
      // ignore
    }

    toast.success("Proceeding to contact queue...");
    router.push(`/mail-submission?generatedCvId=${encodeURIComponent(String(cvId))}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary dark:text-slate-100">
            AI CV Rewriter
          </h2>
          <p className="mt-2 max-w-2xl text-base text-black/60 dark:text-slate-400">
            Enhance CVs with AI context understanding and apply anonymization
            frameworks...
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-primary/10 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="text-sm font-medium text-black/60 dark:text-slate-400">
            Candidate
          </div>
          <div className="mt-1 text-base font-semibold text-primary dark:text-slate-100">
            {candidateName}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold text-primary dark:text-slate-100">
              Original Document
            </CardTitle>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              Unprocessed original copy
            </span>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="no-scrollbar h-[640px] overflow-y-auto bg-slate-100 p-4 dark:bg-slate-900">
                <div className="mx-auto w-full max-w-[680px]">
                  {encodedOriginalUrl ? (
                    <PdfPreview url={encodedOriginalUrl} />
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                      No raw PDF URL found for this generated CV.
                    </div>
                  )}
                </div>
              </div>
            </div>

           
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold text-primary dark:text-slate-100">
              AI Enhanced Version
            </CardTitle>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {activeEditId ? "Editing 1 section" : "Hover sections to edit"}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="no-scrollbar h-[640px] overflow-y-auto bg-slate-100 p-4 dark:bg-slate-900">
                <div className="mx-auto w-full max-w-[680px] rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs font-semibold tracking-wide text-slate-500">
                      AI ENHANCED VERSION
                    </div>
                    <div
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        activeEditId ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      <PencilLine size={14} />
                      {activeEditId ? "Editing" : "Read-only"}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    {enhanced?.header?.logo ? (
                      <div className="mb-3 flex justify-center">
                        <img
                          src={enhanced.header.logo}
                          alt="Logo"
                          className="h-10 w-auto object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // hide broken image
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                    <CvHoverEditText
                      id="header.name"
                      value={enhanced.header.name}
                      draft={draftValue}
                      setDraft={setDraftValue}
                      isActive={activeEditId === "header.name"}
                      onStart={startEdit}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      align="center"
                      textClassName="text-3xl font-semibold text-slate-900"
                      inputClassName="text-base font-semibold"
                      placeholder="Full name"
                    />

                    <div className="mt-2">
                      <CvHoverEditText
                        id="header.designation"
                        value={enhanced.header.designation}
                        draft={draftValue}
                        setDraft={setDraftValue}
                        isActive={activeEditId === "header.designation"}
                        onStart={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        align="center"
                        textClassName="text-base font-medium text-slate-700"
                        placeholder="Designation"
                      />
                    </div>

                    <div className="mt-2">
                      <CvHoverEditText
                        id="header.contactDetails"
                        value={enhanced.header.contactDetails}
                        draft={draftValue}
                        setDraft={setDraftValue}
                        isActive={activeEditId === "header.contactDetails"}
                        onStart={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        align="center"
                        textClassName="text-sm font-medium text-slate-600"
                        placeholder="Contact Details"
                      />
                    </div>

                    <div className="mt-2 flex flex-col items-center gap-1 text-sm text-slate-600 sm:flex-row sm:justify-center">
                      <CvHoverEditText
                        id="header.location"
                        value={enhanced.header.location}
                        draft={draftValue}
                        setDraft={setDraftValue}
                        isActive={activeEditId === "header.location"}
                        onStart={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        align="center"
                        textClassName="max-w-md"
                        placeholder="Location"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {enhanced.sections.map((s) => (
                      <CvHoverEditSection
                        key={s.id}
                        id={s.id}
                        title={s.title}
                        value={s.body}
                        draft={draftValue}
                        setDraft={setDraftValue}
                        isActive={activeEditId === s.id}
                        onStart={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        rows={s.id === "profile" ? 7 : 6}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={downloadProcessed}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 px-6 py-3 text-base font-semibold text-balce transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
        >
          <Download size={18} />
          Download Processed CV
        </button>
        <button
          type="button"
          onClick={proceedToMail}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
        >
          <Mail size={18} />
          Proceed to Contact Queue
        </button>
      </div>
    </div>
  );
}

