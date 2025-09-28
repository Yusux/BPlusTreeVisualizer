import React, { useMemo } from 'react';
import * as d3 from 'd3';
import type { BPlusTreeNode, AnimationStep } from '../types';
import { isLeafNode } from '../types';

interface BPlusTreeViewProps {
  root: BPlusTreeNode | null;
  animationStep: AnimationStep | null;
}

const nodeHeight = 40;

const BPlusTreeView: React.FC<BPlusTreeViewProps> = ({ root, animationStep }) => {
  const { nodes, links, leafLinks, width, height } = useMemo(() => {
    if (!root) {
      return { nodes: [], links: [], leafLinks: [], width: 500, height: 200 };
    }

    const hierarchy = d3.hierarchy(root, d => d.children);
    const nodeWidth = 80;
    const horizontalSpacing = 20;
    const verticalSpacing = 80;

    const treeLayout = d3.tree<BPlusTreeNode>().nodeSize([nodeWidth + horizontalSpacing, nodeHeight + verticalSpacing]);
    const treeRoot = treeLayout(hierarchy);

    const descendants = treeRoot.descendants();
    const allLinks = treeRoot.links();
    
    let minX = 0, maxX = 0, maxY = 0;
    descendants.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    const svgWidth = maxX - minX + nodeWidth * 2;
    const svgHeight = maxY + nodeHeight * 2;
    
    const leafNodes = descendants.filter(n => isLeafNode(n.data));
    leafNodes.sort((a,b) => a.data.keys[0] - b.data.keys[0]);
    
    const newLeafLinks = [];
    for(let i = 0; i < leafNodes.length - 1; i++) {
        newLeafLinks.push({source: leafNodes[i], target: leafNodes[i+1]});
    }

    return { nodes: descendants, links: allLinks, leafLinks: newLeafLinks, width: svgWidth, height: svgHeight };
  }, [root]);

  if (!root) {
    return <div className="flex items-center justify-center h-full text-gray-500">The tree is empty. Insert a key to start.</div>;
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width={width} height={height} className="transform scale-95 origin-center">
        <g transform={`translate(${-nodes[0].x + width / 2}, ${nodeHeight})`}>
          {leafLinks.map((link, i) => {
            const nodeHalfWidth = 40;
            const padding = 5; // Adds space between node and arrow
            const startX = link.source.x + nodeHalfWidth + padding;
            // The arrowhead is 6px, centered on the line's end point.
            // To leave `padding` space, we move the line's end by `padding + 3px`.
            const endX = link.target.x - nodeHalfWidth - (padding + 3);
            
            return (
              <path
                key={`leaf-link-${i}`}
                d={`M ${startX} ${link.source.y} L ${endX} ${link.target.y}`}
                className="stroke-cyan-500 stroke-2 fill-none"
                markerEnd="url(#arrow)"
              />
            );
          })}

          {links.map((link, i) => (
            <path
              key={`link-${i}`}
              d={d3.linkVertical()({
                source: [link.source.x, link.source.y + 20],
                target: [link.target.x, link.target.y - 20],
              })!}
              className="stroke-gray-400 stroke-2 fill-none"
            />
          ))}

          {nodes.map(node => {
            const isHighlighted = animationStep?.highlights?.nodes?.includes(node.data.id);
            const isLeaf = isLeafNode(node.data);
            let specialHighlight = 'none';

            if (animationStep?.type === 'split' && animationStep.splitInfo) {
                if (node.data.id === animationStep.splitInfo.oldNodeId) specialHighlight = 'split-old';
                if (node.data.id === animationStep.splitInfo.newNodeId) specialHighlight = 'split-new';
            } else if (animationStep?.type === 'merge' && animationStep.mergeInfo) {
                if (node.data.id === animationStep.mergeInfo.leftNodeId || node.data.id === animationStep.mergeInfo.rightNodeId) {
                     specialHighlight = 'merge-source';
                }
            } else if ((animationStep?.type === 'borrow-left' || animationStep?.type === 'borrow-right') && animationStep.borrowInfo) {
                if (node.data.id === animationStep.borrowInfo.fromNodeId) specialHighlight = 'borrow-from';
                if (node.data.id === animationStep.borrowInfo.toNodeId) specialHighlight = 'borrow-to';
            }


            let nodeClass = 'transition-all duration-500 stroke-2 ';
            if (specialHighlight === 'split-old') nodeClass += 'fill-red-200 stroke-red-400';
            else if (specialHighlight === 'split-new') nodeClass += 'fill-green-200 stroke-green-400';
            else if (specialHighlight === 'merge-source') nodeClass += 'fill-purple-200 stroke-purple-400';
            else if (specialHighlight === 'borrow-from') nodeClass += 'fill-green-200 stroke-green-400';
            else if (specialHighlight === 'borrow-to') nodeClass += 'fill-red-200 stroke-red-400';
            else if (isHighlighted) nodeClass += 'fill-yellow-300 stroke-yellow-500 ring-4 ring-yellow-500';
            else nodeClass += isLeaf ? 'fill-blue-200 stroke-blue-400' : 'fill-orange-200 stroke-orange-400';
            
            return (
              <g key={node.data.id} transform={`translate(${node.x}, ${node.y})`}>
                <rect
                  x={-40}
                  y={-20}
                  width="80"
                  height="40"
                  rx="5"
                  className={nodeClass}
                />
                <text
                  dy=".31em"
                  textAnchor="middle"
                  className="font-mono text-sm fill-gray-800 pointer-events-none"
                >
                  {node.data.keys.join(',')}
                </text>
              </g>
            );
          })}
        </g>
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="4" markerHeight="4"
                orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-cyan-500" />
            </marker>
        </defs>
      </svg>
    </div>
  );
};

export default BPlusTreeView;