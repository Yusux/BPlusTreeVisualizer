import type { BPlusTreeNode, InternalNode, LeafNode, FindResult, AnimationStep } from '../types';
import { isInternalNode, isLeafNode } from '../types';

let nodeIdCounter = 0;

class BPlusTree {
  root: BPlusTreeNode | null;
  order: number;
  minKeys: number;
  minLeafKeys: number;
  minChildren: number;

  constructor(order: number) {
    if (order < 3) throw new Error("Order must be at least 3");
    this.order = order;
    this.root = null;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.minLeafKeys = Math.ceil(order / 2);
    this.minChildren = Math.ceil(order / 2);
  }
  
  private cloneTree(root: BPlusTreeNode | null): BPlusTreeNode | null {
      if (!root) return null;

      const allNodes: BPlusTreeNode[] = [];
      const queue: BPlusTreeNode[] = [root];
      const visited = new Set<string>();

      while (queue.length > 0) {
          const node = queue.shift()!;
          if (visited.has(node.id)) continue;
          visited.add(node.id);
          allNodes.push(node);
          if (isInternalNode(node)) {
              queue.push(...node.children);
          }
      }
      
      const nodeMap = new Map<string, BPlusTreeNode>();
      allNodes.forEach(node => {
          const nodeCopy = { ...node, keys: [...node.keys] };
          if (isInternalNode(nodeCopy)) {
              nodeCopy.children = [...(node as InternalNode).children];
          }
          if (isLeafNode(nodeCopy)) {
              nodeCopy.values = [...(node as LeafNode).values];
          }
          nodeMap.set(node.id, nodeCopy as BPlusTreeNode);
      });

      nodeMap.forEach(nodeCopy => {
          const originalNode = allNodes.find(n => n.id === nodeCopy.id)!;
          if (originalNode.parent) {
              nodeCopy.parent = nodeMap.get(originalNode.parent.id) as InternalNode || null;
          }
          if (isInternalNode(nodeCopy) && isInternalNode(originalNode)) {
              nodeCopy.children = originalNode.children.map(c => nodeMap.get(c.id)!);
          }
          if (isLeafNode(nodeCopy) && isLeafNode(originalNode)) {
              if((originalNode as LeafNode).next) (nodeCopy as LeafNode).next = nodeMap.get((originalNode as LeafNode).next!.id) as LeafNode || null;
              if((originalNode as LeafNode).prev) (nodeCopy as LeafNode).prev = nodeMap.get((originalNode as LeafNode).prev!.id) as LeafNode || null;
          }
      });

      return nodeMap.get(root.id) || null;
  }
  
  private addStep(steps: AnimationStep[], tree: BPlusTreeNode | null, type: AnimationStep['type'], message: string, highlights: AnimationStep['highlights'], extra: object = {}) {
      steps.push({ type, message, highlights, treeState: this.cloneTree(tree)!, ...extra});
  }

  // Search for a key
  find(key: number): FindResult | null {
    if (!this.root) return null;
    let currentNode: BPlusTreeNode = this.root;
    const path: BPlusTreeNode[] = [currentNode];

    while (isInternalNode(currentNode)) {
      const childIndex = this.findChildIndex(currentNode, key);
      currentNode = currentNode.children[childIndex];
      path.push(currentNode);
    }
    
    const leaf = currentNode as LeafNode;
    for (let i = 0; i < leaf.keys.length; i++) {
      if (leaf.keys[i] === key) return { value: leaf.values[i], path };
    }
    return null;
  }

  getFindAnimation(key: number): AnimationStep[] {
      const steps: AnimationStep[] = [];
      if (!this.root) {
          this.addStep(steps, this.root, 'no-change', `Key ${key} not found in empty tree.`, {});
          return steps;
      }
      this.addStep(steps, this.root, 'start', `Searching for key ${key}.`, { nodes: [this.root.id] });

      let node = this.root;
      const pathIds = [node.id];

      while(isInternalNode(node)) {
          const childIndex = this.findChildIndex(node, key);
          const child = node.children[childIndex];
          pathIds.push(child.id);
          this.addStep(steps, this.root, 'traverse', `Traversing based on key ${key}.`, { nodes: pathIds });
          node = child;
      }

      const leaf = node as LeafNode;
      const keyIndex = leaf.keys.indexOf(key);
      if (keyIndex !== -1) {
          this.addStep(steps, this.root, 'found', `Key ${key} found in leaf node.`, { nodes: pathIds, keys: [{nodeId: leaf.id, keyIndex}] });
      } else {
          this.addStep(steps, this.root, 'no-change', `Key ${key} not found.`, { nodes: pathIds });
      }
      return steps;
  }

  private findChildIndex(node: InternalNode, key: number): number {
    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i++;
    return i;
  }
  
  getInsertAnimation(key: number, value: any): AnimationStep[] {
      const steps: AnimationStep[] = [];
      
      if (this.find(key)) {
          this.addStep(steps, this.root, 'no-change', `Error: Key ${key} already exists.`, {});
          return steps;
      }

      const tempTree = new BPlusTree(this.order);
      tempTree.root = this.cloneTree(this.root);
      
      this.addStep(steps, tempTree.root, 'start', `Starting insertion of key ${key}.`, {});
      
      tempTree.insert(key, value, steps);

      this.addStep(steps, tempTree.root, 'final', `Insertion of ${key} complete.`, { });
      
      return steps;
  }

  insert(key: number, value: any, steps?: AnimationStep[]): void {
    if (!this.root) {
      this.root = this.createLeafNode([key], [value]);
      if(steps) this.addStep(steps, this.root, 'new-root', `Tree was empty. Created a new root for key ${key}.`, { nodes: [this.root.id] });
      return;
    }

    let node = this.root;
    const pathIds = [this.root.id];
    while (isInternalNode(node)) {
        if(steps) this.addStep(steps, this.root, 'traverse', `Finding leaf for ${key}. Traversing...`, { nodes: pathIds });
        const childIndex = this.findChildIndex(node, key);
        node = node.children[childIndex];
        pathIds.push(node.id);
    }
    const leaf = node as LeafNode;
    if(steps) this.addStep(steps, this.root, 'found', `Found target leaf for key ${key}.`, { nodes: pathIds });

    this.insertIntoLeaf(leaf, key, value);

    if (leaf.keys.length > this.order) {
      this.splitLeaf(leaf, steps);
    }
  }

  private insertIntoLeaf(leaf: LeafNode, key: number, value: any) {
    let i = 0;
    while (i < leaf.keys.length && key > leaf.keys[i]) i++;
    leaf.keys.splice(i, 0, key);
    leaf.values.splice(i, 0, value);
  }

  private splitLeaf(leaf: LeafNode, steps?: AnimationStep[]) {
    const midIndex = Math.ceil(leaf.keys.length / 2);

    const newKeys = leaf.keys.splice(midIndex);
    const newValues = leaf.values.splice(midIndex);
    const newLeaf = this.createLeafNode(newKeys, newValues);

    newLeaf.next = leaf.next;
    if (leaf.next) leaf.next.prev = newLeaf;
    leaf.next = newLeaf;
    newLeaf.prev = leaf;

    const pushedKey = newLeaf.keys[0];
    if(steps) this.addStep(steps, this.root, 'split', `Leaf node full. Splitting and pushing key ${pushedKey} up.`, 
        { nodes: [leaf.id, newLeaf.id]}, 
        { splitInfo: { oldNodeId: leaf.id, newNodeId: newLeaf.id, pushedKey, pushedToNodeId: leaf.parent?.id ?? null } }
    );
    
    this.insertIntoParent(leaf, pushedKey, newLeaf, steps);
  }
  
  private insertIntoParent(leftNode: BPlusTreeNode, key: number, rightNode: BPlusTreeNode, steps?: AnimationStep[]) {
    let parent = leftNode.parent;

    if (!parent) {
      const newRoot = this.createInternalNode([key], [leftNode, rightNode]);
      this.root = newRoot;
      leftNode.parent = newRoot;
      rightNode.parent = newRoot;
      if(steps) this.addStep(steps, this.root, 'new-root', `Created new root node.`, { nodes: [newRoot.id]});
      return;
    }

    const childIndex = parent.children.indexOf(leftNode);
    parent.keys.splice(childIndex, 0, key);
    parent.children.splice(childIndex + 1, 0, rightNode);
    rightNode.parent = parent;
    
    if(steps) this.addStep(steps, this.root, 'update-parent', `Inserted key ${key} into parent node.`, { nodes: [parent.id]});

    if (parent.children.length > this.order) {
      this.splitInternalNode(parent, steps);
    }
  }

  private splitInternalNode(node: InternalNode, steps?: AnimationStep[]) {
    const midIndex = Math.floor(this.order / 2);
    const medianKey = node.keys.splice(midIndex, 1)[0];
    
    const newKeys = node.keys.splice(midIndex);
    const newChildren = node.children.splice(midIndex + 1);

    const newNode = this.createInternalNode(newKeys, newChildren);
    newChildren.forEach(child => child.parent = newNode);

    if(steps) this.addStep(steps, this.root, 'split', `Internal node full. Splitting and pushing key ${medianKey} up.`, 
        { nodes: [node.id, newNode.id] },
        { splitInfo: { oldNodeId: node.id, newNodeId: newNode.id, pushedKey: medianKey, pushedToNodeId: node.parent?.id ?? null } }
    );

    this.insertIntoParent(node, medianKey, newNode, steps);
  }

  getDeleteAnimation(key: number): AnimationStep[] {
      const steps: AnimationStep[] = [];
      const tempTree = new BPlusTree(this.order);
      tempTree.root = this.cloneTree(this.root);

      const leaf = tempTree.findLeaf(key, steps);
      const keyIndex = leaf ? leaf.keys.indexOf(key) : -1;

      if (!leaf || keyIndex === -1) {
          this.addStep(steps, this.root, 'no-change', `Key ${key} not found for deletion.`, {});
          return steps;
      }
      
      this.addStep(steps, tempTree.root, 'found', `Found key ${key} in leaf node. Preparing to delete.`, { nodes: [leaf.id], keys: [{nodeId: leaf.id, keyIndex}]});
      
      tempTree.delete(key, steps);
      
      this.addStep(steps, tempTree.root, 'final', `Deletion of ${key} complete.`, {});
      return steps;
  }

  private findLeaf(key: number, steps?: AnimationStep[]): LeafNode {
      if (!this.root) return null!;
      let node = this.root;
      const pathIds = [this.root.id];
      if (steps) this.addStep(steps, this.root, 'start', `Searching for key ${key} to delete.`, { nodes: pathIds });

      while (isInternalNode(node)) {
          const childIndex = this.findChildIndex(node, key);
          node = node.children[childIndex];
          pathIds.push(node.id);
          if (steps) this.addStep(steps, this.root, 'traverse', `Traversing...`, { nodes: pathIds });
      }
      return node as LeafNode;
  }
  
  private getMinKeys(node: BPlusTreeNode): number {
    return (node.isLeaf) ? this.minLeafKeys -1 : this.minKeys;
  }

  delete(key: number, steps?: AnimationStep[]): boolean {
    if (!this.root) return false;
    
    const leaf = this.findLeaf(key);
    const keyIndex = leaf.keys.indexOf(key);
    if (keyIndex === -1) return false;

    leaf.keys.splice(keyIndex, 1);
    leaf.values.splice(keyIndex, 1);

    if (leaf === this.root) {
        if (leaf.keys.length === 0) this.root = null;
        return true;
    }

    if (leaf.keys.length < this.getMinKeys(leaf) + 1) {
        this.handleUnderflow(leaf, steps);
    }
    return true;
  }

  private handleUnderflow(node: BPlusTreeNode, steps?: AnimationStep[]) {
    if(steps) this.addStep(steps, this.root, 'start', `Node [${node.keys}] is in underflow.`, { nodes: [node.id] });

    if (node === this.root) {
        if (isInternalNode(node) && node.children.length === 1) {
            this.root = node.children[0];
            this.root.parent = null;
            if(steps) this.addStep(steps, this.root, 'update-parent', `Root was empty. Promoting its child to be the new root.`, { nodes: [this.root.id] });
        }
        return;
    }

    const parent = node.parent!;
    const nodeIndex = parent.children.indexOf(node);
    
    // Borrow from left
    if (nodeIndex > 0) {
        const leftSibling = parent.children[nodeIndex - 1];
        if (leftSibling.keys.length > this.getMinKeys(leftSibling) + 1) {
            this.borrowFromLeft(node, leftSibling, parent, nodeIndex, steps);
            return;
        }
    }
    // Borrow from right
    if (nodeIndex < parent.children.length - 1) {
        const rightSibling = parent.children[nodeIndex + 1];
        if (rightSibling.keys.length > this.getMinKeys(rightSibling) + 1) {
            this.borrowFromRight(node, rightSibling, parent, nodeIndex, steps);
            return;
        }
    }
    // Merge
    if (nodeIndex > 0) { // Merge with left
        this.merge(parent.children[nodeIndex - 1], node, parent, nodeIndex - 1, steps);
    } else { // Merge with right
        this.merge(node, parent.children[nodeIndex + 1], parent, nodeIndex, steps);
    }
  }
  
  private borrowFromLeft(node: BPlusTreeNode, leftSibling: BPlusTreeNode, parent: InternalNode, nodeIndex: number, steps?: AnimationStep[]) {
      if(steps) this.addStep(steps, this.root, 'borrow-left', `Borrowing from left sibling.`, { nodes: [node.id, leftSibling.id, parent.id] });
      if (isLeafNode(node) && isLeafNode(leftSibling)) {
          node.keys.unshift(leftSibling.keys.pop()!);
          node.values.unshift(leftSibling.values.pop()!);
          parent.keys[nodeIndex - 1] = node.keys[0];
      } else if (isInternalNode(node) && isInternalNode(leftSibling)) {
          node.keys.unshift(parent.keys[nodeIndex - 1]);
          parent.keys[nodeIndex - 1] = leftSibling.keys.pop()!;
          const borrowedChild = leftSibling.children.pop()!;
          node.children.unshift(borrowedChild);
          borrowedChild.parent = node;
      }
      if(steps) this.addStep(steps, this.root, 'update-parent', `Updated parent key after borrowing.`, { nodes: [parent.id] });
  }

  private borrowFromRight(node: BPlusTreeNode, rightSibling: BPlusTreeNode, parent: InternalNode, nodeIndex: number, steps?: AnimationStep[]) {
      if(steps) this.addStep(steps, this.root, 'borrow-right', `Borrowing from right sibling.`, { nodes: [node.id, rightSibling.id, parent.id] });
      if (isLeafNode(node) && isLeafNode(rightSibling)) {
          node.keys.push(rightSibling.keys.shift()!);
          node.values.push(rightSibling.values.shift()!);
          parent.keys[nodeIndex] = rightSibling.keys[0];
      } else if (isInternalNode(node) && isInternalNode(rightSibling)) {
          node.keys.push(parent.keys[nodeIndex]);
          parent.keys[nodeIndex] = rightSibling.keys.shift()!;
          const borrowedChild = rightSibling.children.shift()!;
          node.children.push(borrowedChild);
          borrowedChild.parent = node;
      }
      if(steps) this.addStep(steps, this.root, 'update-parent', `Updated parent key after borrowing.`, { nodes: [parent.id] });
  }

  private merge(leftNode: BPlusTreeNode, rightNode: BPlusTreeNode, parent: InternalNode, leftIndex: number, steps?: AnimationStep[]) {
      const parentKeyIndex = leftIndex;
      if(steps) this.addStep(steps, this.root, 'merge', `Cannot borrow. Merging nodes.`, { nodes: [leftNode.id, rightNode.id, parent.id] });
      
      if (isLeafNode(leftNode) && isLeafNode(rightNode)) {
          leftNode.keys.push(...rightNode.keys);
          leftNode.values.push(...rightNode.values);
          leftNode.next = rightNode.next;
          if (rightNode.next) rightNode.next.prev = leftNode;
      } else if (isInternalNode(leftNode) && isInternalNode(rightNode)) {
          const parentKey = parent.keys[parentKeyIndex];
          leftNode.keys.push(parentKey, ...rightNode.keys);
          leftNode.children.push(...rightNode.children);
          rightNode.children.forEach(child => child.parent = leftNode);
      }

      parent.keys.splice(parentKeyIndex, 1);
      parent.children.splice(leftIndex + 1, 1);

      if (parent.keys.length < this.getMinKeys(parent) && parent !== this.root) {
          this.handleUnderflow(parent, steps);
      } else if (parent === this.root && parent.keys.length === 0) {
          this.root = leftNode;
          leftNode.parent = null;
          if(steps) this.addStep(steps, this.root, 'new-root', `Parent empty. Merged node becomes new root.`, { nodes: [this.root.id]});
      }
  }

  private createLeafNode(keys: number[], values: any[]): LeafNode {
    return { id: `leaf-${nodeIdCounter++}`, keys, values, isLeaf: true, parent: null, prev: null, next: null };
  }
  private createInternalNode(keys: number[], children: BPlusTreeNode[]): InternalNode {
    return { id: `internal-${nodeIdCounter++}`, keys, children, isLeaf: false, parent: null };
  }
}

export { BPlusTree };
