"use client";

import { useEffect, useRef, useState } from "react";

export default function PdfPreview({ url, className = "" }) {
  const rootRef = useRef(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pdf = null;

    async function run() {
      setError("");
      setIsLoading(true);

      try {
        const pdfjs = await import("pdfjs-dist/build/pdf");
        // In Next.js, workerSrc must be a URL string (not a module object).
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        pdf = await pdfjs.getDocument(url).promise;
        if (cancelled) return;

        const container = rootRef.current;
        if (!container) return;
        container.innerHTML = "";

        const deviceScale = Math.min(2, window.devicePixelRatio || 1);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;

          const host = document.createElement("div");
          host.className =
            "mb-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800";

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");

          // Fit to container width
          const viewport = page.getViewport({ scale: 1 });
          const width = container.clientWidth ? container.clientWidth : 680;
          const scale = width / viewport.width;
          const scaledViewport = page.getViewport({ scale: scale * deviceScale });

          canvas.width = Math.floor(scaledViewport.width);
          canvas.height = Math.floor(scaledViewport.height);
          canvas.style.width = `${Math.floor(scaledViewport.width / deviceScale)}px`;
          canvas.style.height = `${Math.floor(
            scaledViewport.height / deviceScale
          )}px`;
          canvas.className = "block w-full";

          host.appendChild(canvas);
          container.appendChild(host);

          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load PDF");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      try {
        pdf?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [url]);

  return (
    <div className={className}>
      {isLoading ? (
        <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-black/60 dark:text-slate-400">
          Loading PDF…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div ref={rootRef} />
    </div>
  );
}

