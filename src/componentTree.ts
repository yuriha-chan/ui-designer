import { UIComponent, ComponentType } from "./types";
import { v4 as uuidv4 } from "uuid";

// コンポーネントタイプと深さに基づく色を生成
export const getColorForComponent = (type: string, depth: number): string => {
  switch (type) {
    case "container": {
      // 深さに基づくグレースケール: 浅いほど明るい
      const lightness = Math.max(20, 80 - depth * 15);
      return `hsl(0, 0%, ${lightness}%)`;
    }
    case "text":
      return "#3b82f6"; // 青
    case "number":
      return "#10b981"; // 緑
    case "button":
      return "#ef4444"; // 赤
    default:
      return "#6b7280"; // グレー
  }
};

// S式表現を生成（辞書式順序ソート用）
export const generateSExpression = (component: UIComponent): string => {
  const entity = component.entityPath || "...";
  if (component.type === "container") {
    // 子をソートしてからS式を生成
    const sortedChildren = [...component.children].sort((a, b) => {
      const aExp = generateSExpression(a);
      const bExp = generateSExpression(b);
      return aExp.localeCompare(bExp);
    });
    const childrenExp = sortedChildren.map(generateSExpression).join(" ");
    return `(${component.type} ${entity} ${childrenExp})`;
  } else {
    return `(${component.type} ${entity})`;
  }
};

// S式表現に基づいてコンポーネントをソート
export const sortComponentsBySExpression = (
  components: UIComponent[]
): UIComponent[] => {
  return [...components].sort((a, b) => {
    const aExp = generateSExpression(a);
    const bExp = generateSExpression(b);
    return aExp.localeCompare(bExp);
  });
};

// エンティティパスを解析してエンティティ名とプロパティ名に分割
export const parseEntityPath = (
  entityPath: string | undefined
): { entity: string; property: string } => {
  if (!entityPath || entityPath === "...") {
    return { entity: "...", property: "" };
  }
  const parts = entityPath.split(">");
  if (parts.length === 2) {
    return { entity: parts[0].trim(), property: parts[1].trim() };
  }
  // フォーマットが不正な場合はそのまま表示
  return { entity: entityPath, property: "" };
};

// コンポーネントが別のコンポーネントの子孫かどうかを判定
export const isDescendant = (
  components: UIComponent[],
  parentId: string,
  childId: string
): boolean => {
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
};

// ツリーからコンポーネントを検索して削除
export const findAndRemove = (
  comps: UIComponent[],
  id: string
): { node: UIComponent | null; newComps: UIComponent[] } => {
  for (let i = 0; i < comps.length; i++) {
    const comp = comps[i];
    if (comp.id === id) {
      const newComps = [...comps];
      newComps.splice(i, 1);
      return { node: comp, newComps };
    }
    const { node, newComps: newChildren } = findAndRemove(comp.children, id);
    if (node) {
      const newComps = [...comps];
      newComps[i] = { ...comp, children: newChildren };
      return { node, newComps };
    }
  }
  return { node: null, newComps: comps };
};

// ツリーからコンポーネントをIDで検索
export const findComponent = (
  comps: UIComponent[],
  id: string
): UIComponent | null => {
  for (const comp of comps) {
    if (comp.id === id) return comp;
    const found = findComponent(comp.children, id);
    if (found) return found;
  }
  return null;
};

// コンポーネントを深くコピー（新しいIDを生成）
export const deepCopy = (comp: UIComponent): UIComponent => ({
  ...comp,
  id: uuidv4(),
  children: comp.children.map(deepCopy),
});

// 新しいコンポーネントを作成
export const createComponent = (
  type: ComponentType,
  entityPath?: string
): UIComponent => ({
  id: uuidv4(),
  type,
  entityPath,
  children: [],
});

// ツリーにコンポーネントを挿入
export const insert = (
  comps: UIComponent[],
  targetId: string,
  node: UIComponent
): UIComponent[] => {
  return comps.map((comp) => {
    if (comp.id === targetId) {
      return { ...comp, children: [...comp.children, node] };
    }
    return { ...comp, children: insert(comp.children, targetId, node) };
  });
};

// コンポーネントを移動
export const move = (
  comps: UIComponent[],
  nodeId: string,
  targetId: string
): UIComponent[] => {
  const { node, newComps } = findAndRemove(comps, nodeId);
  if (!node) return comps; // node not found
  return insert(newComps, targetId, node);
};

// コンポーネントをコピーして挿入
export const copy = (
  comps: UIComponent[],
  sourceId: string,
  targetId: string
): UIComponent[] => {
  const source = findComponent(comps, sourceId);
  if (!source) return comps;
  const copied = deepCopy(source);
  return insert(comps, targetId, copied);
};

// コンポーネントを削除
export const remove = (comps: UIComponent[], id: string): UIComponent[] => {
  const { newComps } = findAndRemove(comps, id);
  return newComps;
};

// コンポーネントを更新
export const update = (
  comps: UIComponent[],
  id: string,
  updates: Partial<UIComponent>
): UIComponent[] => {
  return comps.map((comp) => {
    if (comp.id === id) {
      // 更新を適用するが、idとchildrenは変更しない
      const { id: _, children: __, ...rest } = updates;
      return { ...comp, ...rest };
    }
    return { ...comp, children: update(comp.children, id, updates) };
  });
};
