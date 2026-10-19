import { NextResponse } from "next/server";
import {
  generateImageEdit,
  getActiveModelName,
  ProviderError,
} from "@/lib/image-provider";
import {
  ImageProcessingError,
  inspectAndNormalizeUpload,
  processGeneratedImage,
} from "@/lib/image-processing";
import { buildPhotoPrompt } from "@/lib/prompt-builder";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import {
  MAX_UPLOAD_BYTES,
  RequestValidationError,
  normalizeSettings,
  validateUploadMeta,
} from "@/lib/validation";
import type { ApiErrorBody } from "@/types/photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function errorResponse(
  status: number,
  code: string,
  message: string,
  extraHeaders?: HeadersInit,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: extraHeaders },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const rate = checkRateLimit(getClientKey(request));
  if (!rate.ok) {
    return errorResponse(
      429,
      "rate_limited",
      "Too many generation requests. Please wait a few minutes and try again.",
      { "Retry-After": String(rate.retryAfterSeconds) },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "The request body must be multipart form data with a photo and settings.",
    );
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File)) {
    return errorResponse(
      400,
      "missing_photo",
      "No photo was uploaded. Please select a JPEG, PNG, or WebP image.",
    );
  }

  const settingsRaw = formData.get("settings");
  if (typeof settingsRaw !== "string" || settingsRaw.length === 0) {
    return errorResponse(
      400,
      "missing_settings",
      "Missing generation settings.",
    );
  }

  let settings;
  try {
    settings = normalizeSettings(JSON.parse(settingsRaw) as unknown);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(400, "invalid_settings", error.message);
    }
    return errorResponse(
      400,
      "invalid_settings",
      "Settings must be valid JSON matching the supported option set.",
    );
  }

  try {
    validateUploadMeta({ sizeBytes: photo.size, mimeType: photo.type });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(400, "invalid_photo", error.message);
    }
    return errorResponse(400, "invalid_photo", "The uploaded photo is invalid.");
  }

  if (photo.size > MAX_UPLOAD_BYTES) {
    return errorResponse(
      400,
      "photo_too_large",
      "The uploaded file exceeds the 10 MB limit.",
    );
  }

  let source;
  try {
    const bytes = Buffer.from(await photo.arrayBuffer());
    source = await inspectAndNormalizeUpload(bytes);
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      return errorResponse(400, `photo_${error.code}`, error.message);
    }
    return errorResponse(
      400,
      "photo_corrupt",
      "The uploaded file could not be read as a valid image.",
    );
  }

  const prompt = buildPhotoPrompt(settings);

  let generated;
  try {
    generated = await generateImageEdit({
      image: source.data,
      mimeType: source.mimeType,
      prompt,
    });
  } catch (error) {
    if (error instanceof ProviderError) {
      return errorResponse(error.httpStatus, error.code, error.message);
    }
    return errorResponse(
      502,
      "provider_error",
      "The image service returned an unexpected error. Please try again.",
    );
  }

  let processed;
  try {
    processed = await processGeneratedImage(
      generated.image,
      settings.aspectRatio,
    );
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      return errorResponse(502, `output_${error.code}`, error.message);
    }
    return errorResponse(
      502,
      "output_failed",
      "The generated image could not be processed. Please try again.",
    );
  }

  return NextResponse.json({
    imageBase64: processed.data.toString("base64"),
    mimeType: processed.mimeType,
    width: processed.width,
    height: processed.height,
    format: processed.format,
    sizeBytes: processed.sizeBytes,
    aspectRatioLabel: processed.aspectRatioLabel,
    model: getActiveModelName(),
  });
}
