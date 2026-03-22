import { TileData, Difficulty } from '@/types/game';
import { ImportedProblemsData } from '@/types/imported-problems';
import { TileType, SpecialTilePosition, TileScoring, ObstacleType } from '../constants/enums';
import { generateMathProblem } from '../utils/mathGenerator';

export class BoardSystem {
  /**
   * Create a game board with tiles
   * @param boardSize Number of tiles on the board (default 39)
   * @param problems Optional imported problems to use
   * @returns Array of TileData
   */
  static createBoard(boardSize: number = 40, problems?: ImportedProblemsData): TileData[] {
    const newTiles: TileData[] = [];

    // Create a pool of imported problems if available
    let problemsPool = problems ? [...problems.problems] : [];

    // Board layout configuration — all special positions defined here
    const slipPositions = [7, 28];
    const trapPositions = [18, 38];
    const shopPositions = [19, 20, 29, 30];
    const bonusZoneTiles = [8, 9, 11]; // tiles adjacent to Bonus corner get 2x multiplier

    for (let i = 0; i < boardSize; i++) {
      if (shopPositions.includes(i)) {
        newTiles.push({
          index: i,
          type: TileType.Shop,
          label: '🏪 SHOP'
        });
      } else if (i === SpecialTilePosition.Start) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Start].label,
          onLand: {
            scoreChange: TileScoring[SpecialTilePosition.Start].points,
            message: TileScoring[SpecialTilePosition.Start].message,
          },
        });
      } else if (i === SpecialTilePosition.Bonus) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Bonus].label,
        });
      } else if (i === SpecialTilePosition.Challenge) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Challenge].label,
        });
      } else if (i === SpecialTilePosition.Penalty) {
        newTiles.push({
          index: i,
          type: TileType.Corner,
          label: TileScoring[SpecialTilePosition.Penalty].label,
          onLand: {
            scoreChange: TileScoring[SpecialTilePosition.Penalty].points,
            message: TileScoring[SpecialTilePosition.Penalty].message,
            messageNoDeduct: TileScoring[SpecialTilePosition.Penalty].messageNoDeduct,
          },
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
        if (problemsPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * problemsPool.length);
          const importedProblem = problemsPool[randomIndex];
          problemsPool.splice(randomIndex, 1);

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
          answer: problem.answer,
          pointsMultiplier: bonusZoneTiles.includes(i) ? 2 : undefined,
        });
      }
    }

    return newTiles;
  }
}
