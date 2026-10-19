import { describe, expect, it } from "vitest";
import { buildPhotoPrompt } from "@/lib/prompt-builder";
import { STYLE_PRESETS } from "@/lib/presets";

describe("buildPhotoPrompt", () => {
  it("frames the task as an edit of the supplied photograph", () => {
    const prompt = buildPhotoPrompt(STYLE_PRESETS.professional);
    expect(prompt).toContain("EDIT of the supplied photograph");
    expect(prompt).toContain("attached source photograph");
    expect(prompt).toContain("SAME person");
  });

  it("includes identity, skin, and hair preservation for the default preset", () => {
    const prompt = buildPhotoPrompt(STYLE_PRESETS.passport);
    expect(prompt).toContain("Preserve the person's recognizable facial identity");
    expect(prompt).toContain("natural, realistic skin texture");
    expect(prompt).toContain("Keep the person's hairstyle");
  });

  it("mentions wardrobe, background, lighting, and framing details", () => {
    const prompt = buildPhotoPrompt(STYLE_PRESETS.professional);
    expect(prompt).toContain("navy blue business suit");
    expect(prompt).toContain("well-fitted navy blue suit jacket");
    expect(prompt).toContain("crisp white dress shirt");
    expect(prompt).toContain("solid navy blue tie");
    expect(prompt).toContain("blurred modern office");
    expect(prompt).toContain("diffused studio lighting");
    expect(prompt).toContain("head-and-shoulders");
    expect(prompt).toContain("4:5");
  });

  it("does not mention suit details when keeping original clothing", () => {
    const prompt = buildPhotoPrompt(STYLE_PRESETS.casual);
    expect(prompt).toContain("Keep the person's original clothing");
    expect(prompt).not.toContain("suit jacket");
    expect(prompt).not.toContain("tie");
    expect(prompt).toContain("natural daylight");
    expect(prompt).toContain("original facial expression");
  });

  it("adds passport-specific framing and quality notes", () => {
    const prompt = buildPhotoPrompt(STYLE_PRESETS.passport);
    expect(prompt).toContain("7:9");
    expect(prompt).toContain("35:45");
    expect(prompt).toContain("passport-style photograph");
  });

  it("includes custom instructions when provided", () => {
    const settings = {
      ...STYLE_PRESETS.professional,
      customInstructions: "Keep my round glasses exactly as they are.",
    };
    const prompt = buildPhotoPrompt(settings);
    expect(prompt).toContain("ADDITIONAL INSTRUCTIONS");
    expect(prompt).toContain("Keep my round glasses exactly as they are.");
  });

  it("omits the custom instructions section when empty", () => {
    const prompt = buildPhotoPrompt(STYLE_PRESETS.cv);
    expect(prompt).not.toContain("ADDITIONAL INSTRUCTIONS");
  });

  it("respects preservation toggles when disabled", () => {
    const settings = {
      ...STYLE_PRESETS.professional,
      preserveIdentity: false,
      preserveSkinTexture: false,
      preserveHairstyle: false,
    };
    const prompt = buildPhotoPrompt(settings);
    expect(prompt).toContain("Minor natural adjustments");
    expect(prompt).toContain("Light, subtle portrait retouching");
    expect(prompt).toContain("hairstyle may be refined");
  });

  it("always forbids watermarks and identity-changing edits", () => {
    for (const preset of Object.values(STYLE_PRESETS)) {
      const prompt = buildPhotoPrompt(preset);
      expect(prompt).toContain("watermarks");
      expect(prompt).toContain("Do not change the person's apparent age");
      expect(prompt).toContain("never generate an unrelated face");
    }
  });
});
