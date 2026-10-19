"use client";

import { Loader2 } from "lucide-react";

const STATUS_MESSAGES = [
  "Validating your photo…",
  "Sending the edit request to the image service…",
  "Generating your portrait…",
  "Applying final crops and color…",
] as const;

export function LoadingState({ step }: { step: number }) {
  const message =
    STATUS_MESSAGES[Math.min(step, STATUS_MESSAGES.length - 1)] ??
    STATUS_MESSAGES[0];
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-6 py-12 text-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-stone-700" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-stone-800">{message}</p>
        <p className="mt-1 text-xs text-stone-500">
          This can take up to a minute. Please keep this tab open.
        </p>
      </div>
    </div>
  );
}
