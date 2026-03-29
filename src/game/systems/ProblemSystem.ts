import { ImportedProblemsData, ImportedProblem } from '@/types/imported-problems';
import { Difficulty } from '@/game/constants/enums';
import { generateMathProblem, GeneratedProblem } from '../utils/mathGenerator';

export interface ProblemPoolState {
  pool: ImportedProblem[];
}

export class ProblemSystem {
  /**
   * Get next problem from imported pool or generate random one
   */
  static getNextProblem(
    difficulty: Difficulty,
    importedProblems: ImportedProblemsData | null,
    currentPool: ImportedProblem[],
    correctlyAnsweredIds: Set<number>
  ): { problem: GeneratedProblem; activeProblemId: number | null; newPoolState: ProblemPoolState } {
    // Use imported problems if available
    if (importedProblems && currentPool.length > 0) {
      // Get a random problem from the pool
      const randomIndex = Math.floor(Math.random() * currentPool.length);
      const importedProblem = currentPool[randomIndex];

      // Remove from pool
      const newPool = [...currentPool];
      newPool.splice(randomIndex, 1);

      // If pool is empty, refill it excluding correctly answered problems
      if (newPool.length === 0) {
        const availableProblems = importedProblems.problems.filter(
          p => !correctlyAnsweredIds.has(p.id) && p.id !== importedProblem.id
        );
        newPool.push(...availableProblems);
        if (newPool.length > 0) {
          console.log('Problem pool refilled');
        }
      }

      // Parse answer as number (remove spaces first, e.g., "1 055" -> "1055")
      const answer = parseFloat(importedProblem.answer.trim().replace(/\s+/g, ''));

      return {
        problem: {
          question: importedProblem.question.trim(),
          answer: isNaN(answer) ? 0 : answer
        },
        activeProblemId: importedProblem.id,
        newPoolState: {
          pool: newPool,
        }
      };
    }

    // Fall back to generated problems
    return {
      problem: generateMathProblem(difficulty),
      activeProblemId: null,
      newPoolState: {
        pool: currentPool,
      }
    };
  }

  /**
   * Initialize problem pool from imported data
   */
  static initializeProblemPool(importedProblems: ImportedProblemsData | null): ProblemPoolState {
    return {
      pool: importedProblems ? [...importedProblems.problems] : [],
    };
  }
}
