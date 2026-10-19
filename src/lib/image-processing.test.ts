import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  ASPECT_RATIO_TARGETS,
  ImageProcessingError,
  inspectAndNormalizeUpload,
  processGeneratedImage,
} from "@/lib/image-processing";

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 180, g: 120, b: 90 },
    },
  })
    .png()
    .toBuffer();
}

describe("inspectAndNormalizeUpload", () => {
  it("normalizes a valid png to jpeg", async () => {
    const png = await makePng(800, 1000);
    const result = await inspectAndNormalizeUpload(png);
    expect(result.format).toBe("jpeg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.width).toBe(800);
    expect(result.height).toBe(1000);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it("rejects a corrupt buffer", async () => {
    await expect(
      inspectAndNormalizeUpload(Buffer.from("not-an-image")),
    ).rejects.toMatchObject({ code: "corrupt" });
  });

  it("rejects an empty buffer", async () => {
    await expect(inspectAndNormalizeUpload(Buffer.alloc(0))).rejects.toMatchObject(
      { code: "empty" },
    );
  });

  it("rejects images below the minimum edge size", async () => {
    const tiny = await makePng(50, 50);
    await expect(inspectAndNormalizeUpload(tiny)).rejects.toMatchObject({
      code: "dimensions",
    });
  });

  it("rejects an unsupported format such as gif", async () => {
    const gif = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 10, g: 200, b: 80 },
      },
    })
      .gif()
      .toBuffer();
    await expect(inspectAndNormalizeUpload(gif)).rejects.toMatchObject({
      code: "unsupported",
    });
  });
});

describe("processGeneratedImage", () => {
  it("crops to the passport target of 413x531 without stretching", async () => {
    const source = await makePng(1024, 1024);
    const result = await processGeneratedImage(source, "passport");
    expect(result.width).toBe(413);
    expect(result.height).toBe(531);
    expect(result.format).toBe("png");
    expect(result.mimeType).toBe("image/png");
    expect(result.aspectRatioLabel).toBe(ASPECT_RATIO_TARGETS.passport.label);
  });

  it("supports the square aspect ratio", async () => {
    const source = await makePng(900, 700);
    const result = await processGeneratedImage(source, "square");
    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
  });

  it("rejects corrupt model output", async () => {
    await expect(
      processGeneratedImage(Buffer.from("garbage"), "square"),
    ).rejects.toBeInstanceOf(ImageProcessingError);
  });
});
