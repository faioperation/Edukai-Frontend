import { Suspense } from "react";

import MailSubmissionClient from "./MailSubmissionClient";

export default function MailSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 w-64 rounded-lg bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-[520px] rounded-2xl bg-slate-200/50 dark:bg-slate-800/40" />
        </div>
      }
    >
      <MailSubmissionClient />
    </Suspense>
  );
}
