import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: string; // ex: 'w-48', 'w-64'
}

export function HelpTooltip({ text, position = 'top', width = 'w-56' }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [resolvedPos, setResolvedPos] = useState(position);
  const btnRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceTop = rect.top;
      const spaceBottom = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      // Auto-ajusta posição se não houver espaço
      if (position === 'top' && spaceTop < 80) setResolvedPos('bottom');
      else if (position === 'bottom' && spaceBottom < 80) setResolvedPos('top');
      else if (position === 'left' && spaceLeft < 200) setResolvedPos('right');
      else if (position === 'right' && spaceRight < 200) setResolvedPos('left');
      else setResolvedPos(position);
    }
    setVisible(true);
  };

  const POSITIONS: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const ARROWS: Record<string, string> = {
    top:    'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-700 dark:border-t-slate-600',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-700 dark:border-b-slate-600',
    left:   'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-700 dark:border-l-slate-600',
    right:  'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-700 dark:border-r-slate-600',
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        onFocus={show}
        onBlur={() => setVisible(false)}
        className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors focus:outline-none"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <span className={`absolute z-50 ${POSITIONS[resolvedPos]} ${width} pointer-events-none`}>
          <span className="block bg-slate-700 dark:bg-slate-600 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-relaxed">
            {text}
          </span>
          {/* seta */}
          <span className={`absolute w-0 h-0 border-4 ${ARROWS[resolvedPos]}`} />
        </span>
      )}
    </span>
  );
}
