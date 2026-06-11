'use client';

import { useEffect, useRef } from 'react';
import { MathRenderer } from '@jahnchock/math-to-latex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  /** Math expression to render. A "tz"/"тз" prefix marks it as plain text. */
  text: string;
  className?: string;
}

/**
 * Renders a math expression with KaTeX, falling back to plain text on
 * render errors. Problems prefixed with "tz" or "тз" (case-insensitive)
 * are word problems and rendered as plain text without the prefix.
 */
export default function MathText({ text, className }: MathTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    const isPlainText = /^(tz|тз)/i.test(text.trim());

    if (isPlainText) {
      el.textContent = text.replace(/^(tz|тз)\s*/i, '');
      el.style.whiteSpace = 'normal';
      el.style.wordWrap = 'break-word';
    } else {
      try {
        el.innerHTML = MathRenderer.render(text);
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        el.textContent = text;
      }
    }
  }, [text]);

  return <div ref={ref} className={className}></div>;
}
