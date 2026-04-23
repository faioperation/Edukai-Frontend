"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Check,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatCount(n) {
  return new Intl.NumberFormat().format(n);
}

const PROCESS_STEPS = [
  "Processing...",
  "Checking the quality...",
  "Almost there...",
];

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);

  const [minExp, setMinExp] = useState("Select Experience");
  const [skills, setSkills] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [checkFormatting, setCheckFormatting] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);

  const totalSelected = files.length;

  const canSend = useMemo(() => {
    return totalSelected > 0;
  }, [totalSelected]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const next = [
        ...prev,
        ...list
          .filter((f) => !existing.has(f.name))
          .map((f) => ({ name: f.name, file: f })),
      ];
      return next;
    });

    toast.success(`${list.length} CV${list.length > 1 ? "s" : ""} uploaded`);
    e.target.value = "";
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function clearAll() {
    setFiles([]);
  }

  function startQualityCheck() {
    if (!canSend) {
      toast.error("Please upload at least 1 CV");
      return;
    }

    setDialogOpen(true);
    setStepIndex(0);
    setResult(null);
  }

  useEffect(() => {
    if (!dialogOpen) return;
    if (result) return;

    const t1 = setTimeout(() => setStepIndex(1), 2000);
    const t2 = setTimeout(() => setStepIndex(2), 4000);
    const t3 = setTimeout(() => {
      const total = files.length;
      const passed = Math.max(0, Math.min(total, Math.round(total * 0.75)));
      const failed = Math.max(0, total - passed);
      setResult({ total, passed, failed });
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [dialogOpen, files.length, result]);

  function onOk() {
    setDialogOpen(false);
    router.push("/cv-queue");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-primary dark:text-slate-100">
          Bulk Import
        </h2>
        <p className="mt-2 text-base text-black/60 dark:text-slate-400">
          Upload multiple CVs and run automated quality checks.
        </p>
      </div>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={onPickFiles}
          className="hidden"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) =>
            e.key === "Enter" || e.key === " " ? openPicker() : null
          }
          className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center transition-all hover:border-primary/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/50 dark:hover:bg-slate-900/70"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
            <Upload size={26} />
          </div>
          <div className="mt-4 text-base font-semibold text-black dark:text-slate-100">
            Click to select CV files
          </div>
          <div className="mt-1 text-sm text-black/60 dark:text-slate-400">
            PDF, DOC, or DOCX — you can select multiple files
          </div>
        </div>

        {totalSelected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-base font-semibold text-black dark:text-slate-100">
                Selected CVs:{" "}
                <span className="text-primary">{formatCount(totalSelected)}</span>
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <FileText size={16} className="opacity-80" />
                  <span className="max-w-[220px] truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(f.name)}
                    className="cursor-pointer rounded-full p-1 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black dark:text-slate-100">
            Automated Quality Check Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black/70 dark:text-slate-300">
                Minimum Years of Experience
              </label>
              <select
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                className="h-12 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
              >
                <option>Select Experience</option>
                <option>0-1 years</option>
                <option>2-3 years</option>
                <option>4-6 years</option>
                <option>7+ years</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black/70 dark:text-slate-300">
                Required Skills (comma separated)
              </label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, Node.js"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-black/70 dark:text-slate-300">
                Job Role
              </label>
              <input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Math Teacher"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

        <button
          type="button"
          onClick={startQualityCheck}
          disabled={!canSend}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-primary"
        >
          <Sparkles size={20} />
          Send to check quality
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-black dark:text-slate-100">
              Quality Check
            </DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                      <Loader2 className="animate-spin" size={22} />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-black dark:text-slate-100">
                        {PROCESS_STEPS[stepIndex] || PROCESS_STEPS[0]}
                      </div>
                      <div className="mt-1 text-base text-black/60 dark:text-slate-400">
                        Checking {formatCount(files.length)} CV
                        {files.length > 1 ? "s" : ""} with your rules
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    {stepIndex === 0 ? "35%" : stepIndex === 1 ? "70%" : "90%"}
                  </div>
                </div>

                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{
                      width:
                        stepIndex === 0 ? "35%" : stepIndex === 1 ? "70%" : "90%",
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {PROCESS_STEPS.map((label, i) => (
                  <div
                    key={label}
                    className={[
                      "rounded-xl border p-4",
                      i <= stepIndex
                        ? "border-primary/30 bg-primary/5 dark:border-primary/25 dark:bg-primary/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-medium text-black dark:text-slate-100">
                        {label.replace("...", "")}
                      </div>
                      {i < stepIndex ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          <Check size={16} />
                        </span>
                      ) : i === stepIndex ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Loader2 className="animate-spin" size={16} />
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {i + 1}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-xl font-semibold text-black dark:text-slate-100">
                  Results
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900">
                    <div className="text-sm text-black/60 dark:text-slate-400">
                      Total
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-black dark:text-slate-100">
                      {result.total}
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">
                      Passed
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-emerald-800 dark:text-emerald-200">
                      {result.passed}
                    </div>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                    <div className="text-sm text-rose-700 dark:text-rose-300">
                      Failed
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-rose-800 dark:text-rose-200">
                      {result.failed}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-base text-black/60 dark:text-slate-400">
                Click OK to open the CV Queue.
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            {!result ? (
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={onOk}
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-6 py-2.5 text-base font-semibold text-primary-foreground hover:opacity-95 dark:bg-primary"
              >
                OK
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

