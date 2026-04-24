"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Download, Mail, PencilLine } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PdfPreview from "@/components/PdfPreview";

const ORIGINAL_CV_URL =
  "/assets/cv/MD. AL RAKEB RASEL BOSHUNIA.pdf";

const dummyEnhanced = {
  header: {
    name: "MD. AL RAKEB RASEL BOSHUNIA",
    title: "Backend Engineer (Django)",
    location: "Dhaka, Bangladesh",
    contact: "++880 1749126396  |  official.alrakib@gmail.com",
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

export default function AiRewriterPage() {
  const router = useRouter();

  const candidateName = dummyEnhanced.header.name;
  const [enhanced, setEnhanced] = useState(dummyEnhanced);
  const [isEditing, setIsEditing] = useState(false);

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

  function downloadProcessed() {
    const lines = [
      enhanced.header.name,
      enhanced.header.title,
      enhanced.header.location,
      enhanced.header.contact,
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
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className={[
                "inline-flex cursor-pointer items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                isEditing
                  ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 dark:border-primary/25 dark:bg-primary/10",
              ].join(" ")}
            >
              {isEditing ? "Save" : "Edit"}
            </button>
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
                        isEditing
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      <PencilLine size={14} />
                      {isEditing ? "Editing" : "Read-only"}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <input
                      value={enhanced.header.name}
                      onChange={(e) => updateHeader("name", e.target.value)}
                      readOnly={!isEditing}
                      className="w-full bg-transparent text-center text-3xl font-semibold text-slate-900 outline-none read-only:cursor-not-allowed read-only:text-slate-700"
                    />
                    <input
                      value={enhanced.header.title}
                      onChange={(e) => updateHeader("title", e.target.value)}
                      readOnly={!isEditing}
                      className="mt-2 w-full bg-transparent text-center text-base font-medium text-slate-700 outline-none read-only:cursor-not-allowed"
                    />
                    <div className="mt-2 flex flex-col items-center gap-1 text-sm text-slate-600 sm:flex-row sm:justify-center">
                      <input
                        value={enhanced.header.location}
                        onChange={(e) => updateHeader("location", e.target.value)}
                        readOnly={!isEditing}
                        className="w-full max-w-md bg-transparent text-center outline-none read-only:cursor-not-allowed"
                      />
                      <span className="hidden sm:inline">•</span>
                      <input
                        value={enhanced.header.contact}
                        onChange={(e) => updateHeader("contact", e.target.value)}
                        readOnly={!isEditing}
                        className="w-full max-w-md bg-transparent text-center outline-none read-only:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {enhanced.sections.map((s) => (
                      <div key={s.id}>
                        <div className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">
                          {s.title}
                        </div>
                        <textarea
                          value={s.body}
                          onChange={(e) => updateSection(s.id, e.target.value)}
                          readOnly={!isEditing}
                          rows={s.id === "profile" ? 7 : 6}
                          className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-slate-700 outline-none read-only:cursor-not-allowed"
                        />
                      </div>
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

