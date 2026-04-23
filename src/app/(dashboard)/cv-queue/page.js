"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
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

const TABS = [
  { key: "all", label: "All CVs" },
  { key: "pending", label: "Pending" },
  { key: "passed", label: "Quality Passed" },
  { key: "failed", label: "Quality Failed" },
];

const CV_PDF_URL = "/assets/cv/MD. AL RAKEB RASEL BOSHUNIA.pdf";

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
  return "Pending";
}

function statusPillClasses(status) {
  if (status === "passed")
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (status === "failed")
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200";
}

function availabilityPillClasses(availability) {
  const ok = availability === "Available";
  return ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
    : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
}

export default function CvQueuePage() {
  const router = useRouter();
  const [rows, setRows] = useState(seed);
  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      const tabOk =
        activeTab === "all" ? true : activeTab === row.status;
      const qOk = query ? row.name.toLowerCase().includes(query) : true;
      return tabOk && qOk;
    });
  }, [activeTab, q, rows]);

  const counts = useMemo(() => {
    const all = rows.length;
    const passed = rows.filter((r) => r.status === "passed").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    return { all, passed, failed, pending };
  }, [rows]);

  function generateCv(name) {
    toast.success(`Opening AI Re-writer for ${name}...`);
    router.push("/ai-rewriter");
  }

  function openProfile(row) {
    setSelectedId(row.id);
    setDraft({ ...row });
    setEditMode(false);
    setProfileOpen(true);
  }

  function viewCv(name) {
    const url = encodeURI(CV_PDF_URL);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    // if (!win) toast.error("Popup blocked. Allow popups to view the CV.");
  }

  function onDelete() {
    if (!draft?.id) return;
    const name = draft.name;
    setRows((prev) => prev.filter((r) => r.id !== draft.id));
    setProfileOpen(false);
    toast.success(`Deleted ${name}`);
  }

  function onSave() {
    if (!draft?.id) return;
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    setEditMode(false);
    toast.success("Saved changes");
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
          <div className="text-sm font-medium text-black/60 dark:text-slate-400">
            Total CVs uploaded
          </div>
          <div className="mt-1 text-3xl font-semibold text-primary dark:text-primary">
            {counts.all}
          </div>
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
            placeholder="Search by candidate name..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const count =
              t.key === "all"
                ? counts.all
                : t.key === "passed"
                ? counts.passed
                : t.key === "failed"
                ? counts.failed
                : counts.pending;
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
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        statusPillClasses(row.status),
                      ].join(" ")}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        availabilityPillClasses(row.availability),
                      ].join(" ")}
                    >
                      {row.availability}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => generateCv(row.name)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
                      >
                        <FileText size={16} />
                        Generate CV
                      </button>
                      <button
                        type="button"
                        onClick={() => openProfile(row)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                        aria-label={`View ${row.name}`}
                      >
                        <Eye size={18} />
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
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
              <button
                type="button"
                onClick={() => openProfile(row)}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition-colors hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-primary dark:hover:text-primary-foreground"
                aria-label={`View ${row.name}`}
              >
                <Eye size={18} />
              </button>
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
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                      statusPillClasses(row.status),
                    ].join(" ")}
                  >
                    {statusLabel(row.status)}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-black/60 dark:text-slate-400">
                  Availability
                </div>
                <div className="mt-2">
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                      availabilityPillClasses(row.availability),
                    ].join(" ")}
                  >
                    {row.availability}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => generateCv(row.name)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
              >
                <FileText size={18} />
                Generate CV
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
        <DialogContent className="sm:max-w-5xl" showCloseButton>
          <DialogHeader>
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
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
                      <Image
                        src="/assets/profile-pic.jpg"
                        alt="Profile"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    <div className="min-w-0">
                      {!editMode ? (
                        <>
                          <div className="truncate text-2xl font-semibold text-black dark:text-slate-100">
                            {form.name}
                          </div>
                          <div className="mt-1 text-base font-medium text-primary dark:text-primary">
                            {form.role}
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
                                value={draft?.status || "pending"}
                                onChange={(e) =>
                                  setDraft((d) => ({ ...d, status: e.target.value }))
                                }
                                className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40"
                              >
                                <option value="pending">Pending</option>
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
                            <span className="truncate">{form.location}</span>
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
                            <span className="truncate">{form.experience}</span>
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
                            <span className="truncate">{form.email}</span>
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
                        <Phone size={16} /> {form.phone}
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
                        {form.bio}
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
                      {form.skills?.map((s) => (
                        <span
                          key={s}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                          {s}
                        </span>
                      ))}
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
            <button
              type="button"
              onClick={() => generateCv(form?.name || "")}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 dark:bg-primary"
            >
              <Wand2 size={18} />
              Generate CV
            </button>
            <button
              type="button"
              onClick={() => viewCv(form?.name || "")}
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

