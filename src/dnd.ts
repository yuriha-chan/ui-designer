import { UIComponent } from './types'

// ドラッグアイテムの型定義
export interface DragItem {
  type: string
  component: UIComponent
  parentId?: string
  index?: number // 親の中での位置
}

// ドラッグアイテムの型定数
export const ItemTypes = {
  COMPONENT: 'component',
}

// ドロップ結果の型
export interface DropResult {
  dropped: boolean
  targetId: string
  position?: 'before' | 'after' | 'inside'
}

// ドラッグ中のプレビュー情報
export interface DragPreviewInfo {
  component: UIComponent
  potentialParentId?: string
  potentialParentType?: string
  position?: 'inside' | 'before' | 'after'
}