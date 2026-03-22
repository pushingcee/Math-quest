import { Player } from '@/types/game';
import { ObstacleType } from '../constants/enums';
import { ItemSystem } from './ItemSystem';
import { ItemType } from '@/types/items';
import { BoardGraph } from '../board/BoardGraph';

export interface ObstacleResult {
  scoreChange: number;
  newPosition: number;
  message: string;
}

export class ObstacleSystem {
  /**
   * Handle Slip Tile - Walk player back 3 spaces along the board graph
   */
  static handleSlip(currentPosition: number, graph: BoardGraph | null): ObstacleResult {
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
      message: '❄️ You hit an ice tile! Slipped back 3 spaces!'
    };
  }

  /**
   * Handle Trap Tile - Deduct 15% of current score
   */
  static handleTrap(currentPosition: number, currentScore: number): ObstacleResult {
    const penalty = Math.floor(currentScore * 0.15);
    return {
      scoreChange: -penalty,
      newPosition: currentPosition,
      message: `⚠️ You hit a trap! Lost 15% of your points (-${penalty} points)!`
    };
  }

  /**
   * Apply obstacle effect to player
   */
  static applyObstacleEffect(
    player: Player,
    obstacleType: ObstacleType,
    graph: BoardGraph | null
  ): { player: Player; message: string } {
    // Check if player has a Shield item
    const hasShield = ItemSystem.hasItem(player, ItemType.Shield);
    console.log(`🛡️ Shield check for ${player.name}: hasShield=${hasShield}, inventory=`, player.inventory);

    if (hasShield) {
      // Consume the Shield
      const updatedPlayer = ItemSystem.useItem(player, ItemType.Shield);
      console.log(`🛡️ Shield used! Remaining uses:`, updatedPlayer.inventory);
      return {
        player: updatedPlayer,
        message: '🛡️ Your Shield protected you from the obstacle!'
      };
    }

    if (obstacleType === ObstacleType.Slip) {
      const result = this.handleSlip(player.position, graph);
      return {
        player: {
          ...player,
          position: result.newPosition,
          streak: 0
        },
        message: result.message
      };
    } else if (obstacleType === ObstacleType.Trap) {
      const result = this.handleTrap(player.position, player.score);
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
