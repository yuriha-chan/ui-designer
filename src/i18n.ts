export const translations = {
  en: {
    // App header
    app: {
      undo: "Undo",
      redo: "Redo",
      preview: "Preview",
      exitPreview: "Exit Preview",
      export: "Export",
      import: "Import",
      currentScreen: "Current Screen",
      storyboard: "Storyboard",
      json: "JSON",
      llmText: "LLM Text",
    },
    // Side panel tabs
    tabs: {
      entities: "Entities",
      screens: "Screens",
    },
    // Entities panel
    entities: {
      addEntity: "+ Add Entity",
    },
    // Entity item
    entity: {
      addProperty: "Add property",
      deleteEntity: "Delete entity",
      deleteProperty: "Delete property",
      deleteConfirm: 'Delete entity "{name}"?',
      deletePropertyConfirm: 'Delete property "{name}"?',
    },
    // Property types
    propertyTypes: {
      string: "string",
      number: "number",
      entity: "entity",
      function: "function",
    },
    // Screens panel
    screens: {
      newScreenPlaceholder: "New screen name",
      add: "Add",
      copyScreen: "Copy screen",
      deleteScreen: "Delete screen",
      cannotDeleteLast: "Cannot delete the last screen",
    },
    // Component node
    component: {
      copy: "Copy",
      remove: "Remove",
      selectTargetScreen: "Select target screen",
    },
    // Context menus
    contextMenu: {
      selectEntityPath: "Select Entity Path",
      addComponent: "Add Component",
      container: "Container",
      text: "Text",
      number: "Number",
      button: "Button",
      input: "Input",
    },
    // Placeholders
    placeholder: {
      ok: "OK",
      cancel: "Cancel",
      select: "Select",
      delete: "Delete",
      new: "New",
    },
    // Sample data
    sample: {
      mainScreen: "Main Screen",
      account: "Account",
      product: "Product",
      order: "Order",
      user: "User",
      name: "Name",
      email: "Email",
      balance: "Balance",
      status: "Status",
      title: "Title",
      price: "Price",
      stock: "Stock",
      category: "Category",
      id: "ID",
      date: "Date",
      total: "Total",
      username: "Username",
      role: "Role",
      lastLogin: "Last Login",
    },
  },
  ja: {
    // App header
    app: {
      undo: "元に戻す",
      redo: "やり直し",
      preview: "プレビュー",
      exitPreview: "プレビュー終了",
      export: "エクスポート",
      import: "インポート",
      currentScreen: "現在の画面",
      storyboard: "ストーリーボード",
      json: "JSON",
      llmText: "LLMテキスト",
    },
    // Side panel tabs
    tabs: {
      entities: "エンティティ",
      screens: "画面",
    },
    // Entities panel
    entities: {
      addEntity: "+ エンティティを追加",
    },
    // Entity item
    entity: {
      addProperty: "プロパティを追加",
      deleteEntity: "エンティティを削除",
      deleteProperty: "プロパティを削除",
      deleteConfirm: "エンティティ「{name}」を削除しますか？",
      deletePropertyConfirm: "プロパティ「{name}」を削除しますか？",
    },
    // Property types
    propertyTypes: {
      string: "文字列",
      number: "数値",
      entity: "エンティティ",
      function: "関数",
    },
    // Screens panel
    screens: {
      newScreenPlaceholder: "新しい画面名",
      add: "追加",
      copyScreen: "画面をコピー",
      deleteScreen: "画面を削除",
      cannotDeleteLast: "最後の画面は削除できません",
    },
    // Component node
    component: {
      copy: "コピー",
      remove: "削除",
      selectTargetScreen: "移動先画面を選択",
    },
    // Context menus
    contextMenu: {
      selectEntityPath: "エンティティパスを選択",
      addComponent: "コンポーネントを追加",
      container: "コンテナ",
      text: "テキスト",
      number: "数値",
      button: "ボタン",
      input: "入力",
    },
    // Placeholders
    placeholder: {
      ok: "OK",
      cancel: "キャンセル",
      select: "選択",
      delete: "削除",
      new: "新規",
    },
    // Sample data
    sample: {
      mainScreen: "メイン画面",
      account: "アカウント",
      product: "商品",
      order: "注文",
      user: "ユーザー",
      name: "名前",
      email: "メール",
      balance: "残高",
      status: "ステータス",
      title: "タイトル",
      price: "価格",
      stock: "在庫",
      category: "カテゴリ",
      id: "ID",
      date: "日付",
      total: "合計",
      username: "ユーザー名",
      role: "役割",
      lastLogin: "最終ログイン",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, path: string): string {
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = translations[lang];
  for (const key of keys) {
    result = result?.[key];
  }
  return result ?? path;
}

export function getDefaultLanguage(): Language {
  const stored = localStorage.getItem("lang");
  if (stored === "en" || stored === "ja") {
    return stored;
  }
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("ja")) {
    return "ja";
  }
  return "en";
}
