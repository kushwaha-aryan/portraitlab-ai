"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, ShieldCheck, Sparkles } from "lucide-react";
import { CustomizationPanel } from "@/components/CustomizationPanel";
import { GenerationPreview } from "@/components/GenerationPreview";
import { LoadingState } from "@/components/LoadingState";
import { PhotoUploader } from "@/components/PhotoUploader";
import { StyleSelector } from "@/components/StyleSelector";
import { getStylePreset } from "@/lib/presets";
import { MAX_UPLOAD_BYTES } from "@/lib/validation";
import {
  STYLE_META,
  type ApiErrorBody,
  type GenerationResult,
  type PhotoSettings,
  type PhotoStyle,
} from "@/types/photo";

const ACCEPTED_CLIENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Status = "idle" | "generating" | "success" | "error";

export function PhotoEditor({
  providerLabel = "the image provider",
}: {
  providerLabel?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PhotoSettings>(() =>
    getStylePreset("professional"),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      abortRef.current?.abort();
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [previewUrl]);

  const handleSelectFile = useCallback((next: File) => {
    setUploadError(null);
    if (!ACCEPTED_CLIENT_TYPES.has(next.type.toLowerCase())) {
      setUploadError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setUploadError("That file is larger than 10 MB. Please pick a smaller photo.");
      return;
    }
    if (next.size === 0) {
      setUploadError("That file is empty.");
      return;
    }
    setFile((current) => {
      if (current && previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(next));
      return next;
    });
  }, [previewUrl]);

  const handleRemoveFile = useCallback(() => {
    setFile((current) => {
      if (current && previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return null;
    });
    setUploadError(null);
  }, [previewUrl]);

  const handleStyleSelect = useCallback((style: PhotoStyle) => {
    setSettings(getStylePreset(style));
  }, []);

  const handleSettingsChange = useCallback((patch: Partial<PhotoSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const generate = useCallback(async () => {
    if (!file || status === "generating") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("generating");
    setError(null);
    setLoadingStep(0);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, 3));
    }, 12_000);

    try {
      const body = new FormData();
      body.append("photo", file);
      body.append("settings", JSON.stringify(settings));

      const response = await fetch("/api/generate", {
        method: "POST",
        body,
        signal: controller.signal,
      });

      let payload: unknown = null;
      try {
        payload = (await response.json()) as unknown;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const apiError = payload as ApiErrorBody | null;
        const message =
          apiError?.error?.message ??
          `Generation failed with status ${response.status}. Please try again.`;
        setError(message);
        setStatus("error");
        return;
      }

      const generation = payload as GenerationResult | null;
      if (!generation?.imageBase64) {
        setError("The server returned an empty result. Please try again.");
        setStatus("error");
        return;
      }

      setResult(generation);
      setStatus("success");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(
        "Could not reach the server. Check your connection and try again.",
      );
      setStatus("error");
    } finally {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }
  }, [file, settings, status]);

  const busy = status === "generating";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Your photo</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Clear, front-facing photos work best.
          </p>
          <div className="mt-3">
            <PhotoUploader
              file={file}
              previewUrl={previewUrl}
              disabled={busy}
              error={uploadError}
              onSelect={handleSelectFile}
              onRemove={handleRemoveFile}
            />
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-stone-900">Photo style</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Picking a style loads sensible defaults you can still tweak.
          </p>
          <div className="mt-3">
            <StyleSelector
              value={settings.style}
              disabled={busy}
              onSelect={handleStyleSelect}
            />
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-stone-900">
            Customize
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {STYLE_META[settings.style].label} · advanced options are optional.
          </p>
          <div className="mt-3">
            <CustomizationPanel
              settings={settings}
              disabled={busy}
              onChange={handleSettingsChange}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={!file || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {busy ? "Generating…" : "Generate photo"}
          </button>
          {!file && !busy ? (
            <p className="text-center text-xs text-stone-500">
              Upload a photo to enable generation.
            </p>
          ) : null}
          <p className="flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-stone-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Your photo is sent to {providerLabel} for processing. This app
              does not store your photo permanently.
            </span>
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-900">Result</h2>
          {result && !busy ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <Camera className="h-3 w-3" aria-hidden="true" />
              Ready
            </span>
          ) : null}
        </div>

        {busy ? <LoadingState step={loadingStep} /> : null}

        {!busy && error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-800">
                Generation failed
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStatus(result ? "success" : "idle");
                }}
                className="mt-2 text-xs font-semibold text-red-800 underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {!busy && result ? (
          <GenerationPreview
            result={result}
            busy={busy}
            onRegenerate={() => void generate()}
            originalPreviewUrl={previewUrl}
          />
        ) : null}

        {!busy && !result && !error ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-6 py-16 text-center">
            <Camera className="h-8 w-8 text-stone-300" aria-hidden="true" />
            <p className="text-sm font-medium text-stone-600">
              Your generated photo will appear here
            </p>
            <p className="max-w-xs text-xs text-stone-500">
              Upload a photo, choose a style, then press Generate photo.
            </p>
          </div>
        ) : null}

        {!busy && status === "error" && result ? (
          <p className="text-center text-xs text-stone-500">
            Your previous result is still shown above. Fix the issue and
            regenerate whenever you like.
          </p>
        ) : null}
      </section>
    </div>
  );
}
