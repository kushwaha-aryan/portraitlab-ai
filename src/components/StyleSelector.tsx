"use client";

import {
  BadgeCheck,
  Briefcase,
  FileText,
  ScanFace,
  Smile,
  type LucideIcon,
} from "lucide-react";
import { PHOTO_STYLES, STYLE_META, type PhotoStyle } from "@/types/photo";

const STYLE_ICONS: Record<PhotoStyle, LucideIcon> = {
  professional: Briefcase,
  passport: ScanFace,
  linkedin: BadgeCheck,
  cv: FileText,
  casual: Smile,
};

interface StyleSelectorProps {
  value: PhotoStyle;
  disabled: boolean;
  onSelect: (style: PhotoStyle) => void;
}

export function StyleSelector({ value, disabled, onSelect }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {PHOTO_STYLES.map((style) => {
        const meta = STYLE_META[style];
        const Icon = STYLE_ICONS[style];
        const active = style === value;
        return (
          <button
            key={style}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(style)}
            aria-pressed={active}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                : "border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                active ? "bg-white/15 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{meta.label}</span>
              <span
                className={`mt-0.5 block text-xs leading-snug ${
                  active ? "text-stone-300" : "text-stone-500"
                }`}
              >
                {meta.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
