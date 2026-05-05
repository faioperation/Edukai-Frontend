"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ArrowLeft, Building2, MapPin, BriefcaseBusiness, UserRound, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "A";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

export default function ContactDetailsPage() {
  const params = useParams();
  const id = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await apiGet(`/import-contact/${id}`);
      if (res?.success === false) {
        throw new Error(res?.message || "Failed to load contact");
      }
      return res?.data || res;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading contact details...</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-10 text-center text-rose-500">
        <p>Failed to load contact details.</p>
        <Link href="/contact" className="mt-4 inline-block text-primary hover:underline">
          Return to contacts
        </Link>
      </div>
    );
  }

  const contact = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contact" className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Contact Details
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Left Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 border-t-4 border-t-blue-600">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#4A64C2] text-3xl font-bold text-white shadow-sm">
                {initials(contact.ContactPersonName || contact.FullName || contact.name)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {contact.ContactPersonName || contact.FullName || contact.name || "N/A"}
                </h3>
                <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <BriefcaseBusiness size={16} />
                  {contact.JobTitle || contact.jobTitle || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Professional Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Professional Details
              </div>
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organization</div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Building2 size={16} className="text-slate-400" />
                    {contact.OrganizationName || contact.organizationName || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Job Title</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {contact.JobTitle || contact.jobTitle || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Local Authority</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {contact.LocalAuthority || contact.localAuthority || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Contact Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MapPin size={16} /> Location & Contact
              </div>
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Email</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 break-all">
                    {contact.WorkEmail || contact.workEmail || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Town</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {contact.Town || contact.town || contact.importedOrganization?.Town || contact.importedOrganization?.town || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {[contact.importedOrganization?.AddressLine1 || contact.importedOrganization?.Street, contact.importedOrganization?.Town, contact.importedOrganization?.Postcode].filter(Boolean).join(", ") || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Recent Activity
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Contact profile created
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {contact.createdAt ? new Date(contact.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* School Context Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Building2 size={16} /> School Context
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 px-4 dark:bg-slate-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{contact.Phase || contact.phase || contact.importedOrganization?.Phase || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 px-4 dark:bg-slate-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{contact.Gender || contact.gender || contact.importedOrganization?.Gender || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 px-4 dark:bg-slate-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URN</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{contact.URN || contact.urn || contact.importedOrganization?.URN || "N/A"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
