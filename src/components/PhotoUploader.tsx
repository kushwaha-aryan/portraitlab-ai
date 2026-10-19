"use client";

import { useCallback, useRef, useState } from "react";
import { Image as ImageIcon, RefreshCw, Upload, X } from "lucide-react";

interface PhotoUploaderProps {
  file: File | null;
  previewUrl: string | null;
  disabled: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function PhotoUploader({
  file,
  previewUrl,
  disabled,
  error,
  onSelect,
  onRemove,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const next = files?.[0];
      if (next) onSelect(next);
    },
    [onSelect],
  );

  if (file && previewUrl) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded photo preview"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {file.name}
          </p>
          <p className="text-xs text-stone-500">
            {(file.size / (1024 * 1024)).toFixed(2)} MB · ready to generate
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? "border-stone-900 bg-stone-100"
            : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100/70"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600">
          <Upload className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-stone-800">
            Drop your photo here, or click to browse
          </p>
          <p className="mt-1 text-xs text-stone-500">
            JPEG, PNG or WebP · max 10 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export function EmptyPhotoIcon() {
  return <ImageIcon className="h-5 w-5" aria-hidden="true" />;
}
