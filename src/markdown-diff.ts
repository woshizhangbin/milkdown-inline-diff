import { Node, Fragment, Schema } from "@milkdown/prose/model";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import { myersDiff } from "./myers-diff";
import { Ctx } from "@milkdown/ctx";
import { diffDecorationState } from "./diffDecorationState";
import { editorViewCtx, parserCtx } from "@milkdown/core";
import { EditorState, TextSelection } from "@milkdown/prose/state";
export type ChangeType = "insert" | "delete" | "unchanged";

export interface DiffState {
  currentIndex: number;
  count: number;
}
interface ExtractedBlock {
  nodes: Node[];
}

const LEAF_BLOCK_TYPES: readonly string[] = [
  "paragraph",
  "heading",
  "code_block",
  "hr",
  "table_header_row",
  "table_row",
];

function extractBlocks(doc: Node): ExtractedBlock[] {
  const blocks: ExtractedBlock[] = [];

  const extractFromNode = (node: Node, path: Node[]) => {
    const typeName = node.type.name;

    if (LEAF_BLOCK_TYPES.indexOf(typeName as any) >= 0) {
      blocks.push({
        nodes: [...path, node],
      });
      return;
    }

    if (node.childCount > 0) {
      node.forEach((child: Node) => {
        extractFromNode(child, [...path, node]);
      });
    }
  };

  doc.forEach((child: Node) => {
    extractFromNode(child, [doc]);
  });

  return blocks;
}

export function nodesEqual(a: Node, b: Node): boolean {
  if (a.type.name !== b.type.name) return false;

  const aAttrs = a.attrs || {};
  const bAttrs = b.attrs || {};
  const aKeys = Object.keys(aAttrs).sort();
  const bKeys = Object.keys(bAttrs).sort();

  if (aKeys.length !== bKeys.length) return false;

  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (key !== bKeys[i]) return false;
    if (aAttrs[key] !== bAttrs[key]) return false;
  }

  const aMarks = a.marks || [];
  const bMarks = b.marks || [];

  if (aMarks.length !== bMarks.length) return false;

  for (let i = 0; i < aMarks.length; i++) {
    const aMark = aMarks[i];
    const bMark = bMarks[i];

    if (aMark.type.name !== bMark.type.name) return false;

    const aMarkAttrs = aMark.attrs || {};
    const bMarkAttrs = bMark.attrs || {};
    const aMarkKeys = Object.keys(aMarkAttrs).sort();
    const bMarkKeys = Object.keys(bMarkAttrs).sort();

    if (aMarkKeys.length !== bMarkKeys.length) return false;

    for (let j = 0; j < aMarkKeys.length; j++) {
      const key = aMarkKeys[j];
      if (key !== bMarkKeys[j]) return false;
      if (aMarkAttrs[key] !== bMarkAttrs[key]) return false;
    }
  }

  return true;
}

function childrenEqual(a: Node, b: Node): boolean {
  if (a.childCount !== b.childCount) return false;

  for (let i = 0; i < a.childCount; i++) {
    const aChild = a.child(i);
    const bChild = b.child(i);

    if (!nodesEqual(aChild, bChild)) return false;

    if (aChild.isText && bChild.isText) {
      if (aChild.text !== bChild.text) return false;
    }

    if (aChild.childCount > 0 || bChild.childCount > 0) {
      if (!childrenEqual(aChild, bChild)) return false;
    }
  }

  return true;
}

export function blockEqual(a: ExtractedBlock, b: ExtractedBlock): boolean {
  if (a.nodes.length !== b.nodes.length) return false;

  for (let i = 0; i < a.nodes.length; i++) {
    if (!nodesEqual(a.nodes[i], b.nodes[i])) return false;
  }

  const aLeaf = a.nodes[a.nodes.length - 1];
  const bLeaf = b.nodes[b.nodes.length - 1];

  return childrenEqual(aLeaf, bLeaf);
}

export function deepEquals(node: Node, other: Node): boolean {
  return nodesEqual(node, other) && childrenEqual(node, other);
}

export interface BlockChange {
  type: ChangeType;
  A: ExtractedBlock | null;
  B: ExtractedBlock | null;
}

export function blockDiff(docA: Node, docB: Node): BlockChange[] {
  const blocksA = extractBlocks(docA);
  const blocksB = extractBlocks(docB);

  let changes: BlockChange[] = [];

  const diffResult = myersDiff(blocksA, blocksB, blockEqual);

  for (const op of diffResult) {
    switch (op.type) {
      case "equal":
        for (let i = 0; i < op.items.length; i++) {
          const change: BlockChange = {
            type: "unchanged",
            A: op.items[i],
            B: op.items[i],
          };

          changes.push(change);
        }
        break;
      case "delete":
        for (const block of op.items) {
          const change: BlockChange = {
            type: "delete",
            A: block,
            B: null,
          };

          changes.push(change);
        }
        break;
      case "insert":
        for (const block of op.items) {
          const change: BlockChange = {
            type: "insert",
            A: null,
            B: block,
          };

          changes.push(change);
        }
        break;
    }
  }

  changes = sortTableRows(changes);
  return changes;
}

function isTableRowChange(change: BlockChange): boolean {
  const nodeA = change.A?.nodes[change.A.nodes.length - 1];
  const nodeB = change.B?.nodes[change.B.nodes.length - 1];
  const node = nodeA ?? nodeB;

  return (
    node?.type.name === "table_row" || node?.type.name === "table_header_row"
  );
}

function isTableHeaderRow(change: BlockChange): boolean {
  const node =
    change.A?.nodes[change.A.nodes.length - 1] ??
    change.B?.nodes[change.B.nodes.length - 1];
  return node?.type.name === "table_header_row";
}

function getTableRowColumnCount(change: BlockChange): number {
  const node =
    change.A?.nodes[change.A.nodes.length - 1] ??
    change.B?.nodes[change.B.nodes.length - 1];
  return node?.childCount ?? 0;
}

function getParentPath(change: BlockChange): Node[] | null {
  const nodes = change.A?.nodes ?? change.B?.nodes;
  if (!nodes || nodes.length < 2) return null;
  return nodes.slice(0, -1);
}

function sameParent(a: BlockChange, b: BlockChange): boolean {
  const pathA = getParentPath(a);
  const pathB = getParentPath(b);
  if (!pathA || !pathB) return false;
  if (pathA.length !== pathB.length) return false;
  return pathA.every((node, i) => nodesEqual(node, pathB[i]));
}

function sortByColumnCount(group: BlockChange[]): BlockChange[] {
  const withIndex = group.map((change, index) => ({
    change,
    columnCount: getTableRowColumnCount(change),
    originalIndex: index,
    isHeader: isTableHeaderRow(change),
  }));

  const firstAppearanceOrder = new Map<number, number>();
  let order = 0;
  for (const item of withIndex) {
    if (!firstAppearanceOrder.has(item.columnCount)) {
      firstAppearanceOrder.set(item.columnCount, order++);
    }
  }

  withIndex.sort((a, b) => {
    const orderA = firstAppearanceOrder.get(a.columnCount)!;
    const orderB = firstAppearanceOrder.get(b.columnCount)!;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    if (a.isHeader !== b.isHeader) {
      return a.isHeader ? -1 : 1;
    }

    return a.originalIndex - b.originalIndex;
  });

  return withIndex.map((item) => item.change);
}

function sortTableRows(changes: BlockChange[]): BlockChange[] {
  const result: BlockChange[] = [];
  let i = 0;

  while (i < changes.length) {
    const current = changes[i];

    if (!isTableRowChange(current)) {
      result.push(current);
      i++;
      continue;
    }

    const group: BlockChange[] = [current];
    let j = i + 1;

    while (j < changes.length) {
      const next = changes[j];
      if (!isTableRowChange(next) || !sameParent(current, next)) {
        break;
      }
      group.push(next);
      j++;
    }

    const sortedGroup = sortByColumnCount(group);

    result.push(...sortedGroup);

    i = j;
  }

  return result;
}

export interface DiffEditState {
  mergedDoc: Node;
  decorations: DecorationSet;
  mergeGroups: VNode[][];
}

export interface DiffDecoration {
  groupIndex: string;
  delete: Decoration[];
  insert: Decoration[];
}

export interface VNode {
  node: Node;
  children: VNode[];
  changeType: ChangeType;
  newNode?: Node;
}

export function getDiffDecorations(ctx: Ctx): DiffDecoration[] {
  const decorations = ctx.get(diffDecorationState.key).decorations;
  if (!decorations) {
    return [];
  }
  const result: DiffDecoration[] = [];
  const found = decorations.find(
    0,
    undefined,
    (spec) => (spec as any).decorationType === "diff",
  );
  const filtered = found.filter((deco): deco is Decoration => deco !== null);

  for (const deco of filtered) {
    const spec = deco.spec as any;
    const groupIndex = spec.groupIndex;
    const changeType = spec.changeType;

    let group = result.find((g) => g.groupIndex === groupIndex);
    if (!group) {
      group = { groupIndex, delete: [], insert: [] };
      result.push(group);
    }

    if (changeType === "delete") {
      group.delete.push(deco);
    } else if (changeType === "insert") {
      group.insert.push(deco);
    }
  }

  return result;
}

function findNodePosition(doc: Node, targetNode: Node): number {
  let foundPos = -1;
  doc.descendants((node, pos) => {
    if (node === targetNode) {
      foundPos = pos;
      return false;
    }
    return true;
  });
  return foundPos;
}

function commonNodes(vnodes: VNode[], nodes: Node[]): VNode[] {
  let rs: VNode[] = [];
  const maxLen = Math.min(vnodes.length, nodes.length);
  for (let i = 0; i < maxLen; i++) {
    if (nodesEqual(vnodes[i].node, nodes[i])) {
      rs.push(vnodes[i]);
    } else {
      break;
    }
  }
  return rs;
}

function trySwitchTable(
  current: Node,
  ancestorStack: VNode[],
  ancestors: Node[],
): VNode {
  let parentVNode = ancestorStack[ancestorStack.length - 1];

  if (parentVNode && parentVNode.children.length > 0) {
    let sibling = parentVNode.children[0];
    if (sibling.node.childCount != current.childCount) {
      ancestorStack.pop();
      let newParent = {
        node: ancestors[ancestors.length - 1],
        children: [],
        changeType: "unchanged" as ChangeType,
      };
      if (ancestorStack.length > 0) {
        ancestorStack[ancestorStack.length - 1].children.push(newParent);
      }
      ancestorStack.push(newParent);
      parentVNode = newParent;
    }
  }

  return parentVNode;
}

function trySwitchListItem(
  current: Node,
  ancestorStack: VNode[],
  ancestors: Node[],
): VNode {
  let parentVNode = ancestorStack[ancestorStack.length - 1];
  let parent = ancestors[ancestors.length - 1];

  let newItem =
    parentVNode.children.length > 0 && current.type.name == "paragraph";

  if (newItem) {
    ancestorStack.pop();
    let newParent = {
      node: parent,
      children: [],
      changeType: "unchanged" as ChangeType,
    };

    if (ancestorStack.length > 0) {
      ancestorStack[ancestorStack.length - 1].children.push(newParent);
    }
    ancestorStack.push(newParent);

    parentVNode = newParent;
  }

  return parentVNode;
}

export function buildVNode(blockChanges: BlockChange[]): {
  root: VNode;
  mergeGroups: VNode[][];
} {
  let mergeGroups: VNode[][] = [];
  let currentMergeGroup: VNode[] = [];
  let previousChangeType: ChangeType = "unchanged";
  let ancestorStack: VNode[] = [];

  for (const change of blockChanges) {
    let nodes = change.A?.nodes || change.B?.nodes || [];
    if (nodes.length === 0) continue;

    let ancestors = nodes.slice(0, -1);
    let current = nodes[nodes.length - 1];
    const common = commonNodes(ancestorStack, ancestors);

    if (common.length >= ancestors.length) {
      ancestorStack = ancestorStack.slice(0, ancestors.length);
    } else if (common.length < ancestors.length) {
      ancestorStack = ancestorStack.slice(0, common.length);

      for (let i = common.length; i < ancestors.length; i++) {
        const ancestor = ancestors[i];
        let vnode = {
          node: ancestor,
          children: [],
          changeType: "unchanged" as ChangeType,
        };

        if (ancestorStack.length > 0) {
          ancestorStack[ancestorStack.length - 1].children.push(vnode);
        }

        ancestorStack.push(vnode);
      }
    }

    let parent =
      ancestorStack.length > 0 ? ancestorStack[ancestorStack.length - 1] : null;

    if (
      current.type.name == "table_row" ||
      current.type.name == "table_header_row"
    ) {
      parent = trySwitchTable(current, ancestorStack, ancestors);
    }

    if (parent?.node.type.name == "list_item") {
      parent = trySwitchListItem(current, ancestorStack, ancestors);
    }

    let vnode = {
      node: current,
      children: [],
      changeType: change.type,
    };

    if (parent) {
      parent.children.push(vnode);
    }

    ancestorStack.push(vnode);

    if (change.type === "unchanged") {
      if (currentMergeGroup.length) {
        mergeGroups.push(currentMergeGroup);
        currentMergeGroup = [];
      }
    } else if (change.type === "delete") {
      if (previousChangeType === "insert") {
        mergeGroups.push(currentMergeGroup);
        currentMergeGroup = [];
      }
      currentMergeGroup.push(vnode);
    } else if (change.type === "insert") {
      currentMergeGroup.push(vnode);
    }
    previousChangeType = change.type;
  }

  if (currentMergeGroup.length > 0) {
    mergeGroups.push(currentMergeGroup);
  }

  return { root: ancestorStack[0], mergeGroups };
}

function createDecorationForNode(
  pos: number,
  node: Node,
  changeType: ChangeType,
  groupIndex: number,
): Decoration {
  const className = getDecorationClass(
    changeType as "delete" | "insert" | "modify",
  );

  if (node.type.name === "heading") {
    const decoration = Decoration.inline(
      pos + 1,
      pos + node.nodeSize - 1,
      {
        class: className,
      },
      { changeType, groupIndex, decorationType: "diff", offset: true },
    );
    return decoration;
  }

  const decoration = Decoration.node(
    pos,
    pos + node.nodeSize,
    {
      class: className,
    },
    { changeType, groupIndex, decorationType: "diff" },
  );
  return decoration;
}

function cloneNodeWithSchema(node: Node, schema: Schema): Node {
  if (node.isText) {
    return schema.text(node.text!, node.marks);
  }

  const nodeType = schema.nodes[node.type.name];
  if (!nodeType) {
    throw new Error(`Node type ${node.type.name} not found`);
  }

  const children: Node[] = [];
  node.content.forEach((child) => {
    children.push(cloneNodeWithSchema(child, schema));
  });

  return nodeType.createChecked(node.attrs, Fragment.from(children));
}

function buildNodeFromVNode(vnode: VNode, schema: Schema): Node {
  if (vnode.children.length > 0) {
    const children: Node[] = [];
    for (const child of vnode.children) {
      children.push(buildNodeFromVNode(child, schema));
    }

    const nodeType = schema.nodes[vnode.node.type.name];
    if (!nodeType) {
      throw new Error(`Node type ${vnode.node.type.name} not found`);
    }

    const node = nodeType.createChecked(
      vnode.node.attrs,
      Fragment.from(children),
    );

    vnode.newNode = node;
    return node;
  } else {
    const node = cloneNodeWithSchema(vnode.node, schema);
    vnode.newNode = node;
    return node;
  }
}

export function createDiffEditState(
  originalDoc: Node,
  modifiedDoc: Node,
  schema: Schema,
): DiffEditState {
  const changes = blockDiff(originalDoc, modifiedDoc);
  const { root, mergeGroups } = buildVNode(changes);
  const mergedDoc = buildNodeFromVNode(root, schema);

  const decorations: Decoration[] = [];

  for (let groupIndex = 0; groupIndex < mergeGroups.length; groupIndex++) {
    const group = mergeGroups[groupIndex];
    for (const vnode of group) {
      if (vnode.newNode) {
        const pos = findNodePosition(mergedDoc, vnode.newNode);
        if (pos !== -1) {
          const decoration = createDecorationForNode(
            pos,
            vnode.newNode,
            vnode.changeType,
            groupIndex,
          );
          decorations.push(decoration);
        }
      }
    }
  }

  const decorationSet = DecorationSet.create(mergedDoc, decorations);

  return { mergedDoc, decorations: decorationSet, mergeGroups };
}

export function getDecorationClass(
  type: "delete" | "insert" | "modify",
): string {
  switch (type) {
    case "delete":
      return "diff-decoration-delete";
    case "insert":
      return "diff-decoration-insert";
    case "modify":
      return "diff-decoration-modify";
  }
}

function filterDeleteNodeDecoration(
  diffDecorations: DiffDecoration[],
  action: "accept" | "reject",
): Decoration[] {
  const result: Decoration[] = [];

  for (const group of diffDecorations) {
    if (action === "accept") {
      result.push(...group.delete);
    } else {
      result.push(...group.insert);
    }
  }

  return result;
}

interface TreeNode {
  node: Node;
  pos: number;
  children: TreeNode[];
  parent: TreeNode | null;
  toDelete: boolean;
}

function buildDeleteTree(doc: Node): TreeNode {
  const root: TreeNode = {
    node: doc,
    pos: 0,
    children: [],
    parent: null,
    toDelete: false,
  };

  const nodeMap = new Map<Node, TreeNode>();
  nodeMap.set(doc, root);

  doc.descendants((node: Node, pos: number, parent: Node | null) => {
    if (parent === null) return;
    const parentNode = nodeMap.get(parent);
    if (!parentNode) return;

    const childNode: TreeNode = {
      node: node,
      pos: pos,
      children: [],
      parent: parentNode,
      toDelete: false,
    };
    parentNode.children.push(childNode);
    nodeMap.set(node, childNode);
  });

  return root;
}

function markNodesToDelete(
  treeRoot: TreeNode,
  decorations: Decoration[],
): void {
  for (const decoration of decorations) {
    const from = decoration.from;
    const to = decoration.to;

    const processedNodes = new Set<any>();

    treeRoot.node.descendants((node: any, pos: number, _parent: any) => {
      const nodeEnd = pos + node.nodeSize;

      if (!processedNodes.has(node)) {
        processedNodes.add(node);

        const treeNode = findTreeNodeByNodeRef(treeRoot, node);
        if (treeNode) {
          if (pos >= from && nodeEnd <= to) {
            treeNode.toDelete = true;
          }
        }
      }
    });
  }
}

function findTreeNodeByNodeRef(
  treeRoot: TreeNode,
  targetNode: Node,
): TreeNode | null {
  function traverse(node: TreeNode): TreeNode | null {
    if (node.node === targetNode) {
      return node;
    }
    for (const child of node.children) {
      const found = traverse(child);
      if (found) return found;
    }
    return null;
  }
  return traverse(treeRoot);
}

function markEmptyParentsToDelete(treeRoot: TreeNode): void {
  function traverse(node: TreeNode, depth: number = 0): void {
    if (node.node.type.name === "doc") {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
      return;
    }

    let allChildrenDeleted = true;
    for (const child of node.children) {
      traverse(child, depth + 1);
      if (!child.toDelete) {
        allChildrenDeleted = false;
      }
    }

    if (allChildrenDeleted && node.children.length > 0) {
      node.toDelete = true;
    }
  }

  traverse(treeRoot);
}

function collectNodesToDelete(treeRoot: TreeNode): TreeNode[] {
  const nodes: TreeNode[] = [];

  function traverse(node: TreeNode): void {
    if (node.toDelete) {
      nodes.push(node);
      return;
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(treeRoot);
  return nodes;
}

function shouldReplaceWholeDoc(treeRoot: TreeNode): boolean {
  if (treeRoot.node.type.name !== "doc") return false;

  for (const child of treeRoot.children) {
    if (!child.toDelete) {
      return false;
    }
  }

  return treeRoot.children.length > 0;
}

export function merge(
  ctx: Ctx,
  action: "accept" | "reject",
  index: number,
  mergeAll: boolean,
): boolean {
  let rs = true;

  const view = ctx.get(editorViewCtx);
  const state = view.state;

  const diffDecorations = getDiffDecorations(ctx);
  if (diffDecorations.length == 0) {
    return false;
  }

  const decorations = ctx.get(diffDecorationState.key).decorations!;

  let processDiffDecorations: DiffDecoration[];

  if (mergeAll) {
    processDiffDecorations = diffDecorations;
  } else {
    processDiffDecorations = [diffDecorations[index]];
  }

  let deleteNodeDecorations = filterDeleteNodeDecoration(
    processDiffDecorations,
    action,
  );
  let processDecorations = processDiffDecorations
    .map((d) => [...d.delete, ...d.insert])
    .flat();

  const remainingDecorations = decorations.remove(processDecorations);

  ctx.set(diffDecorationState.key, {
    decorations: remainingDecorations,
  });
  rs = remainingDecorations.find().length > 0;

  const emptyTr = state.tr;
  view.dispatch(emptyTr);

  const treeRoot = buildDeleteTree(state.doc);

  markNodesToDelete(treeRoot, deleteNodeDecorations);

  markEmptyParentsToDelete(treeRoot);

  const nodesToDelete = collectNodesToDelete(treeRoot);

  const shouldReplaceDoc = shouldReplaceWholeDoc(treeRoot);

  if (nodesToDelete.length === 0) {
    return rs;
  }

  if (shouldReplaceDoc) {
    const schema = state.doc.type.schema;
    const emptyText = schema.text("");
    const emptyParagraph = schema.nodes.paragraph.create(null, [emptyText]);
    const newDoc = schema.nodes.doc.create(null, [emptyParagraph]);

    let tr = state.tr;
    tr.replaceWith(0, state.doc.nodeSize, newDoc);
    view.dispatch(tr);
    return rs;
  }

  const sortedNodes = nodesToDelete.sort(
    (a: TreeNode, b: TreeNode) => b.pos - a.pos,
  );

  let tr = state.tr;
  for (const node of sortedNodes) {
    const from = node.pos;
    const to = node.pos + node.node.nodeSize;
    tr.delete(from, to);
  }

  view.dispatch(tr);

  return rs;
}

export function getDiffState(ctx: Ctx): {
  currentIndex: number;
  count: number;
} {
  const groups = getDiffDecorations(ctx);
  if (groups.length == 0) {
    return { currentIndex: -1, count: 0 };
  }
  const view = ctx.get(editorViewCtx);
  const selectionFrom = view.state.selection.from;
  let currentIndex = -1;
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    const firstDecoration = [...group.delete, ...group.insert][0];
    if (firstDecoration) {
      if (firstDecoration.from <= selectionFrom) {
        currentIndex = i;
        break;
      }
    }
  }

  return { currentIndex, count: groups.length };
}

export function jumpTo(ctx: Ctx, index: number) {
  const view = ctx.get(editorViewCtx);

  const groups = getDiffDecorations(ctx);

  if (index < 0 || index >= groups.length) {
    return;
  }

  const conflict = groups[index];
  const doc = view.state.doc;

  let firstDecoration = [...conflict.delete, ...conflict.insert][0];

  const resolvedPos = doc.resolve(firstDecoration.from);
  const selection = TextSelection.near(resolvedPos, 1);
  view.focus();
  const tr = view.state.tr.setSelection(selection);
  view.dispatch(tr);
  const dom = view.domAtPos(resolvedPos.pos).node as HTMLElement;
  if (!dom) return;
  dom.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

export function diff(
  ctx: Ctx,
  newContent: string,
  originContent?: string,
): void {
  const view = ctx.get(editorViewCtx);
  if (!view) {
    console.warn("Editor view not found.");
    return;
  }

  const editorState = view.state;
  const currentDoc =
    originContent === undefined
      ? editorState.doc
      : ctx.get(parserCtx)(originContent);
  const schema = editorState.schema;

  const modifiedDoc = ctx.get(parserCtx)(newContent);
  const diffState = createDiffEditState(currentDoc, modifiedDoc, schema);

  ctx.set(diffDecorationState.key, {
    decorations: diffState.decorations,
  });

  // let oldState = view.state
  let newState = EditorState.create({
    doc: diffState.mergedDoc,
    schema: schema,
    plugins: editorState.plugins,
  });

  view.updateState(newState);
}
