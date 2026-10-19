import { Camera, Sparkles } from "lucide-react";

export function AppHeader({
  providerLabel = "Cloudflare Workers AI",
}: {
  providerLabel?: string;
}) {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
              PortraitLab AI
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
            </h1>
            <p className="text-xs text-stone-500">
              AI professional photo studio
            </p>
          </div>
        </div>
        <span className="hidden rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 sm:inline-flex">
          Powered by {providerLabel}
        </span>
      </div>
    </header>
  );
}
