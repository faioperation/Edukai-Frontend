"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ArrowLeft, Building2, MapPin, Phone, Layers, UserRound, Mail, BriefcaseBusiness, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrganizationDetailsPage() {
  const params = useParams();
  const id = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const res = await apiGet(`/import-organization/${id}`);
      if (res?.success === false) {
        throw new Error(res?.message || "Failed to load organization");
      }
      return res?.data || res;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading organization details...</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-10 text-center text-rose-500">
        <p>Failed to load organization details.</p>
        <Link href="/organizations" className="mt-4 inline-block text-primary hover:underline">
          Return to organizations
        </Link>
      </div>
    );
  }

  const org = data;
  const contacts = org?.contacts || [];

  console.log(org);

  console.log(contacts)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/organizations" className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Organization Details
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Left Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 border-t-4 border-t-blue-600">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#4A64C2] text-white shadow-sm">
                <Building2 size={36} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {org.OrganizationName || org.name || "N/A"}
                </h3>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{org.Town || org.town || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{org.LocalAuthority || org.localAuthority || org.district || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Professional Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Organization Details
              </div>
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase</div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Layers size={16} className="text-slate-400" />
                    {org.Phase || org.phase || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <UserRound size={16} className="text-slate-400" />
                    {org.Gender || org.gender || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">URN</div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span className="text-slate-400">#</span>
                    {org.URN || org.urn || "N/A"}
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telephone</div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Phone size={16} className="text-slate-400" />
                    {org.TelephoneNumber || org.telephone || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Town</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {org.Town || org.town || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {[org.AddressLine1 || org.addressLine1, org.Street || org.street, org.Postcode || org.postcode].filter(Boolean).join(", ") || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Activity Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Recent Activity
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Organization created
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {org.createdAt ? new Date(org.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 font-bold text-primary dark:text-primary mb-4 px-2">
          <Users size={20} />
          <h3 className="text-lg">Associated Contacts ({org.contactCount || contacts.length})</h3>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <tr>
                  <th className="px-5 py-4">CONTACT PERSON & MAIL</th>
                  <th className="px-5 py-4">ORGANIZATION NAME</th>
                  <th className="px-5 py-4">JOB TITLE</th>
                  <th className="px-5 py-4">LOCAL AUTHORITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {contacts.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/40">
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {row.ContactPersonName || row.name || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 truncate text-xs text-slate-500 dark:text-slate-400">
                          <Mail size={14} className="shrink-0 text-slate-400" />
                          <span className="truncate">{row.WorkEmail || row.workEmail || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <Building2 size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{row.OrganizationName || org.OrganizationName || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <BriefcaseBusiness size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{row.JobTitle || row.jobTitle || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {row.LocalAuthority || org.LocalAuthority ? (
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {row.LocalAuthority || org.LocalAuthority}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!contacts.length ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                      No associated contacts found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
