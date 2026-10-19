import {
  generateCloudflareImageEdit,
  getCloudflareModel,
} from "@/lib/cloudflare";
import { ProviderError } from "@/lib/provider-error";
import type { ImageProviderId, ProviderSetupStatus } from "@/types/photo";

export type { ImageProviderId };

export interface ImageEditInput {
  image: Buffer;
  mimeType: string;
  prompt: string;
}

export interface ImageEditOutput {
  image: Buffer;
  mimeType: string;
}

function cloudflareConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim() &&
      process.env.CLOUDFLARE_API_TOKEN?.trim(),
  );
}

/** Cloudflare Workers AI is the only provider. */
export function getActiveProvider(): ImageProviderId {
  return "cloudflare";
}

export function getActiveModelName(): string {
  return getCloudflareModel();
}

/**
 * Describes the active provider without exposing any secret values, so the UI
 * can tell the user exactly what to configure when no key is present yet.
 */
export function getProviderSetupStatus(): ProviderSetupStatus {
  return {
    provider: "cloudflare",
    label: "Cloudflare Workers AI",
    free: true,
    configured: cloudflareConfigured(),
    model: getCloudflareModel(),
    requiredEnvVars: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"],
    setupUrl: "https://dash.cloudflare.com/profile/api-tokens",
  };
}

export async function generateImageEdit(
  input: ImageEditInput,
): Promise<ImageEditOutput> {
  return generateCloudflareImageEdit(input);
}

export { ProviderError };
