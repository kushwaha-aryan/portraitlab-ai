import sharp from "sharp";
import {
  PROVIDER_TIMEOUT_MS,
  ProviderError,
  sanitizeProviderMessage,
  withTimeout,
} from "@/lib/provider-error";

/**
 * FLUX.2 [klein] 4B is the Workers AI image-editing model: it accepts the
 * source photo as a reference image and edits it from the prompt. It is the
 * fastest of the FLUX.2 family on Workers AI (fixed 4-step inference).
 */
export const DEFAULT_CLOUDFLARE_MODEL =
  "@cf/black-forest-labs/flux-2-klein-4b";

/** FLUX.2 rejects reference images that are 512px or larger on either edge. */
const PROVIDER_MAX_EDGE = 512;
const OUTPUT_EDGE = 1024;

export function getCloudflareModel(): string {
  return (
    process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || DEFAULT_CLOUDFLARE_MODEL
  );
}

export interface CloudflareGenerateInput {
  image: Buffer;
  mimeType: string;
  prompt: string;
}

export interface CloudflareGenerateOutput {
  image: Buffer;
  mimeType: string;
}

function classifyCloudflareError(status: number, bodyText: string): ProviderError {
  const detail = (() => {
    try {
      const parsed = JSON.parse(bodyText) as {
        errors?: Array<{ message?: unknown }>;
        messages?: unknown;
        result?: unknown;
        error?: unknown;
      };
      const first = parsed.errors?.[0]?.message ?? parsed.error ?? parsed.result;
      if (typeof first === "string" && first.trim().length > 0) {
        return first.trim().replace(/\s+/g, " ").slice(0, 220);
      }
      if (first && typeof first === "object") {
        return JSON.stringify(first).slice(0, 220);
      }
    } catch {
      // Non-JSON body; fall through.
    }
    return bodyText.trim().replace(/\s+/g, " ").slice(0, 220);
  })();

  if (status === 401 || status === 403) {
    return new ProviderError(
      "auth_error",
      "Cloudflare rejected the API credentials. Create a free token with Workers AI permission at https://dash.cloudflare.com/profile/api-tokens, set CLOUDFLARE_API_TOKEN in .env.local, and restart the server.",
      401,
    );
  }
  if (status === 429) {
    return new ProviderError(
      "quota",
      "The Cloudflare Workers AI free daily limit (or rate limit) was hit. It resets at 00:00 UTC; wait a moment and try again.",
      429,
    );
  }
  if (status === 400 || status === 413 || status === 422) {
    return new ProviderError(
      "blocked",
      `Cloudflare rejected the request: ${detail || "invalid input"}. Try a different photo or simpler custom instructions.`,
      502,
    );
  }
  return new ProviderError(
    "api_error",
    `The Cloudflare Workers AI request failed (${status}): ${detail || "unknown error"}`,
    502,
  );
}

/**
 * Downscales the source photo to the size FLUX.2 accepts for reference images
 * and re-encodes it as JPEG for the multipart upload.
 */
async function toReferenceJpeg(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .rotate()
    .resize({
      width: PROVIDER_MAX_EDGE,
      height: PROVIDER_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

function sniffMimeType(bytes: Buffer): string {
  if (bytes.length > 3 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return "image/png";
  }
  if (bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    bytes.length > 11 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return "image/png";
}

/**
 * Sends the source photo plus prompt to Cloudflare Workers AI FLUX.2 [klein]
 * as multipart form data, where the photo is the `input_image_0` reference.
 * Covered by the free tier (10,000 neurons/day).
 */
export async function generateCloudflareImageEdit(
  input: CloudflareGenerateInput,
): Promise<CloudflareGenerateOutput> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !apiToken) {
    throw new ProviderError(
      "missing_api_key",
      "CLOUDFLARE_ACCOUNT_ID and/or CLOUDFLARE_API_TOKEN are not configured. Create a free Cloudflare account (no credit card), add a Workers AI API token, put both values in .env.local, and restart the app.",
      503,
    );
  }

  const model = getCloudflareModel();
  const reference = await toReferenceJpeg(input.image);

  const form = new FormData();
  form.append("prompt", input.prompt);
  form.append(
    "input_image_0",
    new Blob([new Uint8Array(reference)], { type: "image/jpeg" }),
    "photo.jpg",
  );
  form.append("width", String(OUTPUT_EDGE));
  form.append("height", String(OUTPUT_EDGE));

  let response: Response;
  try {
    response = await withTimeout(
      fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            Accept: "image/png, image/jpeg, application/json",
          },
          body: form,
        },
      ),
      PROVIDER_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }
    throw new ProviderError(
      "api_error",
      `The Cloudflare Workers AI request failed: ${sanitizeProviderMessage(error)}`,
      502,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const bodyText = await response.text();
    throw classifyCloudflareError(response.status, bodyText);
  }

  if (contentType.startsWith("image/")) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 0) {
      return {
        image: bytes,
        mimeType: contentType.split(";")[0].trim() || sniffMimeType(bytes),
      };
    }
    throw new ProviderError(
      "no_image",
      "Cloudflare returned an empty image body. Try again.",
      502,
    );
  }

  const bodyText = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText) as unknown;
  } catch {
    throw new ProviderError(
      "no_image",
      "The Cloudflare response was neither an image nor valid JSON.",
      502,
    );
  }

  const result = (parsed as { result?: unknown }).result;
  const imageValue =
    typeof result === "string"
      ? result
      : ((result as { image?: unknown } | undefined)?.image ??
        (parsed as { image?: unknown }).image);

  if (typeof imageValue === "string" && imageValue.trim().length > 0) {
    const bytes = Buffer.from(imageValue.trim(), "base64");
    return { image: bytes, mimeType: sniffMimeType(bytes) };
  }

  throw new ProviderError(
    "no_image",
    "The Cloudflare API response contained no image data. Try again, or try a different photo.",
    502,
  );
}
