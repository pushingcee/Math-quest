import { Player } from '@/types/game';
import { ObstacleType } from '../constants/enums';
import { ItemSystem } from './ItemSystem';
import { ItemType } from '@/types/items';

export interface ObstacleResult {
  scoreChange: number;
  positionChange: number;
  message: string;
}

export class ObstacleSystem {
  /**
   * Handle Slip Tile - Move player back 3 spaces
   */
  static handleSlip(currentPosition: number, boardSize: number): ObstacleResult {
    const newPosition = Math.max(0, currentPosition - 3);
    const positionChange = newPosition - currentPosition; // Negative value

    return {
      scoreChange: 0,
      positionChange,
      message: '❄️ You hit an ice tile! Slipped back 3 spaces!'
    };
  }

  /**
   * Handle Trap Tile - Deduct 15% of current score
   */
  static handleTrap(currentScore: number): ObstacleResult {
    const penalty = Math.floor(currentScore * 0.15);

    return {
      scoreChange: -penalty,
      positionChange: 0,
      message: `⚠️ You hit a trap! Lost 15% of your points (-${penalty} points)!`
    };
  }

  /**
   * Apply obstacle effect to player
   */
  static applyObstacleEffect(
    player: Player,
    obstacleType: ObstacleType,
    boardSize: number
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
      const result = this.handleSlip(player.position, boardSize);
      return {
        player: {
          ...player,
          position: Math.max(0, player.position + result.positionChange),
          streak: 0 // Reset streak on obstacle
        },
        message: result.message
      };
    } else if (obstacleType === ObstacleType.Trap) {
      const result = this.handleTrap(player.score);
      return {
        player: {
          ...player,
          score: Math.max(0, player.score + result.scoreChange),
          streak: 0 // Reset streak on obstacle
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
