# PortraitLab AI

A polished AI professional photo generator. Upload a photo, pick a style
(professional portrait, passport-style, LinkedIn, CV, or casual), customize
clothing, background, lighting, and framing, then generate an edited portrait
with Cloudflare's free Workers AI FLUX.2 [klein] endpoint. Preview the result
and download it as a PNG.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Cloudflare Workers AI (FLUX.2 [klein]) - 10k free neurons/day
- Sharp — upload validation, orientation, cropping, format conversion
- Zod — server-side settings validation
- Lucide React — icons
- Vitest — unit tests

## Quick start

```bash
npm install
cp .env.example .env.local   # then paste an API key (see below)
npm run dev
```

Open http://localhost:3000, upload a photo, choose a style, and click
**Generate photo**.

You need a Cloudflare API token. The app runs immediately after
`npm install && npm run dev`, and shows an in-app banner telling you exactly
which variables to add until Cloudflare is configured.

- **Free: Cloudflare Workers AI** — create a free Cloudflare
  account (no credit card, GitHub login works) at https://dash.cloudflare.com,
  create an API token with the **Workers AI** template
  (https://dash.cloudflare.com/profile/api-tokens), then set
  `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in `.env.local`. Every
  account gets **10,000 free neurons/day** (resets daily at 00:00 UTC, no
  credit card), which is roughly a dozen FLUX.2 [klein] edits per day.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | server only (`.env.local`) | Free Cloudflare account ID (Workers AI). |
| `CLOUDFLARE_API_TOKEN` | server only (`.env.local`) | Free Cloudflare API token with Workers AI permission. |
| `CLOUDFLARE_IMAGE_MODEL` | server only (`.env.local`) | Optional. Defaults to `@cf/black-forest-labs/flux-2-klein-4b`, which edits the photo from a reference image (`input_image_0`). |

Rules implemented in code:

- All variables are read only in server modules (`src/lib/cloudflare.ts`,
  `src/lib/image-provider.ts`).
- No `NEXT_PUBLIC_*` exposure anywhere.
- If the active provider's key is missing, the API returns HTTP 503 with a
  clear message.
- If the configured model returns no image data, the API returns HTTP 502
  telling you what to check.

## User workflow

1. **Upload** — JPEG, PNG, or WebP, max 10 MB. Drag-and-drop or file picker.
   The client checks size/type, and the server independently re-validates the
   real image contents with Sharp (corrupt files are rejected).
2. **Style** — Professional Portrait, Passport-Style Photo, LinkedIn Profile,
   CV / Resume Photo, Casual Portrait. Selecting a style loads sensible
   defaults (background, clothing, framing, ratio, lighting, expression).
3. **Basic customization** — background, clothing, framing, output ratio, and
   toggles for facial identity and skin texture (both on by default).
4. **Advanced customization** (collapsible) — suit/shirt/tie colors (only
   shown when a suit or formal shirt is selected), lighting, expression,
   hairstyle preservation, skin/identity toggles, and custom instructions
   (max 300 characters, enforced server-side).
5. **Generate** — the photo and settings are POSTed to
   `/api/generate`, validated with Zod, converted into a deterministic editing
   prompt, sent to the active provider with the source image attached, then the
   returned image is cropped/normalized with Sharp and displayed.
6. **Download / Regenerate** — download a PNG or rerun with the same or edited
   settings.

## How generation works

`POST /api/generate` (multipart form data):

- `photo` — the source image file
- `settings` — JSON string matching `photoSettingsSchema`

Server pipeline:

1. In-memory rate limit (6 requests / 10 minutes per IP — local-dev only).
2. File size/type checks + Sharp content sniffing and orientation correction
   (`inspectAndNormalizeUpload`).
3. Zod validation of all settings (`normalizeSettings`).
4. Prompt construction (`buildPhotoPrompt`) that always instructs the model to
   **edit the supplied photo** and preserve identity by default.
5. `generateImageEdit` (in `src/lib/image-provider.ts`) calls Cloudflare
   Workers AI FLUX.2 [klein] — the source photo is downscaled to ≤512 px,
   re-encoded as JPEG, and sent as the `input_image_0` reference image in a
   multipart request — and returns the edited image.
6. `processGeneratedImage` crops (no stretching) to the requested aspect
   ratio — including passport 7:9 at 413×531 px — and encodes a PNG.
7. JSON response with base64 image + metadata (dimensions, size, model).

## Passport-style output

The passport style produces a 413×531 px image (7:9, i.e. 35×45
proportions). **This does not guarantee compliance with any country's official
passport photo rules** (head size, background purity, expression, recency,
and so on vary by authority). Verify requirements yourself before submitting
an official document photo.

## Privacy

- Uploaded photos are processed in memory and sent to Cloudflare Workers AI
  for generation. They are not written to disk, not stored in a database, and
  not retained by this app.
- There is no account system, database, payments, or permanent storage.
- The UI shows a short privacy notice; see also the footer.

## Rate limiting

`src/lib/rate-limit.ts` is a simple in-memory sliding window (6 generations
per 10 minutes per IP). **It is for local development only** — state is lost
on restart and is not shared across processes/instances. Put a real shared
rate limiter in front before any public deployment.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Unit tests (prompt builder, validation, image processing) |

## Project structure

```
src/
  app/
    api/generate/route.ts   # POST endpoint
    layout.tsx
    page.tsx
  components/
    AppHeader.tsx
    PhotoUploader.tsx
    StyleSelector.tsx
    CustomizationPanel.tsx  # basic + advanced controls
    GenerationPreview.tsx
    LoadingState.tsx
    PhotoEditor.tsx         # orchestrates the whole workflow
    fields.tsx              # shared select/toggle primitives
  lib/
    cloudflare.ts           # Cloudflare Workers AI FLUX.2 [klein] image edit
    image-provider.ts       # provider selection + shared generateImageEdit()
    provider-error.ts       # shared ProviderError + timeout helpers
    prompt-builder.ts       # buildPhotoPrompt()
    image-processing.ts     # Sharp validation/cropping
    validation.ts           # Zod schemas + upload checks
    presets.ts              # per-style defaults
    rate-limit.ts           # local-dev rate limiter
  types/photo.ts            # shared types & option lists
```

## Notes & limitations

- Live generation requires a valid Cloudflare key.
- **Cloudflare (free):** Workers AI gives every account 10,000 free neurons
  per day (recurring, resets 00:00 UTC, no credit card). The default
  `@cf/black-forest-labs/flux-2-klein-4b` model edits the photo from a
  reference image and costs roughly 670 neurons per 1024×1024 edit — so the
  free daily allowance is about a dozen images. If you swap
  `CLOUDFLARE_IMAGE_MODEL`, pick another FLUX.2 image-editing model; the
  image-to-image task is not offered for the older SDXL models on Workers AI.
- **Hugging Face is not free anymore** for image models: as of October 2026
  free accounts get $0–0.10/month Inference Providers credit, then
  pay-as-you-go — not usable for ongoing img2img.
- A generation can take up to ~60–120 seconds depending on the provider and
  load.
- Output is intentionally not stored server-side; keep the result in the
  browser tab and download it if you want to keep it.
