'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';
import { convertMathToLatex } from '@/utils/mathToLatex';

interface MathModalProps {
  isOpen: boolean;
  problem: string;
  points?: number;
  timeLeft: number;
  onSubmit: (answer: number) => void;
  timerEnabled?: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export default function MathModal({ isOpen, problem, points, timeLeft, onSubmit, timerEnabled = true, isPaused = false, onTogglePause }: MathModalProps) {
  const [answer, setAnswer] = useState('');
  const [useCustomKeyboard, setUseCustomKeyboard] = useState(false);
  const mathRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect if device has touch capability or is mobile
  useEffect(() => {
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Show custom keyboard if: has touch OR small screen OR mobile user agent
    setUseCustomKeyboard(hasTouchScreen || isSmallScreen || isMobileUA);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAnswer('');
    }
  }, [isOpen]);

  // Render math with KaTeX auto-render
  useEffect(() => {
    if (mathRef.current && problem) {
      // Check if problem starts with "tz" or "тз" (case insensitive)
      const isPlainText = /^(tz|тз)/i.test(problem.trim());

      if (isPlainText) {
        // Display as plain text without KaTeX formatting
        mathRef.current.textContent = problem;
        mathRef.current.style.whiteSpace = 'normal';
        mathRef.current.style.wordWrap = 'break-word';
      } else {
        // Convert plain math to LaTeX and wrap in delimiters
        const latexExpression = convertMathToLatex(problem);
        const displayText = `$${latexExpression}$`;

        // Set the text content first
        mathRef.current.textContent = displayText;

        try {
          // Auto-render will find $...$ and $$...$$ delimiters and render them
          renderMathInElement(mathRef.current, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
            ],
            throwOnError: false,
          });
        } catch (error) {
          console.error('KaTeX rendering error:', error);
          // Text content is already set, so it will just show as plain text
        }
      }
    }
  }, [problem]);

  const handleSubmit = () => {
    if (answer) {
      onSubmit(parseFloat(answer));
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Custom keyboard handlers
  const handleKeyboardClick = (key: string) => {
    if (key === 'backspace') {
      setAnswer(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setAnswer('');
    } else if (key === 'enter') {
      handleSubmit();
    } else {
      const newValue = answer + key;
      // Validate the new value
      if (newValue === '' || newValue === '-' || /^-?\d*\.?\d*$/.test(newValue)) {
        setAnswer(newValue);
      }
    }
  };

  if (!isOpen) return null;

  const KeyboardButton = ({ value, label, className = '' }: { value: string; label?: string; className?: string }) => (
    <button
      onClick={() => handleKeyboardClick(value)}
      className={`rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 active:shadow-md ${className}`}
    >
      {label || value}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-[500px] animate-slide-in rounded-2xl bg-white p-6 text-center">
        <h2 className="mb-4 text-2xl font-bold text-black">Solve the Math Problem!</h2>
        {points !== undefined && (
          <div className="mb-3 inline-block rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-2 text-xl font-bold text-white shadow-lg">
            {points} Points
          </div>
        )}
        <div className="my-4 flex items-center justify-center gap-2 text-2xl font-bold text-black">
          <div
            ref={mathRef}
            className="max-h-[200px] max-w-[350px] overflow-y-auto overflow-x-auto px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 whitespace-normal break-words"
          ></div>
          <span className="shrink-0">= ?</span>
        </div>
        {timerEnabled && (
          <div className="my-2 flex items-center justify-center gap-3">
            <div className="text-xl text-red-500">
              Time: <span id="timer">{timeLeft}</span>s
            </div>
            {onTogglePause && (
              <button
                onClick={onTogglePause}
                className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-1.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode={useCustomKeyboard ? 'none' : 'decimal'}
          value={answer || ''}
          onChange={(e) => {
            if (!useCustomKeyboard) {
              const value = e.target.value;
              if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
                setAnswer(value);
              }
            }
          }}
          onKeyPress={handleKeyPress}
          onFocus={(e) => {
            // Prevent native keyboard on mobile when custom keyboard is active
            if (useCustomKeyboard) {
              e.target.blur();
              e.preventDefault();
            }
          }}
          onClick={(e) => {
            // Prevent native keyboard on mobile when custom keyboard is active
            if (useCustomKeyboard) {
              e.preventDefault();
            }
          }}
          placeholder="Your answer"
          autoFocus={!useCustomKeyboard}
          readOnly={useCustomKeyboard}
          className="my-4 w-full max-w-[300px] rounded-lg border-2 border-purple-500 bg-purple-50 p-3 text-center text-3xl font-bold text-black focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />

        {useCustomKeyboard && (
          <div className="mx-auto mb-4 grid max-w-[320px] grid-cols-4 gap-2">
            <KeyboardButton value="1" />
            <KeyboardButton value="2" />
            <KeyboardButton value="3" />
            <KeyboardButton value="backspace" label="⌫" className="bg-gradient-to-br from-red-500 to-red-600" />

            <KeyboardButton value="4" />
            <KeyboardButton value="5" />
            <KeyboardButton value="6" />
            <KeyboardButton value="clear" label="C" className="bg-gradient-to-br from-orange-500 to-orange-600" />

            <KeyboardButton value="7" />
            <KeyboardButton value="8" />
            <KeyboardButton value="9" />
            <KeyboardButton value="-" label="−" />

            <KeyboardButton value="0" className="col-span-2" />
            <KeyboardButton value="." />
            <KeyboardButton value="enter" label="✓" className="bg-gradient-to-br from-green-500 to-green-600" />
          </div>
        )}

        {!useCustomKeyboard && (
          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-8 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40"
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  );
}
