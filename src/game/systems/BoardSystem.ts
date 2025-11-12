import { TileData, Difficulty } from '@/types/game';
import { ImportedProblemsData } from '@/types/imported-problems';
import { TileType, SpecialTilePosition, TileScoring, ObstacleType } from '../constants/enums';
import { generateMathProblem } from '../utils/mathGenerator';

export class BoardSystem {
  /**
   * Create a game board with tiles
   * @param boardSize Number of tiles on the board (default 40)
   * @param problems Optional imported problems to use
   * @returns Array of TileData
   */
  static createBoard(boardSize: number = 40, problems?: ImportedProblemsData): TileData[] {
    const newTiles: TileData[] = [];

    // Create a pool of imported problems if available
    let problemsPool = problems ? [...problems.problems] : [];

    // Define static obstacle positions
    const slipPositions = [7, 28];  // Ice tiles (slip)
    const trapPositions = [18, 38]; // Trap tiles

    for (let i = 0; i < boardSize; i++) {
      if (i === SpecialTilePosition.Start) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Start].label
        });
      } else if (i === SpecialTilePosition.Bonus) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Bonus].label
        });
      } else if (i === SpecialTilePosition.Challenge) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Challenge].label
        });
      } else if (i === SpecialTilePosition.Penalty) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Penalty].label
        });
      } else if (slipPositions.includes(i)) {
        newTiles.push({
          index: i,
          type: TileType.Obstacle,
          obstacleType: ObstacleType.Slip
        });
      } else if (trapPositions.includes(i)) {
        newTiles.push({
          index: i,
          type: TileType.Obstacle,
          obstacleType: ObstacleType.Trap
        });
      } else {
        const difficulty = (Math.floor(Math.random() * 3) + 1) as Difficulty;
        const points = difficulty * 10 + Math.floor(Math.random() * 20);

        let problem;
        // Use imported problem if available, otherwise generate random one
        if (problemsPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * problemsPool.length);
          const importedProblem = problemsPool[randomIndex];
          problemsPool.splice(randomIndex, 1);

          // If pool is empty, refill it
          if (problemsPool.length === 0 && problems) {
            problemsPool = [...problems.problems];
          }

          problem = {
            question: importedProblem.question.trim(),
            answer: parseFloat(importedProblem.answer.trim().replace(/\s+/g, ''))
          };
        } else {
          problem = generateMathProblem(difficulty);
        }

        newTiles.push({
          index: i,
          type: TileType.Regular,
          difficulty,
          points,
          question: problem.question,
          answer: problem.answer
        });
      }
    }

    return newTiles;
  }

  /**
   * Get tile at specific position
   */
  static getTileAt(tiles: TileData[], position: number): TileData | undefined {
    return tiles[position];
  }

  /**
   * Check if tile is a corner tile
   */
  static isCornerTile(tile: TileData): boolean {
    return tile.type === TileType.Corner;
  }
}
