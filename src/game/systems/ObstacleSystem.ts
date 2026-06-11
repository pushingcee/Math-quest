import { Player } from '@/types/game';
import { ObstacleType } from '../constants/enums';
import { ItemSystem } from './ItemSystem';
import { ItemType } from '@/types/items';
import { BoardGraph } from '../board/BoardGraph';
import { Language, t } from '@/i18n/translations';

export interface ObstacleResult {
  scoreChange: number;
  newPosition: number;
  message: string;
}

export class ObstacleSystem {
  /**
   * Handle Slip Tile - Walk player back 3 spaces along the board graph
   */
  static handleSlip(currentPosition: number, graph: BoardGraph | null, language: Language = 'en'): ObstacleResult {
    let newPosition = currentPosition;

    if (graph) {
      const dest = graph.walkBack(currentPosition, 3);
      if (dest) newPosition = dest.index;
    } else {
      // Fallback for when graph is not available
      newPosition = Math.max(0, currentPosition - 3);
    }

    return {
      scoreChange: 0,
      newPosition,
      message: t(language, 'slipMessage')
    };
  }

  /**
   * Handle Trap Tile - Deduct 15% of current score
   */
  static handleTrap(currentPosition: number, currentScore: number, language: Language = 'en'): ObstacleResult {
    const penalty = Math.floor(currentScore * 0.15);
    return {
      scoreChange: -penalty,
      newPosition: currentPosition,
      message: t(language, 'trapMessage', { penalty })
    };
  }

  /**
   * Apply obstacle effect to player
   */
  static applyObstacleEffect(
    player: Player,
    obstacleType: ObstacleType,
    graph: BoardGraph | null,
    language: Language = 'en'
  ): { player: Player; message: string } {
    // A Shield absorbs the obstacle and is consumed
    if (ItemSystem.hasItem(player, ItemType.Shield)) {
      return {
        player: ItemSystem.useItem(player, ItemType.Shield),
        message: t(language, 'shieldProtected')
      };
    }

    if (obstacleType === ObstacleType.Slip) {
      const result = this.handleSlip(player.position, graph, language);
      return {
        player: {
          ...player,
          position: result.newPosition,
          streak: 0
        },
        message: result.message
      };
    } else if (obstacleType === ObstacleType.Trap) {
      const result = this.handleTrap(player.position, player.score, language);
      return {
        player: {
          ...player,
          score: Math.max(0, player.score + result.scoreChange),
          streak: 0
        },
        message: result.message
      };
    }

    return {
      player,
      message: ''
    };
  }
}
