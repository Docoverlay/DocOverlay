import React, { useEffect, useState } from 'react';
import { X, Lightbulb } from 'lucide-react';

interface TipBubbleProps {
  message: string;
  position: { x: number; y: number };
  onClose: () => void;
  autoHide?: boolean;
  delay?: number;
}

export default function TipBubble({ message, position, onClose, autoHide = true, delay = 5000 }: TipBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Attendre la fin de l'animation
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, delay, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 bg-blue-600 text-white rounded-lg shadow-xl p-4 max-w-xs transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Astuce</p>
          <p className="text-sm">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Flèche pointant vers le bas */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
      </div>
    </div>
  );
}