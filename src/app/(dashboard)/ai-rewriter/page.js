"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Download, Mail, PencilLine, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PdfPreview from "@/components/PdfPreview";

const ORIGINAL_CV_URL =
  "/assets/cv/MD. AL RAKEB RASEL BOSHUNIA.pdf";

const dummyEnhanced = {
  header: {
    name: "MD. AL RAKEB RASEL BOSHUNIA",
    designation: "Backend Engineer (Django)",
    location: "Dhaka, Bangladesh",
    phone: "++880 1749126396",
    email: "official.alrakib@gmail.com",
  },
  sections: [
    {
      id: "profile",
      title: "Professional Profile",
      body:
        "Backend Engineer specializing in Python and Django. Experienced in building scalable REST APIs, optimizing databases, and designing secure, maintainable services. Strong communication and stakeholder alignment with a focus on measurable impact.",
    },
    {
      id: "history",
      title: "Employment History",
      body:
        "- Built and maintained Django-based services for internal automation.\n- Designed REST APIs and integrated third-party services.\n- Improved performance by optimizing PostgreSQL queries and caching.\n- Collaborated with cross-functional teams to deliver features.",
    },
    {
      id: "education",
      title: "Education & Qualifications",
      body:
        "- BSc in Computer Science\n- Training in REST API design & security best practices\n- Continuous learning in distributed systems",
    },
    {
      id: "expertise",
      title: "Technical Expertise",
      body:
        "Django, REST API, PostgreSQL, Docker, Python, Redis, Kubernetes",
    },
  ],
};

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

  const candidateName = dummyEnhanced.header.name;
  const [enhanced, setEnhanced] = useState(dummyEnhanced);
  const [activeEditId, setActiveEditId] = useState(null);
  const [draftValue, setDraftValue] = useState("");

  const encodedOriginalUrl = useMemo(() => encodeURI(ORIGINAL_CV_URL), []);

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

  function saveEdit(id, value) {
    if (!id) return;

    if (id.startsWith("header.")) {
      const key = id.replace("header.", "");
      updateHeader(key, value);
    } else {
      updateSection(id, value);
    }

    setActiveEditId(null);
    setDraftValue("");
    toast.success("Section updated");
  }

  function downloadProcessed() {
    const lines = [
      enhanced.header.name,
      enhanced.header.designation,
      enhanced.header.location,
      enhanced.header.phone,
      enhanced.header.email,
      "",
      ...enhanced.sections.flatMap((s) => ["## " + s.title, s.body, ""]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${enhanced.header.name} - AI Enhanced.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Downloaded processed CV");
  }

  function proceedToMail() {
    toast.success("Proceeding to mail submission...");
    router.push("/mail-submission");
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
                  <PdfPreview url={encodedOriginalUrl} />
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
                      <span className="hidden sm:inline">•</span>
                      <CvHoverEditText
                        id="header.phone"
                        value={enhanced.header.phone}
                        draft={draftValue}
                        setDraft={setDraftValue}
                        isActive={activeEditId === "header.phone"}
                        onStart={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        align="center"
                        textClassName="max-w-md"
                        placeholder="Phone number"
                      />
                      <span className="hidden sm:inline">•</span>
                      <CvHoverEditText
                        id="header.email"
                        value={enhanced.header.email}
                        draft={draftValue}
                        setDraft={setDraftValue}
                        isActive={activeEditId === "header.email"}
                        onStart={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        align="center"
                        textClassName="max-w-md"
                        placeholder="Email"
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

