import { ImportedProblemsData, ImportedProblem } from '@/types/imported-problems';
import { Difficulty } from '@/game/constants/enums';
import { generateMathProblem, GeneratedProblem } from '../utils/mathGenerator';

export interface ProblemPoolState {
  pool: ImportedProblem[];
  usedIds: Set<number>;
}

export class ProblemSystem {
  /**
   * Get next problem from imported pool or generate random one
   */
  static getNextProblem(
    difficulty: Difficulty,
    importedProblems: ImportedProblemsData | null,
    currentPool: ImportedProblem[],
    usedIds: Set<number>
  ): { problem: GeneratedProblem; newPoolState: ProblemPoolState } {
    // Use imported problems if available
    if (importedProblems && currentPool.length > 0) {
      // Get a random problem from the pool
      const randomIndex = Math.floor(Math.random() * currentPool.length);
      const importedProblem = currentPool[randomIndex];

      // Remove from pool
      const newPool = [...currentPool];
      newPool.splice(randomIndex, 1);

      // Add to used set
      const newUsedIds = new Set(usedIds).add(importedProblem.id);

      // If pool is empty, refill it (excluding just-used problems for variety)
      if (newPool.length === 0 && importedProblems.problems.length > 1) {
        const availableProblems = importedProblems.problems.filter(
          p => p.id !== importedProblem.id
        );
        newPool.push(...availableProblems);
        console.log('Problem pool refilled');
      }

      // Parse answer as number (remove spaces first, e.g., "1 055" -> "1055")
      const answer = parseFloat(importedProblem.answer.trim().replace(/\s+/g, ''));

      console.log('Using imported problem:', importedProblem);
      return {
        problem: {
          question: importedProblem.question.trim(),
          answer: isNaN(answer) ? 0 : answer
        },
        newPoolState: {
          pool: newPool,
          usedIds: newUsedIds
        }
      };
    }

    // Fall back to generated problems
    return {
      problem: generateMathProblem(difficulty),
      newPoolState: {
        pool: currentPool,
        usedIds
      }
    };
  }

  /**
   * Initialize problem pool from imported data
   */
  static initializeProblemPool(importedProblems: ImportedProblemsData | null): ProblemPoolState {
    return {
      pool: importedProblems ? [...importedProblems.problems] : [],
      usedIds: new Set()
    };
  }
}
