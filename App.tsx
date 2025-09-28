import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BPlusTree } from './lib/bplustree';
import BPlusTreeView from './components/BPlusTreeView';
import Controls from './components/Controls';
import type { BPlusTreeNode, AnimationStep } from './types';

const App: React.FC = () => {
  const [order, setOrder] = useState(3);
  const tree = useRef<BPlusTree | null>(null);
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPlayer, setAnimationPlayer] = useState<{steps: AnimationStep[], stepIndex: number} | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1500);

  const [displayTree, setDisplayTree] = useState<BPlusTreeNode | null>(null);
  const [currentStepInfo, setCurrentStepInfo] = useState<AnimationStep | null>(null);

  const initializeTree = useCallback(() => {
    tree.current = new BPlusTree(order);
    setDisplayTree(tree.current.root);
    setVersion(v => v + 1);
    setMessage({ text: `New B+ Tree of order ${order} created.`, type: 'info' });
    setCurrentStepInfo(null);
    setIsAnimating(false);
    setAnimationPlayer(null);
  }, [order]);

  useEffect(() => {
    initializeTree();
  }, [order, initializeTree]);

  useEffect(() => {
    if (!isAnimating || !animationPlayer) return;
    
    const { steps, stepIndex } = animationPlayer;

    if (stepIndex >= steps.length) {
        setIsAnimating(false);
        if (steps.length > 0) {
            const lastStep = steps[steps.length - 1];
            // Update the real tree to the final state
            if (lastStep.type !== 'no-change') {
              tree.current!.root = lastStep.treeState;
            }
            setDisplayTree(tree.current!.root);
            setMessage({ text: lastStep.message, type: lastStep.type === 'no-change' ? 'error' : 'success' });
        }
        setCurrentStepInfo(null);
        setAnimationPlayer(null);
        return;
    }

    const currentStep = steps[stepIndex];
    setDisplayTree(currentStep.treeState);
    setCurrentStepInfo(currentStep);
    setMessage({ text: currentStep.message, type: 'info' });

    const timer = setTimeout(() => {
        setAnimationPlayer(prev => prev ? ({ ...prev, stepIndex: prev.stepIndex + 1}) : null);
    }, animationSpeed);

    return () => clearTimeout(timer);

}, [isAnimating, animationPlayer, animationSpeed]);

  const handleOperation = (op: 'insert' | 'delete' | 'find', keyStr: string) => {
    if (isAnimating) return;

    const key = parseInt(keyStr, 10);
    if (isNaN(key)) {
      setMessage({ text: 'Invalid key. Please enter a number.', type: 'error' });
      return;
    }
    if (!tree.current) return;

    let steps: AnimationStep[] = [];
    if (op === 'insert') {
      steps = tree.current.getInsertAnimation(key, key);
    } else if (op === 'delete') {
      steps = tree.current.getDeleteAnimation(key);
    } else if (op === 'find') {
      steps = tree.current.getFindAnimation(key);
    }
    
    if (steps && steps.length > 0) {
        setIsAnimating(true);
        setAnimationPlayer({ steps, stepIndex: 0 });
    } else {
        setMessage({ text: 'Operation did not produce any steps.', type: 'info' });
        setDisplayTree(tree.current.root);
    }
  };
  
  const handleOrderChange = (newOrder: number) => {
    if(newOrder >= 3 && newOrder <= 10) {
        setOrder(newOrder);
    } else {
        setMessage({ text: 'Order must be between 3 and 10.', type: 'error' });
    }
  }

  const handleClear = () => {
    initializeTree();
  };

  const getMessageColor = () => {
    if (!message) return 'text-gray-500';
    switch (message.type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <header className="bg-white shadow-md p-4">
        <h1 className="text-3xl font-bold text-center text-gray-800">B+ Tree Visualizer</h1>
      </header>
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4">
        <div className="md:w-1/4 lg:w-1/5">
          <Controls 
            onOperation={handleOperation} 
            order={order}
            onOrderChange={handleOrderChange}
            onClear={handleClear}
            busy={isAnimating}
            animationSpeed={animationSpeed}
            onAnimationSpeedChange={setAnimationSpeed}
          />
          {message && (
             <div className={`mt-4 p-3 rounded-lg bg-gray-200 border border-gray-300 text-center transition-colors duration-300 ${getMessageColor()}`}>
                <p className="font-semibold">{message.text}</p>
             </div>
          )}
          <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 text-sm text-gray-700">
            <h3 className="font-bold text-lg mb-2 text-gray-800">B+ Tree Rules (Order M={order})</h3>
            <ul className="list-disc list-inside space-y-2">
                <li><span className="font-semibold">Root:</span> Is a leaf or has 2 to {order} children.</li>
                <li><span className="font-semibold">Internal Nodes:</span> Have {Math.ceil(order / 2)} to {order} children.</li>
                <li><span className="font-semibold">Leaf Nodes:</span> Have {Math.ceil(order / 2)} to {order} keys (except possibly root).</li>
                <li>All leaves are at the same depth.</li>
            </ul>
        </div>
        </div>
        <div className="flex-grow bg-white rounded-lg shadow-md border border-gray-200 p-4 overflow-auto">
          <BPlusTreeView 
            key={version} 
            root={displayTree} 
            animationStep={currentStepInfo}
          />
        </div>
      </main>
    </div>
  );
};

export default App;