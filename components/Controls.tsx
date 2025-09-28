import React, { useState } from 'react';

interface ControlsProps {
  onOperation: (op: 'insert' | 'delete' | 'find', key: string) => void;
  order: number;
  onOrderChange: (order: number) => void;
  onClear: () => void;
  busy: boolean;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ onOperation, order, onOrderChange, onClear, busy, animationSpeed, onAnimationSpeedChange }) => {
  const [key, setKey] = useState('');
  const [currentOrder, setCurrentOrder] = useState(order.toString());

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentOrder(e.target.value);
  };
  
  const handleSetOrder = () => {
    const newOrder = parseInt(currentOrder, 10);
    if (!isNaN(newOrder)) {
        onOrderChange(newOrder);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
  };

  const handleOperation = (op: 'insert' | 'delete' | 'find') => {
    onOperation(op, key);
    setKey('');
  };

  const buttonClasses = `w-full py-2 text-white font-semibold rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-4">
      <div>
        <label htmlFor="order" className="block text-sm font-medium text-gray-700">Tree Order (M)</label>
        <div className="mt-1 flex space-x-2">
            <input
              type="number"
              id="order"
              value={currentOrder}
              onChange={handleOrderChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
              min="3"
              max="10"
              disabled={busy}
            />
            <button
                onClick={handleSetOrder}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
                disabled={busy}
            >
                Set
            </button>
        </div>
      </div>
       <div>
        <label htmlFor="speed" className="block text-sm font-medium text-gray-700">Animation Speed</label>
        <div className="mt-1 flex items-center space-x-2">
          <input
            type="range"
            id="speed"
            min="200"
            max="3000"
            step="100"
            value={animationSpeed}
            onChange={(e) => onAnimationSpeedChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy}
          />
          <span className="text-sm text-gray-600 w-16 text-right">{animationSpeed}ms</span>
        </div>
      </div>
      <div>
        <label htmlFor="key" className="block text-sm font-medium text-gray-700">Key</label>
        <input
          type="number"
          id="key"
          value={key}
          onChange={handleKeyChange}
          placeholder="e.g., 42"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          disabled={busy}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => handleOperation('insert')} className={`${buttonClasses} bg-green-600 hover:bg-green-700 focus:ring-green-500`} disabled={busy || !key}>Insert</button>
        <button onClick={() => handleOperation('find')} className={`${buttonClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`} disabled={busy || !key}>Find</button>
        <button onClick={() => handleOperation('delete')} className={`${buttonClasses} bg-red-600 hover:bg-red-700 focus:ring-red-500`} disabled={busy || !key}>Delete</button>
      </div>
      <button onClick={onClear} className={`${buttonClasses} bg-gray-600 hover:bg-gray-700 focus:ring-gray-500`} disabled={busy}>
        Clear Tree
      </button>
    </div>
  );
};

export default Controls;