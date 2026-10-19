"use client";

import { Download, RefreshCw } from "lucide-react";
import type { GenerationResult } from "@/types/photo";

interface GenerationPreviewProps {
  result: GenerationResult;
  busy: boolean;
  onRegenerate: () => void;
  originalPreviewUrl?: string | null;
}

export function GenerationPreview({
  result,
  busy,
  onRegenerate,
  originalPreviewUrl,
}: GenerationPreviewProps) {
  const imageUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `portraitlab-${result.format}-${result.width}x${result.height}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const generatedImage = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={imageUrl}
      alt="Generated portrait result"
      className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
    />
  );

  return (
    <div className="space-y-3">
      {originalPreviewUrl ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalPreviewUrl}
              alt="Original uploaded photo"
              className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
            />
            <figcaption className="border-t border-stone-200 bg-white px-3 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Original
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            {generatedImage}
            <figcaption className="border-t border-stone-200 bg-white px-3 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-stone-500">
              Generated
            </figcaption>
          </figure>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
          {generatedImage}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {[
          `${result.width}×${result.height} px`,
          result.aspectRatioLabel,
          result.format.toUpperCase(),
          `${(result.sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
          result.model,
        ].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download photo
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${busy ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Regenerate
        </button>
      </div>
    </div>
  );
}
