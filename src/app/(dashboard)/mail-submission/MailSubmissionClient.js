"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { Send, Search, Loader2 } from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";

const MAIL_QUEUE_LIMIT = 200;

/** First useful scalar from candidates (supports nested import `payload`). */
function pickScalar(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const s = String(v).trim();
    if (s !== "") return v;
  }
  return "";
}

function titleCaseFromEmailLocal(email) {
  const local = String(email || "").split("@")[0].trim();
  if (!local) return "";
  return local
    .replace(/[._+-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Location line from nested school/org record (`organizationDetails`). */
function townRegionLine(od) {
  if (!od || typeof od !== "object") return "";
  const town = String(od.Town ?? od.town ?? "").trim();
  const reg = String(od.region ?? od.Region ?? "").trim();
  if (town && reg && town.toLowerCase() !== reg.toLowerCase()) return `${town}, ${reg}`;
  return town || reg || "";
}

/** Map `/import-contact/all` rows to queue table columns. */
function mapMailQueueContactRow(item) {
  const d = item || {};
  const od =
    d.organizationDetails && typeof d.organizationDetails === "object"
      ? d.organizationDetails
      : null;
  const payload = d.payload && typeof d.payload === "object" ? d.payload : null;
  const nested =
    payload && typeof payload.payload === "object" ? payload.payload : null;
  const orgObj =
    d.organization && typeof d.organization === "object" && !Array.isArray(d.organization)
      ? d.organization
      : null;

  const contactPerson = pickScalar(
    d.FullName,
    d.fullName,
    d.ContactPerson,
    d.contactPerson,
    d.full_name,
    d.contact_person,
    d.name,
    payload?.FullName,
    payload?.fullName,
    payload?.ContactPerson,
    payload?.contactPerson,
    payload?.name,
    nested?.FullName,
    nested?.fullName
  );

  const email = pickScalar(
    d.WorkEmail,
    d.workEmail,
    d.work_email,
    d.email,
    payload?.WorkEmail,
    payload?.workEmail,
    payload?.email,
    nested?.WorkEmail,
    nested?.email
  );

  const organization = pickScalar(
    d.OrganizationName,
    d.organizationName,
    d.organization_name,
    d.organization,
    od?.OrganizationName,
    od?.organizationName,
    payload?.OrganizationName,
    payload?.organizationName,
    payload?.organization,
    nested?.OrganizationName,
    nested?.organizationName
  );

  const jobTitle = pickScalar(
    d.JobTitle,
    d.jobTitle,
    d.job_title,
    payload?.JobTitle,
    payload?.jobTitle,
    nested?.JobTitle,
    nested?.jobTitle
  );

  const industry = pickScalar(
    d.industry,
    d.Industry,
    d.sector,
    d.Sector,
    d.EstablishmentType,
    d.establishmentType,
    d.TypeOfEstablishment,
    od?.district,
    od?.District,
    od?.LocalAuthority,
    od?.localAuthority,
    payload?.industry,
    payload?.Industry,
    payload?.sector,
    nested?.industry,
    nested?.sector,
    orgObj?.establishmentType,
    orgObj?.EstablishmentType
  );

  const location = pickScalar(
    townRegionLine(od),
    od?.region,
    od?.Region,
    od?.Town,
    od?.town,
    od?.LocalAuthority,
    od?.localAuthority,
    od?.Postcode,
    od?.postcode,
    d.region,
    d.Region,
    d.Town,
    d.town,
    d.Location,
    d.location,
    d.LocalAuthority,
    d.localAuthority,
    payload?.region,
    payload?.Region,
    payload?.Town,
    payload?.town,
    payload?.Location,
    payload?.location,
    payload?.LocalAuthority,
    nested?.Town,
    nested?.region,
    nested?.town,
    orgObj?.Town,
    orgObj?.town,
    orgObj?.Region,
    orgObj?.region,
    orgObj?.County,
    orgObj?.county,
    payload?.County,
    nested?.County
  );

  const radiusKm =
    pickScalar(
      d.distance,
      od?.distance,
      d.radiusKm,
      d.radius,
      d.Radius,
      d.radiusInKm,
      d.distanceKm,
      d.searchRadius,
      d.searchRadiusKm,
      payload?.radiusKm,
      payload?.radius,
      payload?.Radius,
      nested?.radiusKm,
      nested?.radius,
      orgObj?.radiusKm,
      orgObj?.radius
    ) || "";

  const phaseRaw = pickScalar(
    od?.Phase,
    od?.phase,
    d.Phase,
    d.phase,
    d.EstablishmentPhase,
    d.establishmentPhase,
    d.PhaseCode,
    d.phaseLabel,
    payload?.Phase,
    payload?.phase,
    payload?.EstablishmentPhase,
    payload?.establishmentPhase,
    nested?.Phase,
    nested?.phase,
    payload?.schoolPhase,
    d.schoolPhase,
    nested?.establishmentPhase,
    orgObj?.Phase,
    orgObj?.phase,
    orgObj?.EstablishmentPhase,
    orgObj?.establishmentPhase
  );

  const emailStr = typeof email === "string" ? email : email !== "" ? String(email) : "";
  let contactPersonStr =
    typeof contactPerson === "string" ? contactPerson : contactPerson !== "" ? String(contactPerson) : "";
  if (!String(contactPersonStr).trim()) {
    contactPersonStr = titleCaseFromEmailLocal(emailStr);
  }

  return {
    id: d.id,
    contactPerson: String(contactPersonStr || "").trim(),
    email: emailStr.trim(),
    organization:
      typeof organization === "string" ? organization : String(organization ?? ""),
    jobTitle: typeof jobTitle === "string" ? jobTitle : String(jobTitle ?? ""),
    industry: typeof industry === "string" ? industry : String(industry ?? ""),
    location: typeof location === "string" ? location : String(location ?? ""),
    radiusKm:
      radiusKm === "" ? "" : typeof radiusKm === "number" ? radiusKm : String(radiusKm),
    phase: phaseRaw !== "" ? String(phaseRaw).trim() || "—" : "—",
  };
}

const MAIL_RADIUS_KM_MAX = 1000;

/** 3, 5, 7, … odd steps up to max; if max is even (e.g. 1000), append it once. */
function buildMailRadiusKmOptions(maxKm = MAIL_RADIUS_KM_MAX) {
  const cap = Math.max(3, Math.floor(Number(maxKm) || 0));
  const out = [];
  for (let n = 3; n <= cap; n += 2) {
    out.push(n);
  }
  if (cap >= 4 && cap % 2 === 0 && out[out.length - 1] !== cap) {
    out.push(cap);
  }
  return out;
}

/** Radius filter values for the queue dropdown (not from API). */
const MAIL_RADIUS_KM_OPTIONS = buildMailRadiusKmOptions();

const EMPTY_MAIL_ROWS = [];

export default function MailSubmissionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState(() => new Set());
  const [generatedCvId, setGeneratedCvId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const effectiveGeneratedCvId =
    (searchParams?.get("generatedCvId") || "").trim() || generatedCvId.trim();

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [jobTitle, setJobTitle] = useState("All Job Titles");
  const [phase, setPhase] = useState("All Phases");
  const [radius, setRadius] = useState("All Radius Data");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const importContactFiltersQuery = useQuery({
    queryKey: ["import-contact", "filters", "mail-submission-queue"],
    queryFn: async () => {
      const res = await apiGet("/import-contact/filters");
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load contact filters");
      return res?.data && typeof res.data === "object" ? res.data : {};
    },
    staleTime: 60_000,
  });

  const locations = useMemo(() => {
    const regions = Array.isArray(importContactFiltersQuery.data?.regions)
      ? importContactFiltersQuery.data.regions.filter(Boolean)
      : [];
    return ["All Locations", ...regions.map(String)];
  }, [importContactFiltersQuery.data]);

  const jobTitles = useMemo(() => {
    const jobs = Array.isArray(importContactFiltersQuery.data?.jobs)
      ? importContactFiltersQuery.data.jobs.filter(Boolean)
      : [];
    return ["All Job Titles", ...jobs.map(String)];
  }, [importContactFiltersQuery.data]);

  const phases = useMemo(() => {
    const list = Array.isArray(importContactFiltersQuery.data?.phases)
      ? importContactFiltersQuery.data.phases.filter(Boolean)
      : [];
    return ["All Phases", ...list.map(String)];
  }, [importContactFiltersQuery.data]);

  const radii = useMemo(
    () => ["All Radius Data", ...MAIL_RADIUS_KM_OPTIONS.map((n) => String(n))],
    []
  );

  useEffect(() => {
    const fromQuery = (searchParams?.get("generatedCvId") || "").trim();
    if (fromQuery) {
      setGeneratedCvId(fromQuery);
      try {
        sessionStorage.setItem("generatedCv:activeId", fromQuery);
      } catch {
        // ignore
      }
      return;
    }

    try {
      const cached = (sessionStorage.getItem("generatedCv:activeId") || "").trim();
      if (cached) setGeneratedCvId(cached);
    } catch {
      // ignore
    }
  }, [searchParams]);

  const importContactsQuery = useQuery({
    queryKey: [
      "import-contact",
      "all",
      "mail-submission",
      effectiveGeneratedCvId,
      debouncedKeyword,
      location,
      jobTitle,
      phase,
      radius,
    ],
    queryFn: async () => {
      const params = { page: 1, limit: MAIL_QUEUE_LIMIT };
      const gcv = effectiveGeneratedCvId.trim();
      if (gcv) params.generatedCvId = gcv;

      const term = debouncedKeyword.trim();
      if (term) params.searchTerm = term;

      if (location !== "All Locations" && String(location).trim()) {
        params.region = String(location).trim();
      }
      if (jobTitle !== "All Job Titles" && String(jobTitle).trim()) {
        params.jobTitle = String(jobTitle).trim();
      }
      if (phase !== "All Phases" && String(phase).trim()) {
        params.phase = String(phase).trim();
      }
      if (radius !== "All Radius Data") {
        const n = Number(radius);
        if (!Number.isNaN(n)) params.radius = n;
      }

      const res = await apiGet("/import-contact/all", { params });
      if (res?.success === false)
        throw new Error(res?.message || "Failed to load contacts");

      const payload = res || {};
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      return items.map(mapMailQueueContactRow).filter((r) => r.id);
    },
  });

  const rows = importContactsQuery.data ?? EMPTY_MAIL_ROWS;

  useEffect(() => {
    const idSet = new Set(rows.map((r) => String(r.id ?? "")));
    setSelected((prev) => {
      const next = new Set();
      for (const id of prev) {
        const sid = String(id);
        if (idSet.has(sid)) next.add(sid);
      }
      if (next.size === prev.size) {
        for (const x of prev) {
          if (!next.has(String(x))) return next;
        }
        return prev;
      }
      return next;
    });
  }, [rows]);

  const selectedCount = selected.size;
  const allFilteredSelected =
    rows.length > 0 && rows.every((r) => selected.has(String(r.id)));

  function toggleRow(id) {
    const sid = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      const shouldSelect = !allFilteredSelected;
      rows.forEach((r) => {
        const sid = String(r.id);
        if (shouldSelect) next.add(sid);
        else next.delete(sid);
      });
      return next;
    });
  }

  async function sendEmail() {
    if (!selectedCount) {
      toast.error("Please select at least one contact");
      return;
    }
    const gcv = effectiveGeneratedCvId.trim();
    if (!gcv) {
      toast.error("Missing generated CV id. Please go back and generate the CV again.");
      return;
    }

    const contactIds = Array.from(selected)
      .map((id) => String(id).trim())
      .filter(Boolean);

    setIsGenerating(true);
    const toastId = toast.loading("Generating email…");
    try {
      const res = await apiPost("/generated-email/generate", {
        generatedCvId: gcv,
        contactIds,
      });
      if (res?.success === false) throw new Error(res?.message || "Failed to generate email");

      const emailRecordId = String(
        res?.data?.id ??
          res?.data?.generatedEmailId ??
          res?.data?.generatedEmail?.id ??
          res?.generatedEmailId ??
          ""
      ).trim();

      if (!emailRecordId) {
        throw new Error("Server did not return a generated email id.");
      }

      try {
        sessionStorage.setItem("generatedEmail:last", JSON.stringify(res));
        sessionStorage.setItem("generatedEmail:activeId", emailRecordId);
      } catch {
        // ignore
      }

      toast.success("Email generated", { id: toastId });
      router.push(
        `/mail-submission/compose?generatedEmailId=${encodeURIComponent(emailRecordId)}&contacts=${selectedCount}`
      );
    } catch (e) {
      toast.error(e?.message || "Failed to generate email", { id: toastId });
      setIsGenerating(false);
    }
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
                {v === "All Radius Data" ? v : `${v} KM`}
              </option>
            ))}
          </select>
        </div>
        {importContactsQuery.isError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {importContactsQuery.error?.message || "Failed to load contacts"}
          </p>
        ) : null}
        {importContactsQuery.isFetching && rows.length > 0 ? (
          <p className="mt-2 text-xs text-black/50 dark:text-slate-400">Updating results…</p>
        ) : null}
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
          disabled={isGenerating || selectedCount === 0}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-primary"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          {isGenerating ? "Processing..." : "Proceed to Compose Email"}
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
              {importContactsQuery.isPending && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-base text-black/60 dark:text-slate-400"
                  >
                    Loading contacts…
                  </td>
                </tr>
              ) : importContactsQuery.isError && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-base text-red-600 dark:text-red-400"
                  >
                    {importContactsQuery.error?.message || "Failed to load contacts"}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-base text-black/60 dark:text-slate-400"
                  >
                    No contacts found. Adjust filters and try again.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(String(r.id))}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-4 md:hidden">
        {importContactsQuery.isPending && rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-black/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            Loading contacts…
          </div>
        ) : importContactsQuery.isError && rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-red-600 dark:border-slate-800 dark:bg-red-950/30 dark:text-red-400">
            {importContactsQuery.error?.message || "Failed to load contacts"}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base text-black/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No contacts found. Adjust filters and try again.
          </div>
        ) : (
          rows.map((r) => (
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
                  checked={selected.has(String(r.id))}
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
          ))
        )}
      </div>
    </div>
  );
}

