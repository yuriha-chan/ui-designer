// エンティティ定義
export interface Entity {
  name: string
  properties: string[]
}

// UIコンポーネントの種類
export type ComponentType = 'container' | 'text' | 'number' | 'button'

export interface UIComponent {
  id: string
  type: ComponentType
  // typeが'container'の場合: childrenを持つ
  // typeが'text'|'number'|'button'の場合: entityPathを持つ
  entityPath?: string // 例: "Account>Name"
  children: UIComponent[]
}

export interface TopologicalClass {
  signature: string
  components: UIComponent[]
  canonicalForm: string
  complexity: number
}

export interface DesignMetrics {
  totalComponents: number
  maxDepth: number
  maxWidth: number
  equivalenceClasses: number
  topologicalComplexity: number
}