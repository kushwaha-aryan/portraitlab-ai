import type {
  AspectRatio,
  BackgroundOption,
  ClothingOption,
  ExpressionOption,
  FramingOption,
  LightingOption,
  PhotoSettings,
  ShirtColor,
  SuitColor,
  TieOption,
} from "@/types/photo";

const BACKGROUND_PROMPTS: Record<BackgroundOption, string> = {
  white: "a clean, solid pure white background",
  "light-grey":
    "a clean, solid light grey background with even tone and no clutter",
  blue: "a smooth professional blue studio backdrop",
  office:
    "a tastefully blurred modern office environment with soft depth of field and no readable text or logos",
  outdoor:
    "a softly blurred outdoor natural setting with pleasing bokeh and even daylight, no distracting objects",
};

const SUIT_PROMPTS: Record<SuitColor, string> = {
  black: "a well-fitted black suit jacket",
  navy: "a well-fitted navy blue suit jacket",
  charcoal: "a well-fitted charcoal grey suit jacket",
  "light-grey": "a well-fitted light grey suit jacket",
};

const SHIRT_PROMPTS: Record<ShirtColor, string> = {
  white: "a crisp white dress shirt",
  "light-blue": "a light blue dress shirt",
  black: "a black dress shirt",
};

const TIE_PROMPTS: Record<TieOption, string> = {
  none: "no tie, top button relaxed",
  black: "a solid black tie",
  navy: "a solid navy blue tie",
  burgundy: "a solid burgundy tie",
};

const CLOTHING_PROMPTS: Record<ClothingOption, string> = {
  "black-suit": "Dress the person in a formal black business suit.",
  "navy-suit": "Dress the person in a formal navy blue business suit.",
  "charcoal-suit": "Dress the person in a formal charcoal grey business suit.",
  "formal-shirt":
    "Dress the person in a clean formal dress shirt with no jacket.",
  "business-casual":
    "Dress the person in smart business-casual attire such as a collared shirt or refined knit with no loud patterns.",
  original: "Keep the person's original clothing exactly as it appears.",
};

const FRAMING_PROMPTS: Record<FramingOption, string> = {
  headshot:
    "Frame a tight headshot: the face fills most of the frame, with a small margin above the head.",
  "head-shoulders":
    "Frame a classic head-and-shoulders portrait, centered and balanced.",
  "upper-body":
    "Frame an upper-body portrait from roughly the waist up, with comfortable margins.",
};

const LIGHTING_PROMPTS: Record<LightingOption, string> = {
  natural: "Use soft, natural daylight that flatters the face evenly.",
  "soft-studio":
    "Use gentle, diffused studio lighting with soft shadows and pleasing skin tones.",
  "professional-studio":
    "Use even, professional studio lighting with a key light and subtle fill, no harsh shadows on the face.",
};

const EXPRESSION_PROMPTS: Record<ExpressionOption, string> = {
  preserve: "Keep the original facial expression from the source photo.",
  "subtle-smile":
    "Give the person a subtle, confident, natural closed-mouth smile.",
  "neutral-professional":
    "Give the person a calm, neutral, professional expression suitable for official photos.",
};

const ASPECT_PROMPTS: Record<AspectRatio, string> = {
  passport:
    "Compose the output in a 7:9 portrait ratio (35:45 proportions): head centered, eyes on the upper third, both ears visible when possible, shoulders squared, plenty of clear space above the head, suitable for a passport-style photo.",
  square: "Compose the output as a balanced square (1:1) image.",
  portrait: "Compose the output as a 2:3 vertical portrait.",
  "four-five": "Compose the output as a 4:5 vertical portrait.",
  "three-four": "Compose the output as a 3:4 vertical portrait.",
};

function wardrobeSection(settings: PhotoSettings): string {
  const lines: string[] = [CLOTHING_PROMPTS[settings.clothing]];
  const usesSuit =
    settings.clothing === "black-suit" ||
    settings.clothing === "navy-suit" ||
    settings.clothing === "charcoal-suit";
  if (usesSuit) {
    lines.push(
      `Suit fabric and cut: ${SUIT_PROMPTS[settings.suitColor]}.`,
      `Shirt: ${SHIRT_PROMPTS[settings.shirtColor]}.`,
      `Tie: ${TIE_PROMPTS[settings.tie]}.`,
    );
  } else if (settings.clothing === "formal-shirt") {
    lines.push(`Shirt: ${SHIRT_PROMPTS[settings.shirtColor]}.`);
  }
  return lines.join("\n");
}

function identitySection(settings: PhotoSettings): string {
  const lines: string[] = [
    "This is an EDIT of the supplied photograph of a real person, not a request to invent a new character.",
  ];
  if (settings.preserveIdentity) {
    lines.push(
      "Preserve the person's recognizable facial identity exactly: same face shape, bone structure, eyes, nose, mouth, eyebrows, facial hair, skin tone, and distinguishing marks. Do not reshape or redesign the face. Do not swap in a different person.",
    );
  } else {
    lines.push(
      "Minor natural adjustments to the face are acceptable, but keep the person clearly recognizable as the same individual.",
    );
  }
  if (settings.preserveSkinTexture) {
    lines.push(
      "Keep natural, realistic skin texture. Do not plasticize or over-smooth the skin, do not add makeup, and avoid heavy retouching.",
    );
  } else {
    lines.push(
      "Light, subtle portrait retouching of minor blemishes is acceptable, but keep the skin believable.",
    );
  }
  if (settings.preserveHairstyle) {
    lines.push(
      "Keep the person's hairstyle, hair color, and hairline exactly as in the source photo.",
    );
  } else {
    lines.push(
      "The hairstyle may be refined slightly for a cleaner look, but hair color and overall style must remain believable and close to the original.",
    );
  }
  return lines.join("\n");
}

/**
 * Builds a deterministic editing prompt for the active image model from
 * validated settings. The prompt always frames the task as an edit of the
 * supplied source photograph.
 */
export function buildPhotoPrompt(settings: PhotoSettings): string {
  const sections: string[] = [];

  sections.push(
    [
      "TASK",
      "Edit the attached source photograph (image 0) to produce a polished, photorealistic portrait of the SAME person. Never replace the subject with a different person and never generate an unrelated face from scratch.",
    ].join("\n"),
  );

  sections.push(["IDENTITY", identitySection(settings)].join("\n"));

  sections.push(["WARDROBE", wardrobeSection(settings)].join("\n"));

  sections.push(
    ["BACKGROUND", BACKGROUND_PROMPTS[settings.background]].join("\n"),
  );

  sections.push(["LIGHTING", LIGHTING_PROMPTS[settings.lighting]].join("\n"));

  sections.push(
    [
      "EXPRESSION",
      EXPRESSION_PROMPTS[settings.expression],
      "Keep eye color, gaze direction, and age of the person consistent with the source photo.",
    ].join("\n"),
  );

  sections.push(
    [
      "FRAMING AND OUTPUT",
      FRAMING_PROMPTS[settings.framing],
      ASPECT_PROMPTS[settings.aspectRatio],
      "Keep anatomical proportions natural. Do not stretch, squash, or warp the subject or the background.",
    ].join("\n"),
  );

  const constraints = [
    "QUALITY CONSTRAINTS",
    "Produce a single high-quality photorealistic image.",
    "Keep the lighting physically plausible, edges clean, and colors natural.",
    "Do not add text, captions, watermarks, logos, borders, or extra limbs.",
    "Do not change the person's apparent age, ethnicity, gender, or body type.",
  ];
  if (settings.style === "passport") {
    constraints.push(
      "The result must look like a formal passport-style photograph: plain background, even lighting, neutral expression, no artistic effects.",
    );
  } else if (settings.style === "professional" || settings.style === "cv") {
    constraints.push(
      "The result must look like a formal business portrait suitable for a company website or curriculum vitae.",
    );
  } else if (settings.style === "linkedin") {
    constraints.push(
      "The result must look approachable and professional, suitable as a LinkedIn profile picture.",
    );
  } else {
    constraints.push(
      "The result must look like a natural, flattering casual portrait with no artificial stylization.",
    );
  }
  sections.push(constraints.join("\n"));

  const custom = settings.customInstructions.trim();
  if (custom.length > 0) {
    sections.push(
      [
        "ADDITIONAL INSTRUCTIONS",
        "Apply the following user-provided instructions carefully while still obeying every constraint above:",
        custom,
      ].join("\n"),
    );
  }

  return sections.join("\n\n");
}
