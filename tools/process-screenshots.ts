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
}

const MARGIN = 20;
const MARKER_COLOR = { r: 255, g: 0, b: 0, alpha: 1 };
const MARKER_STROKE_WIDTH = 3;

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
    cropBox = {
      x: Math.max(0, meta.cropBox.x - MARGIN),
      y: Math.max(0, meta.cropBox.y - MARGIN),
      width: meta.cropBox.width + MARGIN * 2,
      height: meta.cropBox.height + MARGIN * 2,
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
  if (meta.markedBoxes && meta.markedBoxes.length > 0) {
    for (const box of meta.markedBoxes) {
      // Adjust coordinates relative to crop
      const adjustedX = box.x - cropBox.x + MARGIN;
      const adjustedY = box.y - cropBox.y + MARGIN;

      markerSvg += `
        <rect
          x="${adjustedX}"
          y="${adjustedY}"
          width="${box.width}"
          height="${box.height}"
          fill="none"
          stroke="red"
          stroke-width="${MARKER_STROKE_WIDTH}"
        />`;
    }
  }

  // Process image
  const pipeline = sharp(rawPath).extract({
    left: Math.round(cropBox.x),
    top: Math.round(cropBox.y),
    width: Math.round(cropBox.width),
    height: Math.round(cropBox.height),
  });

  if (markerSvg) {
    const svgOverlay = Buffer.from(
      `<svg width="${cropBox.width}" height="${cropBox.height}">${markerSvg}</svg>`
    );
    await pipeline
      .composite([{ input: svgOverlay, blend: "over" }])
      .png()
      .toFile(finalPath);
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
