// エンティティプロパティ定義
export type PropertyType = "string" | "number" | "entity" | "function";

export interface EntityProperty {
  name: string;
  type: PropertyType;
  entity_type?: string;
}

// エンティティ定義
export interface Entity {
  name: string;
  properties: EntityProperty[];
}

// UIコンポーネントの種類
export type ComponentType =
  | "container"
  | "text"
  | "number"
  | "button"
  | "input";

export interface UIComponent {
  id: string;
  type: ComponentType;
  // typeが'container'の場合: childrenを持つ
  // typeが'text'|'number'|'button'|'input'の場合: entityPathを持つ
  entityPath?: string; // 例: "Account>Name"
  // typeが'button'の場合: プレビューモードでの遷移先画面ID
  targetScreen?: string;
  children: UIComponent[];
}

export interface TopologicalClass {
  signature: string;
  components: UIComponent[];
  canonicalForm: string;
  complexity: number;
}

export interface DesignMetrics {
  totalComponents: number;
  maxDepth: number;
  maxWidth: number;
  equivalenceClasses: number;
  topologicalComplexity: number;
}

// ストーリーボード画面定義
export interface Screen {
  id: string; // 画面ID (uuid生成)
  name: string; // 画面表示名
  components: UIComponent[]; // 画面のコンポーネントツリー
}
