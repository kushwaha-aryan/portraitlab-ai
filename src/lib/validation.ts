import { z } from "zod";
import {
  ASPECT_RATIOS,
  BACKGROUND_OPTIONS,
  CLOTHING_OPTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  LIGHTING_OPTIONS,
  PHOTO_STYLES,
  SHIRT_COLORS,
  SUIT_COLORS,
  TIE_OPTIONS,
  type PhotoSettings,
} from "@/types/photo";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_CUSTOM_INSTRUCTIONS = 300;
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export class RequestValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export const photoSettingsSchema = z.object({
  style: z.enum(PHOTO_STYLES),
  background: z.enum(BACKGROUND_OPTIONS),
  clothing: z.enum(CLOTHING_OPTIONS),
  framing: z.enum(FRAMING_OPTIONS),
  aspectRatio: z.enum(ASPECT_RATIOS),
  preserveIdentity: z.boolean(),
  preserveSkinTexture: z.boolean(),
  preserveHairstyle: z.boolean(),
  suitColor: z.enum(SUIT_COLORS),
  shirtColor: z.enum(SHIRT_COLORS),
  tie: z.enum(TIE_OPTIONS),
  lighting: z.enum(LIGHTING_OPTIONS),
  expression: z.enum(EXPRESSION_OPTIONS),
  customInstructions: z
    .string()
    .trim()
    .max(
      MAX_CUSTOM_INSTRUCTIONS,
      `Custom instructions must be ${MAX_CUSTOM_INSTRUCTIONS} characters or fewer.`,
    ),
});

export function normalizeSettings(input: unknown): PhotoSettings {
  const result = photoSettingsSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) =>
        `${issue.path.length > 0 ? issue.path.join(".") : "settings"}: ${issue.message}`,
    );
    throw new RequestValidationError("Invalid generation settings.", issues);
  }
  return result.data;
}

export function validateUploadMeta(params: {
  sizeBytes: number;
  mimeType: string | undefined | null;
}): void {
  const { sizeBytes, mimeType } = params;
  if (sizeBytes <= 0) {
    throw new RequestValidationError("The uploaded file is empty.", [
      "photo: file is empty",
    ]);
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new RequestValidationError(
      `The uploaded file exceeds the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB limit.`,
      ["photo: file too large"],
    );
  }
  if (!mimeType || !(ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new RequestValidationError(
      "Unsupported file type. Please upload a JPEG, PNG, or WebP image.",
      ["photo: unsupported content type"],
    );
  }
}
