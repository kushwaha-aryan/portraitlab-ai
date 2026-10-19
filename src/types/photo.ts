export const PHOTO_STYLES = [
  "professional",
  "passport",
  "linkedin",
  "cv",
  "casual",
] as const;
export type PhotoStyle = (typeof PHOTO_STYLES)[number];

export const BACKGROUND_OPTIONS = [
  "white",
  "light-grey",
  "blue",
  "office",
  "outdoor",
] as const;
export type BackgroundOption = (typeof BACKGROUND_OPTIONS)[number];

export const CLOTHING_OPTIONS = [
  "black-suit",
  "navy-suit",
  "charcoal-suit",
  "formal-shirt",
  "business-casual",
  "original",
] as const;
export type ClothingOption = (typeof CLOTHING_OPTIONS)[number];

export const FRAMING_OPTIONS = [
  "headshot",
  "head-shoulders",
  "upper-body",
] as const;
export type FramingOption = (typeof FRAMING_OPTIONS)[number];

export const ASPECT_RATIOS = [
  "passport",
  "square",
  "portrait",
  "four-five",
  "three-four",
] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const SUIT_COLORS = ["black", "navy", "charcoal", "light-grey"] as const;
export type SuitColor = (typeof SUIT_COLORS)[number];

export const SHIRT_COLORS = ["white", "light-blue", "black"] as const;
export type ShirtColor = (typeof SHIRT_COLORS)[number];

export const TIE_OPTIONS = ["none", "black", "navy", "burgundy"] as const;
export type TieOption = (typeof TIE_OPTIONS)[number];

export const LIGHTING_OPTIONS = [
  "natural",
  "soft-studio",
  "professional-studio",
] as const;
export type LightingOption = (typeof LIGHTING_OPTIONS)[number];

export const EXPRESSION_OPTIONS = [
  "preserve",
  "subtle-smile",
  "neutral-professional",
] as const;
export type ExpressionOption = (typeof EXPRESSION_OPTIONS)[number];

export interface PhotoSettings {
  style: PhotoStyle;
  background: BackgroundOption;
  clothing: ClothingOption;
  framing: FramingOption;
  aspectRatio: AspectRatio;
  preserveIdentity: boolean;
  preserveSkinTexture: boolean;
  preserveHairstyle: boolean;
  suitColor: SuitColor;
  shirtColor: ShirtColor;
  tie: TieOption;
  lighting: LightingOption;
  expression: ExpressionOption;
  customInstructions: string;
}

export interface GenerationResult {
  imageBase64: string;
  mimeType: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  aspectRatioLabel: string;
  model: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export const IMAGE_PROVIDERS = ["cloudflare"] as const;
export type ImageProviderId = (typeof IMAGE_PROVIDERS)[number];

export interface ProviderSetupStatus {
  provider: ImageProviderId;
  label: string;
  free: boolean;
  configured: boolean;
  model: string;
  requiredEnvVars: string[];
  setupUrl: string;
}

export const STYLE_META: Record<
  PhotoStyle,
  { label: string; description: string }
> = {
  professional: {
    label: "Professional Portrait",
    description: "Polished business portrait with a refined, studio finish.",
  },
  passport: {
    label: "Passport-Style Photo",
    description: "Neutral 35×45 style framing on a plain background.",
  },
  linkedin: {
    label: "LinkedIn Profile",
    description: "Approachable, high-quality profile picture.",
  },
  cv: {
    label: "CV / Resume Photo",
    description: "Clean, formal headshot for job applications.",
  },
  casual: {
    label: "Casual Portrait",
    description: "Relaxed, natural everyday portrait.",
  },
};
