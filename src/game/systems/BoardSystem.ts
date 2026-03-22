import { TileData, Difficulty } from '@/types/game';
import { ImportedProblemsData } from '@/types/imported-problems';
import { TileType, ObstacleType } from '../constants/enums';
import { generateMathProblem } from '../utils/mathGenerator';
import { BoardConfig, TileConfig } from '../board/BoardConfig';

const TILE_TYPE_MAP: Record<TileConfig['type'], TileType> = {
  regular: TileType.Regular,
  shop: TileType.Shop,
  obstacle: TileType.Obstacle,
  corner: TileType.Corner,
  modifier: TileType.Modifier,
};

const OBSTACLE_TYPE_MAP: Record<string, ObstacleType> = {
  slip: ObstacleType.Slip,
  trap: ObstacleType.Trap,
};

export class BoardSystem {
  /**
   * Create a game board from a BoardConfig.
   * Regular tiles get math problems assigned from the problems pool or generated.
   * Modifier tiles are excluded — they only affect overlapping tiles' properties.
   */
  static createBoard(config: BoardConfig, problems?: ImportedProblemsData): TileData[] {
    const newTiles: TileData[] = [];

    // Create a pool of imported problems if available
    let problemsPool = problems ? [...problems.problems] : [];

    // Map from config tile id → newTiles index, for modifier resolution
    const idToNewIndex = new Map<string, number>();
    let gameIndex = 0;

    for (let i = 0; i < config.tiles.length; i++) {
      const tileConfig = config.tiles[i];
      const type = TILE_TYPE_MAP[tileConfig.type];

      // Modifiers are not game tiles — skip them (effects applied below)
      if (type === TileType.Modifier) continue;

      const idx = gameIndex++;
      idToNewIndex.set(tileConfig.id, newTiles.length);

      if (type === TileType.Regular) {
        // Regular tile — assign math problem
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
          index: idx,
          type: TileType.Regular,
          difficulty,
          points,
          question: problem.question,
          answer: problem.answer,
          pointsMultiplier: tileConfig.pointsMultiplier,
        });
      } else if (type === TileType.Obstacle) {
        newTiles.push({
          index: idx,
          type: TileType.Obstacle,
          obstacleType: tileConfig.obstacleType ? OBSTACLE_TYPE_MAP[tileConfig.obstacleType] : undefined,
        });
      } else if (type === TileType.Shop) {
        newTiles.push({
          index: idx,
          type: TileType.Shop,
          label: tileConfig.label ?? '🏪 SHOP',
        });
      } else {
        // Corner tile
        newTiles.push({
          index: idx,
          type: TileType.Corner,
          label: tileConfig.label,
          onLand: tileConfig.onLand,
        });
      }
    }

    // Resolve modifier coverage: apply modifierEffect to tiles under each modifier's grid area
    for (const modConfig of config.tiles) {
      if (modConfig.type !== 'modifier' || !modConfig.modifierEffect) continue;

      const modSpan = modConfig.span ?? 1;
      const modRowMin = modConfig.row;
      const modRowMax = modConfig.row + modSpan - 1;
      const modColMin = modConfig.col;
      const modColMax = modConfig.col + modSpan - 1;

      for (const otherConfig of config.tiles) {
        if (otherConfig.type === 'modifier' || otherConfig.type === 'corner') continue;

        const tileSpan = otherConfig.span ?? 1;
        const tileRowMin = otherConfig.row;
        const tileRowMax = otherConfig.row + tileSpan - 1;
        const tileColMin = otherConfig.col;
        const tileColMax = otherConfig.col + tileSpan - 1;

        const overlaps =
          tileRowMin <= modRowMax && tileRowMax >= modRowMin &&
          tileColMin <= modColMax && tileColMax >= modColMin;

        if (overlaps && modConfig.modifierEffect.pointsMultiplier !== undefined) {
          const newIdx = idToNewIndex.get(otherConfig.id);
          if (newIdx !== undefined) {
            newTiles[newIdx].pointsMultiplier = modConfig.modifierEffect.pointsMultiplier;
          }
        }
      }
    }

    return newTiles;
  }
}
