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

async function clickEntityTab(page: Page) {
  await page.getByRole("tab", { name: "エンティティ" }).click();
  await page.waitForTimeout(100);
}

async function clickScreensTab(page: Page) {
  await page.getByRole("tab", { name: "画面" }).click();
  await page.waitForTimeout(100);
}

async function addEntity(page: Page) {
  await page.getByRole("button", { name: "+ エンティティを追加" }).click();
  await page.waitForTimeout(200);
}

async function addProperty(page: Page, entityIndex: number) {
  await page
    .locator(".entity")
    .nth(entityIndex)
    .getByRole("button", { name: "+" })
    .first()
    .click();
  await page.waitForTimeout(200);
}

async function setEntityName(page: Page, entityIndex: number, name: string, callback: any) {
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
  if (callback) {
    await callback();
  }
  await page
    .locator(".entity")
    .nth(entityIndex)
    .getByRole("textbox")
    .first()
    .press("Enter");
  await page.waitForTimeout(200);
}

async function setPropertyName(
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

async function setPropertyType(
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

async function addScreen(page: Page, name: string) {
  const input = page.locator(".add-screen-form").getByRole("textbox");
  await input.fill(name);
  await page.getByRole("button", { name: "追加" }).click();
  await page.waitForTimeout(100);
}

async function selectScreen(page: Page, index: number) {
  await page.locator(".screen-item").nth(index).click();
  await page.waitForTimeout(100);
}

async function openContextMenu(page: Page, onContainer = false) {
  if (onContainer) {
    const container = page.locator('.children-container .component-box.component-container').first();
    await container.waitFor({ state: 'visible' });

    const box = await container.boundingBox();
    if (!box) {
      throw new Error('Failed to get container boundingBox');
    }

    // Look into right-top corner
    const point = { x: box.x + 5, y: box.y + 5 };

    // Check if there is a child
    const childCount = await container.locator('.component-box').count({ timeout: 0 });
    if (childCount > 0) {
      // Ensure there is no overlapping child container
      const children = container.locator('.component-box');
      const overlapping = await children.evaluateAll((elements, { x, y }) => {
        return elements.some((el) => {
          const rect = el.getBoundingClientRect();
          return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
        });
      }, point);

      if (overlapping) {
        throw new Error('Overlapping childrenc container in right-top corner');
      }
    }

    await page.mouse.click(point.x, point.y, { button: 'right' });
  } else {
    await page.locator('.component-tree').click({ button: 'right' });
  }

  await page.locator('[role="menu"]').waitFor({ state: 'visible' });
}

async function selectContextMenuOption(page: Page, option: string) {
  await page.getByRole("menuitem").filter({ hasText: option }).click();
  await page.waitForTimeout(100);
}

async function expandEntityAccordion(page: Page, entityName: string) {
  await page
    .locator(".entity-path-menu")
    .getByRole("button", { name: entityName })
    .click();
  await page.waitForTimeout(100);
}

async function selectEntityProperty(
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

async function selectPlaceholder(page: Page, placeholderIndex: number) {
  await page
    .locator(".entity-path-menu")
    .getByRole("menuitem")
    .nth(placeholderIndex)
    .click();
  await page.waitForTimeout(100);
}

test.describe("Tutorial Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("lang", "ja");
    });
    await page.reload();
    await page.waitForTimeout(500);
  });

  test("Tutorial Screenshot Capture", async ({ page }) => {
    await page.locator(".entities-panel").waitFor({ timeout: 5000 });

    // ========================================
    // Step 1: エンティティを定義する
    // ========================================

    await takeScreenshot(page, "step1-01", 1, "エンティティパネルの初期状態", {
      cropSelector: ".side-panel",
    });

    await addEntity(page);

    await takeScreenshot(page, "step1-02", 1, "エンティティ追加ボタン", {
      cropSelector: ".entities-panel",
      markedSelectors: ['.entities-panel button:has-text("+")'],
    });

    await setEntityName(page, 0, "本", async () => {
      await takeScreenshot(page, "step1-03", 1, "エンティティ名前変更", {
        cropSelector: ".entities-panel",
        markedSelectors: ['.entities-panel input'],
      });
    });

    await addProperty(page, 0);
    await setPropertyName(page, 0, 0, "タイトル");

    await addProperty(page, 0);
    await setPropertyName(page, 0, 1, "価格");
    await setPropertyType(page, 0, 1, "number");

    await takeScreenshot(page, "step1-04", 1, "プロパティの型選択", {
      cropSelector: ".entity:first-child",
    });

    await addEntity(page);
    await setEntityName(page, 1, "顧客");

    await addProperty(page, 1);
    await setPropertyName(page, 1, 0, "名前");

    await addProperty(page, 1);
    await setPropertyName(page, 1, 1, "住所");

    await takeScreenshot(page, "step1-05", 1, "エンティティ定義完了", {
      cropSelector: ".side-panel",
    });

    // ========================================
    // Step 2: 画面を用意する
    // ========================================

    await clickScreensTab(page);

    await takeScreenshot(page, "step2-01", 2, "画面タブ", {
      cropSelector: ".side-panel",
    });

    await page
      .locator(".add-screen-form")
      .getByRole("textbox")
      .fill("販売画面");
    await page.waitForTimeout(100);

    await takeScreenshot(page, "step2-02", 2, "画面追加入力画面", {
      cropSelector: ".screens-panel",
    });

    await page.getByRole("button", { name: "追加" }).click();
    await page.waitForTimeout(100);

    await addScreen(page, "会計画面");
    await addScreen(page, "購入完了画面");

    await selectScreen(page, 0);

    await takeScreenshot(page, "step2-03", 2, "追加後の画面全体", {
      fullPage: true,
    });

    // ========================================
    // Step 3: 画面に内容を配置する（コンポーネント）
    // ========================================

    await openContextMenu(page);

    await takeScreenshot(
      page,
      "step3-01",
      3,
      "キャンバスの右クリックメニュー",
      {
        cropSelector: ".component-tree",
      }
    );

    await selectContextMenuOption(page, "コンテナ");

    await takeScreenshot(page, "step3-02", 3, "コンテナを追加した画面", {
      cropSelector: ".component-tree",
    });

    await openContextMenu(page, true);

    await takeScreenshot(
      page,
      "step3-03",
      3,
      "コンテナの中を右クリックした画面",
      {
        cropSelector: ".component-tree",
      }
    );

    await selectContextMenuOption(page, "テキスト");
    await expandEntityAccordion(page, "本");

    await takeScreenshot(page, "step3-04", 3, "エンティティパスを選択中", {
      cropSelector: ".entity-path-menu",
    });

    await selectEntityProperty(page, 0, 0);

    await openContextMenu(page, true);
    await selectContextMenuOption(page, "数値");
    await expandEntityAccordion(page, "本");
    await selectEntityProperty(page, 0, 1);

    await takeScreenshot(page, "step3-05", 3, "本のタイトルとか価格を設定", {
      cropSelector: ".component-tree",
    });

    await openContextMenu(page, true);
    await selectContextMenuOption(page, "ボタン");
    await selectPlaceholder(page, 2);

    await takeScreenshot(
      page,
      "step3-06",
      3,
      "本のラベルとして「選択」を選ぶ",
      {
        cropSelector: ".component-tree",
      }
    );

    for (let i = 0; i < 4; i++) {
      await page
        .locator(".component-box.depth-1.component-container")
	.first()
	.hover()
      await page
        .locator(".component-box.depth-1.component-container > .component-actions > button")
        .first()
        .click();
      await page.waitForTimeout(200);
    }

    // ========================================
    // Step 4: 画面同士をつなぐ
    // ========================================

    const selectBookButton = page.locator(".component-button").first();
    selectBookButton.locator(".target-screen-selector select").selectOption("会計画面");
    await page.waitForTimeout(100);

    await takeScreenshot(page, "step4-01", 4, "ボタンの遷移画面を選択中", {
      cropSelector: ".component-tree",
    });

    // ========================================
    // Step 5: 他の画面も作る
    // ========================================

    await clickScreensTab(page);
    await selectScreen(page, 1);

    await openContextMenu(page);
    await selectContextMenuOption(page, "テキスト");
    await expandEntityAccordion(page, "本");
    await selectEntityProperty(page, 0, 0);

    await openContextMenu(page);
    await selectContextMenuOption(page, "数値");
    await expandEntityAccordion(page, "本");
    await selectEntityProperty(page, 0, 1);

    await openContextMenu(page);
    await selectContextMenuOption(page, "テキスト");
    await expandEntityAccordion(page, "顧客");
    await selectEntityProperty(page, 1, 0);

    await openContextMenu(page);
    await selectContextMenuOption(page, "テキスト");
    await expandEntityAccordion(page, "顧客");
    await selectEntityProperty(page, 1, 1);

    await openContextMenu(page);
    await selectContextMenuOption(page, "ボタン");
    await selectPlaceholder(page, 0);
    
    const purchaseButton = page.locator(".component-button").first();
    purchaseButton.locator(".target-screen-selector select").selectOption("購入完了画面");

    await takeScreenshot(page, "step5-01", 5, "会計画面の完了時の画面", {
      cropSelector: ".component-tree",
    });

    await selectScreen(page, 2);

    await openContextMenu(page);
    await selectContextMenuOption(page, "テキスト");
    await selectPlaceholder(page, 0);

    await openContextMenu(page);
    await selectContextMenuOption(page, "ボタン");
    await selectPlaceholder(page, 0);

    const returnButton = page.locator(".component-button").first();
    returnButton.locator(".target-screen-selector select").selectOption("販売画面");

    // ========================================
    // Step 6: プレビューで動かす
    // ========================================

    await clickScreensTab(page);
    await selectScreen(page, 0);

    await takeScreenshot(page, "step6-01", 6, "プレビューボタン", {
      cropSelector: ".header",
    });

    await page.getByRole("button", { name: "プレビュー" }).click();
    await page.waitForTimeout(200);

    await takeScreenshot(
      page,
      "step6-02",
      6,
      "プレビューモードでのボタン表示",
      {
        fullPage: true,
      }
    );

    await page.getByRole("button", { name: "プレビューを終了" }).click();
    await page.waitForTimeout(100);

    // ========================================
    // Step 7: プロパティ名を変更する
    // ========================================

    await clickEntityTab(page);

    await page
      .locator(".entity")
      .nth(1)
      .locator(".property-row")
      .nth(1)
      .locator(".entity-property")
      .click();
    await page.waitForTimeout(100);

    await page
      .locator(".entity")
      .nth(1)
      .locator(".property-row")
      .nth(1)
      .getByRole("textbox")
      .fill("配送先住所");
    await page
      .locator(".entity")
      .nth(1)
      .locator(".property-row")
      .nth(1)
      .getByRole("textbox")
      .press("Enter");
    await page.waitForTimeout(100);

    await takeScreenshot(page, "step7-01", 7, "プロパティ名を編集中の画面", {
      cropSelector: ".side-panel",
    });
  });
});
