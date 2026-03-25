import React, { useState, useCallback, useEffect, useReducer, useContext, createContext, useMemo, useRef } from 'react'
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { v4 as uuidv4 } from 'uuid'
import { useThrottle } from '@uidotdev/usehooks'
import { UIComponent, Entity } from './types'
import { DragItem, ItemTypes, DropResult } from './dnd'
import { dragStore, useDragSelector } from './dragStore';
import { DragContext, DragManager } from './DragManager';
import './App.css'

// サンプルエンティティ定義
const sampleEntities: Entity[] = [
  { name: 'Account', properties: ['Name', 'Email', 'Balance', 'Status'] },
  { name: 'Product', properties: ['Title', 'Price', 'Stock', 'Category'] },
  { name: 'Order', properties: ['ID', 'Date', 'Total', 'Status'] },
  { name: 'User', properties: ['Username', 'Role', 'LastLogin'] },
]

// 初期データ
const initialComponents: UIComponent[] = [
  {
    id: 'root',
    type: 'container',
    children: []
  },
]

// コンポーネントタイプと深さに基づく色を生成
const getColorForComponent = (type: string, depth: number): string => {
  switch (type) {
    case 'container': {
      // 深さに基づくグレースケール: 浅いほど明るい
      const lightness = Math.max(20, 80 - depth * 15)
      return `hsl(0, 0%, ${lightness}%)`
    }
    case 'text':
      return '#3b82f6' // 青
    case 'number':
      return '#10b981' // 緑
    case 'button':
      return '#ef4444' // 赤
    default:
      return '#6b7280' // グレー
  }
}

// S式表現を生成（辞書式順序ソート用）
const generateSExpression = (component: UIComponent): string => {
  const entity = component.entityPath || '...'
  if (component.type === 'container') {
    // 子をソートしてからS式を生成
    const sortedChildren = [...component.children].sort((a, b) => {
      const aExp = generateSExpression(a)
      const bExp = generateSExpression(b)
      return aExp.localeCompare(bExp)
    })
    const childrenExp = sortedChildren.map(generateSExpression).join(' ')
    return `(${component.type} ${entity} ${childrenExp})`
  } else {
    return `(${component.type} ${entity})`
  }
}

// S式表現に基づいてコンポーネントをソート
const sortComponentsBySExpression = (components: UIComponent[]): UIComponent[] => {
  return [...components].sort((a, b) => {
    const aExp = generateSExpression(a)
    const bExp = generateSExpression(b)
    return aExp.localeCompare(bExp)
  })
}

// エンティティパスを解析してエンティティ名とプロパティ名に分割
const parseEntityPath = (entityPath: string | undefined): { entity: string, property: string } => {
  if (!entityPath || entityPath === '...') {
    return { entity: '...', property: '' }
  }
  const parts = entityPath.split('>')
  if (parts.length === 2) {
    return { entity: parts[0].trim(), property: parts[1].trim() }
  }
  // フォーマットが不正な場合はそのまま表示
  return { entity: entityPath, property: '' }
}


// コンポーネントを描画するコンポーネント
const ComponentNode: React.FC<{
  component: UIComponent
  depth: number
  parentId?: string
  entities: Entity[]
  onCopy: (sourceId: string, parentId: string) => void
  onRemove: (id: string) => void
  onEntityPathChange: (id: string, entityPath: string) => void
  onMoveComponent: (draggedId: string, targetId: string) => void
  isDescendant: (parentId: string, childId: string) => boolean
  setContextMenu: (menu: { type: 'entity-path' | 'container-create', componentId: string, x: number, y: number } | null) => void
}> = React.memo(({ component, depth, parentId, entities, onCopy, onRemove, onEntityPathChange, onMoveComponent, isDescendant, setContextMenu }) => {
  const color = getColorForComponent(component.type, depth)
  const { entity, property } = parseEntityPath(component.entityPath)

  useEffect(() => {
    console.log(`ComponentNode ${component.id} mounted, type=${component.type}, parentId=${parentId || 'root'}`)
    return () => {
      console.log(`ComponentNode ${component.id} unmounted`)
    }
  }, [component.id, component.type, parentId])

  const { setRawDropTargetId } = useContext(DragContext)!;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.COMPONENT,
    item: () => {
      console.log(`ComponentNode ${component.id}: drag item created, actual parentId=${parentId || 'none'}`)
      return {
        type: ItemTypes.COMPONENT,
        component,
        parentId: parentId,
      } as DragItem
    },
    collect: (monitor) => {
      const dragging = monitor.isDragging()
      return {
        isDragging: dragging,
      }
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>()
      console.log(`ComponentNode ${component.id}: drag end, dropResult=`, dropResult, 'item=', item)
      if (dropResult && dropResult.dropped) {
        console.log(`ComponentNode ${component.id}: moving component to target ${dropResult.targetId}`)
        onMoveComponent(item.component.id, dropResult.targetId)
      } else {
        console.log(`ComponentNode ${component.id}: dropResult invalid or missing`)
      }
      setRawDropTargetId(null);
    },
  }), [component.id, component.type, parentId, onMoveComponent])

  const isOver = useDragSelector(
    (state) => state.currentDropTargetId === component.id
  );


  // ドロップ可能にする
  const isContainer = component.type === 'container'
  console.log(`ComponentNode ${component.id}: useDrop hook called, isContainer=${isContainer}, parentId=${parentId || 'none'}`)
  const [{ canDrop }, drop] = useDrop(() => {
    const isContainer = component.type === 'container'
    return {
      accept: ItemTypes.COMPONENT,
      canDrop: (item) => {
        // Prevent dragging a container into its own descendant
        if (item.component.type === 'container' && isDescendant(item.component.id, component.id)) {
          console.log(`ComponentNode ${component.id}: canDrop false - would create cycle (descendant)`)
          return false;
        }

        // For non-container components, allow drop only if they have a parent (will route to parent)
        if (!isContainer) {
          if (!parentId) {
            console.log(`ComponentNode ${component.id}: canDrop false - non-container has no parent`)
            return false;
          }
          console.log(`ComponentNode ${component.id}: canDrop true - non-container will route to parent ${parentId}`)
          return true;
        }

        if (item.component.id === component.id) {
          console.log(`ComponentNode ${component.id}: canDrop false - dropping onto itself`)
          return false;
        }

        return true;
      },

      hover: (_item, monitor) => {
        if (monitor.isOver({ shallow: true })) {
          let targetId = component.id
          // For non-containers, route hover to parent
          if (!isContainer && parentId) {
            targetId = parentId
          }
          console.log(`ComponentNode ${component.id}: setting currentDropTargetId=${targetId}`)
          setRawDropTargetId(targetId);
        }
      },
      drop: (item: DragItem) => {
        console.log(`ComponentNode ${component.id}: drop called for item ${item.component.id}`)
        return {
          dropped: true,
          targetId: dragStore.getState().currentDropTargetId,
        } as DropResult
      },
      collect: (monitor: DropTargetMonitor<DragItem, DropResult>) => {
        const canDropValue = monitor.canDrop()
        return {
          canDrop: canDropValue,
        }
      },
    }
  }, [component.id, component.type, parentId, isDescendant])

  // dragとdropを同じ要素に適用（dropはコンテナのみ）
  const dragDropRef = useCallback((el: HTMLDivElement | null) => {
    console.log(`ComponentNode ${component.id}: dragDropRef called with el=${el ? 'HTMLDivElement' : 'null'}`)
    drag(el)
    drop(el)
  }, [drag, drop, component.id])

  const handleCopy = () => {
    if (parentId) {
      onCopy(component.id, parentId)
    } else {
      // Root components cannot be copied (no parent)
      throw ValueError('Cannot copy root component')
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const menuType = component.type === 'container' ? 'container-create' : 'entity-path'
    setContextMenu({
      type: menuType,
      componentId: component.id,
      x: e.clientX,
      y: e.clientY
    })
  }

  // TODO
  const cursorClass = 'cursor-default';

  return (
    <div className="component-node">
      <div
        ref={dragDropRef}
        className={`component-box ${cursorClass} depth-${depth} component-${component.type}`}
        onContextMenu={handleContextMenu}
        style={{
          backgroundColor: color,
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        <div className="component-content">
          {component.type !== 'container' && (
            <div className="entity-path-display">
              <div className="entity-label">{entity}</div>
              {property && <div className="property-label">{property}</div>}
            </div>
          )}
        </div>
        { component.type === 'container' && isOver && canDrop && (
          <div className="insertion-preview" />
        )}
        { parentId && (
          <div className="component-actions">
            <button onClick={handleCopy} title="Copy">⎘</button>
            <button onClick={() => onRemove(component.id)} title="Remove">×</button>
          </div>)
        }
        {component.type === 'container' && component.children.length > 0 && (
          <div className="children-container">
            {sortComponentsBySExpression(component.children).map((child) => (
              <ComponentNode
                key={child.id}
                component={child}
                depth={depth + 1}
                parentId={component.id}
                entities={entities}
                onCopy={onCopy}
                onRemove={onRemove}
                onEntityPathChange={onEntityPathChange}
                onMoveComponent={onMoveComponent}
                isDescendant={isDescendant}
                setContextMenu={setContextMenu}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}, (prev, next) => (prev === next || Object.keys(prev).every(k => prev[k] === next[k])))

function App() {
  const [components, setComponents] = useState<UIComponent[]>(initialComponents)
  const [entities] = useState<Entity[]>(sampleEntities)
  type ContextMenuType = 'entity-path' | 'container-create'
  const [contextMenu, setContextMenu] = useState<{
    type: ContextMenuType
    componentId: string
    x: number
    y: number
    pendingComponentType?: 'text' | 'number' | 'button' // エンティティパス選択待ちのコンポーネントタイプ
  } | null>(null)

  useEffect(() => {
    console.log('App mounted')
    return () => console.log('App unmounted')
  }, [])

  // メニュー外クリックやエスケープキーでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !(e.target as Element).closest('.context-menu')) {
        setContextMenu(null)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu])

  const isDescendant = useCallback((parentId: string, childId: string): boolean => {
    const findDescendant = (comps: UIComponent[]): boolean => {
      for (const comp of comps) {
        if (comp.id === parentId) {
          // Check if childId is in this subtree
          const findInSubtree = (c: UIComponent): boolean => {
            if (c.id === childId) return true;
            return c.children.some(findInSubtree);
          };
          return comp.children.some(findInSubtree);
        }
        if (findDescendant(comp.children)) return true;
      }
      return false;
    };
    return findDescendant(components);
  }, [components]);

  const moveComponent = useCallback((draggedId: string, targetId: string) => {
    console.log(`moveComponent: draggedId=${draggedId}, targetId=${targetId}`)
    // コンポーネントを移動するロジック
    const findAndRemove = (comps: UIComponent[], id: string): { node: UIComponent | null; newComps: UIComponent[] } => {
      console.log(`findAndRemove: searching for id=${id} in comps length=${comps.length}`)
      for (let i = 0; i < comps.length; i++) {
        if (comps[i].id === id) {
          console.log(`findAndRemove: found node at index ${i}, removing`)
          const node = comps[i]
          const newComps = [...comps]
          newComps.splice(i, 1)
          return { node, newComps }
        }
        const result = findAndRemove(comps[i].children, id)
        if (result.node) {
          console.log(`findAndRemove: found node in children of comps[${i}], updating children`)
          const newComps = [...comps]
          newComps[i] = { ...comps[i], children: result.newComps }
          return { node: result.node, newComps }
        }
      }
      console.log(`findAndRemove: node not found`)
      return { node: null, newComps: comps }
    }

    const insertAt = (comps: UIComponent[], targetId: string, node: UIComponent): UIComponent[] => {
      console.log(`insertAt: targetId=${targetId}, comps length=${comps.length}`)
      return comps.map(comp => {
        if (comp.id === targetId) {
          console.log(`insertAt: found target comp ${comp.id}`);
          console.log(`insertAt: adding node to children, current children count=${comp.children.length}`)
          return { ...comp, children: [...comp.children, node] }
        }
        return { ...comp, children: insertAt(comp.children, targetId, node) }
      })
    }

    // ドラッグされたコンポーネントを探して削除
    const { node, newComps } = findAndRemove(components, draggedId)
    if (!node) {
      console.log(`moveComponent: node not found for draggedId ${draggedId}`)
      return
    }
    console.log(`moveComponent: node found, newComps length=${newComps.length}`)

    // ターゲットに挿入
    let updatedComps = newComps
    updatedComps = insertAt(newComps, targetId, node)

    console.log(`moveComponent: setting components`)
    setComponents(updatedComps)
  }, [components])

  const copyComponent = useCallback((sourceId: string, parentId: string) => {
    // ソースコンポーネントを探す
    const findComponent = (comps: UIComponent[], id: string): UIComponent | null => {
      for (const comp of comps) {
        if (comp.id === id) return comp
        const found = findComponent(comp.children, id)
        if (found) return found
      }
      return null
    }

    const source = findComponent(components, sourceId)
    if (!source) return

    // ディープコピーを作成（新しいIDを割り当て）
    const deepCopy = (comp: UIComponent): UIComponent => ({
      ...comp,
      id: uuidv4(),
      children: comp.children.map(deepCopy)
    })

    const copied = deepCopy(source)

    // 親のchildrenに追加
    const updateComponents = (comps: UIComponent[]): UIComponent[] => {
      return comps.map((comp) => {
        if (comp.id === parentId) {
          return {
            ...comp,
            children: [...comp.children, copied],
          }
        }
        return {
          ...comp,
          children: updateComponents(comp.children),
        }
      })
    }

    setComponents(updateComponents(components))
  }, [components])

  const removeComponent = useCallback((id: string) => {
    const updateComponents = (comps: UIComponent[]): UIComponent[] => {
      return comps
        .filter((comp) => comp.id !== id)
        .map((comp) => ({
          ...comp,
          children: updateComponents(comp.children),
        }))
    }

    setComponents(updateComponents(components))
  }, [components])

  const addComponentToContainer = useCallback((containerId: string, type: 'container' | 'text' | 'number' | 'button', entityPath?: string) => {
    const newComponent: UIComponent = {
      id: uuidv4(),
      type,
      children: type === 'container' ? [] : [],
      entityPath: entityPath || undefined
    }

    const updateComponents = (comps: UIComponent[]): UIComponent[] => {
      return comps.map((comp) => {
        if (comp.id === containerId) {
          return { ...comp, children: [...comp.children, newComponent] }
        }
        return {
          ...comp,
          children: updateComponents(comp.children),
        }
      })
    }

    setComponents(updateComponents(components))
  }, [components])

  const updateEntityPath = useCallback((id: string, entityPath: string) => {
    const updateComponents = (comps: UIComponent[]): UIComponent[] => {
      return comps.map((comp) => {
        if (comp.id === id) {
          return { ...comp, entityPath }
        }
        return {
          ...comp,
          children: updateComponents(comp.children),
        }
      })
    }

    setComponents(updateComponents(components))
  }, [components])

  // エンティティパス選択メニューコンポーネント
  const EntityPathMenu: React.FC<{
    entities: Entity[]
    onSelect: (entityPath: string) => void
    onClose: () => void
    x: number
    y: number
  }> = ({ entities, onSelect, onClose, x, y }) => {
    const [expandedEntity, setExpandedEntity] = useState<string | null>(null)

    return (
      <div className="context-menu entity-path-menu" style={{ left: x, top: y }}>
        <div className="menu-header">
          <h5>Select Entity Path</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="accordion">
          <div
            className="accordion-item"
            onClick={() => onSelect('')}
          >
            <div className="accordion-title">...</div>
            <div className="accordion-content">Clear entity path</div>
          </div>
          {entities.map((entity) => (
            <div key={entity.name} className="accordion-item">
              <div
                className="accordion-title"
                onClick={() => setExpandedEntity(expandedEntity === entity.name ? null : entity.name)}
              >
                {entity.name}
                <span className="accordion-icon">
                  {expandedEntity === entity.name ? '−' : '+'}
                </span>
              </div>
              {expandedEntity === entity.name && (
                <div className="accordion-content">
                  {entity.properties.map((property) => (
                    <div
                      key={property}
                      className="property-option"
                      onClick={() => onSelect(`${entity.name}>${property}`)}
                    >
                      {property}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // コンテナ作成コンテキストメニューコンポーネント
  const ContainerContextMenu: React.FC<{
    onSelect: (type: 'container' | 'text' | 'number' | 'button') => void
    onClose: () => void
    x: number
    y: number
  }> = ({ onSelect, onClose, x, y }) => {
    return (
      <div className="context-menu container-context-menu" style={{ left: x, top: y }}>
        <div className="menu-header">
          <h5>Add Component</h5>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="menu-options">
          <div className="menu-option" onClick={() => onSelect('container')}>
            <div className="option-icon">□</div>
            <div className="option-label">Container</div>
          </div>
          <div className="menu-option" onClick={() => onSelect('text')}>
            <div className="option-icon" style={{ color: '#3b82f6' }}>T</div>
            <div className="option-label">Text</div>
          </div>
          <div className="menu-option" onClick={() => onSelect('number')}>
            <div className="option-icon" style={{ color: '#10b981' }}>#</div>
            <div className="option-label">Number</div>
          </div>
          <div className="menu-option" onClick={() => onSelect('button')}>
            <div className="option-icon" style={{ color: '#ef4444' }}>B</div>
            <div className="option-label">Button</div>
          </div>
        </div>
      </div>
    )
  }

  const handleEntityPathSelect = (entityPath: string) => {
    if (!contextMenu) return
    const { componentId, pendingComponentType } = contextMenu
    if (pendingComponentType) {
      // エンティティパス選択待ちのコンポーネントを作成
      addComponentToContainer(componentId, pendingComponentType, entityPath)
    } else {
      // 既存コンポーネントのエンティティパスを更新
      updateEntityPath(componentId, entityPath)
    }
    setContextMenu(null)
  }

  const handleComponentCreate = (type: 'container' | 'text' | 'number' | 'button') => {
    if (!contextMenu) return
    const { componentId, x, y } = contextMenu
    if (type === 'container') {
      // コンテナは即時作成
      addComponentToContainer(componentId, type)
      setContextMenu(null)
    } else {
      // テキスト/数字/ボタンはエンティティパス選択メニューを表示
      setContextMenu({
        type: 'entity-path',
        componentId,
        x,
        y,
        pendingComponentType: type
      })
    }
  }


  return (
    <DndProvider backend={HTML5Backend}>
      <DragManager>
      <div className="app">
        <main className="main">
          <div className="designer">
            <div className="component-tree">
              {sortComponentsBySExpression(components).map((comp) => (
                <ComponentNode
                  key={comp.id}
                  component={comp}
                  depth={0}
                  parentId={undefined}
                  entities={entities}
                  onCopy={copyComponent}
                  onRemove={removeComponent}
                  onEntityPathChange={updateEntityPath}
                  onMoveComponent={moveComponent}
                  isDescendant={isDescendant}
                  setContextMenu={setContextMenu}
                />
              ))}
            </div>
            <div className="side-panel">
              <div className="entities-panel">
                <h4>Entities</h4>
                <div className="entities-list">
                  {entities.map((entity) => (
                    <div key={entity.name} className="entity">
                      <div className="entity-name">{entity.name}</div>
                      <div className="entity-properties">
                        {entity.properties.map((prop) => (
                          <div key={prop} className="entity-property">
                            {entity.name} &gt; {prop}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        {contextMenu && contextMenu.type === 'entity-path' && (
          <EntityPathMenu
            entities={entities}
            onSelect={handleEntityPathSelect}
            onClose={() => setContextMenu(null)}
            x={contextMenu.x}
            y={contextMenu.y}
          />
        )}
        {contextMenu && contextMenu.type === 'container-create' && (
          <ContainerContextMenu
            onSelect={handleComponentCreate}
            onClose={() => setContextMenu(null)}
            x={contextMenu.x}
            y={contextMenu.y}
          />
        )}
      </div></DragManager>
    </DndProvider>
  )
}

export default App
