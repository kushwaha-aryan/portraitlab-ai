import sharp from "sharp";
import type { Metadata } from "sharp";
import type { AspectRatio } from "@/types/photo";

export const ASPECT_RATIO_TARGETS: Record<
  AspectRatio,
  { width: number; height: number; label: string }
> = {
  passport: { width: 413, height: 531, label: "7:9 (35×45 proportions)" },
  square: { width: 1024, height: 1024, label: "1:1" },
  portrait: { width: 1024, height: 1536, label: "2:3" },
  "four-five": { width: 1024, height: 1280, label: "4:5" },
  "three-four": { width: 1152, height: 1536, label: "3:4" },
};

const ALLOWED_FORMATS = new Set(["jpeg", "jpg", "png", "webp"]);
const MIN_INPUT_EDGE = 128;
const MAX_INPUT_EDGE = 8000;

export type ImageProcessingErrorCode =
  | "corrupt"
  | "unsupported"
  | "dimensions"
  | "empty"
  | "failed";

export class ImageProcessingError extends Error {
  constructor(
    public readonly code: ImageProcessingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export interface ProcessedImage {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

export interface ProcessedSourceImage extends ProcessedImage {
  aspectRatioLabel: string;
}

function formatOf(format: string | undefined): string | null {
  if (!format) return null;
  const normalized = format.toLowerCase();
  return ALLOWED_FORMATS.has(normalized) ? normalized : null;
}

/**
 * Validates that the buffer really is an image, checks dimensions, corrects
 * EXIF orientation, and re-encodes to a normalized JPEG for the provider.
 */
export async function inspectAndNormalizeUpload(
  buffer: Buffer,
): Promise<ProcessedImage> {
  if (buffer.byteLength === 0) {
    throw new ImageProcessingError("empty", "The uploaded file is empty.");
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    throw new ImageProcessingError(
      "corrupt",
      "The uploaded file could not be read as a valid image.",
    );
  }

  const format = formatOf(metadata.format);
  if (!format) {
    throw new ImageProcessingError(
      "unsupported",
      "Unsupported image format. Please upload a JPEG, PNG, or WebP image.",
    );
  }

  const { width, height } = metadata;
  if (!width || !height) {
    throw new ImageProcessingError(
      "corrupt",
      "The uploaded image is missing dimension information and looks corrupt.",
    );
  }
  if (
    width < MIN_INPUT_EDGE ||
    height < MIN_INPUT_EDGE ||
    width > MAX_INPUT_EDGE ||
    height > MAX_INPUT_EDGE
  ) {
    throw new ImageProcessingError(
      "dimensions",
      `Image dimensions must be between ${MIN_INPUT_EDGE} and ${MAX_INPUT_EDGE} pixels on each side.`,
    );
  }

  try {
    const { data, info } = await sharp(buffer, { failOn: "error" })
      .rotate()
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return {
      data,
      mimeType: "image/jpeg",
      width: info.width,
      height: info.height,
      format: "jpeg",
      sizeBytes: data.byteLength,
    };
  } catch {
    throw new ImageProcessingError(
      "failed",
      "The uploaded image could not be processed.",
    );
  }
}

/**
 * Validates the model output, corrects orientation, crops to the requested
 * aspect ratio without stretching, and encodes a browser-friendly PNG.
 */
export async function processGeneratedImage(
  buffer: Buffer,
  aspectRatio: AspectRatio,
): Promise<ProcessedSourceImage> {
  const target = ASPECT_RATIO_TARGETS[aspectRatio];

  if (buffer.byteLength === 0) {
    throw new ImageProcessingError(
      "empty",
      "The image returned by the model was empty.",
    );
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    throw new ImageProcessingError(
      "corrupt",
      "The image returned by the model could not be decoded.",
    );
  }

  const format = formatOf(metadata.format);
  if (!format) {
    throw new ImageProcessingError(
      "unsupported",
      `The model returned an unsupported image format (${metadata.format ?? "unknown"}).`,
    );
  }
  if (!metadata.width || !metadata.height) {
    throw new ImageProcessingError(
      "corrupt",
      "The image returned by the model is missing dimension information.",
    );
  }

  try {
    const { data, info } = await sharp(buffer, { failOn: "error" })
      .rotate()
      .resize(target.width, target.height, {
        fit: "cover",
        position: "attention",
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      mimeType: "image/png",
      width: info.width,
      height: info.height,
      format: "png",
      sizeBytes: data.byteLength,
      aspectRatioLabel: target.label,
    };
  } catch {
    throw new ImageProcessingError(
      "failed",
      "The generated image could not be processed into the requested format.",
    );
  }
}
