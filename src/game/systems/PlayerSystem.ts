import { Player } from '@/types/game';
import { ItemSystem } from './ItemSystem';
import { PLAYER_COLOR_OPTIONS } from '@/game/constants/colors';

export class PlayerSystem {
  /**
   * Initialize players with selected avatars and colors
   */
  static initializePlayersWithAvatars(avatarIndices: number[], colors: string[]): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < avatarIndices.length; i++) {
      const { coins, inventory } = ItemSystem.initializePlayerInventory();
      players.push({
        id: i,
        name: `Player ${i + 1}`,
        position: 0,
        score: 0,
        color: colors[i] || PLAYER_COLOR_OPTIONS[i].hex, // Use selected color or fallback
        streak: 0,
        avatarIndex: avatarIndices[i],
        coins,
        inventory,
      });
    }
    return players;
  }

  /**
   * Update player streak
   */
  static updatePlayerStreak(player: Player, newStreak: number): Player {
    return {
      ...player,
      streak: newStreak
    };
  }
}
