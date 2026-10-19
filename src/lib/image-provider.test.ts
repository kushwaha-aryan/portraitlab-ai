import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getActiveModelName,
  getActiveProvider,
  getProviderSetupStatus,
} from "@/lib/image-provider";

const KEYS = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_IMAGE_MODEL",
] as const;

const original: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of KEYS) {
    original[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    const previous = original[key];
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  }
});

describe("getActiveProvider", () => {
  it("always resolves to cloudflare", () => {
    expect(getActiveProvider()).toBe("cloudflare");
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc";
    process.env.CLOUDFLARE_API_TOKEN = "tok";
    expect(getActiveProvider()).toBe("cloudflare");
  });
});

describe("getProviderSetupStatus", () => {
  it("reports cloudflare as configured only when both vars are set", () => {
    expect(getProviderSetupStatus().configured).toBe(false);
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc";
    expect(getProviderSetupStatus().configured).toBe(false);
    process.env.CLOUDFLARE_API_TOKEN = "tok";
    const status = getProviderSetupStatus();
    expect(status.provider).toBe("cloudflare");
    expect(status.configured).toBe(true);
    expect(status.requiredEnvVars).toEqual([
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN",
    ]);
  });

  it("never leaks secret values in the setup status", () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc";
    process.env.CLOUDFLARE_API_TOKEN = "super-secret-token";
    const status = getProviderSetupStatus();
    expect(JSON.stringify(status)).not.toContain("super-secret-token");
  });

  it("points an unconfigured provider at the free cloudflare setup", () => {
    const status = getProviderSetupStatus();
    expect(status.provider).toBe("cloudflare");
    expect(status.configured).toBe(false);
    expect(status.free).toBe(true);
    expect(status.requiredEnvVars).toContain("CLOUDFLARE_API_TOKEN");
  });
});

describe("getActiveModelName", () => {
  it("defaults to the FLUX.2 reference-editing model", () => {
    expect(getActiveModelName()).toContain("flux-2");
  });

  it("honours the CLOUDFLARE_IMAGE_MODEL override", () => {
    process.env.CLOUDFLARE_IMAGE_MODEL = "@cf/custom/model";
    expect(getActiveModelName()).toBe("@cf/custom/model");
  });
});
