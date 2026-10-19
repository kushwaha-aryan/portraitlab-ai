"use client";

import { MAX_CUSTOM_INSTRUCTIONS } from "@/lib/validation";
import { FieldSelect, ToggleRow } from "@/components/fields";
import type {
  AspectRatio,
  BackgroundOption,
  ClothingOption,
  ExpressionOption,
  FramingOption,
  LightingOption,
  PhotoSettings,
  ShirtColor,
  SuitColor,
  TieOption,
} from "@/types/photo";

function optionsFrom<const T extends readonly string[]>(
  values: T,
  labels: Record<T[number], string>,
): Array<{ value: T[number]; label: string }> {
  return values.map((value) => ({
    value,
    label: labels[value as T[number]],
  }));
}

const BACKGROUND_LABELS: Record<BackgroundOption, string> = {
  white: "White",
  "light-grey": "Light Grey",
  blue: "Blue",
  office: "Office",
  outdoor: "Outdoor",
};

const CLOTHING_LABELS: Record<ClothingOption, string> = {
  "black-suit": "Black Suit",
  "navy-suit": "Navy Suit",
  "charcoal-suit": "Charcoal Suit",
  "formal-shirt": "Formal Shirt",
  "business-casual": "Business Casual",
  original: "Keep Original Clothing",
};

const FRAMING_LABELS: Record<FramingOption, string> = {
  headshot: "Headshot",
  "head-shoulders": "Head and Shoulders",
  "upper-body": "Upper Body",
};

const SUIT_LABELS: Record<SuitColor, string> = {
  black: "Black",
  navy: "Navy Blue",
  charcoal: "Charcoal Grey",
  "light-grey": "Light Grey",
};

const SHIRT_LABELS: Record<ShirtColor, string> = {
  white: "White",
  "light-blue": "Light Blue",
  black: "Black",
};

const TIE_LABELS: Record<TieOption, string> = {
  none: "None",
  black: "Black",
  navy: "Navy",
  burgundy: "Burgundy",
};

const LIGHTING_LABELS: Record<LightingOption, string> = {
  natural: "Natural",
  "soft-studio": "Soft Studio",
  "professional-studio": "Professional Studio",
};

const EXPRESSION_LABELS: Record<ExpressionOption, string> = {
  preserve: "Preserve Original",
  "subtle-smile": "Subtle Smile",
  "neutral-professional": "Neutral Professional",
};

const ASPECT_LABELS: Record<AspectRatio, string> = {
  passport: "Passport 35×45 (7:9)",
  square: "Square (1:1)",
  portrait: "Portrait (2:3)",
  "four-five": "Portrait (4:5)",
  "three-four": "Portrait (3:4)",
};

interface CustomizationPanelProps {
  settings: PhotoSettings;
  disabled: boolean;
  onChange: (patch: Partial<PhotoSettings>) => void;
}

export function CustomizationPanel({
  settings,
  disabled,
  onChange,
}: CustomizationPanelProps) {
  const usesSuit =
    settings.clothing === "black-suit" ||
    settings.clothing === "navy-suit" ||
    settings.clothing === "charcoal-suit";
  const usesShirtColor =
    usesSuit || settings.clothing === "formal-shirt";
  const keepOriginalClothing = settings.clothing === "original";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldSelect<BackgroundOption>
          label="Background"
          value={settings.background}
          disabled={disabled}
          options={optionsFrom(
            ["white", "light-grey", "blue", "office", "outdoor"],
            BACKGROUND_LABELS,
          )}
          onChange={(background) => onChange({ background })}
        />
        <FieldSelect<ClothingOption>
          label="Clothing"
          value={settings.clothing}
          disabled={disabled}
          options={optionsFrom(
            [
              "black-suit",
              "navy-suit",
              "charcoal-suit",
              "formal-shirt",
              "business-casual",
              "original",
            ],
            CLOTHING_LABELS,
          )}
          onChange={(clothing) => onChange({ clothing })}
        />
        <FieldSelect<FramingOption>
          label="Framing"
          value={settings.framing}
          disabled={disabled}
          options={optionsFrom(
            ["headshot", "head-shoulders", "upper-body"],
            FRAMING_LABELS,
          )}
          onChange={(framing) => onChange({ framing })}
        />
        <FieldSelect<AspectRatio>
          label="Output ratio"
          value={settings.aspectRatio}
          disabled={disabled}
          options={optionsFrom(
            ["passport", "square", "portrait", "four-five", "three-four"],
            ASPECT_LABELS,
          )}
          onChange={(aspectRatio) => onChange({ aspectRatio })}
        />
      </div>

      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-2">
        <ToggleRow
          label="Preserve facial identity"
          description="Keep the same recognizable face"
          checked={settings.preserveIdentity}
          disabled={disabled}
          onChange={(preserveIdentity) => onChange({ preserveIdentity })}
        />
        <ToggleRow
          label="Natural skin texture"
          description="Avoid plastic or over-smoothed skin"
          checked={settings.preserveSkinTexture}
          disabled={disabled}
          onChange={(preserveSkinTexture) => onChange({ preserveSkinTexture })}
        />
      </div>

      <details className="group rounded-xl border border-stone-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-stone-800 select-none [&::-webkit-details-marker]:hidden">
          <span>Advanced customization</span>
          <span className="text-xs font-normal text-stone-500 transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="space-y-5 border-t border-stone-100 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {usesSuit ? (
              <FieldSelect<SuitColor>
                label="Suit color"
                value={settings.suitColor}
                disabled={disabled}
                options={optionsFrom(
                  ["black", "navy", "charcoal", "light-grey"],
                  SUIT_LABELS,
                )}
                onChange={(suitColor) => onChange({ suitColor })}
              />
            ) : null}
            {usesShirtColor ? (
              <FieldSelect<ShirtColor>
                label="Shirt color"
                value={settings.shirtColor}
                disabled={disabled}
                options={optionsFrom(["white", "light-blue", "black"], SHIRT_LABELS)}
                onChange={(shirtColor) => onChange({ shirtColor })}
              />
            ) : null}
            {usesSuit ? (
              <FieldSelect<TieOption>
                label="Tie"
                value={settings.tie}
                disabled={disabled}
                options={optionsFrom(["none", "black", "navy", "burgundy"], TIE_LABELS)}
                onChange={(tie) => onChange({ tie })}
              />
            ) : null}
            <FieldSelect<LightingOption>
              label="Lighting"
              value={settings.lighting}
              disabled={disabled}
              options={optionsFrom(
                ["natural", "soft-studio", "professional-studio"],
                LIGHTING_LABELS,
              )}
              onChange={(lighting) => onChange({ lighting })}
            />
            <FieldSelect<ExpressionOption>
              label="Facial expression"
              value={settings.expression}
              disabled={disabled}
              options={optionsFrom(
                ["preserve", "subtle-smile", "neutral-professional"],
                EXPRESSION_LABELS,
              )}
              onChange={(expression) => onChange({ expression })}
            />
          </div>

          <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-2">
            <ToggleRow
              label="Preserve hairstyle"
              checked={settings.preserveHairstyle}
              disabled={disabled}
              onChange={(preserveHairstyle) => onChange({ preserveHairstyle })}
            />
            <ToggleRow
              label="Preserve skin texture"
              checked={settings.preserveSkinTexture}
              disabled={disabled}
              onChange={(preserveSkinTexture) => onChange({ preserveSkinTexture })}
            />
            <ToggleRow
              label="Preserve facial identity"
              checked={settings.preserveIdentity}
              disabled={disabled}
              onChange={(preserveIdentity) => onChange({ preserveIdentity })}
            />
          </div>

          <label className="block">
            <span className="mb-1 flex items-baseline justify-between text-xs font-medium text-stone-600">
              Custom instructions
              <span className="font-normal text-stone-400">
                {settings.customInstructions.length}/{MAX_CUSTOM_INSTRUCTIONS}
              </span>
            </span>
            <textarea
              value={settings.customInstructions}
              disabled={disabled}
              maxLength={MAX_CUSTOM_INSTRUCTIONS}
              rows={3}
              placeholder="e.g. Keep my glasses, make the backdrop slightly warmer."
              onChange={(event) =>
                onChange({
                  customInstructions: event.target.value.slice(
                    0,
                    MAX_CUSTOM_INSTRUCTIONS,
                  ),
                })
              }
              className="w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm transition placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {keepOriginalClothing ? (
            <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
              Original clothing is kept, so suit, shirt, and tie options are
              hidden.
            </p>
          ) : null}
        </div>
      </details>
    </div>
  );
}
