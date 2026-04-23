"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Send, Search } from "lucide-react";

export default function MailSubmissionPage() {
  const router = useRouter();
  const rows = useMemo(
    () => [
      {
        id: "c_1",
        contactPerson: "Kai Smith",
        email: "kai.smith@edukai.co.uk",
        organization: "AbleConnect Ghana",
        jobTitle: "Founder",
        industry: "Social Impact",
        location: "London",
        radiusKm: 4809,
        phase: "Primary",
      },
      {
        id: "c_2",
        contactPerson: "Emma Johnson",
        email: "emma.johnson@acme.org",
        organization: "Acme Education",
        jobTitle: "School Administrator",
        industry: "Education",
        location: "Harlow",
        radiusKm: 4844,
        phase: "Secondary",
      },
      {
        id: "c_3",
        contactPerson: "Oliver Brown",
        email: "oliver.brown@northfield.io",
        organization: "Northfield",
        jobTitle: "Headteacher",
        industry: "Education",
        location: "Mansfield",
        radiusKm: 4825,
        phase: "16 Plus",
      },
      {
        id: "c_4",
        contactPerson: "Sophia Williams",
        email: "sophia.williams@greenline.com",
        organization: "Greenline",
        jobTitle: "UX/UI Designer",
        industry: "Technology",
        location: "Abbots Langley",
        radiusKm: 4817,
        phase: "Not Applicable",
      },
      {
        id: "c_5",
        contactPerson: "Noah Davis",
        email: "noah.davis@edutech.ai",
        organization: "EduTech AI",
        jobTitle: "Full Stack Developer",
        industry: "Technology",
        location: "Wickford",
        radiusKm: 4827,
        phase: "Primary",
      },
      {
        id: "c_6",
        contactPerson: "Ava Miller",
        email: "ava.miller@harmony.org",
        organization: "Harmony",
        jobTitle: "Office Manager",
        industry: "Operations",
        location: "Hornchurch",
        radiusKm: 4840,
        phase: "Secondary",
      },
      {
        id: "c_7",
        contactPerson: "John Smith",
        email: "john.doe@example.com",
        organization: "AbleConnect Ghana",
        jobTitle: "Founder",
        industry: "Social Impact",
        location: "London",
        radiusKm: 1000,
        phase: "Primary",
      },
      {
        id: "c_8",
        contactPerson: "Jane Doe",
        email: "jane.doe@example.com",
        organization: "Example",
        jobTitle: "HR Manager",
        industry: "Human Resources",
        location: "New York",
        radiusKm: 500,
        phase: "Secondary",
      },
      {
        id: "c_9",
        contactPerson: "Sarah Doe",
        email: "john.doe@example.com",
        organization: "Example",
        jobTitle: "Marketing Manager",
        industry: "Technology",
        location: "New York",
        radiusKm: 1000,
        phase: "Not Applicable",
      },
    ],
    []
  );

  const [selected, setSelected] = useState(() => new Set());

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [jobTitle, setJobTitle] = useState("All Job Titles");
  const [phase, setPhase] = useState("All Phases");
  const [radius, setRadius] = useState("All Radius Data");
  const [isSending, setIsSending] = useState(false);

  const locations = useMemo(() => {
    const s = new Set(rows.map((r) => r.location));
    return ["All Locations", ...Array.from(s)];
  }, [rows]);
  const jobTitles = useMemo(() => {
    const s = new Set(rows.map((r) => r.jobTitle));
    return ["All Job Titles", ...Array.from(s)];
  }, [rows]);
  const phases = useMemo(() => {
    const s = new Set(rows.map((r) => r.phase));
    return ["All Phases", ...Array.from(s)];
  }, [rows]);
  const radii = useMemo(() => {
    const s = new Set(rows.map((r) => `Up to ${r.radiusKm} KM`));
    return ["All Radius Data", ...Array.from(s)];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const keywordOk = q
        ? [
            r.contactPerson,
            r.email,
            r.organization,
            r.jobTitle,
            r.industry,
            r.location,
            r.phase,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true;
      const locationOk = location === "All Locations" ? true : r.location === location;
      const jobOk = jobTitle === "All Job Titles" ? true : r.jobTitle === jobTitle;
      const phaseOk = phase === "All Phases" ? true : r.phase === phase;
      const radiusOk =
        radius === "All Radius Data"
          ? true
          : `Up to ${r.radiusKm} KM` === radius;
      return keywordOk && locationOk && jobOk && phaseOk && radiusOk;
    });
  }, [rows, keyword, location, jobTitle, phase, radius]);

  const selectedCount = selected.size;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      const shouldSelect = !allFilteredSelected;
      filtered.forEach((r) => {
        if (shouldSelect) next.add(r.id);
        else next.delete(r.id);
      });
      return next;
    });
  }

  async function sendEmail() {
    if (!selectedCount) {
      toast.error("Please select at least one contact");
      return;
    }
    if (isSending) return;

    setIsSending(true);
    const toastId = toast.loading(
      `Sending CV to ${selectedCount} contact${selectedCount > 1 ? "s" : ""}...`
    );

    await new Promise((r) => setTimeout(r, 4000));

    toast.success("Successfully sent the email", { id: toastId });
    setIsSending(false);
    router.push("/cv-queue");
  }

  function selectStyles() {
    return "h-11 w-full cursor-pointer rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-sky-900/40 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-primary/40";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary dark:text-slate-100">
            Mail-submission Queue
          </h2>
          <p className="mt-2 max-w-3xl text-base text-black/60 dark:text-slate-400">
            Select contacts and automatically distribute candidate applications
            dynamically
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xl font-medium text-black/60 dark:text-slate-400">
            Selected contacts :
          </span>
          <span className=" ml-2 mt-1 text-xl font-semibold text-primary dark:text-primary">
            {selectedCount}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-slate-400">
          Search & filter audience
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search keywords..."
              className="h-11 w-full rounded-xl border border-sky-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 dark:border-sky-900/40 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40"
            />
          </div>

          <select value={location} onChange={(e) => setLocation(e.target.value)} className={selectStyles()}>
            {locations.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={selectStyles()}>
            {jobTitles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select value={phase} onChange={(e) => setPhase(e.target.value)} className={selectStyles()}>
            {phases.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select value={radius} onChange={(e) => setRadius(e.target.value)} className={selectStyles()}>
            {radii.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 text-base font-medium text-slate-800 dark:text-slate-100">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleSelectAllFiltered}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          Select All
        </label>

        <button
          type="button"
          onClick={sendEmail}
          disabled={isSending}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-primary"
        >
          <Send size={18} />
          {isSending ? "Sending..." : "Send Email"}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <tr>
                <th className="px-5 py-4 font-semibold">Select</th>
                <th className="px-5 py-4 font-semibold">Contact Person</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Organization Name</th>
                <th className="px-5 py-4 font-semibold">Job Title</th>
                <th className="px-5 py-4 font-semibold">Industry</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Radius (KM)</th>
                <th className="px-5 py-4 font-semibold">Phase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40"
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                      aria-label={`Select ${r.contactPerson}`}
                    />
                  </td>
                  <td className="px-5 py-4 text-base font-semibold text-black dark:text-slate-100">
                    {r.contactPerson}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {r.email}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {r.organization}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {r.jobTitle}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {r.industry}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {r.location}
                  </td>
                  <td className="px-5 py-4 text-base text-slate-700 dark:text-slate-200">
                    {r.radiusKm}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      {r.phase}
                    </span>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-base text-black/60 dark:text-slate-400"
                  >
                    No contacts found. Adjust filters and try again.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-4 md:hidden">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-black dark:text-slate-100">
                  {r.contactPerson}
                </div>
                <div className="mt-1 text-sm text-black/60 dark:text-slate-400">
                  {r.email}
                </div>
              </div>
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggleRow(r.id)}
                className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                aria-label={`Select ${r.contactPerson}`}
              />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-black/60 dark:text-slate-400">
                    Organization
                  </div>
                  <div className="mt-1 text-sm font-medium text-black dark:text-slate-100">
                    {r.organization}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-black/60 dark:text-slate-400">
                    Job Title
                  </div>
                  <div className="mt-1 text-sm font-medium text-black dark:text-slate-100">
                    {r.jobTitle}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-black/60 dark:text-slate-400">
                    Location
                  </div>
                  <div className="mt-1 text-sm font-medium text-black dark:text-slate-100">
                    {r.location}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-black/60 dark:text-slate-400">
                    Radius (KM)
                  </div>
                  <div className="mt-1 text-sm font-medium text-black dark:text-slate-100">
                    {r.radiusKm}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-black/60 dark:text-slate-400">
                    Phase
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                      {r.phase}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs text-black/60 dark:text-slate-400">
                    Industry
                  </div>
                  <div className="mt-1 text-sm font-medium text-black dark:text-slate-100">
                    {r.industry}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!filtered.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-black/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No contacts found. Adjust filters and try again.
          </div>
        ) : null}
      </div>
    </div>
  );
}

