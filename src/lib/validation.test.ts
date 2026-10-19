import { describe, expect, it } from "vitest";
import { STYLE_PRESETS } from "@/lib/presets";
import {
  MAX_CUSTOM_INSTRUCTIONS,
  MAX_UPLOAD_BYTES,
  RequestValidationError,
  normalizeSettings,
  validateUploadMeta,
} from "@/lib/validation";

describe("normalizeSettings", () => {
  it("accepts every style preset", () => {
    for (const preset of Object.values(STYLE_PRESETS)) {
      expect(() => normalizeSettings(preset)).not.toThrow();
    }
  });

  it("rejects unknown style values", () => {
    const bad = { ...STYLE_PRESETS.professional, style: "celebrity" };
    expect(() => normalizeSettings(bad)).toThrow(RequestValidationError);
  });

  it("rejects unknown clothing and background values", () => {
    expect(() =>
      normalizeSettings({ ...STYLE_PRESETS.cv, clothing: "tuxedo" }),
    ).toThrow(RequestValidationError);
    expect(() =>
      normalizeSettings({ ...STYLE_PRESETS.cv, background: "space" }),
    ).toThrow(RequestValidationError);
  });

  it("rejects non-boolean preservation flags", () => {
    expect(() =>
      normalizeSettings({
        ...STYLE_PRESETS.cv,
        preserveIdentity: "yes",
      }),
    ).toThrow(RequestValidationError);
  });

  it("trims and accepts custom instructions at the limit", () => {
    const padded = ` ${"a".repeat(MAX_CUSTOM_INSTRUCTIONS)} `;
    const parsed = normalizeSettings({
      ...STYLE_PRESETS.cv,
      customInstructions: padded,
    });
    expect(parsed.customInstructions).toHaveLength(MAX_CUSTOM_INSTRUCTIONS);
  });

  it("rejects custom instructions beyond the limit", () => {
    expect(() =>
      normalizeSettings({
        ...STYLE_PRESETS.cv,
        customInstructions: "a".repeat(MAX_CUSTOM_INSTRUCTIONS + 1),
      }),
    ).toThrow(RequestValidationError);
  });

  it("rejects completely invalid input", () => {
    expect(() => normalizeSettings(null)).toThrow(RequestValidationError);
    expect(() => normalizeSettings("nope")).toThrow(RequestValidationError);
  });
});

describe("validateUploadMeta", () => {
  it("accepts a normal jpeg upload", () => {
    expect(() =>
      validateUploadMeta({ sizeBytes: 1024, mimeType: "image/jpeg" }),
    ).not.toThrow();
  });

  it("rejects empty files", () => {
    expect(() =>
      validateUploadMeta({ sizeBytes: 0, mimeType: "image/png" }),
    ).toThrow(RequestValidationError);
  });

  it("rejects files over 10 MB", () => {
    expect(() =>
      validateUploadMeta({
        sizeBytes: MAX_UPLOAD_BYTES + 1,
        mimeType: "image/png",
      }),
    ).toThrow(RequestValidationError);
  });

  it("rejects unsupported mime types", () => {
    for (const mimeType of ["image/gif", "application/pdf", "text/plain", ""]) {
      expect(() =>
        validateUploadMeta({ sizeBytes: 100, mimeType }),
      ).toThrow(RequestValidationError);
    }
  });
});
