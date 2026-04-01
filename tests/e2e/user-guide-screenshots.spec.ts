import { test } from "@playwright/test";
import {
  takeScreenshot,
  clickEntityTab,
  clickScreensTab,
  addEntity,
  addProperty,
  setEntityName,
  setPropertyName,
  setPropertyType,
  selectScreen,
  openContextMenu,
  selectContextMenuOption,
  expandEntityAccordion,
  selectEntityProperty,
  selectPlaceholder,
} from "./screenshot-utils";

test.describe("User Guide Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("lang", "ja");
    });
    await page.reload();
    await page.waitForTimeout(500);
  });

  test("User Guide Screenshot Capture", async ({ page }) => {
    await page.locator(".entities-panel").waitFor({ timeout: 5000 });

    // ========================================
    // Getting Started
    // ========================================

    // ug-01: メイン画面
    await takeScreenshot(page, "ug-01", 1, "メイン画面", {
      fullPage: true,
    });

    // ========================================
    // Working with Entities
    // ========================================

    // ug-02: エンティティパネルの初期状態
    await takeScreenshot(page, "ug-02", 2, "エンティティパネルの初期状態", {
      markedSelectors: [".side-panel"],
    });

    // ug-03: エンティティ追加ボタン
    await takeScreenshot(page, "ug-03", 3, "エンティティ追加ボタン", {
      cropSelector: ".entities-panel",
      markedSelectors: ['button:has-text("+")'],
      margin: 100,
    });

    await addEntity(page);
    await setEntityName(page, 0, "商品");
    await addProperty(page, 0);
    await setPropertyName(page, 0, 0, "名前");
    await setPropertyType(page, 0, 0, "string");
    await addProperty(page, 0);
    await setPropertyName(page, 0, 1, "価格");
    await setPropertyType(page, 0, 1, "number");

    // ug-04: エンティティ完了状態
    await takeScreenshot(page, "ug-04", 4, "エンティティ定義完了", {
      cropSelector: ".side-panel",
    });

    // ug-05: プロパティタイプドロップダウン
    await page
      .locator(".entity")
      .nth(0)
      .locator(".property-row")
      .nth(0)
      .locator(".property-type-badge")
      .click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "ug-05", 5, "プロパティタイプ選択", {
      cropSelector: ".entity:first-child",
      marginBottom: 160,
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);

    // ========================================
    // Building Screens
    // ========================================

    // ug-06: 画面タブ
    await takeScreenshot(page, "ug-06", 6, "画面タブ", {
      cropSelector: ".side-panel",
      markedSelectors: ['[data-value="screens"]'],
    });

    await clickScreensTab(page);

    // ug-07: 画面パネル
    await takeScreenshot(page, "ug-07", 7, "画面パネル", {
      cropSelector: ".side-panel",
    });

    // ug-08: 画面名入力
    await takeScreenshot(page, "ug-08", 8, "画面名入力", {
      cropSelector: ".screens-panel",
      markedSelectors: [".add-screen-form input"],
    });

    // ug-09: 画面選択・複製・削除ボタン
    await page.locator(".screen-item").first().hover();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "ug-09", 9, "画面操作ボタン", {
      cropSelector: ".screens-panel",
    });

    // ========================================
    // Using Components
    // ========================================

    await selectScreen(page, 0);

    // ug-10: 右クリックでコンテキストメニュー
    await openContextMenu(page);
    await takeScreenshot(page, "ug-10", 10, "コンポーネント追加メニュー", {
      cropSelector: ".component-tree",
    });

    // ug-11: コンポーネントタイプ選択
    await takeScreenshot(page, "ug-11", 11, "コンポーネントタイプ選択", {
      cropSelector: ".container-context-menu",
      markedSelectors: [".menu-option:nth-child(1)"],
      margin: 120,
    });

    await selectContextMenuOption(page, "コンテナ");

    // ug-12: コンテナ追加後
    await takeScreenshot(page, "ug-12", 12, "コンテナ追加後", {
      cropSelector: ".component-tree",
    });

    // ug-13: コンテナ内でテキスト追加
    await openContextMenu(page, true);
    await takeScreenshot(page, "ug-13", 13, "コンテナ内コンポーネント追加", {
      cropSelector: ".container-context-menu",
      markedSelectors: [".menu-option:nth-child(2)"],
      margin: 120,
    });

    await selectContextMenuOption(page, "テキスト");
    await expandEntityAccordion(page, "商品");
    await selectEntityProperty(page, 0, 0);

    // ug-14: テキストコンポーネント追加後
    await takeScreenshot(page, "ug-14", 14, "テキスト追加後", {
      cropSelector: ".component-tree",
    });

    // ug-15: 数値を追加
    await openContextMenu(page, true);
    await selectContextMenuOption(page, "数値");
    await expandEntityAccordion(page, "商品");
    await selectEntityProperty(page, 0, 1);

    // ug-16: 数値コンポーネント追加後
    await takeScreenshot(page, "ug-16", 16, "数値追加後", {
      cropSelector: ".component-tree",
    });

    // ug-17: ボタンを追加
    await openContextMenu(page, true);
    await selectContextMenuOption(page, "ボタン");
    await selectPlaceholder(page, 0);

    // ug-18: ボタンコンポーネントとナビゲーション設定
    await takeScreenshot(page, "ug-18", 18, "ボタン追加後", {
      cropSelector: ".component-tree",
      markedSelectors: [".component-button select"],
    });

    // ug-19: コピーボタン
    await page
      .locator(".component-box.depth-1.component-container")
      .first()
      .hover();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "ug-19", 19, "コピーボタン", {
      cropSelector: ".component-box.depth-1.component-container",
      markedSelectors: [".component-actions button:first-child"],
      margin: 50,
    });

    // ug-20: コンポーネント移動（ドラッグ）
    await takeScreenshot(page, "ug-20", 20, "コンポーネントドラッグ", {
      cropSelector: ".component-tree",
    });

    // ========================================
    // Preview Mode
    // ========================================

    // ug-21: プレビューボタン
    await takeScreenshot(page, "ug-21", 21, "プレビューボタン", {
      cropSelector: ".header",
      markedSelectors: ['button:has-text("プレビュー")'],
    });

    await page.getByRole("button", { name: "プレビュー" }).click();
    await page.waitForTimeout(200);

    // ug-22: プレビューモード
    await takeScreenshot(page, "ug-22", 22, "プレビューモード", {
      fullPage: true,
    });

    // ug-23: プレビュー終了ボタン
    await takeScreenshot(page, "ug-23", 23, "プレビュー終了ボタン", {
      fullPage: true,
      markedSelectors: ['button:has-text("プレビューを終了")'],
    });

    await page.getByRole("button", { name: "プレビューを終了" }).click();
    await page.waitForTimeout(100);

    // ========================================
    // Undo and Redo
    // ========================================

    // ug-24: アンドゥ・リドゥボタン
    await page.waitForTimeout(200);
    await takeScreenshot(page, "ug-24", 24, "アンドゥ・リドゥボタン", {
      cropSelector: ".header",
    });

    // ========================================
    // Import and Export
    // ========================================

    // ug-25: エクスポートモード選択
    await page.waitForTimeout(200);
    await takeScreenshot(page, "ug-25", 25, "エクスポートモード選択", {
      fullPage: true,
    });

    // ug-26: エクスポートフォーマット選択
    await page.waitForTimeout(200);
    await takeScreenshot(page, "ug-26", 26, "エクスポートフォーマット選択", {
      fullPage: true,
    });

    // ug-27: インポート・エクスポートボタン
    await page.waitForTimeout(200);
    await takeScreenshot(page, "ug-27", 27, "インポート・エクスポートボタン", {
      fullPage: true,
    });

    // ========================================
    // Language Settings
    // ========================================

    // ug-28: 言語セレクター
    await page.locator("select").first().click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "ug-28", 28, "言語セレクター", {
      cropSelector: ".header",
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);

    // ug-29: 言語選択ドロップダウン
    await page.locator("select").first().click();
    await page.waitForTimeout(100);
    await takeScreenshot(page, "ug-29", 29, "言語選択ドロップダウン", {
      cropSelector: ".header",
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
  });
});
