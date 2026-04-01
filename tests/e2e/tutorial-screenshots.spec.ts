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
  margin?: number;
  marginBottom?: number;
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
    const firstElement = locator.first();
    const box = await firstElement.boundingBox();
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

async function setEntityName(page: Page, entityIndex: number, name: string) {
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
  // wait animation
  await page.waitForTimeout(100);
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

    // step1-01: エンティティパネルの初期状態
    await takeScreenshot(page, "step1-01", 1, "エンティティパネルの初期状態", {
      markedSelectors: [".side-panel"],
    });

    // step1-02: 「+ エンティティを追加」ボタンの位置（操作前）
    await takeScreenshot(page, "step1-02", 1, "エンティティ追加ボタンの位置", {
      cropSelector: ".entities-panel",
      markedSelectors: ['.entities-panel button:has-text("+")'],
      margin: 100,
    });

    await addEntity(page);

    // step1-03: エンティティが追加された状態
    await takeScreenshot(page, "step1-03", 1, "エンティティが追加された状態", {
      cropSelector: ".entities-panel",
    });

    // step1-04: エンティティ名入力中
    await page.locator(".entity").nth(0).locator(".entity-name").click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "step1-04", 1, "エンティティ名入力中", {
      cropSelector: ".entities-panel",
      markedSelectors: [".entities-panel input"],
    });

    await page
      .locator(".entity")
      .nth(0)
      .getByRole("textbox")
      .first()
      .fill("本");
    await page
      .locator(".entity")
      .nth(0)
      .getByRole("textbox")
      .first()
      .press("Enter");
    await page.waitForTimeout(200);

    // step1-05: 「本」が確定した状態
    await takeScreenshot(
      page,
      "step1-05",
      1,
      "エンティティ名「本」が確定した状態",
      {
        cropSelector: ".entities-panel",
      }
    );

    // step1-06: 「+」ボタン（プロパティ追加）
    await takeScreenshot(page, "step1-06", 1, "プロパティ追加ボタンの位置", {
      cropSelector: ".entity:first-child",
      markedSelectors: [".entity:first-child button:has-text('+')"],
    });

    await addProperty(page, 0);

    // step1-07: プロパティ名入力中
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(0)
      .locator(".entity-property")
      .click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "step1-07", 1, "プロパティ名入力中", {
      cropSelector: ".entity:first-child",
      markedSelectors: [".entity:first-child .property-row:first-child input"],
    });

    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(0)
      .getByRole("textbox")
      .fill("タイトル");
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(0)
      .getByRole("textbox")
      .press("Enter");
    await page.waitForTimeout(100);

    // step1-08: タイトルプロパティ確定後
    await takeScreenshot(page, "step1-08", 1, "タイトルプロパティ確定後", {
      cropSelector: ".entity:first-child",
    });

    await addProperty(page, 0);

    // step1-09: 価格プロパティ名入力中
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(1)
      .locator(".entity-property")
      .click();
    await page.waitForTimeout(100);
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(1)
      .getByRole("textbox")
      .fill("価格");
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(1)
      .getByRole("textbox")
      .press("Enter");
    await page.waitForTimeout(100);
    await takeScreenshot(page, "step1-09", 1, "価格プロパティ名入力中", {
      cropSelector: ".entity:first-child",
    });

    // step1-10: 型ドロップダウン
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(1)
      .locator(".property-type-badge")
      .click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "step1-10", 1, "型ドロップダウン", {
      cropSelector: ".entity:first-child",
      markedSelectors: [
        ".entity:first-child .property-row:nth-child(2) .property-type-badge",
      ],
      marginBottom: 160,
    });

    // step1-11: number型選択中
    await page.getByRole("option", { name: "number" }).click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "step1-11", 1, "number型選択中", {
      cropSelector: ".entity:first-child",
    });

    // step1-12: 本エンティティ完了状態
    await takeScreenshot(page, "step1-12", 1, "本エンティティ完了状態", {
      cropSelector: ".side-panel",
    });

    // step1-13: 第二エンティティ追加ボタン
    await takeScreenshot(page, "step1-13", 1, "第二エンティティ追加ボタン", {
      cropSelector: ".entities-panel",
      markedSelectors: ['.entities-panel button:has-text("+")'],
    });

    await addEntity(page);
    await setEntityName(page, 1, "顧客");
    await addProperty(page, 1);
    await setPropertyName(page, 1, 0, "名前");
    await addProperty(page, 1);
    await setPropertyName(page, 1, 1, "住所");

    // step1-14: 顧客エンティティ完了状態
    await takeScreenshot(page, "step1-14", 1, "顧客エンティティ完了状態", {
      cropSelector: ".side-panel",
    });

    // ========================================
    // Step 2: 画面を用意する
    // ========================================

    // step2-01: 「画面」タブの位置
    await takeScreenshot(page, "step2-01", 2, "画面タブの位置", {
      cropSelector: ".side-panel",
      markedSelectors: ['[data-value="screens"]'],
    });

    await clickScreensTab(page);

    // step2-02: 画面タブ選択後
    await takeScreenshot(page, "step2-02", 2, "画面タブ選択後", {
      cropSelector: ".side-panel",
    });

    // step2-03: 画面名入力欄
    await takeScreenshot(page, "step2-03", 2, "画面名入力欄", {
      cropSelector: ".screens-panel",
      markedSelectors: [".add-screen-form input"],
    });

    // step2-04: 「販売画面」入力中
    await page
      .locator(".add-screen-form")
      .getByRole("textbox")
      .fill("販売画面");
    await page.waitForTimeout(100);
    await takeScreenshot(page, "step2-04", 2, "販売画面入力中", {
      cropSelector: ".screens-panel",
      markedSelectors: [".add-screen-form input"],
    });

    // step2-05: 「追加」ボタン
    await takeScreenshot(page, "step2-05", 2, "追加ボタン", {
      cropSelector: ".screens-panel",
      markedSelectors: ['.add-screen-form button:has-text("追加")'],
    });

    await page.getByRole("button", { name: "追加" }).click();
    await page.waitForTimeout(100);

    await addScreen(page, "会計画面");
    await addScreen(page, "購入完了画面");

    // step2-06: 画面追加後の状態
    await takeScreenshot(page, "step2-06", 2, "画面追加後の状態", {
      cropSelector: ".side-panel",
    });

    await selectScreen(page, 1);

    // step2-07: 販売画面選択後のキャンバス
    await takeScreenshot(page, "step2-07", 2, "販売画面選択後のキャンバス", {
      fullPage: true,
    });

    // ========================================
    // Step 3: 画面に内容を配置する（コンポーネント）
    // ========================================

    await openContextMenu(page);

    // step3-01: コンテキストメニュー表示
    await takeScreenshot(page, "step3-01", 3, "コンテキストメニュー表示", {
      cropSelector: ".component-tree",
    });

    // step3-02: コンテナ選択メニュー
    await takeScreenshot(page, "step3-02", 3, "テキスト選択メニュー", {
      cropSelector: ".container-context-menu",
      markedSelectors: [".menu-option:nth-child(1)"],
      margin: 120,
    });

    await selectContextMenuOption(page, "コンテナ");

    // step3-03: コンテナ追加後
    await takeScreenshot(page, "step3-03", 3, "コンテナ追加後", {
      cropSelector: ".component-tree",
    });

    // step3-04: コンテナ内右クリック位置
    await takeScreenshot(page, "step3-04", 3, "コンテナ内右クリック位置", {
      cropSelector: ".component-tree",
    });

    await openContextMenu(page, true);

    // step3-05: テキスト選択メニュー
    await takeScreenshot(page, "step3-05", 3, "テキスト選択メニュー", {
      cropSelector: ".container-context-menu",
      markedSelectors: [".menu-option:nth-child(2)"],
      margin: 120,
    });

    await selectContextMenuOption(page, "テキスト");
    await expandEntityAccordion(page, "本");

    // step3-06: エンティティパス選択
    await takeScreenshot(page, "step3-06", 3, "エンティティパス選択", {
      cropSelector: ".entity-path-menu",
    });

    await selectEntityProperty(page, 0, 0);

    // step3-07: タイトル追加後
    await takeScreenshot(page, "step3-07", 3, "タイトル追加後", {
      cropSelector: ".component-tree",
    });

    // step3-08: 数値追加右クリック位置
    await takeScreenshot(page, "step3-08", 3, "数値追加右クリック位置", {
      cropSelector: ".component-tree",
    });

    await openContextMenu(page, true);
    await selectContextMenuOption(page, "数値");
    await expandEntityAccordion(page, "本");
    await selectEntityProperty(page, 0, 1);

    // step3-09: 価格追加後
    await takeScreenshot(page, "step3-09", 3, "価格追加後", {
      cropSelector: ".component-tree",
    });

    // step3-10: ボタン追加右クリック位置
    await takeScreenshot(page, "step3-10", 3, "ボタン追加右クリック位置", {
      cropSelector: ".component-tree",
    });

    await openContextMenu(page, true);
    await selectContextMenuOption(page, "ボタン");

    // step3-11: ボタンラベル選択
    await takeScreenshot(page, "step3-11", 3, "ボタンラベル選択", {
      cropSelector: ".entity-path-menu",
    });

    await selectPlaceholder(page, 2);

    // step3-12: ボタン追加後
    await takeScreenshot(page, "step3-12", 3, "ボタン追加後", {
      cropSelector: ".component-tree",
    });

    await page
      .locator(".component-box.depth-1.component-container")
      .first()
      .hover();

    // step3-13: コピーボタンの位置
    await takeScreenshot(page, "step3-13", 3, "コピーボタンの位置", {
      cropSelector: ".component-box.depth-1.component-container",
      markedSelectors: [".component-actions button:first-child"],
      margin: 50,
    });

    for (let i = 0; i < 4; i++) {
      await page
        .locator(".component-box.depth-1.component-container")
        .first()
        .hover();
      await page.waitForTimeout(50);
      await page
        .locator(
          ".component-box.depth-1.component-container > .component-actions > button"
        )
        .first()
        .click();
      await page.waitForTimeout(200);
    }

    // step3-14: コンテナ複製後
    await takeScreenshot(page, "step3-14", 3, "コンテナ複製後", {
      cropSelector: ".component-tree",
    });

    // ========================================
    // Step 4: 画面同士をつなぐ
    // ========================================

    const selectBookButton = page.locator(".component-button").first();

    // step4-01: ボタンのドロップダウン位置
    await takeScreenshot(page, "step4-01", 4, "ボタンのドロップダウン位置", {
      cropSelector: ".component-tree",
      markedSelectors: [".component-button select"],
    });

    await selectBookButton
      .locator(".target-screen-selector select")
      .selectOption("会計画面");
    await page.waitForTimeout(100);

    // step4-02: 「会計画面」選択中
    await takeScreenshot(page, "step4-02", 4, "会計画面選択中", {
      cropSelector: ".component-tree",
    });

    // step4-03: 遷移設定後
    await takeScreenshot(page, "step4-03", 4, "遷移設定後", {
      cropSelector: ".component-tree",
    });

    // ========================================
    // Step 5: 他の画面も作る
    // ========================================

    await clickScreensTab(page);

    // step5-01: 会計画面選択位置
    await takeScreenshot(page, "step5-01", 5, "会計画面選択位置", {
      cropSelector: ".screens-panel",
      markedSelectors: [".screen-item:nth-child(3)"],
    });

    await selectScreen(page, 2);

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
    await purchaseButton
      .locator(".target-screen-selector select")
      .selectOption("購入完了画面");

    // step5-02: 会計画面編集完了
    await takeScreenshot(page, "step5-02", 5, "会計画面編集完了", {
      cropSelector: ".component-tree",
    });

    await selectScreen(page, 3);

    await openContextMenu(page);
    await selectContextMenuOption(page, "テキスト");
    // step5-03: 購入完了画面プレースホルダー
    await takeScreenshot(
      page,
      "step5-03",
      5,
      "購入完了画面プレースホルダー選択",
      {
        cropSelector: ".component-tree",
      }
    );
    await selectPlaceholder(page, 0);

    await openContextMenu(page);
    await selectContextMenuOption(page, "ボタン");
    await selectPlaceholder(page, 0);

    const returnButton = page.locator(".component-button").first();
    await returnButton
      .locator(".target-screen-selector select")
      .selectOption("販売画面");

    // ========================================
    // Step 6: プレビューで動かす
    // ========================================

    await clickScreensTab(page);
    await selectScreen(page, 1);

    // step6-01: プレビューボタン
    await takeScreenshot(page, "step6-01", 6, "プレビューボタン", {
      cropSelector: ".header",
      markedSelectors: ['button:has-text("プレビュー")'],
    });

    await page.getByRole("button", { name: "プレビュー" }).click();
    await page.waitForTimeout(200);

    // step6-02: プレビューモード
    await takeScreenshot(page, "step6-02", 6, "プレビューモード", {
      fullPage: true,
    });

    await takeScreenshot(page, "step6-03", 6, "プレビューモード", {
      fullPage: true,
      markedSelectors: ['button:has-text("プレビューを終了")'],
    });

    await page.getByRole("button", { name: "プレビューを終了" }).click();
    await page.waitForTimeout(100);

    // ========================================
    // Step 7: プロパティ名を変更する
    // ========================================

    await clickEntityTab(page);

    // step7-01: 住所プロパティクリック位置
    await takeScreenshot(page, "step7-01", 7, "住所プロパティクリック位置", {
      cropSelector: ".entity:nth-child(2)",
      markedSelectors: [
        ".entity:nth-child(2) .property-row:nth-child(2) .entity-property",
      ],
    });

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

    // step7-02: プロパティ名編集中
    await takeScreenshot(page, "step7-02", 7, "プロパティ名編集中", {
      cropSelector: ".entity:nth-child(2)",
      markedSelectors: [
        ".entity:nth-child(2) .property-row:nth-child(2) input",
      ],
    });

    await page
      .locator(".entity")
      .nth(1)
      .locator(".property-row")
      .nth(1)
      .getByRole("textbox")
      .press("Enter");
    await page.waitForTimeout(100);

    // step7-03: プロパティ名変更完了
    await takeScreenshot(page, "step7-03", 7, "プロパティ名変更完了", {
      cropSelector: ".side-panel",
    });
  });
});
