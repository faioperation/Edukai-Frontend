"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Send } from "lucide-react";

import PdfPreview from "@/components/PdfPreview";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

function pluralize(n, one, many = `${one}s`) {
  return n === 1 ? one : many;
}

function na(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s === "null" ? "" : s;
}

function pickGeneratedCvNode(emailPayload) {
  if (!emailPayload || typeof emailPayload !== "object") return null;
  const direct =
    emailPayload.generatedCv ?? emailPayload.generated_cv ?? emailPayload.generatedCV;
  if (direct && typeof direct === "object") return direct;
  return null;
}

function resolvedPdfFieldsFromCv(cvLike) {
  if (!cvLike || typeof cvLike !== "object") return { pdfUrl: "", pdfPath: "" };
  return {
    pdfUrl: cvLike.pdfUrl ?? cvLike.pdf_url,
    pdfPath: cvLike.pdfPath ?? cvLike.pdf_path,
  };
}

function resolveGeneratedCvId(emailPayload, cvNode) {
  if (!emailPayload || typeof emailPayload !== "object") return "";
  const fromTop =
    emailPayload.generatedCvId ??
    emailPayload.generated_cv_id ??
    emailPayload.GeneratedCvId;
  const nestedId = cvNode?.id ?? cvNode?.generatedCvId ?? cvNode?.generated_cv_id;
  return na(fromTop ?? nestedId);
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
  if (u.startsWith("/")) return u;
  const params = new URLSearchParams({ url: u });
  return `/api/pdf-proxy?${params.toString()}`;
}

/** Subject fallback only when API returns null — do not derive from `generatedCv`. */
function fallbackSubjectLine() {
  return "Candidate introduction";
}

/** Format one key highlight row (strings or `{ icon, title, description }`). */
function formatKeyHighlightEntry(item) {
  if (item == null) return "";
  if (typeof item === "string" || typeof item === "number") return String(item).trim();
  if (typeof item === "object") {
    const icon = na(item.icon);
    const title = na(item.title);
    const description = na(item.description);
    const headline = [icon, title].filter(Boolean).join(" ").trim();
    if (headline && description)
      return `${headline}${description ? `\n${description}` : ""}`.trim();
    if (headline) return headline;
    return description;
  }
  return String(item).trim();
}

function buildEmailBodyFromApi(data) {
  if (!data || typeof data !== "object") return "";

  const lines = [];
  const pushPara = (s) => {
    const t = String(s ?? "").trim();
    if (!t) return;
    if (lines.length) lines.push("");
    lines.push(t);
  };

  pushPara(data.salutation);
  pushPara(data.introParagraph);

  const kh = data.keyHighlights;
  if (Array.isArray(kh) && kh.length) {
    if (lines.length) lines.push("");
    lines.push("Key Highlights:");
    lines.push("");
    for (const item of kh) {
      const block = formatKeyHighlightEntry(item);
      if (!block) continue;
      const indented = block
        .split("\n")
        .map((line, idx) => (idx === 0 ? `- ${line}` : `  ${line}`))
        .join("\n");
      lines.push(indented);
      lines.push("");
    }
    while (lines[lines.length - 1] === "") lines.pop();
  }

  pushPara(data.impactStatement);
  pushPara(data.closingStatement);

  const nb = String(data.nbFooter ?? "").trim();
  if (nb) {
    if (lines.length) lines.push("");
    lines.push(nb);
  }

  const sig = data.signatureBlock;
  if (sig && typeof sig === "object") {
    if (lines.length) lines.push("");
    const name = String(sig.name ?? "").trim();
    const desig = String(sig.designation ?? "").trim();
    const c = sig.contact && typeof sig.contact === "object" ? sig.contact : {};
    if (name) lines.push(name);
    if (desig) lines.push(desig);
    const parts = [
      c.phone && `Phone: ${String(c.phone).trim()}`,
      c.mobile && `Mobile: ${String(c.mobile).trim()}`,
      c.address && String(c.address).trim(),
      c.website && String(c.website).trim(),
    ].filter(Boolean);
    for (const p of parts) lines.push(p);
  }

  return lines.join("\n").trim();
}

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 read-only:cursor-default read-only:bg-slate-50 read-only:text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40 dark:read-only:bg-slate-900/40 dark:read-only:text-slate-200";

const textareaBase =
  "w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 read-only:bg-slate-50 read-only:text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:read-only:bg-slate-900/40 dark:read-only:text-slate-200";

function attachmentFilename(gc) {
  if (!gc || typeof gc !== "object") return "CV.pdf";
  const url = na(gc.pdfUrl ?? gc.pdf_url);
  if (url) {
    try {
      const path = url.split("?")[0].split("/").pop() || "";
      const decoded = decodeURIComponent(path);
      if (decoded.toLowerCase().endsWith(".pdf")) return decoded;
    } catch {
      // ignore
    }
  }
  const fn = na(gc.firstName).replace(/[\\/:*?"<>|]+/g, "-") || "candidate";
  return `${fn}_CV.pdf`;
}

/**
 * Drop `user` from API record (not used on this page).
 * Keeps `generatedCv` only so the PDF viewer can read `pdfUrl` / `pdfPath`.
 */
function sanitizeEmailRecord(data) {
  if (!data || typeof data !== "object") return null;
  const { user: _ignored, ...rest } = data;
  return rest;
}

function applyEmailDataToForm(data, setPayload, setters, setLoadError) {
  setLoadError("");
  const clean = sanitizeEmailRecord(data);
  if (!clean) {
    setLoadError("Invalid email data.");
    return;
  }
  setPayload(clean);
  setters.setSubject(na(clean.subject) || fallbackSubjectLine());
  setters.setSalutation(na(clean.salutation));
  setters.setIntroParagraph(na(clean.introParagraph));
  setters.setKeyHighlights(Array.isArray(clean.keyHighlights) ? clean.keyHighlights : []);
  setters.setImpactStatement(na(clean.impactStatement));
  setters.setClosingStatement(na(clean.closingStatement));
  setters.setNbFooter(na(clean.nbFooter));
  setters.setSignatureBlock(
    clean.signatureBlock && typeof clean.signatureBlock === "object"
      ? clean.signatureBlock
      : { contact: {} }
  );
}

const STORAGE_EMAIL_ACTIVE_KEY = "generatedEmail:activeId";

export default function ComposeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  /** `null` = not hydrated yet; afterwards URL id or persisted POST id from sessionStorage */
  const [resolvedEmailId, setResolvedEmailId] = useState(null);

  const [payload, setPayload] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [salutation, setSalutation] = useState("");
  const [introParagraph, setIntroParagraph] = useState("");
  const [keyHighlights, setKeyHighlights] = useState([]);
  const [impactStatement, setImpactStatement] = useState("");
  const [closingStatement, setClosingStatement] = useState("");
  const [nbFooter, setNbFooter] = useState("");
  const [signatureBlock, setSignatureBlock] = useState({ contact: {} });

  const computedMessageBody = useMemo(() => {
    return buildEmailBodyFromApi({
      salutation,
      introParagraph,
      keyHighlights,
      impactStatement,
      closingStatement,
      nbFooter,
      signatureBlock,
    });
  }, [
    salutation,
    introParagraph,
    keyHighlights,
    impactStatement,
    closingStatement,
    nbFooter,
    signatureBlock,
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const emailIdHydrated = resolvedEmailId !== null;
  const generatedEmailId = emailIdHydrated ? resolvedEmailId : "";

  useEffect(() => {
    const fromUrl = (
      (searchParams?.get("generatedEmailId") || "").trim() ||
      (searchParams?.get("emailId") || "").trim()
    );
    if (fromUrl) {
      try {
        sessionStorage.setItem(STORAGE_EMAIL_ACTIVE_KEY, fromUrl);
      } catch {
        // ignore
      }
      setResolvedEmailId(fromUrl);
      return;
    }
    try {
      const stored = (sessionStorage.getItem(STORAGE_EMAIL_ACTIVE_KEY) || "").trim();
      setResolvedEmailId(stored);
    } catch {
      setResolvedEmailId("");
    }
  }, [searchParams]);

  const generatedEmailQuery = useQuery({
    queryKey: ["generated-email", "detail", generatedEmailId],
    enabled: emailIdHydrated && Boolean(generatedEmailId),
    queryFn: async () => {
      const res = await apiGet(
        `/generated-email/${encodeURIComponent(generatedEmailId)}`
      );
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load generated email");
      const data = res?.data;
      if (!data || typeof data !== "object")
        throw new Error("Invalid response from server");
      return data;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!emailIdHydrated || !generatedEmailId) return;
    if (generatedEmailQuery.isError) {
      setLoadError(generatedEmailQuery.error?.message || "Failed to load email.");
      return;
    }
    if (!generatedEmailQuery.data) return;
    applyEmailDataToForm(
      generatedEmailQuery.data,
      setPayload,
      {
        setSubject,
        setSalutation,
        setIntroParagraph,
        setKeyHighlights,
        setImpactStatement,
        setClosingStatement,
        setNbFooter,
        setSignatureBlock,
      },
      setLoadError
    );
  }, [
    generatedEmailId,
    generatedEmailQuery.data,
    generatedEmailQuery.isError,
    generatedEmailQuery.error,
    emailIdHydrated,
  ]);

  useEffect(() => {
    if (!emailIdHydrated) return;
    if (generatedEmailId) return;
    setLoadError("");
    try {
      const raw = sessionStorage.getItem("generatedEmail:last");
      if (!raw) {
        setLoadError(
          "No generated email id in the URL and nothing saved locally. Go back to the queue and click Proceed to Compose Email."
        );
        return;
      }
      const res = JSON.parse(raw);
      const data = res?.data;
      if (!data || typeof data !== "object") {
        setLoadError("Invalid saved email response.");
        return;
      }
      applyEmailDataToForm(
        data,
        setPayload,
        {
          setSubject,
          setSalutation,
          setIntroParagraph,
          setKeyHighlights,
          setImpactStatement,
          setClosingStatement,
          setNbFooter,
          setSignatureBlock,
        },
        setLoadError
      );
    } catch (e) {
      setLoadError(e?.message || "Could not read saved email.");
    }
  }, [generatedEmailId, emailIdHydrated]);

  const selectedCount = useMemo(() => {
    const ids = payload?.contactIds ?? payload?.contact_ids;
    if (Array.isArray(ids) && ids.length > 0) return ids.length;

    const raw = searchParams?.get("contacts");
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);

    const idStr = (searchParams?.get("ids") || "").trim();
    if (!idStr) return 0;
    return idStr.split(",").filter(Boolean).length;
  }, [payload, searchParams]);

  const cvNodeFromEmail = useMemo(
    () => (payload ? pickGeneratedCvNode(payload) : null),
    [payload]
  );

  const generatedCvRowId = useMemo(
    () => resolveGeneratedCvId(payload ?? {}, cvNodeFromEmail),
    [payload, cvNodeFromEmail]
  );

  const pdfDirectFromEmbeddedCv = useMemo(() => {
    const absolute = resolveGeneratedPdfUrl(resolvedPdfFieldsFromCv(cvNodeFromEmail));
    return na(absolute);
  }, [cvNodeFromEmail]);

  const generatedCvPdfQuery = useQuery({
    queryKey: ["generated-cv", "compose-pdf", generatedCvRowId],
    enabled: Boolean(generatedCvRowId && payload && !pdfDirectFromEmbeddedCv),
    queryFn: async () => {
      const res = await apiGet(`/generated-cv/${encodeURIComponent(generatedCvRowId)}`);
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load generated CV");
      const raw = res?.data ?? res;
      if (!raw || typeof raw !== "object") throw new Error("Invalid CV response");
      return raw;
    },
    staleTime: 60_000,
  });

  const effectiveCvForPreview = useMemo(() => {
    if (pdfDirectFromEmbeddedCv && cvNodeFromEmail && typeof cvNodeFromEmail === "object") {
      return cvNodeFromEmail;
    }
    const fetched = generatedCvPdfQuery.data;
    if (fetched && typeof fetched === "object") return fetched;
    if (cvNodeFromEmail && typeof cvNodeFromEmail === "object") return cvNodeFromEmail;
    return null;
  }, [cvNodeFromEmail, pdfDirectFromEmbeddedCv, generatedCvPdfQuery.data]);

  const absolutePdfHref = useMemo(() => {
    if (!effectiveCvForPreview || typeof effectiveCvForPreview !== "object") return "";
    return resolveGeneratedPdfUrl(resolvedPdfFieldsFromCv(effectiveCvForPreview));
  }, [effectiveCvForPreview]);

  const proxiedPdfUrl = useMemo(() => {
    const u = na(absolutePdfHref);
    if (!u) return "";
    return toPdfProxyUrl(u);
  }, [absolutePdfHref]);

  const attachmentName = useMemo(
    () => attachmentFilename(effectiveCvForPreview),
    [effectiveCvForPreview]
  );

  async function persistEmailDraft() {
    if (!generatedEmailId) {
      toast.error("No generated email id to update.");
      return false;
    }
    if (!na(subject).trim()) {
      toast.error("Subject is required");
      return false;
    }
    if (!computedMessageBody.trim()) {
      toast.error("Email content cannot be empty");
      return false;
    }
    const toastId = toast.loading("Saving email…");
    setIsSavingEmail(true);
    try {
      const body = {
        subject: na(subject).trim(),
        salutation: na(salutation).trim(),
        introParagraph: na(introParagraph).trim(),
        keyHighlights,
        impactStatement: na(impactStatement).trim(),
        closingStatement: na(closingStatement).trim(),
        nbFooter: na(nbFooter).trim(),
        signatureBlock,
      };
      const res = await apiPatch(
        `/generated-email/${encodeURIComponent(generatedEmailId)}`,
        body
      );
      if (res?.success === false) throw new Error(res?.message || "Update failed");

      queryClient.invalidateQueries({
        queryKey: ["generated-email", "detail", generatedEmailId],
      });
      toast.success("Email saved", { id: toastId });
      return true;
    } catch (e) {
      toast.error(e?.message || "Failed to save email", { id: toastId });
      return false;
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function onSend() {
    if (!selectedCount) {
      toast.error("No selected contacts found. Please go back and select contacts.");
      return;
    }
    if (!na(subject)) {
      toast.error("Subject is required");
      return;
    }
    if (!computedMessageBody.trim()) {
      toast.error("Email content cannot be empty");
      return;
    }
    if (!generatedEmailId) {
      toast.error("No generated email id found to send.");
      return;
    }
    if (isSending) return;

    setIsSending(true);
    const toastId = toast.loading(
      `Sending email to ${selectedCount} ${pluralize(selectedCount, "contact")}...`
    );

    try {
      const res = await apiPost(`/generated-email/send/${encodeURIComponent(generatedEmailId)}`);
      if (res?.success === false) throw new Error(res?.message || "Failed to send email");

      toast.success("Email sent successfully", { id: toastId });
      router.push("/mail-submission");
    } catch (error) {
      toast.error(error?.message || "Failed to send email", { id: toastId });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <h2 className="mt-3 text-3xl font-semibold text-primary dark:text-slate-100">
            Email Submission
          </h2>
          <p className="mt-2 max-w-3xl text-base text-black/60 dark:text-slate-400">
            Review, customize, and automatically dispatch Candidate CVs to selected
            contacts.
          </p>
          {!emailIdHydrated || (generatedEmailId && generatedEmailQuery.isPending) ? (
            <p className="mt-3 text-sm text-black/60 dark:text-slate-400">
              {!emailIdHydrated ? "Preparing…" : "Loading email…"}
            </p>
          ) : null}
          {loadError ? (
            <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{loadError}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
            <span className="text-base font-medium text-black/60 dark:text-slate-400">
              Selected contacts:
            </span>
            <span className="ml-2 text-xl font-semibold text-primary">{selectedCount}</span>
          </div>

          <button
            type="button"
            disabled={isSavingEmail || !generatedEmailId}
            onClick={async () => {
              if (!isEditing) {
                setIsEditing(true);
                return;
              }
              const ok = await persistEmailDraft();
              if (!ok) return;
              setIsEditing(false);
            }}
            className={[
              "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
              isEditing
                ? "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900",
            ].join(" ")}
          >
            <Pencil size={16} />
            {isSavingEmail ? "Saving…" : isEditing ? "Save Email" : "Edit Email"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-slate-400">
            Subject
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            readOnly={!isEditing}
            placeholder="Email subject"
            className={`h-12 ${inputBase} dark:placeholder:text-slate-500`}
          />
        </div>

        {!isEditing ? (
          <div className="mt-6 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-slate-400">
              Message Preview
            </div>
            <textarea
              value={computedMessageBody}
              readOnly
              rows={22}
              className={`${textareaBase} min-h-[420px] whitespace-pre-wrap read-only:cursor-default`}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-slate-400">
              Edit Message Parts
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Salutation</label>
              <input value={salutation} onChange={e => setSalutation(e.target.value)} className={`h-11 ${inputBase}`} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Intro Paragraph</label>
              <textarea value={introParagraph} onChange={e => setIntroParagraph(e.target.value)} rows={4} className={textareaBase} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Key Highlights</label>
              {keyHighlights.map((kh, idx) => (
                <div key={idx} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex gap-2">
                    <input placeholder="Icon" value={kh.icon || ""} onChange={e => {
                      const newKh = [...keyHighlights];
                      newKh[idx] = { ...newKh[idx], icon: e.target.value };
                      setKeyHighlights(newKh);
                    }} className={`w-16 h-11 ${inputBase} px-2 text-center`} />
                    <input placeholder="Title" value={kh.title || ""} onChange={e => {
                      const newKh = [...keyHighlights];
                      newKh[idx] = { ...newKh[idx], title: e.target.value };
                      setKeyHighlights(newKh);
                    }} className={`flex-1 h-11 ${inputBase}`} />
                  </div>
                  <textarea placeholder="Description" value={kh.description || ""} onChange={e => {
                      const newKh = [...keyHighlights];
                      newKh[idx] = { ...newKh[idx], description: e.target.value };
                      setKeyHighlights(newKh);
                    }} rows={2} className={textareaBase} />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Impact Statement</label>
              <textarea value={impactStatement} onChange={e => setImpactStatement(e.target.value)} rows={3} className={textareaBase} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Closing Statement</label>
              <input value={closingStatement} onChange={e => setClosingStatement(e.target.value)} className={`h-11 ${inputBase}`} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">NB Footer</label>
              <textarea value={nbFooter} onChange={e => setNbFooter(e.target.value)} rows={3} className={textareaBase} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Signature Block</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input placeholder="Name" value={signatureBlock.name || ""} onChange={e => setSignatureBlock({...signatureBlock, name: e.target.value})} className={`h-11 ${inputBase}`} />
                <input placeholder="Designation" value={signatureBlock.designation || ""} onChange={e => setSignatureBlock({...signatureBlock, designation: e.target.value})} className={`h-11 ${inputBase}`} />
                <input placeholder="Phone" value={signatureBlock.contact?.phone || ""} onChange={e => setSignatureBlock({...signatureBlock, contact: {...signatureBlock.contact, phone: e.target.value}})} className={`h-11 ${inputBase}`} />
                <input placeholder="Mobile" value={signatureBlock.contact?.mobile || ""} onChange={e => setSignatureBlock({...signatureBlock, contact: {...signatureBlock.contact, mobile: e.target.value}})} className={`h-11 ${inputBase}`} />
                <input placeholder="Address" value={signatureBlock.contact?.address || ""} onChange={e => setSignatureBlock({...signatureBlock, contact: {...signatureBlock.contact, address: e.target.value}})} className={`h-11 ${inputBase}`} />
                <input placeholder="Website" value={signatureBlock.contact?.website || ""} onChange={e => setSignatureBlock({...signatureBlock, contact: {...signatureBlock.contact, website: e.target.value}})} className={`h-11 ${inputBase}`} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <div className="text-sm font-semibold text-black/70 dark:text-slate-300">
            Included Attachment (PDF preview)
          </div>
          {generatedCvPdfQuery.isPending ? (
            <p className="text-sm text-black/60 dark:text-slate-400">Loading CV PDF…</p>
          ) : null}
          {generatedCvPdfQuery.isError ? (
            <p className="text-sm text-rose-700 dark:text-rose-300">
              {generatedCvPdfQuery.error?.message || "Could not load CV for PDF"}
            </p>
          ) : null}
          {absolutePdfHref ? (
            <div className="text-xs break-all text-black/55 dark:text-slate-400">
              <span className="font-medium text-black/65 dark:text-slate-400">generatedCv.pdfUrl: </span>
              <a
                href={proxiedPdfUrl || toPdfProxyUrl(absolutePdfHref)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline decoration-primary/30 underline-offset-2 hover:opacity-90"
              >
                {absolutePdfHref}
              </a>
            </div>
          ) : null}
          {!proxiedPdfUrl &&
          !(generatedCvRowId && (generatedCvPdfQuery.isPending || generatedCvPdfQuery.isFetching)) ? (
            <p className="text-sm text-black/60 dark:text-slate-400">
              {!payload ? (
                "Generate an email from the mail queue to attach the CV PDF."
              ) : generatedCvRowId ? (
                "No PDF URL or path found for this generated CV."
              ) : (
                "This email record did not include a generated CV reference."
              )}
            </p>
          ) : null}
          {proxiedPdfUrl ? (
            <>
              <div className="text-xs text-black/50 dark:text-slate-500">{attachmentName}</div>
              <div className="max-h-[560px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-900">
                <PdfPreview url={proxiedPdfUrl} className="min-h-[280px]" />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={isSending || !selectedCount}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary"
      >
        <Send size={18} />
        {isSending
          ? "Sending..."
          : `Send Email to ${selectedCount} ${pluralize(selectedCount, "Contact")}`}
      </button>
    </div>
  );
}
