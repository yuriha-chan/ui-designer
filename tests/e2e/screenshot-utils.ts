import { Page, Locator } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const SCREENSHOTS_DIR = path.join(
  __dirname,
  "../../docs/ja/screenshots"
);
export const METADATA_FILE = path.join(SCREENSHOTS_DIR, "metadata.json");
export const RAW_DIR = path.join(SCREENSHOTS_DIR, "raw");

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenshotMeta {
  id: string;
  step: number;
  description: string;
  rawPath: string;
  cropSelector: string | null;
  markedSelectors: string[];
  cropBox?: BoundingBox;
  markedBoxes?: BoundingBox[];
  sequence?: { position: number; total: number };
  margin?: number;
  marginBottom?: number;
}

export const metadata: ScreenshotMeta[] = [];

export async function saveMetadata() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

export async function getBoundingBox(
  locator: Locator
): Promise<BoundingBox | null> {
  try {
    const firstElement = locator.first();
    const box = await firstElement.boundingBox();
    if (box) {
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } catch {}
  return null;
}

export async function takeScreenshot(
  page: Page,
  id: string,
  step: number,
  description: string,
  options: {
    cropSelector?: string;
    markedSelectors?: string[];
    sequence?: { position: number; total: number };
    fullPage?: boolean;
    margin?: number;
    marginBottom?: number;
  } = {}
) {
  const rawPath = path.join(RAW_DIR, `${id}.png`);
  await page.screenshot({ path: rawPath, fullPage: options.fullPage ?? false });

  let cropBox: BoundingBox | undefined;
  let markedBoxes: BoundingBox[] = [];

  if (options.cropSelector) {
    const cropElement = page.locator(options.cropSelector);
    cropBox = (await getBoundingBox(cropElement)) ?? undefined;
  }

  if (options.markedSelectors && options.markedSelectors.length > 0) {
    for (const selector of options.markedSelectors) {
      const element = page.locator(selector);
      const box = await getBoundingBox(element);
      if (box) {
        markedBoxes.push(box);
      }
    }
  }

  metadata.push({
    id,
    step,
    description,
    rawPath: `raw/${id}.png`,
    cropSelector: options.cropSelector ?? null,
    markedSelectors: options.markedSelectors ?? [],
    cropBox,
    markedBoxes: markedBoxes.length > 0 ? markedBoxes : undefined,
    sequence: options.sequence,
    margin: options.margin,
    marginBottom: options.marginBottom,
  });

  await saveMetadata();
}

export async function clickEntityTab(page: Page) {
  await page.getByRole("tab", { name: "エンティティ" }).click();
  await page.waitForTimeout(100);
}

export async function clickScreensTab(page: Page) {
  await page.getByRole("tab", { name: "画面" }).click();
  await page.waitForTimeout(100);
}

export async function addEntity(page: Page) {
  await page.getByRole("button", { name: "+ エンティティを追加" }).click();
  await page.waitForTimeout(200);
}

export async function addProperty(page: Page, entityIndex: number) {
  await page
    .locator(".entity")
    .nth(entityIndex)
    .getByRole("button", { name: "+" })
    .first()
    .click();
  await page.waitForTimeout(200);
}

export async function setEntityName(
  page: Page,
  entityIndex: number,
  name: string
) {
  await page
    .locator(".entity")
    .nth(entityIndex)
    .locator(".entity-name")
    .click();
  await page.waitForTimeout(100);
  await page
    .locator(".entity")
    .nth(entityIndex)
    .getByRole("textbox")
    .first()
    .fill(name);
  await page
    .locator(".entity")
    .nth(entityIndex)
    .getByRole("textbox")
    .first()
    .press("Enter");
  await page.waitForTimeout(200);
}

export async function setPropertyName(
  page: Page,
  entityIndex: number,
  propertyIndex: number,
  name: string
) {
  const entity = page.locator(".entity").nth(entityIndex);
  await entity
    .locator(".property-row")
    .nth(propertyIndex)
    .locator(".entity-property")
    .click();
  await page.waitForTimeout(100);
  await entity
    .locator(".property-row")
    .nth(propertyIndex)
    .getByRole("textbox")
    .fill(name);
  await entity
    .locator(".property-row")
    .nth(propertyIndex)
    .getByRole("textbox")
    .press("Enter");
  await page.waitForTimeout(100);
}

export async function setPropertyType(
  page: Page,
  entityIndex: number,
  propertyIndex: number,
  type: string
) {
  const entity = page.locator(".entity").nth(entityIndex);
  await entity
    .locator(".property-row")
    .nth(propertyIndex)
    .locator(".property-type-badge")
    .click();
  await page.waitForTimeout(100);
  await page.getByRole("option", { name: type }).click();
  await page.waitForTimeout(100);
}

export async function addScreen(page: Page, name: string) {
  const input = page.locator(".add-screen-form").getByRole("textbox");
  await input.fill(name);
  await page.getByRole("button", { name: "追加" }).click();
  await page.waitForTimeout(100);
}

export async function selectScreen(page: Page, index: number) {
  await page.locator(".screen-item").nth(index).click();
  await page.waitForTimeout(100);
}

export async function setScreenName(page: Page, name: string) {
  await page.locator(".header h1").click();
  await page.waitForTimeout(100);
  await page.locator(".header input").fill(name);
  await page.locator(".header input").press("Enter");
  await page.waitForTimeout(100);
}

export async function openContextMenu(page: Page, onContainer = false) {
  if (onContainer) {
    const container = page
      .locator(".children-container .component-box.component-container")
      .first();
    await container.waitFor({ state: "visible" });

    const box = await container.boundingBox();
    if (!box) {
      throw new Error("Failed to get container boundingBox");
    }

    let point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    const childCount = await container.locator(".component-box").count();
    if (childCount > 0) {
      point = { x: box.x + box.width / 2, y: box.y + box.height - 10 };
      const children = container.locator(".component-box");
      const overlapping = await children.evaluateAll((elements, { x, y }) => {
        return elements.some((el) => {
          const rect = el.getBoundingClientRect();
          return (
            x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height
          );
        });
      }, point);

      if (overlapping) {
        throw new Error("Overlapping children container in bottom");
      }
    }

    await page.mouse.click(point.x, point.y, { button: "right" });
  } else {
    await page.locator(".component-tree").click({ button: "right" });
  }

  await page.locator('[role="menu"]').waitFor({ state: "visible" });
  await page.waitForTimeout(100);
}

export async function selectContextMenuOption(page: Page, option: string) {
  await page.getByRole("menuitem").filter({ hasText: option }).click();
  await page.waitForTimeout(100);
}

export async function expandEntityAccordion(page: Page, entityName: string) {
  await page
    .locator(".entity-path-menu")
    .getByRole("button", { name: entityName })
    .click();
  await page.waitForTimeout(100);
}

export async function selectEntityProperty(
  page: Page,
  entityIndex: number,
  propertyIndex: number
) {
  await page
    .locator(".entity-path-menu")
    .locator(".accordion-item")
    .nth(entityIndex)
    .getByRole("menuitem")
    .nth(propertyIndex)
    .click();
  await page.waitForTimeout(100);
}

export async function selectPlaceholder(page: Page, placeholderIndex: number) {
  await page
    .locator(".entity-path-menu")
    .getByRole("menuitem")
    .nth(placeholderIndex)
    .click();
  await page.waitForTimeout(100);
}
