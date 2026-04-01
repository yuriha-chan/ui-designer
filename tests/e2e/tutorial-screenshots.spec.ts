import { test, Page, Locator } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, "../../docs/ja/screenshots");
const METADATA_FILE = path.join(SCREENSHOTS_DIR, "metadata.json");
const RAW_DIR = path.join(SCREENSHOTS_DIR, "raw");

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
  cropBox?: BoundingBox;
  markedBoxes?: BoundingBox[];
  sequence?: { position: number; total: number };
}

const metadata: ScreenshotMeta[] = [];

async function saveMetadata() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

async function getBoundingBox(locator: Locator): Promise<BoundingBox | null> {
  try {
    const box = await locator.boundingBox();
    if (box) {
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } catch {
    // Element not found
  }
  return null;
}

async function takeScreenshot(
  page: Page,
  id: string,
  step: number,
  description: string,
  options: {
    cropSelector?: string;
    markedSelectors?: string[];
    sequence?: { position: number; total: number };
    fullPage?: boolean;
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
  });

  await saveMetadata();
}

test.describe("Tutorial Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Clear localStorage and set Japanese locale
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("lang", "ja");
    });
    await page.reload();
    await page.waitForTimeout(1000);
  });

  test("Step 1: Define Entities", async ({ page }) => {
    // Wait for the app to load
    await page.waitForSelector(".entities-panel", { timeout: 10000 });

    await takeScreenshot(page, "step1-01", 1, "エンティティパネルの初期状態", {
      cropSelector: ".side-panel",
    });

    // Click add entity button
    await page.locator('button:has-text("+ エンティティを追加")').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, "step1-02", 1, "エンティティ追加ボタン", {
      cropSelector: ".entities-panel",
      markedSelectors: ['.entities-panel button:has-text("+")'],
    });

    // Fill in entity name "本" - click on the entity name to edit
    await page.locator(".entity:last-child .entity-name").click();
    await page.waitForTimeout(300);
    const entityInput = page.locator(".entity:last-child input").first();
    await entityInput.fill("本");
    await entityInput.press("Enter");
    await page.waitForTimeout(500);

    await takeScreenshot(page, "step1-03", 1, "新しいエンティティ「本」", {
      cropSelector: ".entities-panel",
    });

    // Add property "タイトル" - click the green + button for the entity
    await page
      .locator(".entity")
      .first()
      .locator("button")
      .filter({ hasText: "+" })
      .click();
    await page.waitForTimeout(500);

    // Click on the new property name to edit it
    await page
      .locator(".entity")
      .first()
      .locator(".property-row:last-child .entity-property")
      .click();
    await page.waitForTimeout(300);

    let propInput = page
      .locator(".entity")
      .first()
      .locator(".property-row:last-child input");
    await propInput.fill("タイトル");
    await propInput.press("Enter");
    await page.waitForTimeout(300);

    // Add property "価格"
    await page
      .locator(".entity")
      .first()
      .locator("button")
      .filter({ hasText: "+" })
      .click();
    await page.waitForTimeout(500);
    await page
      .locator(".entity")
      .first()
      .locator(".property-row:last-child .entity-property")
      .click();
    await page.waitForTimeout(300);
    propInput = page
      .locator(".entity")
      .first()
      .locator(".property-row:last-child input");
    await propInput.fill("価格");
    await propInput.press("Enter");
    await page.waitForTimeout(300);

    await takeScreenshot(page, "step1-04", 1, "プロパティの追加", {
      cropSelector: ".entity:first-child",
    });

    // Add second entity "顧客"
    await page.locator('button:has-text("+ エンティティを追加")').click();
    await page.waitForTimeout(300);
    await page.locator(".entity:last-child .entity-name").click();
    await page.waitForTimeout(300);
    const entityInput2 = page.locator(".entity:last-child input").first();
    await entityInput2.fill("顧客");
    await entityInput2.press("Enter");
    await page.waitForTimeout(500);

    // Add properties to 顧客
    await page
      .locator(".entity")
      .last()
      .locator("button")
      .filter({ hasText: "+" })
      .click();
    await page.waitForTimeout(500);
    await page
      .locator(".entity")
      .last()
      .locator(".property-row:last-child .entity-property")
      .click();
    await page.waitForTimeout(300);
    propInput = page
      .locator(".entity")
      .last()
      .locator(".property-row:last-child input");
    await propInput.fill("名前");
    await propInput.press("Enter");
    await page.waitForTimeout(300);

    await page
      .locator(".entity")
      .last()
      .locator("button")
      .filter({ hasText: "+" })
      .click();
    await page.waitForTimeout(500);
    await page
      .locator(".entity")
      .last()
      .locator(".property-row:last-child .entity-property")
      .click();
    await page.waitForTimeout(300);
    propInput = page
      .locator(".entity")
      .last()
      .locator(".property-row:last-child input");
    await propInput.fill("住所");
    await propInput.press("Enter");
    await page.waitForTimeout(300);

    await takeScreenshot(page, "step1-05", 1, "エンティティ定義完了", {
      cropSelector: ".side-panel",
    });
  });

  test("Step 2: Create Screens", async ({ page }) => {
    await page.waitForSelector(".entities-panel", { timeout: 10000 });

    // Switch to Screens tab
    await page.click('[data-value="screens"]');
    await page.waitForTimeout(500);

    await takeScreenshot(page, "step2-01", 2, "画面タブ", {
      cropSelector: ".side-panel",
    });

    // Add screens
    const input = page.locator(".add-screen-form input");
    await input.fill("販売画面");
    await page.click('.add-screen-form button:has-text("追加")');
    await page.waitForTimeout(300);

    await takeScreenshot(page, "step2-02", 2, "画面追加フォーム", {
      cropSelector: ".screens-panel",
    });

    await input.fill("会計画面");
    await page.click('.add-screen-form button:has-text("追加")');
    await page.waitForTimeout(300);

    await input.fill("購入完了画面");
    await page.click('.add-screen-form button:has-text("追加")');
    await page.waitForTimeout(300);

    await takeScreenshot(page, "step2-03", 2, "画面一覧", {
      cropSelector: ".screens-panel",
    });
  });

  test("Step 3: Add Components", async ({ page }) => {
    await page.waitForSelector(".component-tree", { timeout: 10000 });

    // Right-click on canvas
    await page.locator(".component-tree").click({ button: "right" });
    await page.waitForTimeout(500);

    await takeScreenshot(
      page,
      "step3-01",
      3,
      "キャンバスの右クリックメニュー",
      {
        cropSelector: ".component-tree",
      }
    );

    // Close context menu
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    await takeScreenshot(page, "step3-02", 3, "空のキャンバス", {
      cropSelector: ".component-tree",
    });
  });

  test("Step 6: Preview Mode", async ({ page }) => {
    await page.waitForSelector(".header", { timeout: 10000 });

    await takeScreenshot(page, "step6-01", 6, "プレビューボタン", {
      cropSelector: ".header",
    });

    // Click preview button
    await page.click('button:has-text("プレビュー")');
    await page.waitForTimeout(500);

    await takeScreenshot(page, "step6-02", 6, "プレビューモード", {
      fullPage: true,
    });
  });
});
