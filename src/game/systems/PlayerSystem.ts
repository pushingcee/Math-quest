import { Player } from '@/types/game';

const playerColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

export class PlayerSystem {
  /**
   * Initialize players for a new game (default avatars)
   */
  static initializePlayers(count: number): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < count; i++) {
      players.push({
        id: i,
        name: `Player ${i + 1}`,
        position: 0,
        score: 0,
        color: playerColors[i],
        streak: 0,
        avatarIndex: i, // Default to matching index
      });
    }
    return players;
  }

  /**
   * Initialize players with selected avatars and colors
   */
  static initializePlayersWithAvatars(avatarIndices: number[], colors: string[]): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < avatarIndices.length; i++) {
      players.push({
        id: i,
        name: `Player ${i + 1}`,
        position: 0,
        score: 0,
        color: colors[i] || playerColors[i], // Use selected color or fallback
        streak: 0,
        avatarIndex: avatarIndices[i],
      });
    }
    return players;
  }

  /**
   * Move player to new position
   */
  static movePlayerToPosition(player: Player, newPosition: number, boardSize: number): Player {
    return {
      ...player,
      position: newPosition % boardSize
    };
  }

  /**
   * Update player score
   */
  static updatePlayerScore(player: Player, scoreChange: number): Player {
    return {
      ...player,
      score: Math.max(0, player.score + scoreChange)
    };
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

  /**
   * Reset player streak
   */
  static resetPlayerStreak(player: Player): Player {
    return {
      ...player,
      streak: 0
    };
  }

  /**
   * Check if player passed START (position wrapped around)
   */
  static didPassStart(oldPosition: number, newPosition: number, boardSize: number): boolean {
    return newPosition < oldPosition;
  }

  /**
   * Get player by ID
   */
  static getPlayerById(players: Player[], playerId: number): Player | undefined {
    return players.find(p => p.id === playerId);
  }

  /**
   * Get next player ID in turn order
   */
  static getNextPlayerId(currentPlayerId: number, totalPlayers: number): number {
    return (currentPlayerId + 1) % totalPlayers;
  }
}
