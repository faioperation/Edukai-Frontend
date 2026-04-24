"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Paperclip, Pencil, Send } from "lucide-react";

function pluralize(n, one, many = `${one}s`) {
    return n === 1 ? one : many;
}

export default function MailSubmissionComposePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const selectedCount = useMemo(() => {
        const raw = searchParams?.get("contacts");
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return Math.floor(n);

        const ids = (searchParams?.get("ids") || "").trim();
        if (!ids) return 0;
        return ids.split(",").filter(Boolean).length;
    }, [searchParams]);

    const [isEditing, setIsEditing] = useState(false);
    const [subject, setSubject] = useState(
        "Driving Inclusive Change: Founder of AbleConnect Seeking New Opportunities"
    );
    const [body, setBody] = useState(
        [
            "Introducing a distinguished leader in digital inclusion and social equity innovation, whose career is marked by transformative projects like AbleConnect Ghana — a pioneering platform for Persons with Disabilities (PWDs).",
            "",
            "Key Highlights:",
            "",
            "- Visionary Leadership: As Founder of AbleConnect, spearheaded the establishment of a unique national platform that connects PWDs to essential services and opportunities across Ghana.",
            "- Strategic Development & Implementation: Orchestrated the design and rollout of a comprehensive WhatsApp AI chatbot system, optimizing accessibility for users with disabilities and enhancing service navigation through a multilingual interface.",
            "- Innovative Solutions: Developed core system components, such as Registration & Case Management System and Service Navigation Engine, providing centralized data management and streamlined service access.",
            "- Inclusive Design & Accessibility: Advanced the platform’s accessibility in four local languages, accommodating users visually, hearing, and mobility-impaired, and ensuring widespread usability.",
            "- Impact Measurement & Analytics: Introduced a national dashboard for tracking program impact, effectively monitoring training participation, employment outcomes, and technology access for over 500,000 PWDs targeted.",
            "- Cross-Sector Partnerships: Established robust collaborations with government agencies and non-profit organizations to expand service offerings, including job placements, assistive technology support, and legal aid.",
            "",
            "With comprehensive expertise in managing projects at the intersection of technology and social good, the candidate is seeking leadership opportunities that leverage their passion for change-making and expertise in digital transformation to create sustainable impact.",
            "",
            "Best regards,",
            "Edukal Recruitment Team",
        ].join("\n")
    );

    const [isSending, setIsSending] = useState(false);

    async function onSend() {
        if (!selectedCount) {
            toast.error("No selected contacts found. Please go back and select contacts.");
            return;
        }
        if (!subject.trim()) {
            toast.error("Subject is required");
            return;
        }
        if (!body.trim()) {
            toast.error("Email body is required");
            return;
        }
        if (isSending) return;

        setIsSending(true);
        const toastId = toast.loading(
            `Sending email to ${selectedCount} ${pluralize(selectedCount, "contact")}...`
        );

        await new Promise((r) => setTimeout(r, 1200));

        toast.success("Email sent", { id: toastId });
        setIsSending(false);
        router.push("/mail-submission");
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
                        Review, customize, and automatically dispatch Candidate CVs to
                        selected contacts.
                    </p>
                </div>

                <div className="flex items-center gap-3">


                    <button
                        type="button"
                        onClick={() => {
                            if (!isEditing) {
                                setIsEditing(true);
                                return;
                            }
                            setIsEditing(false);
                            toast.success("Email saved");
                        }}
                        className={[
                            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            isEditing
                                ? "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                : "border border-slate-200 bg-primary text-primary-foreground hover:bg-primary/90 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900",
                        ].join(" ")}
                    >
                        <Pencil size={16} />
                        {isEditing ? "Save Email" : "Edit Email"}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-black/70 dark:text-slate-300">
                        Subject:
                    </label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={!isEditing}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40 dark:disabled:bg-slate-900/40 dark:disabled:text-slate-200"
                    />
                </div>

                <div className="mt-5 space-y-2">
                    <label className="text-sm font-semibold text-black/70 dark:text-slate-300">
                        Message Body:
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        readOnly={!isEditing}
                        rows={14}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 read-only:cursor-not-allowed read-only:bg-slate-50 read-only:text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-primary/40 dark:read-only:bg-slate-900/40 dark:read-only:text-slate-200"
                    />
                </div>

                <div className="mt-5 space-y-2">
                    <div className="text-sm font-semibold text-black/70 dark:text-slate-300">
                        Included Attachment:
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                        <Paperclip size={16} className="opacity-80" />
                        Naana_Abena_Amanoа_Sifah_CV_Enhanced.pdf
                    </div>
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
