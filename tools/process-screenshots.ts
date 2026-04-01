import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
// @ts-ignore
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, "../docs/ja/screenshots");
const METADATA_FILE = path.join(SCREENSHOTS_DIR, "metadata.json");
const RAW_DIR = path.join(SCREENSHOTS_DIR, "raw");
const FINAL_DIR = path.join(SCREENSHOTS_DIR, "final");

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenshotMeta {
  id: string;
  step: number;
  description: string;
  rawPath: string;
  cropSelector: string | null;
  markedSelectors: string[];
  sequence?: { position: number; total: number };
  cropBox?: BoundingBox;
  markedBoxes?: BoundingBox[];
  margin?: number;
  marginBottom?: number;
}

const MARGIN = 20;
const MARKER_MARGIN = 5;
const MARKER_COLOR = { r: 255, g: 100, b: 0, alpha: 1 };
const MARKER_STROKE_WIDTH = 3;
const OVERLAY_OPACITY = 0.5;

async function processScreenshot(meta: ScreenshotMeta): Promise<void> {
  const rawPath = path.join(SCREENSHOTS_DIR, meta.rawPath);
  const finalPath = path.join(FINAL_DIR, `${meta.id}.png`);

  if (!fs.existsSync(rawPath)) {
    console.error(`Raw screenshot not found: ${rawPath}`);
    return;
  }

  const image = sharp(rawPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    console.error(`Could not get metadata for: ${rawPath}`);
    return;
  }

  let cropBox: BoundingBox = meta.cropBox || {
    x: 0,
    y: 0,
    width: metadata.width,
    height: metadata.height,
  };

  if (meta.cropBox) {
    const marginTop = meta.margin ?? MARGIN;
    const marginBottomVal = meta.marginBottom ?? meta.margin ?? MARGIN;

    cropBox = {
      x: Math.max(0, meta.cropBox.x - marginTop),
      y: Math.max(0, meta.cropBox.y - marginTop),
      width: meta.cropBox.width + marginTop + marginBottomVal,
      height: meta.cropBox.height + marginTop + marginBottomVal,
    };

    // Adjust crop box to image bounds
    if (cropBox.x + cropBox.width > metadata.width) {
      cropBox.width = metadata.width - cropBox.x;
    }
    if (cropBox.y + cropBox.height > metadata.height) {
      cropBox.height = metadata.height - cropBox.y;
    }
  }

  // Create SVG for markers
  let markerSvg = "";
  let overlaySvg = "";
  if (meta.markedBoxes && meta.markedBoxes.length > 0) {
    // Create semi-transparent white overlay on non-marked areas
    overlaySvg = `<svg width="${cropBox.width}" height="${cropBox.height}">`;
    overlaySvg += `<defs><mask id="m"><rect width="100%" height="100%" fill="white"/>`;

    for (const box of meta.markedBoxes) {
      const adjustedX = box.x - cropBox.x;
      const adjustedY = box.y - cropBox.y;

      // Cut out the marked box area (with margin) from the mask (black = hidden)
      overlaySvg += `<rect x="${adjustedX - MARKER_MARGIN}" y="${adjustedY - MARKER_MARGIN}" width="${box.width + MARKER_MARGIN * 2}" height="${box.height + MARKER_MARGIN * 2}" fill="black"/>`;

      // Add red stroke marker around the box (with margin)
      markerSvg += `
        <rect
          x="${adjustedX - MARKER_MARGIN}"
          y="${adjustedY - MARKER_MARGIN}"
          width="${box.width + MARKER_MARGIN * 2}"
          height="${box.height + MARKER_MARGIN * 2}"
          fill="none"
          stroke="red"
          stroke-width="${MARKER_STROKE_WIDTH}"
        />`;
    }

    overlaySvg += `</mask></defs>`;
    overlaySvg += `<rect width="100%" height="100%" fill="white" fill-opacity="${OVERLAY_OPACITY}" mask="url(#m)"/>`;
    overlaySvg += `</svg>`;
  }

  // Process image
  const pipeline = sharp(rawPath).extract({
    left: Math.round(cropBox.x),
    top: Math.round(cropBox.y),
    width: Math.round(cropBox.width),
    height: Math.round(cropBox.height),
  });

  if (markerSvg || overlaySvg) {
    const composites: any[] = [];

    if (overlaySvg) {
      composites.push({ input: Buffer.from(overlaySvg), blend: "over" });
    }

    if (markerSvg) {
      const markerOverlay = Buffer.from(
        `<svg width="${cropBox.width}" height="${cropBox.height}">${markerSvg}</svg>`
      );
      composites.push({ input: markerOverlay, blend: "over" });
    }

    await pipeline.composite(composites).png().toFile(finalPath);
  } else {
    await pipeline.png().toFile(finalPath);
  }

  console.log(`Processed: ${meta.id} -> ${finalPath}`);
}

async function main(): Promise<void> {
  // Ensure final directory exists
  if (!fs.existsSync(FINAL_DIR)) {
    fs.mkdirSync(FINAL_DIR, { recursive: true });
  }

  // Read metadata
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(
      "Metadata file not found. Run the Playwright test first to generate screenshots."
    );
    process.exit(1);
  }

  const metadata: ScreenshotMeta[] = JSON.parse(
    fs.readFileSync(METADATA_FILE, "utf-8")
  );

  console.log(`Processing ${metadata.length} screenshots...`);

  for (const meta of metadata) {
    await processScreenshot(meta);
  }

  console.log("Done!");
}

main().catch(console.error);
