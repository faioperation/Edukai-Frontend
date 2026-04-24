import { Suspense } from "react";
import ComposeClient from "./ComposeClient";

export default function MailSubmissionComposePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 w-10 rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-8 w-64 rounded-lg bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-5 w-[520px] max-w-full rounded-lg bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-[420px] rounded-2xl bg-slate-200/50 dark:bg-slate-800/40" />
        </div>
      }
    >
      <ComposeClient />
    </Suspense>
  );
}
