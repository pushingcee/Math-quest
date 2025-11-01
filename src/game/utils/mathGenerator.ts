import { Difficulty } from '@/game/constants/enums';

export interface GeneratedProblem {
  question: string;
  answer: number;
}

export function generateMathProblem(difficulty: Difficulty): GeneratedProblem {
  let a: number, b: number, operation: string, answer: number;

  switch (difficulty) {
    case Difficulty.Easy:
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      operation = Math.random() < 0.5 ? '+' : '-';
      answer = operation === '+' ? a + b : a - b;
      break;
    case Difficulty.Medium:
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 30) + 5;
      const ops = ['+', '-', '*'];
      operation = ops[Math.floor(Math.random() * ops.length)];
      if (operation === '+') answer = a + b;
      else if (operation === '-') answer = a - b;
      else answer = a * b;
      break;
    case Difficulty.Hard:
      const hardOps = ['*', '/'];
      operation = hardOps[Math.floor(Math.random() * hardOps.length)];
      if (operation === '*') {
        a = Math.floor(Math.random() * 20) + 5;
        b = Math.floor(Math.random() * 20) + 5;
        answer = a * b;
      } else {
        b = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 20) + 5;
        a = b * answer;
      }
      break;
    default:
      a = 0;
      b = 0;
      operation = '+';
      answer = 0;
  }

  return { question: `${a} ${operation} ${b}`, answer };
}
