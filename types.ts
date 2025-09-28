export interface BPlusTreeNode {
  id: string;
  keys: number[];
  parent: InternalNode | null;
  isLeaf: boolean;
  children?: BPlusTreeNode[];
  values?: any[];
  prev?: LeafNode | null;
  next?: LeafNode | null;
}

export interface InternalNode extends BPlusTreeNode {
  isLeaf: false;
  children: BPlusTreeNode[];
}

export interface LeafNode extends BPlusTreeNode {
  isLeaf: true;
  values: any[];
  prev: LeafNode | null;
  next: LeafNode | null;
}

export interface FindResult {
    value: any;
    path: BPlusTreeNode[];
}

// Type guard for InternalNode
export function isInternalNode(node: BPlusTreeNode): node is InternalNode {
    return !node.isLeaf;
}

// Type guard for LeafNode
export function isLeafNode(node: BPlusTreeNode): node is LeafNode {
    return node.isLeaf;
}

// Animation Types
export interface HighlightInfo {
  nodes?: string[];
  keys?: { nodeId: string; keyIndex: number }[];
}

export interface SplitInfo {
  oldNodeId: string;
  newNodeId: string;
  pushedKey: number;
  pushedToNodeId: string | null;
}

export interface MergeInfo {
  leftNodeId: string;
  rightNodeId: string;
  mergedNodeId: string;
  pulledKey: number;
  fromParentId: string;
}

export interface BorrowInfo {
    fromNodeId: string;
    toNodeId: string;
    key: number;
    parentKeyNodeId: string;
}

export interface AnimationStep {
  type: 'start' | 'traverse' | 'found' | 'split' | 'merge' | 'borrow-left' | 'borrow-right' | 'update-parent' | 'new-root' | 'final' | 'no-change';
  treeState: BPlusTreeNode; // Deep clone of the tree at this step
  message: string;
  highlights: HighlightInfo;
  splitInfo?: SplitInfo;
  mergeInfo?: MergeInfo;
  borrowInfo?: BorrowInfo;
}
